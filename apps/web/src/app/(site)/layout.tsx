import { Footer } from "@/components/chrome/Footer";
import { SiteHeader } from "@/components/chrome/SiteHeader";

// Public pages: the demo roster and the token gallery. No session needed.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader variant="site" />
      <main id="main" className="wrap view">
        {children}
      </main>
      <Footer />
    </>
  );
}
