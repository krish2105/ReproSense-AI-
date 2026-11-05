import { redirect } from "next/navigation";

// The landing page arrives with issue #7. Until then the demo roster is the front door.
export default function Index() {
  redirect("/demo");
}
