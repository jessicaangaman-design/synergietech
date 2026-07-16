import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import {
  useStore,
  PROSPECT_STATUTS,
  BESOINS,
  formatDate,
  type ProspectStatut,
  type BesoinType,
  type Source,
  type Prospect,
} from "@/lib/store";
import { validateName, validatePhone, validateEmail, formatPhone, stripDigits, sanitizePhoneInput } from "@/lib/validation";
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
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/prospects")({
  component: ProspectsPage,
});

const STATUT_STYLE: Record<
  ProspectStatut,
  { badge: string; dot: string; bar: string }
> = {
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

function initials(nom: string) {
  return nom
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

function ProspectsPage() {
  const prospects = useStore((s) => s.prospects);
  const equipe = useStore((s) => s.equipe);
  const commerciaux = useMemo(
    () => equipe.filter((m) => m.role === "commercial" && m.actif).map((m) => m.nom),
    [equipe],
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
          const style = s === "Tous" ? null : STATUT_STYLE[s as ProspectStatut];
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
                const st = STATUT_STYLE[p.statut];
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
          const st = STATUT_STYLE[p.statut];
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
  const setStatut = useStore((s) => s.setProspectStatut);
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
          <DropdownMenuItem
            key={s}
            onClick={() => {
              setStatut(prospectId, s);
              toast.success(`Statut : ${s}`);
            }}
          >
            {s}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NewProspectDialog({ onClose }: { onClose: () => void }) {
  const addProspect = useStore((s) => s.addProspect);
  const equipe = useStore((s) => s.equipe);
  const commerciaux = useMemo(
    () => equipe.filter((m) => m.role === "commercial" && m.actif).map((m) => m.nom),
    [equipe],
  );
  const [f, setF] = useState({
    nom: "",
    entreprise: "",
    telephone: "",
    email: "",
    adresse: "",
    besoin: "vidéosurveillance" as BesoinType,
    source: "site web" as Source,
    commercial: commerciaux[0] ?? "",
  });
  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Nouveau prospect</DialogTitle>
        <DialogDescription>Créer une fiche prospect dans le pipeline</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>Nom complet *</Label>
          <Input
            value={f.nom}
            onChange={(e) => setF({ ...f, nom: stripDigits(e.target.value) })}
            placeholder="Ex: Konan Aristide"
            maxLength={80}
          />
        </div>
        <div className="col-span-2">
          <Label>Entreprise</Label>
          <Input
            value={f.entreprise}
            onChange={(e) => setF({ ...f, entreprise: e.target.value })}
            maxLength={120}
          />
        </div>
        <div>
          <Label>Téléphone *</Label>
          <Input
            value={f.telephone}
            onChange={(e) => setF({ ...f, telephone: sanitizePhoneInput(e.target.value) })}
            placeholder="+225 07 00 00 00 00"
            inputMode="tel"
            maxLength={25}
          />
        </div>
        <div>
          <Label>Email</Label>
          <Input
            type="email"
            value={f.email}
            onChange={(e) => setF({ ...f, email: e.target.value })}
            placeholder="nom@exemple.com"
            maxLength={254}
          />
        </div>
        <div className="col-span-2">
          <Label>Adresse</Label>
          <Input value={f.adresse} onChange={(e) => setF({ ...f, adresse: e.target.value })} />
        </div>
        <div>
          <Label>Type de besoin</Label>
          <Select value={f.besoin} onValueChange={(v: BesoinType) => setF({ ...f, besoin: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {BESOINS.map((b) => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Source</Label>
          <Select value={f.source} onValueChange={(v: Source) => setF({ ...f, source: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(["recommandation", "site web", "appel direct", "réseaux sociaux"] as Source[]).map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <Label>Commercial assigné</Label>
          <Select value={f.commercial} onValueChange={(v) => setF({ ...f, commercial: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {commerciaux.map((c: string) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Annuler</Button>
        <Button
          onClick={() => {
            if (!f.nom || !f.telephone) {
              toast.error("Nom et téléphone requis");
              return;
            }
            addProspect(f);
            toast.success("Prospect créé");
            onClose();
          }}
        >
          Créer
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function ProspectDetailDialog({ prospect, onClose }: { prospect: Prospect; onClose: () => void }) {
  const addNote = useStore((s) => s.addNote);
  const convertir = useStore((s) => s.convertirProspect);
  const setStatut = useStore((s) => s.setProspectStatut);
  const [note, setNote] = useState("");
  const navigate = useNavigate();
  const p = useStore((s) => s.prospects.find((x) => x.id === prospect.id)) || prospect;
  const st = STATUT_STYLE[p.statut];

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {p.nom}
          <Badge variant="outline" className={st.badge}>{p.statut}</Badge>
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
        {p.derniereRelance && <Info label="Dernière relance" value={formatDate(p.derniereRelance)} />}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Select value={p.statut} onValueChange={(v: ProspectStatut) => setStatut(p.id, v)}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PROSPECT_STATUTS.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {p.statut !== "Converti" && (
          <Button
            onClick={() => {
              const cid = convertir(p.id);
              toast.success("Prospect converti en client — contrat créé en brouillon");
              onClose();
              navigate({ to: "/contrats", search: { open: cid } as any });
            }}
          >
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
          <Button
            onClick={() => {
              if (!note.trim()) return;
              addNote(p.id, note);
              setNote("");
              toast.success("Note ajoutée");
            }}
          >
            Ajouter
          </Button>
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

function Info({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
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
