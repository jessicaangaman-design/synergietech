import { useSearchParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState, useEffect } from "react";
import { Plus, AlertTriangle, Trash2 } from "lucide-react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
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
import { FieldError } from "@/components/PhoneField";
import { getApiErrorMessage } from "@/lib/api/client";
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
import { useClient, useClients } from "@/features/clients/api/use-client";
import { StatutContrat, TypeContrat} from "@/features/interface/enum";

const TYPES: ContratType[] = [
  "INSTALLATION",
  "MAINTENANCE",
  "ABONNEMENT",
];
const STATUTS: ContratStatut[] = ["BROUILLON", "ACTIF", "RENOUVELLEMENT", "EXPIRE", "RESILIE"];

const contratFormSchema = z.object({
  clientId: z.string().trim().min(1, "L'identifiant du client est obligatoire").max(120),
  type: z.custom<TypeContrat>(
    (value) => TYPES.includes(value as ContratType),
    "Type de contrat invalide",
  ),
  besoin: z.custom<BesoinType>(
    (value) => BESOINS.includes(value as BesoinType),
    "Service invalide",
  ),
  dureeMois: z.number().int().min(1, "La durée minimale est d'un mois").max(120),
  statut: z.custom<ContratStatut>(
    (value) => STATUTS.includes(value as ContratStatut),
    "Statut invalide",
  ),
  lignes: z
    .array(
      z.object({
        description: z.string().trim().min(1, "La désignation est obligatoire"),
        quantite: z.number().int().min(1, "La quantité doit être supérieure à zéro"),
        prixUnitaire: z.number().min(0, "Le prix ne peut pas être négatif"),
      }),
    )
    .min(1, "Ajoutez au moins une ligne au devis"),
});

type ContratFormValues = z.infer<typeof contratFormSchema>;

