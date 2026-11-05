# ReproSense: image prompts for ChatGPT (Mauve Pro look)

Use these prompts to make every image the app and website need, including the **body map**. They follow OpenAI's own
prompting guide for its image models: describe the scene, then the subject, then the details, then the limits, and say what
the image is for. Reuse one style block every time, and change one thing at a time when fixing an image
([OpenAI prompting guide](https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide)).

## How to work (10 minutes of setup saves hours)
1. Open **one** new ChatGPT chat called "ReproSense images" and make every image in that chat, so the style stays the same.
2. Make image **S1 (style anchor)** first. When you like it, say: *"Use this image as the style reference for every image in this chat."*
3. Paste the **style block** after every prompt.
4. For icons, illustrations and the body map, add *"transparent background PNG"* at the end. ChatGPT can make transparent PNGs.
   If the background comes out white, reply *"same image, remove the background, transparent PNG"*.
5. To fix an image, change one thing per reply, for example *"same image, change only the colour of the orb to lavender, keep everything else the same"*.
6. Download, rename to the file name in the table, and save it in the folder shown. The app and mockup load these exact names.
7. Hackathon rule: list "AI-generated images (ChatGPT)" in the pitch credits.

## Rules that keep the images safe and on-brand
- No real people's faces, no celebrities, no logos, no brand names, and no text inside images (we add text in code).
- Women are shown modestly dressed (abaya, shayla or modest clothing). Faces turned away or out of frame.
- The body map figure is a smooth, neutral mannequin with **no anatomical detail** (no nipples, navel shadow, genitals or muscles).
- No medical gore, blood, needles or pills. Use calm, hopeful moods.
- Never show a screen with readable fake data. Leave screens blank; we place real screenshots in code.

## Style block (paste after every prompt)
```
Style: soft, premium women's-health app visual. Gentle 3D clay-and-glass look with rounded forms, soft studio light,
subtle pearl sheen, very soft shadows. Palette: dusty plum #4B3653, magenta pink #D35FA8, peach #EAB09D, blush pink #EFB5D3,
lavender #B88BE3, on a pale blush background #F6F1F4 with soft lilac and peach glows. Calm, warm, modern and trustworthy.
No text, no letters, no numbers, no logos, no watermark, no real person's face.
```

## S · Style anchor (make this first)
| # | Save as | Size | Prompt |
|---|---|---|---|
| S1 | `apps/web/public/images/brand/style-anchor.png` | 1536x1024 | A calm still life for a women's-health app: five soft glossy orbs of different sizes (magenta, peach, blush, lavender, deep plum) resting on a gently curved ribbon that rises from lower left to upper right, pale blush background with soft lilac glow, lots of empty space on the left. |

## A · Brand
| # | Save as | Size | Prompt |
|---|---|---|---|
| A1 | `apps/web/public/images/brand/app-icon.png` | 1024x1024 | App icon: a single glossy orb that blends magenta into lavender, with a thin soft ring around it like a cycle, centred on a rounded-square plum background, simple and bold enough to read at small size. |
| A2 | `apps/web/public/images/brand/logo-mark.png` | 1024x1024, transparent | The same orb-and-ring symbol alone, flat-ish 3D, centred, transparent background PNG. |
| A3 | `apps/web/public/images/brand/splash.png` | 1024x1536 | Phone splash screen background: the orb-and-ring symbol small in the centre, surrounded by very soft blush and lavender glows, top and bottom empty. |

