import { redirect } from "next/navigation";
 
export default function Home() {
  // Redirigimos a la nueva ruta de la landing page pública
  redirect("/landing-page");
}
