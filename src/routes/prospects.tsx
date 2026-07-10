import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Filter, MoreVertical, ArrowRight, StickyNote } from "lucide-react";
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

const COLONNES: ProspectStatut[] = [
  "Nouveau",
  "Contacté",
  "Devis envoyé",
  "Négociation",
  "Converti",
  "Perdu",
];

const STATUT_BADGE: Record<ProspectStatut, string> = {
  Nouveau: "bg-chart-1/15 text-chart-1 border-chart-1/30",
  Contacté: "bg-chart-6/15 text-chart-6 border-chart-6/30",
  "Devis envoyé": "bg-chart-2/15 text-chart-2 border-chart-2/30",
  Négociation: "bg-chart-7/15 text-chart-7 border-chart-7/30",
  Converti: "bg-success/15 text-success border-success/30",
  Perdu: "bg-destructive/15 text-destructive border-destructive/30",
};

function ProspectsPage() {
  const prospects = useStore((s) => s.prospects);
  const setStatut = useStore((s) => s.setProspectStatut);
  const [filtre, setFiltre] = useState<{ commercial: string; besoin: string }>({
    commercial: "all",
    besoin: "all",
  });
  const [openNew, setOpenNew] = useState(false);
  const [detail, setDetail] = useState<Prospect | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      prospects.filter(
        (p) =>
          (filtre.commercial === "all" || p.commercial === filtre.commercial) &&
          (filtre.besoin === "all" || p.besoin === filtre.besoin),
      ),
    [prospects, filtre],
  );

  const onDrop = (statut: ProspectStatut) => {
    if (dragId) {
      setStatut(dragId, statut);
      toast.success(`Prospect déplacé vers "${statut}"`);
      setDragId(null);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Prospects"
        subtitle="Pipeline commercial — glissez-déposez pour changer un statut"
        actions={
          <>
            <Select value={filtre.commercial} onValueChange={(v) => setFiltre((f) => ({ ...f, commercial: v }))}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-3.5 w-3.5 mr-1.5" />
                <SelectValue placeholder="Commercial" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous commerciaux</SelectItem>
                {COMMERCIAUX.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtre.besoin} onValueChange={(v) => setFiltre((f) => ({ ...f, besoin: v }))}>
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
            <Dialog open={openNew} onOpenChange={setOpenNew}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-1.5" /> Nouveau prospect
                </Button>
              </DialogTrigger>
              <NewProspectDialog onClose={() => setOpenNew(false)} />
            </Dialog>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto">
        {COLONNES.map((col) => {
          const items = filtered.filter((p) => p.statut === col);
          return (
            <div
              key={col}
              className="min-w-[240px] flex flex-col"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(col)}
            >
              <div className="flex items-center justify-between px-2 py-2 mb-2 border-b-2 border-border">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    {col}
                  </span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {items.length}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2 min-h-[200px]">
                {items.map((p) => (
                  <ProspectCard
                    key={p.id}
                    p={p}
                    onOpen={() => setDetail(p)}
                    onDragStart={() => setDragId(p.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        {detail && <ProspectDetailDialog prospect={detail} onClose={() => setDetail(null)} />}
      </Dialog>
    </div>
  );
}

function ProspectCard({
  p,
  onOpen,
  onDragStart,
}: {
  p: Prospect;
  onOpen: () => void;
  onDragStart: () => void;
}) {
  const setStatut = useStore((s) => s.setProspectStatut);
  return (
    <Card
      draggable
      onDragStart={onDragStart}
      onClick={onOpen}
      className="p-3 cursor-pointer hover:shadow-md hover:border-accent/50 transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="min-w-0">
          <div className="font-medium text-sm truncate">{p.nom}</div>
          {p.entreprise && (
            <div className="text-xs text-muted-foreground truncate">{p.entreprise}</div>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <button className="p-1 hover:bg-muted rounded">
              <MoreVertical className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuLabel>Changer le statut</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {PROSPECT_STATUTS.map((s) => (
              <DropdownMenuItem key={s} onClick={() => setStatut(p.id, s)}>
                {s}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex flex-wrap gap-1 mb-2">
        <Badge variant="outline" className="text-[10px] font-normal">
          {p.besoin}
        </Badge>
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="truncate">{p.commercial}</span>
        {p.notes.length > 0 && (
          <span className="flex items-center gap-0.5">
            <StickyNote className="h-3 w-3" />
            {p.notes.length}
          </span>
        )}
      </div>
    </Card>
  );
}

function NewProspectDialog({ onClose }: { onClose: () => void }) {
  const addProspect = useStore((s) => s.addProspect);
  const [f, setF] = useState({
    nom: "",
    entreprise: "",
    telephone: "",
    email: "",
    adresse: "",
    besoin: "vidéosurveillance" as BesoinType,
    source: "site web" as Source,
    commercial: COMMERCIAUX[0],
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
          <Input value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} />
        </div>
        <div className="col-span-2">
          <Label>Entreprise</Label>
          <Input
            value={f.entreprise}
            onChange={(e) => setF({ ...f, entreprise: e.target.value })}
          />
        </div>
        <div>
          <Label>Téléphone *</Label>
          <Input value={f.telephone} onChange={(e) => setF({ ...f, telephone: e.target.value })} />
        </div>
        <div>
          <Label>Email</Label>
          <Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
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
              {COMMERCIAUX.map((c) => (
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
  // re-read from store to get updates
  const p = useStore((s) => s.prospects.find((x) => x.id === prospect.id)) || prospect;

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {p.nom}
          <Badge variant="outline" className={STATUT_BADGE[p.statut]}>{p.statut}</Badge>
        </DialogTitle>
        {p.entreprise && <DialogDescription>{p.entreprise}</DialogDescription>}
      </DialogHeader>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
        <Info label="Téléphone" value={p.telephone} />
        <Info label="Email" value={p.email} />
        <Info label="Adresse" value={p.adresse} />
        <Info label="Besoin" value={p.besoin} />
        <Info label="Source" value={p.source} />
        <Info label="Commercial" value={p.commercial} />
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
