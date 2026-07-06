import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, CalendarDays, List } from "lucide-react";
import {
  useStore,
  TECHNICIENS,
  formatDateTime,
  formatDate,
  type Intervention,
  type InterventionStatut,
  type InterventionType,
} from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

export const Route = createFileRoute("/interventions")({
  component: InterventionsPage,
});

const TYPES: InterventionType[] = ["Installation", "Maintenance préventive", "Dépannage", "Contrôle périodique"];
const STATUTS: InterventionStatut[] = ["Planifiée", "En cours", "Terminée", "Annulée"];

const STATUT_STYLE: Record<InterventionStatut, string> = {
  Planifiée: "bg-chart-1/15 text-chart-1 border-chart-1/30",
  "En cours": "bg-warning/15 text-warning border-warning/30",
  Terminée: "bg-success/15 text-success border-success/30",
  Annulée: "bg-muted text-muted-foreground",
};

function InterventionsPage() {
  const interventions = useStore((s) => s.interventions);
  const [openNew, setOpenNew] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...interventions].sort((a, b) => +new Date(a.dateHeure) - +new Date(b.dateHeure)),
    [interventions],
  );

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Interventions"
        subtitle="Planning et suivi des installations, maintenances et dépannages"
        actions={
          <Dialog open={openNew} onOpenChange={setOpenNew}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-1.5" /> Nouvelle intervention</Button>
            </DialogTrigger>
            <NewInterventionDialog onClose={() => setOpenNew(false)} />
          </Dialog>
        }
      />

      <Tabs defaultValue="liste">
        <TabsList>
          <TabsTrigger value="liste"><List className="h-4 w-4 mr-1.5" /> Liste</TabsTrigger>
          <TabsTrigger value="cal"><CalendarDays className="h-4 w-4 mr-1.5" /> Semaine</TabsTrigger>
        </TabsList>

        <TabsContent value="liste">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & heure</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Technicien</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((i) => (
                  <TableRow key={i.id} onClick={() => setDetailId(i.id)} className="cursor-pointer">
                    <TableCell className="text-xs whitespace-nowrap">{formatDateTime(i.dateHeure)}</TableCell>
                    <TableCell className="font-medium">{i.clientNom}</TableCell>
                    <TableCell className="text-xs">{i.type}</TableCell>
                    <TableCell className="text-xs">{i.technicien}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUT_STYLE[i.statut]}>{i.statut}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="cal">
          <WeekCalendar onOpen={setDetailId} />
        </TabsContent>
      </Tabs>

      <Dialog open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)}>
        {detailId && <InterventionDetail id={detailId} onClose={() => setDetailId(null)} />}
      </Dialog>
    </div>
  );
}

