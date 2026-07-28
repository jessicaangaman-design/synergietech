import { useSearchParams } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { Plus, AlertTriangle, Trash2 } from "lucide-react";
import {
  BESOINS,
  type ContratStatut,
  type ContratType,
  type BesoinType,
  type Contrat,
  type LigneContrat,
  totalLignes,
} from "@/types";
import { useContrat, useContratActions, useContrats } from "@/features/contrats/api/use-contrats";
import { daysUntil, formatDate, formatFCFA } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

const TYPES: ContratType[] = [
  "Installation ponctuelle",
  "Contrat de maintenance annuel",
  "Abonnement télésurveillance",
];
const STATUTS: ContratStatut[] = ["Brouillon", "Actif", "En renouvellement", "Expiré", "Résilié"];

const STATUT_STYLE: Record<ContratStatut, string> = {
  Brouillon: "bg-muted text-muted-foreground",
  Actif: "bg-success/15 text-success border-success/30",
  "En renouvellement": "bg-warning/15 text-warning border-warning/30",
  Expiré: "bg-destructive/15 text-destructive border-destructive/30",
  Résilié: "bg-muted text-muted-foreground line-through",
};

export function ContratsPage() {
  const { contrats } = useContrats();
  const [openNew, setOpenNew] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const openContratId = searchParams.get("open");

  useEffect(() => {
    if (openContratId) setDetailId(openContratId);
  }, [openContratId]);

  const sorted = useMemo(
    () => [...contrats].sort((a, b) => +new Date(b.dateSignature) - +new Date(a.dateSignature)),
    [contrats],
  );
  const echeanceCount = contrats.filter((c) => {
    const j = daysUntil(c.echeance);
    return j >= 0 && j <= 30 && c.statut !== "Résilié" && c.statut !== "Brouillon";
  }).length;

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Contrats"
        subtitle={`${contrats.length} contrats · ${echeanceCount} échéance(s) dans les 30 jours`}
        actions={
          <Dialog open={openNew} onOpenChange={setOpenNew}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-1.5" /> Nouveau contrat
              </Button>
            </DialogTrigger>
            <NewContratDialog onClose={() => setOpenNew(false)} />
          </Dialog>
        }
      />

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Service</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead>Signature</TableHead>
              <TableHead>Échéance</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((c) => {
              const j = daysUntil(c.echeance);
              const alerte =
                j >= 0 && j <= 30 && c.statut !== "Résilié" && c.statut !== "Brouillon";
              return (
                <TableRow key={c.id} onClick={() => setDetailId(c.id)} className="cursor-pointer">
                  <TableCell className="font-medium">{c.clientNom}</TableCell>
                  <TableCell className="text-xs">{c.type}</TableCell>
                  <TableCell className="text-xs">{c.besoin}</TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {formatFCFA(c.montant)}
                  </TableCell>
                  <TableCell className="text-xs">{formatDate(c.dateSignature)}</TableCell>
                  <TableCell className="text-xs">
                    <div className="flex items-center gap-1.5">
                      {formatDate(c.echeance)}
                      {alerte && (
                        <Badge
                          variant="outline"
                          className="bg-warning/15 text-warning border-warning/30 text-[10px]"
                        >
                          <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                          {j}j
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUT_STYLE[c.statut]}>
                      {c.statut}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)}>
        {detailId && <ContratDetail id={detailId} onClose={() => setDetailId(null)} />}
      </Dialog>
    </div>
  );
}

function ContratDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const { contrat } = useContrat(id);
  const { updateContrat, addLigne, updateLigne, removeLigne } = useContratActions();
  const [newLigne, setNewLigne] = useState({ description: "", quantite: 1, prixUnitaire: 0 });

  if (!contrat) return null;
  const j = daysUntil(contrat.echeance);

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {contrat.clientNom}
          <Badge variant="outline" className={STATUT_STYLE[contrat.statut]}>
            {contrat.statut}
          </Badge>
        </DialogTitle>
        <DialogDescription>
          {contrat.type} — {contrat.besoin}
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Montant total (calculé)</Label>
          <div className="h-9 px-3 flex items-center rounded-md border border-input bg-muted/40 font-mono text-sm">
            {formatFCFA(contrat.montant)}
          </div>
        </div>
        <div>
          <Label>Statut</Label>
          <Select
            value={contrat.statut}
            onValueChange={(v: ContratStatut) => updateContrat(id, { statut: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUTS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Type</Label>
          <Select
            value={contrat.type}
            onValueChange={(v: ContratType) => updateContrat(id, { type: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Durée (mois)</Label>
          <Input
            type="number"
            value={contrat.dureeMois}
            onChange={(e) => updateContrat(id, { dureeMois: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label>Date de signature</Label>
          <Input
            type="date"
            value={contrat.dateSignature.slice(0, 10)}
            onChange={(e) =>
              updateContrat(id, { dateSignature: new Date(e.target.value).toISOString() })
            }
          />
        </div>
        <div>
          <Label>Échéance</Label>
          <Input
            type="date"
            value={contrat.echeance.slice(0, 10)}
            onChange={(e) =>
              updateContrat(id, { echeance: new Date(e.target.value).toISOString() })
            }
          />
        </div>
      </div>

      {j >= 0 && j <= 30 && contrat.statut !== "Résilié" && contrat.statut !== "Brouillon" && (
        <div className="flex items-center gap-2 text-sm bg-warning/10 border border-warning/30 rounded-md p-3 text-warning">
          <AlertTriangle className="h-4 w-4" />
          Ce contrat arrive à échéance dans {j} jour(s).
        </div>
      )}

      <div>
        <Label className="text-sm mb-2 block">Devis — équipements & services</Label>
        <div className="rounded-md border overflow-hidden">
          <div className="grid grid-cols-[1fr_80px_130px_130px_36px] gap-2 px-3 py-2 bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
            <div>Désignation</div>
            <div className="text-center">Qté</div>
            <div className="text-right">P.U. (FCFA)</div>
            <div className="text-right">Total</div>
            <div />
          </div>
          {contrat.lignes.map((l) => (
            <div
              key={l.id}
              className="grid grid-cols-[1fr_80px_130px_130px_36px] gap-2 px-3 py-1.5 items-center border-t"
            >
              <Input
                className="h-8"
                value={l.description}
                onChange={(e) => updateLigne(id, l.id, { description: e.target.value })}
              />
              <Input
                type="number"
                min={1}
                className="h-8 text-center"
                value={l.quantite}
                onChange={(e) => updateLigne(id, l.id, { quantite: Number(e.target.value) })}
              />
              <Input
                type="number"
                min={0}
                className="h-8 text-right font-mono"
                value={l.prixUnitaire}
                onChange={(e) => updateLigne(id, l.id, { prixUnitaire: Number(e.target.value) })}
              />
              <div className="text-right font-mono text-sm">
                {formatFCFA(l.quantite * l.prixUnitaire)}
              </div>
              <button
                onClick={() => removeLigne(id, l.id)}
                className="text-muted-foreground hover:text-destructive justify-self-center"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {contrat.lignes.length === 0 && (
            <div className="px-3 py-3 text-xs text-muted-foreground border-t">
              Aucune ligne. Ajoutez du matériel ou une prestation ci-dessous.
            </div>
          )}
          <div className="grid grid-cols-[1fr_80px_130px_130px_36px] gap-2 px-3 py-2 border-t bg-muted/30 items-center font-medium">
            <div className="text-right text-sm">Total devis</div>
            <div />
            <div />
            <div className="text-right font-mono text-sm text-primary">
              {formatFCFA(totalLignes(contrat.lignes))}
            </div>
            <div />
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <Input
            placeholder="Désignation (ex : 4 caméras IP 4MP)"
            value={newLigne.description}
            onChange={(e) => setNewLigne({ ...newLigne, description: e.target.value })}
          />
          <Input
            type="number"
            min={1}
            className="w-20"
            placeholder="Qté"
            value={newLigne.quantite}
            onChange={(e) => setNewLigne({ ...newLigne, quantite: Number(e.target.value) })}
          />
          <Input
            type="number"
            min={0}
            className="w-32"
            placeholder="P.U."
            value={newLigne.prixUnitaire}
            onChange={(e) => setNewLigne({ ...newLigne, prixUnitaire: Number(e.target.value) })}
          />
          <Button
            onClick={() => {
              if (!newLigne.description.trim()) return;
              addLigne(id, newLigne.description, newLigne.quantite, newLigne.prixUnitaire);
              setNewLigne({ description: "", quantite: 1, prixUnitaire: 0 });
            }}
          >
            Ajouter
          </Button>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Fermer
        </Button>
        <Button
          onClick={() => {
            toast.success("Contrat enregistré");
            onClose();
          }}
        >
          Enregistrer
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function NewContratDialog({ onClose }: { onClose: () => void }) {
  const { addContrat } = useContratActions();
  const [f, setF] = useState({
    clientNom: "",
    type: "Installation ponctuelle" as ContratType,
    besoin: "vidéosurveillance" as BesoinType,
    dureeMois: 12,
    statut: "Brouillon" as ContratStatut,
  });
  const [lignes, setLignes] = useState<Omit<LigneContrat, "id">[]>([
    { description: "", quantite: 1, prixUnitaire: 0 },
  ]);
  const total = lignes.reduce((s, l) => s + (l.quantite || 0) * (l.prixUnitaire || 0), 0);

  const updateL = (i: number, patch: Partial<Omit<LigneContrat, "id">>) =>
    setLignes((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const removeL = (i: number) => setLignes((ls) => ls.filter((_, idx) => idx !== i));
  const addL = () => setLignes((ls) => [...ls, { description: "", quantite: 1, prixUnitaire: 0 }]);

  return (
    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Nouveau devis / contrat</DialogTitle>
        <DialogDescription>
          Le montant du contrat est calculé automatiquement à partir des lignes du devis.
        </DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>Client *</Label>
          <Input value={f.clientNom} onChange={(e) => setF({ ...f, clientNom: e.target.value })} />
        </div>
        <div>
          <Label>Type</Label>
          <Select value={f.type} onValueChange={(v: ContratType) => setF({ ...f, type: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Service</Label>
          <Select value={f.besoin} onValueChange={(v: BesoinType) => setF({ ...f, besoin: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BESOINS.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Durée (mois)</Label>
          <Input
            type="number"
            value={f.dureeMois}
            onChange={(e) => setF({ ...f, dureeMois: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label>Statut initial</Label>
          <Select value={f.statut} onValueChange={(v: ContratStatut) => setF({ ...f, statut: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUTS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-2">
        <div className="flex items-center justify-between mb-2">
          <Label>Lignes du devis</Label>
          <Button size="sm" variant="outline" onClick={addL}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter une ligne
          </Button>
        </div>
        <div className="rounded-md border overflow-hidden">
          <div className="grid grid-cols-[1fr_80px_130px_130px_36px] gap-2 px-3 py-2 bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
            <div>Désignation</div>
            <div className="text-center">Qté</div>
            <div className="text-right">P.U. (FCFA)</div>
            <div className="text-right">Total</div>
            <div />
          </div>
          {lignes.map((l, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_80px_130px_130px_36px] gap-2 px-3 py-1.5 items-center border-t"
            >
              <Input
                className="h-8"
                placeholder="Ex : 4 caméras IP 4MP"
                value={l.description}
                onChange={(e) => updateL(i, { description: e.target.value })}
              />
              <Input
                type="number"
                min={1}
                className="h-8 text-center"
                value={l.quantite}
                onChange={(e) => updateL(i, { quantite: Number(e.target.value) })}
              />
              <Input
                type="number"
                min={0}
                className="h-8 text-right font-mono"
                value={l.prixUnitaire}
                onChange={(e) => updateL(i, { prixUnitaire: Number(e.target.value) })}
              />
              <div className="text-right font-mono text-sm">
                {formatFCFA((l.quantite || 0) * (l.prixUnitaire || 0))}
              </div>
              <button
                onClick={() => removeL(i)}
                className="text-muted-foreground hover:text-destructive justify-self-center"
                aria-label="Supprimer la ligne"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <div className="grid grid-cols-[1fr_80px_130px_130px_36px] gap-2 px-3 py-2 border-t bg-muted/30 items-center font-medium">
            <div className="text-right text-sm">Total devis</div>
            <div />
            <div />
            <div className="text-right font-mono text-sm text-primary">{formatFCFA(total)}</div>
            <div />
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Annuler
        </Button>
        <Button
          onClick={() => {
            if (!f.clientNom) return toast.error("Nom du client requis");
            const filtered = lignes
              .filter((l) => l.description.trim() && l.quantite > 0)
              .map((l) => ({ ...l, id: Math.random().toString(36).slice(2, 10) }));
            const now = new Date();
            const echeance = new Date(now);
            echeance.setMonth(echeance.getMonth() + (f.dureeMois || 6));
            addContrat({
              ...f,
              montant: filtered.reduce((s, l) => s + l.quantite * l.prixUnitaire, 0),
              dateSignature: now.toISOString(),
              echeance: echeance.toISOString(),
              lignes: filtered,
            } as Omit<Contrat, "id">);
            toast.success("Contrat créé — CA dashboard mis à jour");
            onClose();
          }}
        >
          Créer le devis
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
