import { PageIn } from "@/components/states/AreaLoading";

export default function Template({ children }: { children: React.ReactNode }) {
  return <PageIn>{children}</PageIn>;
}
