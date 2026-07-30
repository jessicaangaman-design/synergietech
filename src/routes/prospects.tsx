import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import {
  Plus,
  Filter,
  MoreVertical,
  ArrowRight,
  StickyNote,
  Phone,
  Mail,
  MapPin,
  Building2,
  User as UserIcon,
  Search,
} from "lucide-react";
import { PROSPECT_STATUTS, BESOINS, type ProspectStatut, type Prospect } from "@/types";
import { useUsers } from "@/features/equipe/api/use-equipe";
import { RoleSTS, SourceProspect, TypeBesoin } from "@/features/interface/enum";
import { useProspectActions, useProspects } from "@/features/prospects/api/use-prospects";
import { getApiErrorMessage } from "@/lib/api/client";
import { formatDate } from "@/lib/formatters";
import { validateName, validateEmail, stripDigits } from "@/lib/validation";
import {
  PhoneField,
  FieldError,
  composePhone,
  validateDialCode,
  validateNationalNumber,
} from "@/components/PhoneField";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const TYPE_BESOIN_OPTIONS = [
  { value: TypeBesoin.VIDEOSURVEILLANCE, label: "Vidéosurveillance" },
  { value: TypeBesoin.CONTROLE_ACCES, label: "Contrôle d'accès" },
  { value: TypeBesoin.CLOTURE_ELECTRIQUE, label: "Clôture électrique" },
  { value: TypeBesoin.MOTORISATION_PORTAIL, label: "Motorisation de portail" },
  { value: TypeBesoin.INCENDIE, label: "Incendie" },
  { value: TypeBesoin.ALARME, label: "Alarme" },
  { value: TypeBesoin.RADIO, label: "Radio" },
] as const;

const SOURCE_OPTIONS = [
  { value: SourceProspect.RECOMMANDATION, label: "Recommandation" },
  { value: SourceProspect.SITE_WEB, label: "Site web" },
  { value: SourceProspect.APPEL_DIRECT, label: "Appel direct" },
  { value: SourceProspect.RESEAUX_SOCIAUX, label: "Réseaux sociaux" },
  { value: SourceProspect.AUTRE, label: "Autre" },
] as const;

const prospectFormSchema = z
  .object({
    nom: z.string().trim().max(80, "Le nom ne doit pas dépasser 80 caractères"),
    entreprise: z.string().trim().max(120, "Le nom de l'entreprise est trop long"),
    indicatif: z.string(),
    telephone: z.string(),
    email: z.string().trim().max(254, "L'adresse e-mail est trop longue"),
    adresse: z.string().trim(),
    typeBesoin: z.nativeEnum(TypeBesoin),
    source: z.nativeEnum(SourceProspect),
    notes: z.string().trim().max(2000, "Les notes ne doivent pas dépasser 2000 caractères"),
    commercialId: z.string(),
  })
  .superRefine((values, context) => {
    const nomError = validateName(values.nom, "Nom");
    if (nomError) context.addIssue({ code: "custom", path: ["nom"], message: nomError });

    const indicatifError = validateDialCode(values.indicatif);
    if (indicatifError) {
      context.addIssue({ code: "custom", path: ["indicatif"], message: indicatifError });
    }

    const numeroError = validateNationalNumber(values.telephone, true);
    if (numeroError) {
      context.addIssue({ code: "custom", path: ["telephone"], message: numeroError });
    }

    const emailError = validateEmail(values.email, false);
    if (emailError) context.addIssue({ code: "custom", path: ["email"], message: emailError });
  });

type ProspectFormValues = z.infer<typeof prospectFormSchema>;

