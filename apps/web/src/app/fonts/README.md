# Fonts (self-hosted)

The two typefaces of design E · Mauve Pro (docs/06), self-hosted so the build never calls Google Fonts.
These are the same subset files `next/font/google` used to download, now loaded by `next/font/local` in `src/app/layout.tsx`.

| File | Family | Weights | Characters |
| --- | --- | --- | --- |
| `plus-jakarta-sans-latin-wght.woff2` | Plus Jakarta Sans (variable) | 200–800 | Latin |
| `ibm-plex-sans-arabic-arabic-*.woff2` | IBM Plex Sans Arabic | 400, 500, 600, 700 | Arabic |
| `ibm-plex-sans-arabic-latin-*.woff2` | IBM Plex Sans Arabic | 400, 500, 600, 700 | Latin inside Arabic text |

Licence: SIL Open Font License 1.1 (https://openfontlicense.org). Each file keeps its copyright notice and licence URL
in its name table:
- Plus Jakarta Sans: Copyright 2020 The Plus Jakarta Sans Project Authors (https://github.com/tokotype/PlusJakartaSans).
- IBM Plex Sans Arabic: Copyright 2019 IBM Corp. (https://github.com/IBM/plex).
