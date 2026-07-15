import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, UserCog, Wrench, Laptop } from "lucide-react";
import { useStore, type Membre, type MembreRole } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/equipe")({
  component: EquipePage,
  head: () => ({
    meta: [
      { title: "Équipe — STS SARL" },
      { name: "description", content: "Gestion des commerciaux et techniciens" },
    ],
  }),
});

type Editing = { mode: "create"; role: MembreRole } | { mode: "edit"; membre: Membre } | null;

function EquipePage() {
  const equipe = useStore((s) => s.equipe);
  const prospects = useStore((s) => s.prospects);
  const interventions = useStore((s) => s.interventions);
  const removeMembre = useStore((s) => s.removeMembre);
  const updateMembre = useStore((s) => s.updateMembre);

  const [editing, setEditing] = useState<Editing>(null);
  const [toDelete, setToDelete] = useState<Membre | null>(null);

  const commerciaux = useMemo(() => equipe.filter((m) => m.role === "commercial"), [equipe]);
  const techniciens = useMemo(() => equipe.filter((m) => m.role === "technicien"), [equipe]);
  const informaticiens = useMemo(() => equipe.filter((m) => m.role === "informaticien"), [equipe]);

  const chargeCommercial = (nom: string) =>
    prospects.filter((p) => p.commercial === nom && p.statut !== "Perdu" && p.statut !== "Converti").length;
  const chargeTech = (nom: string) =>
    interventions.filter((i) => i.technicien === nom && (i.statut === "Planifiée" || i.statut === "En cours")).length;
  const chargeInfo = (nom: string) =>
    interventions.filter((i) => i.technicien === nom && (i.statut === "Planifiée" || i.statut === "En cours")).length;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <PageHeader
        title="Équipe"
        subtitle="Gérez les commerciaux et techniciens de STS SARL"
      />

      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <UserCog className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Commerciaux ({commerciaux.length})
            </h2>
          </div>
          <Button size="sm" onClick={() => setEditing({ mode: "create", role: "commercial" })}>
            <Plus className="h-4 w-4 mr-1.5" /> Nouveau commercial
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {commerciaux.map((m) => (
            <MembreCard
              key={m.id}
              m={m}
              charge={chargeCommercial(m.nom)}
              chargeLabel="prospects actifs"
              onEdit={() => setEditing({ mode: "edit", membre: m })}
              onDelete={() => setToDelete(m)}
              onToggle={(actif) => updateMembre(m.id, { actif })}
            />
          ))}
          {commerciaux.length === 0 && (
            <Card className="p-6 text-sm text-muted-foreground col-span-full">
              Aucun commercial. Cliquez sur « Nouveau commercial ».
            </Card>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Techniciens ({techniciens.length})
            </h2>
          </div>
          <Button size="sm" onClick={() => setEditing({ mode: "create", role: "technicien" })}>
            <Plus className="h-4 w-4 mr-1.5" /> Nouveau technicien
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {techniciens.map((m) => (
            <MembreCard
              key={m.id}
              m={m}
              charge={chargeTech(m.nom)}
              chargeLabel="interventions en cours"
              onEdit={() => setEditing({ mode: "edit", membre: m })}
              onDelete={() => setToDelete(m)}
              onToggle={(actif) => updateMembre(m.id, { actif })}
            />
          ))}
          {techniciens.length === 0 && (
            <Card className="p-6 text-sm text-muted-foreground col-span-full">
              Aucun technicien. Cliquez sur « Nouveau technicien ».
            </Card>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Laptop className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Informaticiens ({informaticiens.length})
            </h2>
          </div>
          <Button size="sm" onClick={() => setEditing({ mode: "create", role: "informaticien" })}>
            <Plus className="h-4 w-4 mr-1.5" /> Nouvel informaticien
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {informaticiens.map((m) => (
            <MembreCard
              key={m.id}
              m={m}
              charge={chargeInfo(m.nom)}
              chargeLabel="interventions en cours"
              onEdit={() => setEditing({ mode: "edit", membre: m })}
              onDelete={() => setToDelete(m)}
              onToggle={(actif) => updateMembre(m.id, { actif })}
            />
          ))}
          {informaticiens.length === 0 && (
            <Card className="p-6 text-sm text-muted-foreground col-span-full">
              Aucun informaticien. Cliquez sur « Nouvel informaticien ».
            </Card>
          )}
        </div>
      </section>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        {editing && <MembreDialog editing={editing} onClose={() => setEditing(null)} />}
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {toDelete?.nom} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est définitive. Les prospects ou interventions déjà assignés à cette
              personne conserveront son nom dans l'historique, mais elle ne pourra plus être
              sélectionnée. Astuce : désactivez plutôt le membre pour préserver l'historique.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (toDelete) {
                  removeMembre(toDelete.id);
                  toast.success(`${toDelete.nom} supprimé`);
                  setToDelete(null);
                }
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MembreCard({
  m,
  charge,
  chargeLabel,
  onEdit,
  onDelete,
  onToggle,
}: {
  m: Membre;
  charge: number;
  chargeLabel: string;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (actif: boolean) => void;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-semibold truncate">{m.nom}</div>
            {!m.actif && (
              <Badge variant="outline" className="bg-muted text-muted-foreground text-[10px]">
                Inactif
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
            {m.telephone && <div>📞 {m.telephone}</div>}
            {m.email && <div className="truncate">✉️ {m.email}</div>}
          </div>
          <div className="mt-3 text-xs">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              {charge} {chargeLabel}
            </Badge>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <Switch checked={m.actif} onCheckedChange={onToggle} aria-label="Actif" />
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function MembreDialog({ editing, onClose }: { editing: Exclude<Editing, null>; onClose: () => void }) {
  const addMembre = useStore((s) => s.addMembre);
  const updateMembre = useStore((s) => s.updateMembre);
  const isEdit = editing.mode === "edit";
  const initial: Membre =
    editing.mode === "edit"
      ? editing.membre
      : {
          id: "",
          nom: "",
          role: editing.role,
          telephone: "",
          email: "",
          actif: true,
        };

  const [f, setF] = useState({
    nom: initial.nom,
    role: initial.role,
    telephone: initial.telephone || "",
    email: initial.email || "",
    actif: initial.actif,
  });

  const roleLabel = (r: MembreRole) =>
    r === "commercial" ? "Commercial" : r === "technicien" ? "Technicien" : "Informaticien";

  const submit = () => {
    if (!f.nom.trim()) {
      toast.error("Le nom est obligatoire");
      return;
    }
    if (isEdit) {
      updateMembre(initial.id, {
        nom: f.nom.trim(),
        role: f.role,
        telephone: f.telephone,
        email: f.email,
        actif: f.actif,
      });
      toast.success("Membre mis à jour");
    } else {
      addMembre({
        nom: f.nom.trim(),
        role: f.role,
        telephone: f.telephone,
        email: f.email,
        actif: f.actif,
      });
      toast.success(`${roleLabel(f.role)} ajouté`);
    }
    onClose();
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>
          {isEdit ? "Modifier le membre" : `Nouveau ${f.role === "commercial" ? "commercial" : "technicien"}`}
        </DialogTitle>
        <DialogDescription>
          {isEdit
            ? "Mettez à jour les informations de ce membre de l'équipe."
            : "Ajoutez un membre à l'équipe. Il sera disponible dans les sélecteurs des autres modules."}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-3">
        <div>
          <Label>Nom complet *</Label>
          <Input value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} />
        </div>
        <div>
          <Label>Rôle</Label>
          <Select value={f.role} onValueChange={(v: MembreRole) => setF({ ...f, role: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="technicien">Technicien</SelectItem>
              <SelectItem value="informaticien">Informaticien</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Téléphone</Label>
            <Input value={f.telephone} onChange={(e) => setF({ ...f, telephone: e.target.value })} />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm mt-1">
          <Switch checked={f.actif} onCheckedChange={(v) => setF({ ...f, actif: v })} />
          Membre actif (visible dans les listes déroulantes)
        </label>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Annuler</Button>
        <Button onClick={submit}>{isEdit ? "Enregistrer" : "Ajouter"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}