function WeekCalendar({ onOpen }: { onOpen: (id: string) => void }) {
  const interventions = useStore((s) => s.interventions);
  const [offset, setOffset] = useState(0);

  const start = useMemo(() => {
    const d = new Date();
    const day = (d.getDay() + 6) % 7; // Monday=0
    d.setDate(d.getDate() - day + offset * 7);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [offset]);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-muted-foreground">
          Semaine du {formatDate(days[0].toISOString())} au {formatDate(days[6].toISOString())}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setOffset(offset - 1)}>← Précédente</Button>
          <Button variant="outline" size="sm" onClick={() => setOffset(0)}>Cette semaine</Button>
          <Button variant="outline" size="sm" onClick={() => setOffset(offset + 1)}>Suivante →</Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((d) => {
          const items = interventions.filter((i) => {
            const di = new Date(i.dateHeure);
            return di.toDateString() === d.toDateString();
          });
          return (
            <Card key={d.toISOString()} className="min-h-[220px]">
              <CardContent className="p-2.5">
                <div className="text-[11px] uppercase text-muted-foreground">
                  {d.toLocaleDateString("fr-FR", { weekday: "short" })}
                </div>
                <div className="text-lg font-semibold mb-2">{d.getDate()}</div>
                <div className="space-y-1.5">
                  {items.map((i) => (
                    <button
                      key={i.id}
                      onClick={() => onOpen(i.id)}
                      className="w-full text-left bg-muted/60 hover:bg-muted rounded px-2 py-1.5 text-[11px]"
                    >
                      <div className="font-medium truncate">{i.clientNom}</div>
                      <div className="text-muted-foreground">
                        {new Date(i.dateHeure).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} · {i.type}
                      </div>
                      <Badge variant="outline" className={`${STATUT_STYLE[i.statut]} mt-1 text-[9px]`}>
                        {i.statut}
                      </Badge>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function InterventionDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const i = useStore((s) => s.interventions.find((x) => x.id === id));
  const update = useStore((s) => s.updateIntervention);
  if (!i) return null;

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {i.clientNom}
          <Badge variant="outline" className={STATUT_STYLE[i.statut]}>{i.statut}</Badge>
        </DialogTitle>
        <DialogDescription>{i.type} — {formatDateTime(i.dateHeure)}</DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Statut</Label>
          <Select value={i.statut} onValueChange={(v: InterventionStatut) => update(id, { statut: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Technicien</Label>
          <Select value={i.technicien} onValueChange={(v) => update(id, { technicien: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TECHNICIENS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <Label>Date & heure</Label>
          <Input
            type="datetime-local"
            value={i.dateHeure.slice(0, 16)}
            onChange={(e) => update(id, { dateHeure: new Date(e.target.value).toISOString() })}
          />
        </div>
        <div className="col-span-2">
          <Label>Description du travail</Label>
          <Textarea
            rows={2}
            value={i.description}
            onChange={(e) => update(id, { description: e.target.value })}
          />
        </div>
      </div>

      {(i.statut === "Terminée" || i.statut === "En cours") && (
        <div className="mt-2 space-y-2 border-t border-border pt-3">
          <Label className="text-sm">Rapport de fin d'intervention</Label>
          <Textarea
            rows={4}
            placeholder="Résumé du travail effectué, tests réalisés, observations..."
            value={i.rapport || ""}
            onChange={(e) => update(id, { rapport: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={i.materielRemplace || false}
              onCheckedChange={(v) => update(id, { materielRemplace: !!v })}
            />
            Matériel remplacé
          </label>
        </div>
      )}

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Fermer</Button>
        {i.statut !== "Terminée" && (
          <Button
            onClick={() => {
              update(id, { statut: "Terminée" });
              toast.success("Intervention terminée");
            }}
          >
            Marquer terminée
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  );
}

function NewInterventionDialog({ onClose }: { onClose: () => void }) {
  const add = useStore((s) => s.addIntervention);
  const contrats = useStore((s) => s.contrats);
  const [f, setF] = useState({
    clientNom: "",
    contratId: undefined as string | undefined,
    type: "Installation" as InterventionType,
    technicien: TECHNICIENS[0],
    dateHeure: new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16),
    description: "",
  });
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Nouvelle intervention</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>Client / contrat existant</Label>
          <Select
            value={f.contratId || "none"}
            onValueChange={(v) => {
              if (v === "none") {
                setF({ ...f, contratId: undefined });
              } else {
                const c = contrats.find((x) => x.id === v);
                setF({ ...f, contratId: v, clientNom: c?.clientNom || "" });
              }
            }}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Client hors contrat —</SelectItem>
              {contrats.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.clientNom} · {c.type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <Label>Nom client</Label>
          <Input value={f.clientNom} onChange={(e) => setF({ ...f, clientNom: e.target.value })} />
        </div>
        <div>
          <Label>Type</Label>
          <Select value={f.type} onValueChange={(v: InterventionType) => setF({ ...f, type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Technicien</Label>
          <Select value={f.technicien} onValueChange={(v) => setF({ ...f, technicien: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TECHNICIENS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <Label>Date & heure</Label>
          <Input
            type="datetime-local"
            value={f.dateHeure}
            onChange={(e) => setF({ ...f, dateHeure: e.target.value })}
          />
        </div>
        <div className="col-span-2">
          <Label>Description</Label>
          <Textarea
            rows={2}
            value={f.description}
            onChange={(e) => setF({ ...f, description: e.target.value })}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Annuler</Button>
        <Button
          onClick={() => {
            if (!f.clientNom) return toast.error("Nom du client requis");
            add({
              ...f,
              dateHeure: new Date(f.dateHeure).toISOString(),
              statut: "Planifiée",
            } as Omit<Intervention, "id">);
            toast.success("Intervention planifiée");
            onClose();
          }}
        >
          Créer
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
