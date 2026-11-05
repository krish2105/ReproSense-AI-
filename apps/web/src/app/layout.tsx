import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic, Plus_Jakarta_Sans } from "next/font/google";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { SkipLink } from "@/components/chrome/SkipLink";
import { ToastProvider } from "@/components/ui/Toast";
import { dirOf, isLocale, defaultLocale } from "@/i18n/config";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-jakarta", display: "swap" });
const plexArabic = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500", "600", "700"], variable: "--font-plex-arabic", display: "swap" });

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
      className={`${jakarta.variable} ${plexArabic.variable}`}
    >
      <body>
        <NextIntlClientProvider>
          <ToastProvider>
            <SkipLink />
            {children}
          </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
