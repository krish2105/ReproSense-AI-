import { Footer } from "@/components/chrome/Footer";
import { SiteHeader } from "@/components/chrome/SiteHeader";
import { TabBar } from "@/components/chrome/TabBar";
import { requireRole } from "@/lib/session";

// Her app: patient role only (CLAUDE.md rule 9). Phone-width column; the floating tab bar sits over the bottom.
export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  await requireRole("patient");
  return (
    <div className="app-shell">
      <SiteHeader variant="patient" />
      <main id="main" className="wrap">
        {children}
      </main>
      <Footer />
      <TabBar />
    </div>
  );
}
