"""Sending her 6-digit sign-in code (K5). Only through a provider whose key is set (RESEND_API_KEY); without one the
email option is off, the web hides it and the API answers 503. The address and the code are never logged."""

from __future__ import annotations

import json
import logging
import urllib.error
import urllib.request
from typing import Protocol

from app.config import get_settings

log = logging.getLogger("reprosense.email")

# Resend's shared test sender: it delivers only to the Resend account's own address. Set EMAIL_FROM for real use.
TEST_SENDER = "ReproSense <onboarding@resend.dev>"
SUBJECT = {"en": "Your ReproSense sign-in code", "ar": "رمز الدخول إلى ReproSense"}
BODY = {
    "en": "Your code is {code}. It works for 10 minutes, once. If you did not ask for it, you can ignore this email.",
    "ar": "رمزك هو {code}. يعمل لمدة 10 دقائق ولمرة واحدة. إذا لم تطلبيه، يمكنك تجاهل هذه الرسالة.",
}


class EmailSender(Protocol):
    def send_code(self, to: str, code: str, lang: str) -> None: ...


class SendFailed(Exception):
    """The provider refused or could not be reached. Carries no address and no code."""


class ResendSender:
    """https://resend.com/docs/api-reference/emails/send-email. Plain HTTPS, no extra dependency."""

    URL = "https://api.resend.com/emails"

    def __init__(self, api_key: str, sender: str) -> None:
        self.api_key, self.sender = api_key, sender

    def send_code(self, to: str, code: str, lang: str) -> None:
        other = "ar" if lang == "en" else "en"
        text = BODY[lang].format(code=code) + "\n\n" + BODY[other].format(code=code)
        req = urllib.request.Request(
            self.URL,
            data=json.dumps({"from": self.sender, "to": [to], "subject": SUBJECT[lang], "text": text}).encode(),
            headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=8) as r:  # noqa: S310 (fixed https URL)
                if r.status >= 300:
                    raise SendFailed(f"status {r.status}")
        except urllib.error.HTTPError as e:
            log.warning("sign-in email not sent: provider status %s", e.code)  # no address, no code
            raise SendFailed(f"status {e.code}") from None
        except (urllib.error.URLError, TimeoutError) as e:
            log.warning("sign-in email not sent: %s", type(e).__name__)
            raise SendFailed(type(e).__name__) from None


_override: EmailSender | None = None


def set_sender(sender: EmailSender | None) -> None:
    """Tests put a fake sender here (it captures the code); None goes back to the configured provider."""
    global _override
    _override = sender


def get_sender() -> EmailSender | None:
    if _override is not None:
        return _override
    s = get_settings()
    return ResendSender(s.resend_api_key, s.email_from or TEST_SENDER) if s.resend_api_key else None
