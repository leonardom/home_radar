import { AppHeader } from "@/components/navigation/app-header";

export function ProtectedNav() {
  return <AppHeader mode="loggedIn" />;
}
