import { Redirect } from "expo-router";
import { useSession } from "@/auth/session";

/** Her app when a token is kept, otherwise the fictional women to choose from. */
export default function Index() {
  const { token } = useSession();
  return <Redirect href={token ? "/home" : "/demo"} />;
}
