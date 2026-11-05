import os

os.environ["DATABASE_URL"] = "postgresql:///reprosense_test?host=/tmp"
os.environ.setdefault("RATE_LIMIT_PER_MIN", "100000")
os.environ.setdefault("RATE_LIMIT_SENSITIVE_PER_MIN", "100000")
os.environ["LLM_PROVIDER"] = "none"  # tests are deterministic and offline

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def seeded():
    from app.db.seed import seed

    return seed()


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
