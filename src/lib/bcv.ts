export async function fetchAndSaveBCV(supabase: any): Promise<number> {
  try {
    const res = await fetch("https://ve.dolarapi.com/v1/dolares/oficial", {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    const rate = parseFloat(data.promedio);

    await supabase
      .from("exchange_rates")
      .insert({ rate_bs: rate, source: "BCV" });
    return rate;
  } catch {
    // Fallback: obtener la última tasa guardada
    const { data } = await supabase
      .from("exchange_rates")
      .select("rate_bs")
      .order("fetched_at", { ascending: false })
      .limit(1)
      .single();
    return data?.rate_bs ?? 52.4;
  }
}
