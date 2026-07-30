import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, UserCog, Wrench, Laptop } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { type EquipeRole, useEquipeActions, useUsers } from "@/features/equipe/api/use-equipe";
import { RoleSTS } from "@/features/interface/enum";
import type { User } from "@/features/interface/user.type";
import { useInterventions } from "@/features/interventions/api/use-interventions";
import { useProspects } from "@/features/prospects/api/use-prospects";
import { ApiError } from "@/lib/api/client";
import { validateName, validateEmail, stripDigits } from "@/lib/validation";
import {
  PhoneField,
  FieldError,
  composePhone,
  splitPhone,
  validateDialCode,
  validateNationalNumber,
} from "@/components/PhoneField";
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

type Editing = { mode: "create"; role: EquipeRole } | { mode: "edit"; membre: User } | null;

const createMembreFormSchema = (isEdit: boolean) =>
  z
    .object({
      name: z.string().trim().max(80, "Le nom ne doit pas dépasser 80 caractères"),
      role: z.enum([RoleSTS.COMMERCIAL, RoleSTS.TECHNICIEN, RoleSTS.SECRETAIRE, RoleSTS.ADMIN]),
      indicatif: z.string(),
      password: z.string().max(128, "Le mot de passe ne doit pas dépasser 128 caractères"),
      phone: z.string(),
      email: z.string().trim().max(254, "L'adresse e-mail est trop longue"),
      isActive: z.boolean(),
    })
    .superRefine((values, context) => {
      const nomError = validateName(values.name, "Nom");
      if (nomError) {
        context.addIssue({ code: "custom", path: ["name"], message: nomError });
      }

      if (!isEdit && !values.password) {
        context.addIssue({
          code: "custom",
          path: ["password"],
          message: "Le mot de passe est obligatoire",
        });
      } else if (values.password && values.password.length < 6) {
        context.addIssue({
          code: "custom",
          path: ["password"],
          message: "Le mot de passe doit contenir au moins 6 caractères",
        });
      }

      const emailError = validateEmail(values.email, false);
      if (emailError) {
        context.addIssue({ code: "custom", path: ["email"], message: emailError });
      }

      const hasPhone = values.indicatif.length > 0 || values.phone.length > 0;
      if (!hasPhone) return;

      const indicatifError = validateDialCode(values.indicatif);
      if (indicatifError) {
        context.addIssue({ code: "custom", path: ["indicatif"], message: indicatifError });
      }

      const numeroError = validateNationalNumber(values.phone, true);
      if (numeroError) {
        context.addIssue({ code: "custom", path: ["phone"], message: numeroError });
      }
    });

type MembreFormValues = z.infer<ReturnType<typeof createMembreFormSchema>>;

