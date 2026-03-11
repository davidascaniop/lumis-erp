import { getPortalData } from "@/lib/actions/portal";
import { PortalClient } from "./portal-client";
import { notFound } from "next/navigation";

export const metadata = { title: "Portal de Pagos — LUMIS" };

export default async function PortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await getPortalData(token);
  if (!data) notFound();
  return <PortalClient data={data} token={token} />;
}