## B · Website
| # | Save as | Size | Prompt |
|---|---|---|---|
| B1 | `apps/web/public/images/hero/hero-light.png` | 1536x1024 | Website hero: a glossy ribbon path rising from lower left to upper right with five glowing orbs along it (one per life stage: magenta, peach, blush, lavender, plum), the middle orb slightly larger, soft particles like pollen in the air, left 45% empty for the headline. |
| B2 | `apps/web/public/images/hero/hero-dark.png` | 1536x1024 | The same ribbon and five orbs on a deep aubergine background #17111A, orbs glowing softly like pearls, faint lilac haze, left 45% empty. |
| B3 | `apps/web/public/images/hero/hero-mobile.png` | 1024x1536 | Vertical version of the ribbon rising from bottom to top with the five orbs, top 35% empty for text. |
| B4 | `apps/web/public/images/sections/problem-fragments.png` | 1536x1024 | Soft blank paper cards and small rounded objects (a calendar block, a folded lab report, a phone with a blank screen) floating apart with thin broken light threads between them; calm but slightly uneasy. |
| B5 | `apps/web/public/images/sections/solution-connected.png` | 1536x1024 | The same cards gathered into a neat arc, joined by continuous soft pink light threads that meet in one glowing lavender orb; resolved and calm. |
| B6 | `apps/web/public/images/sections/for-women.png` | 1536x1024 | Editorial photograph, back view: a young woman in a soft pastel abaya and shayla walking on the Abu Dhabi Corniche at golden hour, holding her phone, face not visible, warm documentary style, gentle film grain. Photorealistic. |
| B7 | `apps/web/public/images/sections/for-clinics.png` | 1536x1024 | Photorealistic bright modern women's clinic consultation room in Abu Dhabi, soft daylight, blush and white interior, a large monitor showing only soft blank rounded cards, a tablet on the desk, a doctor's hands near the keyboard, no face. |
| B8 | `apps/web/public/images/sections/privacy-vault.png` | 1024x1024 | A small rounded vault of thick clear glass with a softly glowing plum orb inside and a faint fingerprint pattern on the door, standing on a blush pedestal. |
| B9 | `apps/web/public/images/sections/abu-dhabi-clay.png` | 1536x1024 | Abstract matte white clay relief of a coastline with islands and desert, three softly raised regions, small columns of magenta, amber and teal light rising from them like a data skyline, 45-degree view. No labels. |
| B10 | `apps/web/public/images/og/og-image.png` | 1536x800 | Wide banner: the ribbon and five orbs small on the right, very soft Abu Dhabi skyline silhouette far behind at dawn, large empty space on the left for the title. |

## C · Five life stages (matching set, transparent)
Make C1 first, then for C2–C5 say *"same style, same lighting and size as the previous icon"*.
| # | Save as | Size | Prompt |
|---|---|---|---|
| C1 | `apps/web/public/images/stages/periods.png` | 1024x1024, transparent | A soft 3D magenta orb with a small crescent moon resting against it. |
| C2 | `apps/web/public/images/stages/trying.png` | 1024x1024, transparent | A soft 3D peach orb with a small sprouting seedling with two leaves. |
| C3 | `apps/web/public/images/stages/pregnancy.png` | 1024x1024, transparent | A soft 3D blush orb gently cradled by a curved ribbon, suggesting growth and care (abstract, no body). |
| C4 | `apps/web/public/images/stages/after-birth.png` | 1024x1024, transparent | Two small soft 3D hands, rounded and abstract, holding a tiny lavender heart. |
| C5 | `apps/web/public/images/stages/perimenopause.png` | 1024x1024, transparent | A soft 3D plum orb with a gentle sunrise arc rising behind it. |

## D · Body map (the app overlays tap points on these, so framing matters)
The app places tap points at fixed positions, measured as a percentage of the image. Ask for this framing exactly:
- full figure from the top of the shoulders to mid-thigh
- figure centred
- top of the shoulders at 12% from the top
- belly button level at 50% height
- hip line at 72% height
- the figure fills 90% of the image height

| # | Save as | Size | Prompt |
|---|---|---|---|
| D1 | `apps/web/public/images/app/body-map-front.png` and `mockup/images/body-map-front.png` | 768x1024, transparent | Front view of a smooth, neutral female mannequin torso for a medical body-map app, from the top of the shoulders to mid-thigh, arms relaxed slightly away from the body, made of soft frosted blush-pink glass with a pearl sheen and a faint lavender rim light. No face, no anatomical detail, no nipples, no navel, no genitals, no muscles; modest and non-sexual, like a soft-sculpted mannequin. Centred. Top of shoulders at 12% from top, belly-button level at 50%, hip line at 72%, figure fills 90% of the height. Transparent background PNG. |
| D2 | `apps/web/public/images/app/body-map-back.png` | 768x1024, transparent | The same mannequin from the back, same framing, same material, same size and position, for marking lower-back pain. Transparent background PNG. |
| D3 | `apps/web/public/images/app/body-map-pelvis.png` | 1024x1024, transparent | A gentle, simplified illustration of the female pelvic area for a health app: soft rounded abstract shapes for the womb and ovaries in blush and lavender glass, no realistic anatomy, no labels, calm and friendly, like an educational icon. Transparent background PNG. |

