import { redirect } from "next/navigation";
import { sesionActual } from "@/lib/auth";
import AppShell from "@/components/AppShell";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const sesion = await sesionActual();
  if (!sesion) redirect("/login");
  return <AppShell sesion={sesion}>{children}</AppShell>;
}