const STATUT_STYLE: Record<ProspectStatut, { badge: string; dot: string; bar: string }> = {
  Nouveau: {
    badge: "bg-chart-1/15 text-chart-1 border-chart-1/30",
    dot: "bg-chart-1",
    bar: "bg-chart-1",
  },
  Contacté: {
    badge: "bg-chart-6/15 text-chart-6 border-chart-6/30",
    dot: "bg-chart-6",
    bar: "bg-chart-6",
  },
  "Devis envoyé": {
    badge: "bg-chart-2/15 text-chart-2 border-chart-2/30",
    dot: "bg-chart-2",
    bar: "bg-chart-2",
  },
  Négociation: {
    badge: "bg-chart-7/15 text-chart-7 border-chart-7/30",
    dot: "bg-chart-7",
    bar: "bg-chart-7",
  },
  Gagné: {
    badge: "bg-success/15 text-success border-success/30",
    dot: "bg-success",
    bar: "bg-success",
  },
  Converti: {
    badge: "bg-success/15 text-success border-success/30",
    dot: "bg-success",
    bar: "bg-success",
  },
  Perdu: {
    badge: "bg-destructive/15 text-destructive border-destructive/30",
    dot: "bg-destructive",
    bar: "bg-destructive",
  },
};

const getStatutStyle = (statut: ProspectStatut) => STATUT_STYLE[statut] ?? STATUT_STYLE.Nouveau;

