import { redirect } from "next/navigation";

export default function Home() {
  // El middleware se encargará de redirigir a /login si no hay sesión
  // Si hay sesión, redirigimos directamente al dashboard.
  redirect("/dashboard");
}
