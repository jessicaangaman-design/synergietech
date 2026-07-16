// Validation utilities — client-side input safety
// - Names: letters, spaces, hyphens, apostrophes, accents; no digits, no symbols
// - Phones: international format with a real country dial code + digits only
// - Emails: standard RFC-ish check

/** Curated list of ITU-T E.164 country calling codes (indicatifs pays). */
export const COUNTRY_DIAL_CODES: readonly string[] = [
  "1","7","20","27","30","31","32","33","34","36","39","40","41","43","44","45","46","47","48","49",
  "51","52","53","54","55","56","57","58","60","61","62","63","64","65","66",
  "81","82","84","86","90","91","92","93","94","95","98",
  "211","212","213","216","218","220","221","222","223","224","225","226","227","228","229",
  "230","231","232","233","234","235","236","237","238","239",
  "240","241","242","243","244","245","246","247","248","249",
  "250","251","252","253","254","255","256","257","258",
  "260","261","262","263","264","265","266","267","268","269",
  "290","291","297","298","299",
  "350","351","352","353","354","355","356","357","358","359",
  "370","371","372","373","374","375","376","377","378","379","380","381","382","383","385","386","387","389",
  "420","421","423",
  "500","501","502","503","504","505","506","507","508","509",
  "590","591","592","593","594","595","596","597","598","599",
  "670","672","673","674","675","676","677","678","679","680","681","682","683","685","686","687","688","689","690","691","692",
  "800","808","850","852","853","855","856","870","878","880","881","882","883","886","888",
  "960","961","962","963","964","965","966","967","968","970","971","972","973","974","975","976","977","979","992","993","994","995","996","998",
];

/** Nom: lettres (avec accents), espaces, tirets et apostrophes uniquement, 2..80 caractères. */
const NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ' \-]{2,80}$/;

export function validateName(raw: string, label = "Nom"): string | null {
  const v = raw.trim();
  if (!v) return `${label} obligatoire`;
  if (/\d/.test(v)) return `${label} : les chiffres ne sont pas autorisés`;
  if (!NAME_REGEX.test(v)) return `${label} invalide (lettres, espaces, - et ' uniquement)`;
  return null;
}

/**
 * Téléphone international : commence par "+" suivi d'un indicatif pays valide
 * et de 6 à 14 chiffres (espaces/tirets/points/parenthèses tolérés à l'affichage).
 * Retourne null si valide, sinon un message d'erreur.
 */
export function validatePhone(raw: string, required = true): string | null {
  const v = raw.trim();
  if (!v) return required ? "Téléphone obligatoire" : null;
  if (!v.startsWith("+")) return "Le numéro doit commencer par + suivi de l'indicatif du pays (ex: +225…)";
  // Retire les séparateurs d'affichage
  const cleaned = v.replace(/[\s().-]/g, "");
  if (!/^\+\d+$/.test(cleaned)) return "Le numéro ne doit contenir que des chiffres après le +";
  const digits = cleaned.slice(1);
  // Cherche un indicatif pays valide (1 à 3 chiffres, plus long d'abord)
  const code = [3, 2, 1]
    .map((len) => digits.slice(0, len))
    .find((c) => COUNTRY_DIAL_CODES.includes(c));
  if (!code) return "Indicatif pays inconnu (ex: +225 Côte d'Ivoire, +33 France)";
  const national = digits.slice(code.length);
  if (national.length < 6 || national.length > 14) {
    return "Longueur du numéro invalide (6 à 14 chiffres après l'indicatif)";
  }
  return null;
}

/** Normalise l'affichage du numéro : "+<code> <groupes de 2 chiffres>". */
export function formatPhone(raw: string): string {
  const cleaned = raw.replace(/[\s().-]/g, "");
  if (!/^\+\d+$/.test(cleaned)) return raw.trim();
  const digits = cleaned.slice(1);
  const code = [3, 2, 1]
    .map((len) => digits.slice(0, len))
    .find((c) => COUNTRY_DIAL_CODES.includes(c));
  if (!code) return raw.trim();
  const national = digits.slice(code.length);
  const grouped = national.replace(/(\d{2})(?=\d)/g, "$1 ");
  return `+${code} ${grouped}`.trim();
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(raw: string, required = false): string | null {
  const v = raw.trim();
  if (!v) return required ? "Email obligatoire" : null;
  if (v.length > 254) return "Email trop long";
  if (!EMAIL_REGEX.test(v)) return "Format d'email invalide";
  return null;
}

/** Empêche la saisie de chiffres dans un champ nom (à utiliser dans onChange). */
export function stripDigits(v: string): string {
  return v.replace(/\d+/g, "");
}

/** Filtre les caractères non autorisés dans un champ téléphone (garde + espaces chiffres séparateurs). */
export function sanitizePhoneInput(v: string): string {
  // Autorise seulement + au début, chiffres, espaces et séparateurs courants
  let out = v.replace(/[^\d+\s().-]/g, "");
  // Un seul + et uniquement au début
  const hasPlus = out.startsWith("+");
  out = out.replace(/\+/g, "");
  return (hasPlus ? "+" : "") + out;
}