const STATUT_STYLE: Record<ContratStatut, string> = {
  BROUILLON: "bg-muted text-muted-foreground",
  ACTIF: "bg-success/15 text-success border-success/30",
  "RENOUVELLEMENT": "bg-warning/15 text-warning border-warning/30",
  EXPIRE: "bg-destructive/15 text-destructive border-destructive/30",
  RESILIE: "bg-muted text-muted-foreground line-through",
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
  () =>
    [...contrats].sort(
      (a, b) =>
        +(b.dateSignature ? new Date(b.dateSignature) : new Date(0)) -
        +(a.dateSignature ? new Date(a.dateSignature) : new Date(0))
    ),
  [contrats]
);
  const echeanceCount = contrats.filter((c) => {
   const j = c.dateEcheance ? daysUntil(c.dateEcheance) : -1;
    return j >= 0 && j <= 30 && c.statut !== "RESILIE" && c.statut !== "BROUILLON";
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
              const j =c.dateEcheance ? daysUntil(c.dateEcheance) : -1;
              const alerte =
                j >= 0 && j <= 30 && c.statut !== "RESILIE" && c.statut !== "BROUILLON";
              return (
                <TableRow key={c.id} onClick={() => setDetailId(c.id)} className="cursor-pointer">
                  <TableCell className="font-medium">{c.client?.name}</TableCell>
                  <TableCell className="text-xs">{c.type}</TableCell>
                  <TableCell className="text-xs">{c.type}</TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {formatFCFA(c.montant)}
                  </TableCell>
                  <TableCell className="text-xs">{formatDate(c.dateSignature)}</TableCell>
                  <TableCell className="text-xs">
                    <div className="flex items-center gap-1.5">
                       {c.dateSignature ? formatDate(c.dateSignature) : "-"}
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
  const j = daysUntil(contrat.dateEcheance);

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {contrat.client?.name}
          <Badge variant="outline" className={STATUT_STYLE[contrat.statut]}>
            {contrat.statut}
          </Badge>
        </DialogTitle>
        <DialogDescription>
          {contrat.type} 
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
            onValueChange={(v: StatutContrat) => updateContrat(id, { statut: v })}
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
            onValueChange={(v: TypeContrat) => updateContrat(id, { type: v })}
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
           value={contrat.dureeMois ?? ""}
            onChange={(e) => updateContrat(id, { dureeMois: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label>Date de signature</Label>
          <Input
            type="date"
          value={contrat.dateSignature?.slice(0, 10) ?? ""}
            onChange={(e) =>
              updateContrat(id, { dateSignature: new Date(e.target.value).toISOString() })
            }
          />
        </div>
        <div>
          <Label>Échéance</Label>
          <Input
            type="date"
           value={contrat.dateEcheance ? contrat.dateEcheance.slice(0, 10) : ""}
            onChange={(e) =>
              updateContrat(id, { dateEcheance: new Date(e.target.value).toISOString() })
            }
          />
        </div>
      </div>

      {j >= 0 && j <= 30 && contrat.statut !== "RESILIE" && contrat.statut !== "BROUILLON" && (
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
         {(contrat.lignes ?? []).map((l) => (
            <div
              key={l.id}
              className="grid grid-cols-[1fr_80px_130px_130px_36px] gap-2 px-3 py-1.5 items-center border-t"
            >
              <Input
                className="h-8"
                value={l.designation}
                onChange={(e) => updateLigne(id, l.id, { designation: e.target.value })}
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
          {(contrat.lignes ?? []).length === 0 && (
            <div className="px-3 py-3 text-xs text-muted-foreground border-t">
              Aucune ligne. Ajoutez du matériel ou une prestation ci-dessous.
            </div>
          )}
          <div className="grid grid-cols-[1fr_80px_130px_130px_36px] gap-2 px-3 py-2 border-t bg-muted/30 items-center font-medium">
            <div className="text-right text-sm">Total devis</div>
            <div />
            <div />
            <div className="text-right font-mono text-sm text-primary">
              {formatFCFA(totalLignes(contrat.lignes ?? []))}
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
  const { clients}=useClients();
  const {
    clearErrors,
    control,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ContratFormValues>({
    resolver: zodResolver(contratFormSchema),
    defaultValues: {
     clientId : "",
     type: TypeContrat.INSTALLATION_PONCTUELLE,
      besoin: "vidéosurveillance",
      dureeMois: 12,
      statut: StatutContrat.ACTIF,
      lignes: [{ description: "", quantite: 1, prixUnitaire: 0 }],
    },
  });
  const {
    fields: lignes,
    append: addLigne,
    remove: removeLigne,
  } = useFieldArray({ control, name: "lignes" });
  const lignesValues = watch("lignes");
  const total = lignesValues.reduce(
    (somme, ligne) => somme + (ligne.quantite || 0) * (ligne.prixUnitaire || 0),
    0,
  );

  const submit = async (values: ContratFormValues) => {
    clearErrors("root.server");

    const lignesValides = values.lignes
  .filter((ligne) => ligne.description && ligne.quantite > 0)
  .map((ligne) => ({
    designation: ligne.description,
    quantite: ligne.quantite,
    prixUnitaire: ligne.prixUnitaire,
  }));
    const now = new Date();
    const echeance = new Date(now);
    echeance.setMonth(echeance.getMonth() + values.dureeMois);

    try {
     await addContrat({
  type: values.type,
  clientId: values.clientId,
  statut: values.statut as StatutContrat,
  montant: lignesValides.reduce(
    (somme, ligne) => somme + ligne.quantite * ligne.prixUnitaire,
    0
  ),
  dateSignature: now.toISOString(),
  dateEcheance: echeance.toISOString(),
  dureeMois: values.dureeMois,
  lignes: lignesValides,
});
      toast.success("Contrat créé — CA dashboard mis à jour");
      onClose();
    } catch (error) {
      const message = getApiErrorMessage(error, "La création du contrat a échoué.");
      setError("root.server", { type: "server", message });
      toast.error(message);
    }
  };

  return (
    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Nouveau devis / contrat</DialogTitle>
        <DialogDescription>
          Le montant du contrat est calculé automatiquement à partir des lignes du devis.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit(submit)}>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Client *</Label>
          <Controller
  name="clientId"
  control={control}
  render={({ field }) => (
    <Select
      value={field.value || "none"}
      onValueChange={(value) => {
        if (value === "none") {
          field.onChange(undefined);
          return;
        }
        field.onChange(value);
      }}
    >
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">— Client hors contrat —</SelectItem>
        {clients.map((client) => (
          <SelectItem key={client.id} value={client.id}>
            {client.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )}
/>
            <FieldError message={errors.clientId?.message} />
          </div>
          <div>
            <Label>Type</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-invalid={!!errors.type}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError message={errors.type?.message} />
          </div>
          <div>
            <Label>Service</Label>
            <Controller
              name="besoin"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-invalid={!!errors.besoin}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BESOINS.map((besoin) => (
                      <SelectItem key={besoin} value={besoin}>
                        {besoin}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError message={errors.besoin?.message} />
          </div>
          <div>
            <Label>Durée (mois)</Label>
            <Controller
              name="dureeMois"
              control={control}
              render={({ field }) => (
                <Input
                  type="number"
                  min={1}
                  max={120}
                  value={field.value}
                  onChange={(event) => field.onChange(Number(event.target.value))}
                  aria-invalid={!!errors.dureeMois}
                />
              )}
            />
            <FieldError message={errors.dureeMois?.message} />
          </div>
          <div>
            <Label>Statut initial</Label>
            <Controller
              name="statut"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-invalid={!!errors.statut}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUTS.map((statut) => (
                      <SelectItem key={statut} value={statut}>
                        {statut}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError message={errors.statut?.message} />
          </div>
        </div>

        <div className="mt-2">
          <div className="flex items-center justify-between mb-2">
            <Label>Lignes du devis</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => addLigne({ description: "", quantite: 1, prixUnitaire: 0 })}
            >
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
            {lignes.map((ligne, index) => (
              <div
                key={ligne.id}
                className="grid grid-cols-[1fr_80px_130px_130px_36px] gap-2 px-3 py-1.5 items-start border-t"
              >
                <div>
                  <Controller
                    name={`lignes.${index}.description`}
                    control={control}
                    render={({ field }) => (
                      <Input {...field} className="h-8" placeholder="Ex : 4 caméras IP 4MP" />
                    )}
                  />
                  <FieldError message={errors.lignes?.[index]?.description?.message} />
                </div>
                <div>
                  <Controller
                    name={`lignes.${index}.quantite`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="number"
                        min={1}
                        className="h-8 text-center"
                        value={field.value}
                        onChange={(event) => field.onChange(Number(event.target.value))}
                      />
                    )}
                  />
                  <FieldError message={errors.lignes?.[index]?.quantite?.message} />
                </div>
                <div>
                  <Controller
                    name={`lignes.${index}.prixUnitaire`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="number"
                        min={0}
                        className="h-8 text-right font-mono"
                        value={field.value}
                        onChange={(event) => field.onChange(Number(event.target.value))}
                      />
                    )}
                  />
                  <FieldError message={errors.lignes?.[index]?.prixUnitaire?.message} />
                </div>
                <div className="text-right font-mono text-sm pt-2">
                  {formatFCFA(
                    (lignesValues[index]?.quantite || 0) * (lignesValues[index]?.prixUnitaire || 0),
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeLigne(index)}
                  className="text-muted-foreground hover:text-destructive justify-self-center mt-2"
                  aria-label="Supprimer la ligne"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {lignes.length === 0 && (
              <div className="border-t px-3 py-2">
                <FieldError message={errors.lignes?.message} />
              </div>
            )}
            <div className="grid grid-cols-[1fr_80px_130px_130px_36px] gap-2 px-3 py-2 border-t bg-muted/30 items-center font-medium">
              <div className="text-right text-sm">Total devis</div>
              <div />
              <div />
              <div className="text-right font-mono text-sm text-primary">{formatFCFA(total)}</div>
              <div />
            </div>
          </div>
        </div>
        <FieldError message={errors.root?.server?.message} />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Création..." : "Créer le devis"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
