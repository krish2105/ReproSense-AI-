"""Write apps/web/src/data/build-week.json: every pull request merged since acceptance, for the /evidence page.

The jury scores the prototype on what was built after the team was accepted (selection 16 Nov 2026; build week from
17 Nov, Abu Dhabi time). This lists each merged pull request from then on, straight from GitHub, so the page shows the
record rather than a claim. Bot pull requests (dependency updates) are left out. Run it again after more merges:

    python3 tools/build_week.py            # needs the GitHub CLI (gh), signed in
"""

from __future__ import annotations

import json
import subprocess
from datetime import datetime, timedelta, timezone
from pathlib import Path

REPO = "krish2105/ReproSense-AI-"
GST = timezone(timedelta(hours=4))  # Abu Dhabi
SINCE = datetime(2026, 11, 17, tzinfo=GST)  # first day of build week, the day after selection
OUT = Path(__file__).resolve().parents[1] / "apps/web/src/data/build-week.json"


def merged_prs() -> list[dict]:
    raw = subprocess.run(
        ["gh", "pr", "list", "-R", REPO, "--state", "merged", "--limit", "500", "--json", "number,title,author,mergedAt"],
        check=True,
        capture_output=True,
        text=True,
    ).stdout
    return json.loads(raw)


def main() -> None:
    prs = [p for p in merged_prs() if not p["author"].get("is_bot") and not p["author"]["login"].startswith("app/")]
    after, before = [], 0
    for p in prs:
        merged = datetime.fromisoformat(p["mergedAt"].replace("Z", "+00:00")).astimezone(GST)
        if merged >= SINCE:
            after.append({"number": p["number"], "title": p["title"], "author": p["author"]["login"], "merged": merged.date().isoformat()})
        else:
            before += 1
    after.sort(key=lambda p: (p["merged"], p["number"]))
    data = {
        "since": SINCE.date().isoformat(),
        "generated": datetime.now(GST).replace(microsecond=0).isoformat(),
        "before": before,
        "authors": sorted({p["author"] for p in after}),
        "prs": after,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n")
    print(f"{len(after)} merged since {data['since']} by {len(data['authors'])} people; {before} before -> {OUT}")


if __name__ == "__main__":
    main()
