"""docs/31 §H, M3 and M4 (docs/30 security assessment): keys can be rotated without signing everyone out or losing data.

M3, session tokens:
- outside demo mode the API refuses to start without DEMO_TOKEN_SECRET (a random per-process secret signed everyone out
  on every restart and split two instances);
- every token names its key (JWT "kid"); during a rotation DEMO_TOKEN_SECRET_PREVIOUS still verifies older tokens;
  a kid the API does not know never selects anything but the current secret.
M4, field encryption:
- new ciphertext carries a key id; NOTES_KEY_PREVIOUS still decrypts during a rotation; ciphertext written before key
  ids existed still reads.
"""

import base64
import os

import jwt
import pytest
from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.config import Settings, finalise, get_settings
from app.security import crypto


def _b64key() -> str:
    return base64.b64encode(os.urandom(32)).decode()


# ---------- M3 ----------
def test_outside_demo_mode_a_signing_secret_is_required():
    with pytest.raises(RuntimeError, match="DEMO_TOKEN_SECRET"):
        finalise(Settings(demo_mode=False, demo_token_secret="", notes_key=_b64key()))
    s = finalise(Settings(demo_mode=True, demo_token_secret="", notes_key=_b64key()))
    assert len(s.demo_token_secret) >= 40  # demo and development only


def test_a_token_names_its_key_and_survives_a_rotation(client, monkeypatch):
    from app.security.auth import key_id

    s = get_settings()
    old = s.demo_token_secret
    r = client.post("/v1/demo/login", json={"persona": "noura", "role": "patient"})
    token = r.json()["token"]
    client.cookies.clear()
    assert jwt.get_unverified_header(token)["kid"] == key_id(old)

    monkeypatch.setattr(s, "demo_token_secret", "new-" + os.urandom(24).hex())
    monkeypatch.setattr(s, "demo_token_secret_previous", old)
    assert client.get("/v1/demo/whoami", headers={"Authorization": f"Bearer {token}"}).status_code == 200

    monkeypatch.setattr(s, "demo_token_secret_previous", "")  # rotation finished: the old key is gone
    assert client.get("/v1/demo/whoami", headers={"Authorization": f"Bearer {token}"}).status_code == 401


def test_an_unknown_kid_selects_nothing_but_the_current_secret(client):
    forged = jwt.encode(
        {"sub": "noura", "role": "admin", "aud": "reprosense-demo", "exp": 4_102_444_800},
        "attacker-key",
        algorithm="HS256",
        headers={"kid": "attacker"},
    )
    assert client.get("/v1/demo/whoami", headers={"Authorization": f"Bearer {forged}"}).status_code == 401


# ---------- M4 ----------
@pytest.fixture
def keys(monkeypatch):
    s = get_settings()

    def use(current: str, previous: str = ""):
        monkeypatch.setattr(s, "notes_key", current)
        monkeypatch.setattr(s, "notes_key_previous", previous)
        crypto.reset_keys()

    yield use
    crypto.reset_keys()  # the monkeypatch undoes the settings; the cache must follow


def test_new_ciphertext_carries_a_key_id(keys):
    k = _b64key()
    keys(k)
    blob = crypto.encrypt("hello")
    assert blob.startswith(crypto.MAGIC) and blob[4:8] == crypto.key_id(base64.b64decode(k))
    assert crypto.decrypt(blob) == "hello"


def test_ciphertext_from_before_key_ids_still_reads(keys):
    k = _b64key()
    keys(k)
    nonce = os.urandom(12)
    legacy = nonce + AESGCM(base64.b64decode(k)).encrypt(nonce, b"written in 2026", b"reprosense")
    assert crypto.decrypt(legacy) == "written in 2026"


def test_a_rotation_keeps_old_data_readable(keys):
    a, b = _b64key(), _b64key()
    keys(a)
    old = crypto.encrypt("note under key A")
    keys(b, previous=a)
    assert crypto.decrypt(old) == "note under key A"
    assert crypto.encrypt("x")[4:8] == crypto.key_id(base64.b64decode(b))
    keys(b)  # rotation finished: data still under A can no longer be read
    with pytest.raises(InvalidTag):
        crypto.decrypt(old)