export function EquipePage() {
  const { users } = useUsers();
  const { prospects } = useProspects();
  const { interventions } = useInterventions();
  const { removeMembre, updateMembre } = useEquipeActions();

  const [editing, setEditing] = useState<Editing>(null);
  const [toDelete, setToDelete] = useState<User | null>(null);

  const commerciaux = useMemo(
    () => users.filter((user) => user.role === RoleSTS.COMMERCIAL),
    [users],
  );

  const techniciens = useMemo(
    () => users.filter((user) => user.role === RoleSTS.TECHNICIEN),
    [users],
  );

    const secretaire = useMemo(
    () => users.filter((user) => user.role === RoleSTS.SECRETAIRE),
    [users],
  );
  const admins = useMemo(() => users.filter((user) => user.role === RoleSTS.ADMIN), [users]);

  const chargeCommercial = (nom: string) =>
    prospects.filter((p) => p.commercial === nom && p.statut !== "Perdu" && p.statut !== "Converti")
      .length;
  const chargeTech = (nom: string) =>
    interventions.filter(
      (i) => i.technicien === nom && (i.statut === "Planifiée" || i.statut === "En cours"),
    ).length;
  return (
    <div className="p-6 lg:p-8 space-y-8">
      <PageHeader title="Équipe" subtitle="Gérez les commerciaux et techniciens de STS SARL" />

      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <UserCog className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Commerciaux ({commerciaux.length})
            </h2>
          </div>
          <Button
            size="sm"
            onClick={() => setEditing({ mode: "create", role: RoleSTS.COMMERCIAL })}
          >
            <Plus className="h-4 w-4 mr-1.5" /> Nouveau commercial
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {commerciaux.map((m) => (
            <MembreCard
              key={m.id}
              m={m}
              charge={chargeCommercial(m.name ?? "")}
              chargeLabel="prospects actifs"
              onEdit={() => setEditing({ mode: "edit", membre: m })}
              onDelete={() => setToDelete(m)}
              onToggle={(isActive) => updateMembre(m.id, { isActive })}
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
          <Button
            size="sm"
            onClick={() => setEditing({ mode: "create", role: RoleSTS.TECHNICIEN })}
          >
            <Plus className="h-4 w-4 mr-1.5" /> Nouveau technicien
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {techniciens.map((m) => (
            <MembreCard
              key={m.id}
              m={m}
              charge={chargeTech(m.name ?? "")}
              chargeLabel="interventions en cours"
              onEdit={() => setEditing({ mode: "edit", membre: m })}
              onDelete={() => setToDelete(m)}
              onToggle={(isActive) => updateMembre(m.id, { isActive })}
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
            <Wrench className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Secretaire ({secretaire.length})
            </h2>
          </div>
          <Button
            size="sm"
            onClick={() => setEditing({ mode: "create", role: RoleSTS.SECRETAIRE })}
          >
            <Plus className="h-4 w-4 mr-1.5" /> Nouvelle Secretaire
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {secretaire.map((m) => (
            <MembreCard
              key={m.id}
              m={m}
              charge={chargeTech(m.name ?? "")}
              chargeLabel="interventions en cours"
              onEdit={() => setEditing({ mode: "edit", membre: m })}
              onDelete={() => setToDelete(m)}
              onToggle={(isActive) => updateMembre(m.id, { isActive })}
            />
          ))}
          {secretaire.length === 0 && (
            <Card className="p-6 text-sm text-muted-foreground col-span-full">
              Aucune Secretaire. Cliquez sur « Nouvelle secretaire ».
            </Card>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Laptop className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Administrateurs ({admins.length})
            </h2>
          </div>
          <Button size="sm" onClick={() => setEditing({ mode: "create", role: RoleSTS.ADMIN })}>
            <Plus className="h-4 w-4 mr-1.5" /> Nouvel administrateur
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {admins.map((m) => (
            <MembreCard
              key={m.id}
              m={m}
              charge={0}
              chargeLabel="tâche assignée"
              onEdit={() => setEditing({ mode: "edit", membre: m })}
              onDelete={() => setToDelete(m)}
              onToggle={(isActive) => updateMembre(m.id, { isActive })}
            />
          ))}
          {admins.length === 0 && (
            <Card className="p-6 text-sm text-muted-foreground col-span-full">
              Aucun administrateur. Cliquez sur « Nouvel administrateur ».
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
            <AlertDialogTitle>Supprimer {toDelete?.name ?? toDelete?.email} ?</AlertDialogTitle>
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
                  toast.success(`${toDelete.name ?? toDelete.email} supprimé`);
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
  m: User;
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
            <div className="font-semibold truncate">{m.name ?? m.email}</div>
            {!m.isActive && (
              <Badge variant="outline" className="bg-muted text-muted-foreground text-[10px]">
                Inactif
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
            {m.phone && <div>📞 {m.phone}</div>}
            {m.email && <div className="truncate">✉️ {m.email}</div>}
          </div>
          <div className="mt-3 text-xs">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              {charge} {chargeLabel}
            </Badge>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <Switch checked={m.isActive} onCheckedChange={onToggle} aria-label="Actif" />
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

function MembreDialog({
  editing,
  onClose,
}: {
  editing: Exclude<Editing, null>;
  onClose: () => void;
}) {
  const { addMembre, updateMembre } = useEquipeActions();
  const isEdit = editing.mode === "edit";
  const initial = editing.mode === "edit" ? editing.membre : null;
  const initialPhone = splitPhone(initial?.phone ?? "");
  const {
    control,
    clearErrors,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<MembreFormValues>({
    resolver: zodResolver(createMembreFormSchema(isEdit)),
    defaultValues: {
      name: initial?.name ?? "",
      password: "",
      role: (initial?.role ??
        (editing.mode === "create" ? editing.role : RoleSTS.ADMIN)) as EquipeRole,
      indicatif: initialPhone.indicatif,
      phone: initialPhone.national,
      email: initial?.email ?? "",
      isActive: initial?.isActive ?? true,
    },
  });
  const selectedRole = watch("role");

  const roleLabel = (role: EquipeRole) =>
    role === RoleSTS.COMMERCIAL
      ? "Commercial"
      : role === RoleSTS.TECHNICIEN
        ? "Technicien"
        : role === RoleSTS.SECRETAIRE
          ? "Secrétaire"
          : "Administrateur";

  const submit = async (values: MembreFormValues) => {
    clearErrors("root.server");

    const payload = {
      name: values.name,
      role: values.role,
      phone: composePhone(values.indicatif, values.phone),
      email: values.email,
      isActive: values.isActive,
    };

    try {
      if (isEdit) {
        await updateMembre(editing.membre.id, {
          ...payload,
          ...(values.password ? { password: values.password } : {}),
        });
        toast.success("Membre mis à jour");
      } else {
        await addMembre({ ...payload, password: values.password });
        toast.success(`${roleLabel(values.role)} ajouté`);
      }
      onClose();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : isEdit
              ? "La mise à jour du membre a échoué."
              : "L'ajout du membre a échoué.";

      setError("root.server", { type: "server", message });
      toast.error(message);
    }
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>
          {isEdit ? "Modifier le membre" : `Nouveau ${roleLabel(selectedRole).toLowerCase()}`}
        </DialogTitle>
        <DialogDescription>
          {isEdit
            ? "Mettez à jour les informations de ce membre de l'équipe."
            : "Ajoutez un membre à l'équipe. Il sera disponible dans les sélecteurs des autres modules."}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit(submit)} className="grid gap-3">
        <div>
          <Label>Nom complet *</Label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                onChange={(event) => field.onChange(stripDigits(event.target.value))}
                placeholder="Ex: Kouassi Yves"
                maxLength={80}
                aria-invalid={!!errors.name}
              />
            )}
          />
          <FieldError message={errors.name?.message} />
        </div>
        <div>
          <Label>Mot de passe {isEdit ? "(laisser vide pour ne pas le modifier)" : "*"}</Label>
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="password"
                autoComplete="new-password"
                placeholder={isEdit ? "Nouveau mot de passe" : "6 caractères minimum"}
                maxLength={128}
                aria-invalid={!!errors.password}
              />
            )}
          />
          <FieldError message={errors.password?.message} />
        </div>
        <div>
          <Label>Rôle</Label>
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger aria-invalid={!!errors.role}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={RoleSTS.COMMERCIAL}>Commercial</SelectItem>
                  <SelectItem value={RoleSTS.TECHNICIEN}>Technicien</SelectItem>
                  <SelectItem value={RoleSTS.SECRETAIRE}>Secrétaire</SelectItem>
                  <SelectItem value={RoleSTS.ADMIN}>Administrateur</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          <FieldError message={errors.role?.message} />
        </div>
        <Controller
          name="indicatif"
          control={control}
          render={({ field: indicatifField }) => (
            <Controller
              name="phone"
              control={control}
              render={({ field: numeroField }) => (
                <PhoneField
                  indicatif={indicatifField.value}
                  national={numeroField.value}
                  onIndicatifChange={indicatifField.onChange}
                  onNationalChange={numeroField.onChange}
                  indicatifError={errors.indicatif?.message}
                  nationalError={errors.phone?.message}
                />
              )}
            />
          )}
        />
        <div>
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
        <Controller
          name="isActive"
          control={control}
          render={({ field }) => (
            <label className="flex items-center gap-2 text-sm mt-1">
              <Switch checked={field.value} onCheckedChange={field.onChange} />
              Membre actif (visible dans les listes déroulantes)
            </label>
          )}
        />
        <FieldError message={errors.root?.server?.message} />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Enregistrement..." : isEdit ? "Enregistrer" : "Ajouter"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
