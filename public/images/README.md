# Images folder

Save generated images here using the exact file names in `docs/11_IMAGE_PROMPTS.md`.

```
public/images/
  hero/         hero-light.png, hero-dark.png, hero-mobile.png
  sections/     problem-fragments.png, solution-connected.png, how-it-works.png, for-women.png,
                for-clinics.png, abu-dhabi-map.png, privacy-vault.png, empty-state.png
  icons/        life-stages.png (transparent)
  og/           og-image.png (1200×630, social share)
  app-screens/  phone-blank.png + real screenshots of our app (taken from the running build)
```

Rules
- Convert to WebP (quality 82) before shipping; keep the PNG originals here.
- Max 400 KB per image after conversion; hero ≤ 250 KB.
- Every image gets meaningful `alt` text in `apps/web/messages/en.json` and `ar.json`.
- AI-generated images are listed in the pitch credits.