After you save D1, open the mockup, go to Her app → Calendar → "Where does it hurt?". The image replaces the drawn outline
automatically. If the tap points don't sit right, change the numbers in `SITES` in `mockup/template.html`. Each entry lists the area name, then x%, then y%.

## E · In-app illustrations and icons (transparent)
| # | Save as | Size | Prompt |
|---|---|---|---|
| E1 | `apps/web/public/images/app/onboarding-welcome.png` | 1024x1024, transparent | A friendly soft 3D phone with a blank screen, a small calendar block and a lavender orb floating beside it, welcoming mood. |
| E2 | `apps/web/public/images/app/onboarding-privacy.png` | 1024x1024, transparent | A soft 3D shield made of frosted glass with a small plum lock shape inside, calm and protective. |
| E3 | `apps/web/public/images/app/onboarding-stage.png` | 1024x1024, transparent | Five tiny soft orbs (magenta, peach, blush, lavender, plum) arranged on a gentle curved path, as if choosing a step. |
| E4 | `apps/web/public/images/app/copilot-avatar.png` | 1024x1024, transparent | A small glowing orb character with no face, soft gradient magenta to lavender, with a tiny sparkle, friendly and calm. |
| E5 | `apps/web/public/images/app/care-navigator.png` | 1024x1024, transparent | A soft 3D envelope with a small calendar card and a checkmark-shaped ribbon (no text), plum and blush. |
| E6 | `apps/web/public/images/app/visit-mode.png` | 1024x1024, transparent | A soft 3D phone with a blank screen turning toward a small clipboard, a gentle light beam between them, plum and lavender. |
| E7 | `apps/web/public/images/app/empty-state.png` | 1024x1024, transparent | A single soft lavender orb resting on a small blush cloud, tiny sparkles rising, peaceful. |
| E8 | `apps/web/public/images/app/red-flag.png` | 1024x1024, transparent | A soft rounded 3D bell shape in warm coral red with a gentle glow, urgent but not scary. |
| E9 | `apps/web/public/images/icons/logged-data.png` | 1536x512, transparent | Six matching small 3D clay icons in a row: a droplet (flow), a soft lightning bolt (pain), a small leaf (symptoms), a crescent moon with stars (sleep), a flame (energy), a calm smiling cloud (mood). Even spacing, same size, same light. |
| E10 | `apps/web/public/images/icons/moods.png` | 1536x512, transparent | Five matching soft 3D clay faces as round blobs, simple and friendly: calm, tired, in pain, low, energetic. Pastel blush, peach and lavender. |

## F · Clinic side and pitch
| # | Save as | Size | Prompt |
|---|---|---|---|
| F1 | `apps/web/public/images/clinic/dashboard-header.png` | 1536x512 | Wide soft background banner for a clinic dashboard: pearl white with faint blue and blush glows and small rising light columns on the right. |
| F2 | `apps/web/public/images/pitch/title-slide.png` | 1536x864 | Pitch title background: the ribbon and five orbs on the right, large empty blush area on the left. |
| F3 | `apps/web/public/images/pitch/impact.png` | 1536x864 | Abstract image of many small soft orbs moving from scattered on the left to neatly connected on the right, showing care that gets completed. |
| F4 | `apps/web/public/images/pitch/team.png` | 1536x864 | Soft background for a team slide: blush wall with gentle lavender light and a few floating orbs at the edges, centre empty. |
| F5 | `apps/web/public/images/social/post-square.png` | 1024x1024 | Social post visual: the app icon orb large in the centre with soft rings around it and the five stage orbs orbiting. |

## Fixing results: phrases that work
- "Same image, more empty space on the left."
- "Same image, softer shadows, less shine."
- "Same image, change only the background to #F6F1F4, keep everything else the same."
- "Same image, transparent background PNG."
- "Same image, remove any text or letters."
- "Same image but with no anatomical detail; smooth mannequin surface." (body map)
