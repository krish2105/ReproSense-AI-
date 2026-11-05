import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { SkipLink } from "@/components/chrome/SkipLink";
import { ToastProvider } from "@/components/ui/Toast";
import { clientMessages } from "@/i18n/client-messages";
import { dirOf, isLocale, defaultLocale } from "@/i18n/config";
import "./globals.css";

// Self-hosted (src/app/fonts, SIL Open Font License 1.1): the build never calls Google Fonts, so CI and deploys
// cannot fail on its responses. Same files, weights and subsets that next/font/google used to fetch. Font loader options
// must be literals, so the unicode ranges are written out in each call.
const jakarta = localFont({
  src: [{ path: "./fonts/plus-jakarta-sans-latin-wght.woff2", weight: "200 800", style: "normal" }],
  variable: "--font-jakarta",
  display: "swap",
  declarations: [{ prop: "unicode-range", value: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD" }],
  adjustFontFallback: "Arial",
});
// Arabic letters, and the Latin letters (numbers, "PCOS", "AED") inside Arabic text: two families, each limited to its
// range, so the browser fetches only what a page shows. Not preloaded: English pages never download them.
const plexArabic = localFont({
  src: [
    { path: "./fonts/ibm-plex-sans-arabic-arabic-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ibm-plex-sans-arabic-arabic-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/ibm-plex-sans-arabic-arabic-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/ibm-plex-sans-arabic-arabic-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-plex-arabic",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0600-06FF, U+0750-077F, U+0870-0891, U+0897-08E1, U+08E3-08FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC" }],
  adjustFontFallback: false,
});
const plexArabicLatin = localFont({
  src: [
    { path: "./fonts/ibm-plex-sans-arabic-latin-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ibm-plex-sans-arabic-latin-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/ibm-plex-sans-arabic-latin-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/ibm-plex-sans-arabic-latin-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-plex-arabic-latin",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD" }],
  adjustFontFallback: "Arial",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    title: { default: t("title"), template: `%s · ${t("title")}` },
    description: t("description"),
    icons: {
      icon: [
        { url: "/images/brand/derived/favicon-32.png", sizes: "32x32", type: "image/png" },
        { url: "/images/brand/derived/icon-192.png", sizes: "192x192", type: "image/png" },
      ],
      apple: "/images/brand/derived/apple-touch-icon.png",
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      images: [{ url: "/images/og/og-image.png", width: 1536, height: 800, alt: t("ogAlt") }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F1F4" },
    { media: "(prefers-color-scheme: dark)", color: "#17111A" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const raw = await getLocale();
  const locale = isLocale(raw) ? raw : defaultLocale;
  const jar = await cookies();
  const theme = jar.get("rs_theme")?.value;
  const discreet = jar.get("rs_discreet")?.value === "1";
  return (
    <html
      lang={locale}
      dir={dirOf(locale)}
      data-theme={theme === "dark" || theme === "light" ? theme : undefined}
      data-scroll-behavior="smooth"
      data-discreet={discreet ? "" : undefined}
      className={`${jakarta.variable} ${plexArabic.variable} ${plexArabicLatin.variable}`}
    >
      <body>
        <NextIntlClientProvider messages={await clientMessages()}>
          <ToastProvider>
            <SkipLink />
            {children}
          </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
