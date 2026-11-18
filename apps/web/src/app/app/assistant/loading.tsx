import { AreaLoading } from "@/components/states/AreaLoading";

// Per tab, not for the whole app area: an area-level boundary kept the Calendar's blood-pressure save pending.
export default function Loading() {
  return <AreaLoading area="app" />;
}
