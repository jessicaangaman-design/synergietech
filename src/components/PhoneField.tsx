import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COUNTRY_DIAL_CODES } from "@/lib/validation";

/** Message d'erreur inline sous un champ. */
export function FieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p className="text-xs text-destructive mt-1" role="alert">
      {message}
    </p>
  );
}

/** Vérifie qu'un indicatif (sans le +) existe dans la liste ITU-T. */
export function isValidDialCode(code: string): boolean {
  return COUNTRY_DIAL_CODES.includes(code.replace(/^\+/, "").trim());
}

/** Valide l'indicatif et retourne un message d'erreur ou null. */
export function validateDialCode(code: string): string | null {
  const v = code.replace(/^\+/, "").trim();
  if (!v) return "Indicatif pays obligatoire";
  if (!/^\d{1,3}$/.test(v)) return "Indicatif : 1 à 3 chiffres uniquement";
  if (!COUNTRY_DIAL_CODES.includes(v)) return "Indicatif pays inconnu (ex: 225, 33, 1)";
  return null;
}

/** Valide la partie nationale du numéro. */
export function validateNationalNumber(num: string, required = true): string | null {
  const v = num.replace(/[\s().-]/g, "");
  if (!v) return required ? "Numéro obligatoire" : null;
  if (!/^\d+$/.test(v)) return "Le numéro ne doit contenir que des chiffres";
  if (v.length < 6 || v.length > 14) return "Longueur invalide (6 à 14 chiffres)";
  return null;
}

/** Combine indicatif + numéro national en E.164 lisible. */
export function composePhone(indicatif: string, national: string): string {
  const code = indicatif.replace(/^\+/, "").trim();
  const digits = national.replace(/[\s().-]/g, "");
  if (!code || !digits) return "";
  const grouped = digits.replace(/(\d{2})(?=\d)/g, "$1 ");
  return `+${code} ${grouped}`.trim();
}

/** Sépare un numéro stocké en indicatif + national (best effort). */
export function splitPhone(full: string): { indicatif: string; national: string } {
  const cleaned = full.replace(/[\s().-]/g, "");
  if (!cleaned.startsWith("+")) return { indicatif: "", national: cleaned.replace(/\D/g, "") };
  const digits = cleaned.slice(1);
  const code = [3, 2, 1]
    .map((len) => digits.slice(0, len))
    .find((c) => COUNTRY_DIAL_CODES.includes(c));
  if (!code) return { indicatif: "", national: digits };
  return { indicatif: code, national: digits.slice(code.length) };
}

type PhoneFieldProps = {
  indicatif: string;
  national: string;
  onIndicatifChange: (v: string) => void;
  onNationalChange: (v: string) => void;
  required?: boolean;
  label?: string;
  indicatifError?: string | null;
  nationalError?: string | null;
};

/** Champ téléphone en deux parties : indicatif pays (vérifié) + numéro. */
export function PhoneField({
  indicatif,
  national,
  onIndicatifChange,
  onNationalChange,
  required,
  label = "Téléphone",
  indicatifError,
  nationalError,
}: PhoneFieldProps) {
  return (
    <div className="col-span-2">
      <Label>
        {label}
        {required ? " *" : ""}
      </Label>
      <div className="grid grid-cols-[110px_1fr] gap-2">
        <div>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">+</span>
            <Input
              value={indicatif}
              onChange={(e) => onIndicatifChange(e.target.value.replace(/\D/g, "").slice(0, 3))}
              placeholder="225"
              inputMode="numeric"
              maxLength={3}
              aria-invalid={!!indicatifError}
              className="pl-5"
            />
          </div>
          <FieldError message={indicatifError} />
        </div>
        <div>
          <Input
            value={national}
            onChange={(e) => onNationalChange(e.target.value.replace(/[^\d\s().-]/g, "").slice(0, 20))}
            placeholder="07 00 00 00 00"
            inputMode="tel"
            aria-invalid={!!nationalError}
          />
          <FieldError message={nationalError} />
        </div>
      </div>
    </div>
  );
}