function initials(nom: string) {
  return nom
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

export function ProspectsPage() {
  const { prospects } = useProspects();
  const { users } = useUsers();
  const commerciaux = useMemo(
    () =>
      users
        .filter((user) => user.role === RoleSTS.COMMERCIAL && user.isActive)
        .map((user) => user.name)
        .filter((name): name is string => name !== null),
    [users],
  );

  const [tab, setTab] = useState<ProspectStatut | "Tous">("Tous");
  const [search, setSearch] = useState("");
  const [filtre, setFiltre] = useState<{ commercial: string; besoin: string }>({
    commercial: "all",
    besoin: "all",
  });
  const [openNew, setOpenNew] = useState(false);
  const [detail, setDetail] = useState<Prospect | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { Tous: prospects.length };
    for (const s of PROSPECT_STATUTS) c[s] = 0;
    for (const p of prospects) c[p.statut]++;
    return c;
  }, [prospects]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return prospects.filter(
      (p) =>
        (tab === "Tous" || p.statut === tab) &&
        (filtre.commercial === "all" || p.commercial === filtre.commercial) &&
        (filtre.besoin === "all" || p.besoin === filtre.besoin) &&
        (q === "" ||
          p.nom.toLowerCase().includes(q) ||
          (p.entreprise ?? "").toLowerCase().includes(q) ||
          p.telephone.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q)),
    );
  }, [prospects, tab, filtre, search]);

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Prospects"
        subtitle="Suivi commercial — filtrez par statut, commercial ou besoin"
        actions={
          <Dialog open={openNew} onOpenChange={setOpenNew}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-1.5" /> Nouveau prospect
              </Button>
            </DialogTrigger>
            <NewProspectDialog onClose={() => setOpenNew(false)} />
          </Dialog>
        }
      />

      {/* Status tabs */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4 border-b border-border pb-3">
        {(["Tous", ...PROSPECT_STATUTS] as const).map((s) => {
          const active = tab === s;
          const style = s === "Tous" ? null : getStatutStyle(s as ProspectStatut);
          return (
            <button
              key={s}
              onClick={() => setTab(s)}
              className={[
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
                active
                  ? "bg-foreground text-background border-foreground shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-foreground/40",
              ].join(" ")}
            >
              {style && <span className={`h-2 w-2 rounded-full ${style.dot}`} />}
              <span>{s}</span>
              <span
                className={[
                  "text-[11px] px-1.5 py-0.5 rounded-full font-semibold tabular-nums",
                  active ? "bg-background/20 text-background" : "bg-muted text-foreground/70",
                ].join(" ")}
              >
                {counts[s] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un nom, une entreprise, un téléphone…"
            className="pl-8"
          />
        </div>
        <Select
          value={filtre.commercial}
          onValueChange={(v) => setFiltre((f) => ({ ...f, commercial: v }))}
        >
          <SelectTrigger className="w-[180px]">
            <Filter className="h-3.5 w-3.5 mr-1.5" />
            <SelectValue placeholder="Commercial" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous commerciaux</SelectItem>
            {commerciaux.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filtre.besoin}
          onValueChange={(v) => setFiltre((f) => ({ ...f, besoin: v }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Besoin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous besoins</SelectItem>
            {BESOINS.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table (desktop) */}
      <Card className="hidden md:block overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="py-3 pl-4 pr-2 font-semibold">Prospect</th>
                <th className="py-3 px-2 font-semibold">Contact</th>
                <th className="py-3 px-2 font-semibold">Besoin</th>
                <th className="py-3 px-2 font-semibold">Commercial</th>
                <th className="py-3 px-2 font-semibold">Statut</th>
                <th className="py-3 px-2 font-semibold">Créé le</th>
                <th className="py-3 pr-4 pl-2 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    Aucun prospect ne correspond aux filtres.
                  </td>
                </tr>
              )}
              {filtered.map((p) => {
                const st = getStatutStyle(p.statut);
                return (
                  <tr
                    key={p.id}
                    onClick={() => setDetail(p)}
                    className="border-b border-border last:border-0 hover:bg-muted/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 pl-4 pr-2">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                            {initials(p.nom)}
                          </div>
                          <span
                            className={`absolute -left-1 top-0 h-9 w-1 rounded-full ${st.bar}`}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-foreground truncate">{p.nom}</div>
                          {p.entreprise && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                              <Building2 className="h-3 w-3" /> {p.entreprise}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {p.telephone}
                      </div>
                      {p.email && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 truncate max-w-[220px]">
                          <Mail className="h-3 w-3" /> {p.email}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <Badge variant="outline" className="font-normal capitalize">
                        {p.besoin}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-foreground/80">{p.commercial}</td>
                    <td className="py-3 px-2">
                      <Badge variant="outline" className={st.badge}>
                        <span className={`h-1.5 w-1.5 rounded-full ${st.dot} mr-1.5`} />
                        {p.statut}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-muted-foreground text-xs">
                      {formatDate(p.dateCreation)}
                    </td>
                    <td className="py-3 pr-4 pl-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {p.notes.length > 0 && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-0.5 mr-1">
                            <StickyNote className="h-3 w-3" />
                            {p.notes.length}
                          </span>
                        )}
                        <StatutMenu prospectId={p.id} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Cards (mobile) */}
      <div className="md:hidden space-y-2">
        {filtered.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground text-sm">
            Aucun prospect ne correspond aux filtres.
          </Card>
        )}
        {filtered.map((p) => {
          const st = getStatutStyle(p.statut);
          return (
            <Card
              key={p.id}
              onClick={() => setDetail(p)}
              className="p-3 cursor-pointer hover:border-accent/50 relative overflow-hidden"
            >
              <span className={`absolute left-0 top-0 bottom-0 w-1 ${st.bar}`} />
              <div className="pl-2 flex items-start justify-between gap-2 mb-1.5">
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{p.nom}</div>
                  {p.entreprise && (
                    <div className="text-xs text-muted-foreground truncate">{p.entreprise}</div>
                  )}
                </div>
                <Badge variant="outline" className={st.badge}>
                  {p.statut}
                </Badge>
              </div>
              <div className="pl-2 text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {p.telephone}
                </span>
                <span className="capitalize">{p.besoin}</span>
                <span className="flex items-center gap-1">
                  <UserIcon className="h-3 w-3" /> {p.commercial}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        {detail && <ProspectDetailDialog prospect={detail} onClose={() => setDetail(null)} />}
      </Dialog>
    </div>
  );
}

function StatutMenu({ prospectId }: { prospectId: string }) {
  const { setProspectStatut: setStatut } = useProspectActions();

  const changeStatut = async (statut: ProspectStatut) => {
    try {
      await setStatut(prospectId, statut);
      toast.success(`Statut : ${statut}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Le changement de statut a échoué."));
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <button className="p-1.5 hover:bg-muted rounded">
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuLabel>Changer le statut</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {PROSPECT_STATUTS.map((s) => (
          <DropdownMenuItem key={s} onClick={() => void changeStatut(s)}>
            {s}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NewProspectDialog({ onClose }: { onClose: () => void }) {
  const { addProspect } = useProspectActions();
  const { users } = useUsers();
  const commerciaux = useMemo(
    () => users.filter((user) => user.role === RoleSTS.COMMERCIAL && user.isActive),
    [users],
  );
  const {
    clearErrors,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProspectFormValues>({
    resolver: zodResolver(prospectFormSchema),
    defaultValues: {
      nom: "",
      entreprise: "",
      indicatif: "225",
      telephone: "",
      email: "",
      adresse: "",
      typeBesoin: TypeBesoin.VIDEOSURVEILLANCE,
      source: SourceProspect.SITE_WEB,
      notes: "",
      commercialId: commerciaux[0]?.id ?? "",
    },
  });

  const submit = async (values: ProspectFormValues) => {
    clearErrors("root.server");

    try {
      await addProspect({
        nom: values.nom,
        entreprise: values.entreprise || undefined,
        telephone: composePhone(values.indicatif, values.telephone),
        email: values.email || undefined,
        adresse: values.adresse,
        typeBesoin: values.typeBesoin,
        source: values.source,
        notes: values.notes || undefined,
        commercialId: values.commercialId || undefined,
      });
      toast.success("Prospect créé");
      onClose();
    } catch (error) {
      const message = getApiErrorMessage(error, "La création du prospect a échoué.");
      setError("root.server", { type: "server", message });
      toast.error(message);
    }
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Nouveau prospect</DialogTitle>
        <DialogDescription>Créer une fiche prospect dans le pipeline</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit(submit)} className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>Nom complet *</Label>
          <Controller
            name="nom"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                onChange={(event) => field.onChange(stripDigits(event.target.value))}
                placeholder="Ex: Konan Aristide"
                maxLength={80}
                aria-invalid={!!errors.nom}
              />
            )}
          />
          <FieldError message={errors.nom?.message} />
        </div>
        <div className="col-span-2">
          <Label>Entreprise</Label>
          <Controller
            name="entreprise"
            control={control}
            render={({ field }) => <Input {...field} maxLength={120} />}
          />
          <FieldError message={errors.entreprise?.message} />
        </div>
        <Controller
          name="indicatif"
          control={control}
          render={({ field: indicatifField }) => (
            <Controller
              name="telephone"
              control={control}
              render={({ field: numeroField }) => (
                <PhoneField
                  required
                  indicatif={indicatifField.value}
                  national={numeroField.value}
                  onIndicatifChange={indicatifField.onChange}
                  onNationalChange={numeroField.onChange}
                  indicatifError={errors.indicatif?.message}
                  nationalError={errors.telephone?.message}
                />
              )}
            />
          )}
        />
        <div className="col-span-2">
          <Label>Email</Label>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="email"
                placeholder="nom@exemple.com"
                maxLength={254}
                aria-invalid={!!errors.email}
              />
            )}
          />
          <FieldError message={errors.email?.message} />
        </div>
        <div className="col-span-2">
          <Label>Adresse</Label>
          <Controller
            name="adresse"
            control={control}
            render={({ field }) => <Input {...field} />}
          />
        </div>
        <div>
          <Label>Type de besoin</Label>
          <Controller
            name="typeBesoin"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger aria-invalid={!!errors.typeBesoin}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_BESOIN_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError message={errors.typeBesoin?.message} />
        </div>
        <div>
          <Label>Source</Label>
          <Controller
            name="source"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger aria-invalid={!!errors.source}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError message={errors.source?.message} />
        </div>
        <div className="col-span-2">
          <Label>Notes</Label>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                rows={3}
                maxLength={2000}
                placeholder="Informations complémentaires sur le prospect"
                aria-invalid={!!errors.notes}
              />
            )}
          />
          <FieldError message={errors.notes?.message} />
        </div>
        <div className="col-span-2">
          <Label>Commercial assigné</Label>
          <Controller
            name="commercialId"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || "none"}
                onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un commercial" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Non assigné</SelectItem>
                  {commerciaux.map((commercial) => (
                    <SelectItem key={commercial.id} value={commercial.id}>
                      {commercial.name ?? commercial.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="col-span-2">
          <FieldError message={errors.root?.server?.message} />
        </div>
        <DialogFooter className="col-span-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Création..." : "Créer"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function ProspectDetailDialog({ prospect, onClose }: { prospect: Prospect; onClose: () => void }) {
  const {
    addNote,
    convertirProspect: convertir,
    setProspectStatut: setStatut,
  } = useProspectActions();
  const [note, setNote] = useState("");
  const navigate = useNavigate();
  const { prospects } = useProspects();
  const p = prospects.find((item) => item.id === prospect.id) || prospect;
  const st = getStatutStyle(p.statut);

  const changeStatut = async (statut: ProspectStatut) => {
    try {
      await setStatut(p.id, statut);
      toast.success(`Statut : ${statut}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Le changement de statut a échoué."));
    }
  };

  const convertirEnClient = async () => {
    try {
      const contratId = await convertir(p.id);
      toast.success("Prospect converti en client — contrat créé en brouillon");
      onClose();
      navigate(`/contrats?open=${encodeURIComponent(contratId)}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "La conversion du prospect a échoué."));
    }
  };

  const enregistrerNote = async () => {
    const texte = note.trim();
    if (!texte) {
      toast.error("La note ne peut pas être vide.");
      return;
    }

    try {
      await addNote(p.id, texte);
      setNote("");
      toast.success("Note ajoutée");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "L'ajout de la note a échoué."));
    }
  };

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {p.nom}
          <Badge variant="outline" className={st.badge}>
            {p.statut}
          </Badge>
        </DialogTitle>
        {p.entreprise && <DialogDescription>{p.entreprise}</DialogDescription>}
      </DialogHeader>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
        <Info icon={<Phone className="h-3.5 w-3.5" />} label="Téléphone" value={p.telephone} />
        <Info icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={p.email} />
        <Info icon={<MapPin className="h-3.5 w-3.5" />} label="Adresse" value={p.adresse} />
        <Info label="Besoin" value={p.besoin} />
        <Info label="Source" value={p.source} />
        <Info icon={<UserIcon className="h-3.5 w-3.5" />} label="Commercial" value={p.commercial} />
        <Info label="Créé le" value={formatDate(p.dateCreation)} />
        {p.derniereRelance && (
          <Info label="Dernière relance" value={formatDate(p.derniereRelance)} />
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Select
          value={p.statut}
          onValueChange={(statut: ProspectStatut) => void changeStatut(statut)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PROSPECT_STATUTS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {p.statut !== "Converti" && (
          <Button onClick={() => void convertirEnClient()}>
            <ArrowRight className="h-4 w-4 mr-1.5" />
            Convertir en client
          </Button>
        )}
      </div>

      <div>
        <Label className="text-sm">Ajouter une note / relance</Label>
        <div className="flex gap-2 mt-1">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Ex : rappelé le client, RDV fixé mardi 10h..."
          />
          <Button onClick={() => void enregistrerNote()}>Ajouter</Button>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Label className="text-sm">Historique ({p.notes.length})</Label>
        {p.notes.length === 0 && (
          <div className="text-xs text-muted-foreground">Aucune note pour l'instant.</div>
        )}
        {p.notes.map((n) => (
          <div key={n.id} className="bg-muted/50 rounded-md p-2.5 text-sm">
            <div className="text-[11px] text-muted-foreground mb-1">{formatDate(n.date)}</div>
            {n.texte}
          </div>
        ))}
      </div>
    </DialogContent>
  );
}

function Info({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
