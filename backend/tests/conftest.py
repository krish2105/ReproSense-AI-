import os

os.environ["DATABASE_URL"] = os.environ.get("TEST_DATABASE_URL", "postgresql:///reprosense_test?host=/tmp")
os.environ.setdefault("RATE_LIMIT_PER_MIN", "100000")
os.environ.setdefault("RATE_LIMIT_SENSITIVE_PER_MIN", "100000")
os.environ.setdefault("DEMO_RESET_COOLDOWN_S", "0")  # tests reset often; test_hardening.py checks the cooldown
os.environ["LLM_PROVIDER"] = "none"  # tests are deterministic and offline
os.environ.setdefault("PDF_WARM", "false")  # no worker processes behind every report; test_pool_and_pdf.py checks it
os.environ.setdefault("DEMO_MODE", "true")  # the tests exercise the demo doors; the setting's own default is off

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def seeded():
    from app.db.seed import seed

    return seed()


@pytest.fixture(autouse=True)
def fresh_rate_limits():
    """Every test starts with an empty rate-limit window: sign-ins count against the address (H2b), so one test's
    sign-ins must not use up the next test's allowance."""
    from app.security.middleware import reset_limits

    reset_limits()
    yield


@pytest.fixture
def reseed():
    from app.db.seed import seed

    yield
    seed()


@pytest.fixture(scope="session")
def client(seeded):
    from app.main import app

    return TestClient(app)


def login(client, persona=None, role="patient"):
    r = client.post("/v1/demo/login", json={"persona": persona, "role": role})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}
