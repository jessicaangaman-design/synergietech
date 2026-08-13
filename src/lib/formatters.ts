export const formatFCFA = (value: number) =>
  `${Math.round(value).toLocaleString("fr-FR").replace(/\u202F/g, " ")} FCFA`;

export const formatDate = (iso: string | null) => {
  if (!iso) return "-";

  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatDateTime = (iso: string | null) => {
  if (!iso) return "-";

  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const daysUntil = (iso: string | null) => {
  if (!iso) return -1;

  const difference = new Date(iso).getTime() - Date.now();
  return Math.ceil(difference / (1000 * 60 * 60 * 24));
};