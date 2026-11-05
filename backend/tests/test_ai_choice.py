"""Her "AI features" switch in Privacy (DoH Responsible AI Standard 3.1.6.1: patients may opt out of AI).
Off: the assistant is closed and her cards keep the fixed template wording; rules and patterns are unchanged."""

from conftest import login

from app.agents import pipeline


def set_ai(client, headers, on: bool):
    r = client.patch("/v1/consents", headers=headers, json={"purpose": "assistant", "granted": on})
    assert r.status_code == 200, r.text


def test_turning_ai_off_closes_the_assistant_and_on_opens_it(client, reseed):
    h = login(client, "noura")
    assert client.get("/v1/assistant/status", headers=h).json() == {"ai_on": True}
    set_ai(client, h, False)
    assert client.get("/v1/assistant/status", headers=h).json() == {"ai_on": False}
    r = client.post("/v1/assistant/ask", headers=h, json={"question": "What is PCOS?"})
    assert r.status_code == 403 and r.json()["detail"] == "ai_off"
    patterns = {c["observation_id"] for c in client.get("/v1/insights", headers=h).json()["cards"]}
    assert patterns, "rules still find her patterns with AI off"
    set_ai(client, h, True)
    assert client.post("/v1/assistant/ask", headers=h, json={"question": "What is PCOS?"}).status_code == 200


class FakeLLM:
    name = "fake-llm"

    def __init__(self):
        self.calls = 0

    def complete_json(self, system, user, max_tokens):
        self.calls += 1
        return {"summary": "Reworded by a model.", "what_to_consider": []}


def test_no_text_reaches_a_model_when_she_turns_ai_off(monkeypatch):
    import json

    from app.config import DATA_DIR

    fake = FakeLLM()
    monkeypatch.setattr(pipeline, "get_llm", lambda: fake)
    bundle = json.loads((DATA_DIR / "personas" / "noura.json").read_text())
    on = pipeline.run({**bundle, "ai_ok": True})
    calls_when_on = fake.calls
    off = pipeline.run({**bundle, "ai_ok": False})
    assert calls_when_on > 0 and fake.calls == calls_when_on  # AI off: the model is never called
    writer = lambda out: next(s["detail"] for s in out["trace"] if s["agent"] == "writer")  # noqa: E731
    assert "(fake-llm)" in writer(on) and "she turned AI off" in writer(off)
    assert {c["written_by"] for c in off["cards"]} == {"template"}
    ids = lambda out: [c["observation_id"] for c in out["cards"]]  # noqa: E731
    assert ids(on) == ids(off)  # the same patterns either way: rules decide, AI only words


def test_a_new_record_has_ai_off_unless_she_ticks_it(client, reseed):
    base = {"name": "Huda", "age": 26, "region": "Al Ain", "life_stage": "periods", "lang": "en"}
    client.cookies.clear()
    assert client.post("/v1/demo/signup", json=base).status_code == 200
    assert client.get("/v1/assistant/status").json() == {"ai_on": False}
    client.cookies.clear()
    assert client.post("/v1/demo/signup", json={**base, "name": "Noor", "use_ai": True}).status_code == 200
    assert client.get("/v1/assistant/status").json() == {"ai_on": True}
    client.cookies.clear()
