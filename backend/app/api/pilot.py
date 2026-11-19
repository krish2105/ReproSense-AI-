"""Public pilot material for clinics (docs/29): the one-page proposal as a PDF. No session, no personal data.

Like every other /v1 path it counts against the general rate limit (app/security/middleware.py)."""

from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from app.reports import pilot_proposal

router = APIRouter(prefix="/v1/pilot", tags=["pilot"])


@router.get("/proposal.pdf")
def proposal_pdf(lang: Literal["en", "ar"] = "en"):
    try:
        pdf = pilot_proposal.pdf(lang)
    except OSError as e:  # Pango/Cairo missing on the host, or the messages were not copied into the image
        raise HTTPException(503, "The proposal PDF is unavailable on this server; the page at /pilot shows it.") from e
    return Response(
        pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="reprosense-pilot-proposal-{lang}.pdf"',
            "Cache-Control": "public, max-age=3600",  # the same bytes for everyone; nothing personal in it
        },
    )
