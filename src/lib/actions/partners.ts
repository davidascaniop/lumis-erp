export function calcCreditStatus(
  receivables: any[],
): "green" | "yellow" | "red" {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // normalizar para comparar solo d\u00eda

  const hasOverdue = receivables.some((r) => {
    const d = new Date(r.due_date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() < today.getTime();
  });

  const hasDueSoon = receivables.some((r) => {
    const d = new Date(r.due_date);
    d.setHours(0, 0, 0, 0);
    const days = Math.ceil((d.getTime() - today.getTime()) / 86400000);
    return days >= 0 && days <= 3;
  });

  // Se aplican las reglas
  if (hasOverdue) return "red";
  if (hasDueSoon) return "yellow";
  return "green";
}
