import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Filter, Mail, Pencil, Phone, Plus, Search, Trash2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { type EquipeRole, useEquipeActions, useUsers } from "@/features/equipe/api/use-equipe";
import { RoleSTS } from "@/features/interface/enum";
import type { User } from "@/features/interface/user.type";
import { useInterventions } from "@/features/interventions/api/use-interventions";
import { useProspects } from "@/features/prospects/api/use-prospects";
import { ApiError, getApiErrorMessage } from "@/lib/api/client";
import { formatDate } from "@/lib/formatters";
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

const EQUIPE_ROLES: EquipeRole[] = [
  RoleSTS.COMMERCIAL,
  RoleSTS.TECHNICIEN,
  RoleSTS.SECRETAIRE,
  RoleSTS.ADMIN,
];

const ROLE_LABEL: Record<EquipeRole, string> = {
  [RoleSTS.COMMERCIAL]: "Commercial",
  [RoleSTS.TECHNICIEN]: "Technicien",
  [RoleSTS.SECRETAIRE]: "Secrétaire",
  [RoleSTS.ADMIN]: "Administrateur",
};

const ROLE_STYLE: Record<EquipeRole, string> = {
  [RoleSTS.COMMERCIAL]: "bg-chart-1/15 text-chart-1 border-chart-1/30",
  [RoleSTS.TECHNICIEN]: "bg-warning/15 text-warning border-warning/30",
  [RoleSTS.SECRETAIRE]: "bg-chart-2/15 text-chart-2 border-chart-2/30",
  [RoleSTS.ADMIN]: "bg-primary/10 text-primary border-primary/20",
};

function isEquipeRole(role: RoleSTS): role is EquipeRole {
  return EQUIPE_ROLES.includes(role as EquipeRole);
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

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
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [tab, setTab] = useState<EquipeRole | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  const members = useMemo(() => users.filter((user) => isEquipeRole(user.role)), [users]);

  const counts = useMemo(() => {
    const result: Record<string, number> = { ALL: members.length };
    for (const role of EQUIPE_ROLES) result[role] = 0;
    for (const member of members) result[member.role]++;
    return result;
  }, [members]);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("fr-FR");

    return members.filter(
      (member) =>
        (tab === "ALL" || member.role === tab) &&
        (activeFilter === "ALL" ||
          (activeFilter === "ACTIVE" ? member.isActive : !member.isActive)) &&
        (query === "" ||
          (member.name ?? "").toLocaleLowerCase("fr-FR").includes(query) ||
          member.email.toLocaleLowerCase("fr-FR").includes(query) ||
          (member.phone ?? "").toLocaleLowerCase("fr-FR").includes(query)),
    );
  }, [activeFilter, members, search, tab]);

  const chargeCommercial = (nom: string) =>
    prospects.filter(
      (prospect) =>
        prospect.commercial === nom &&
        prospect.statut !== "Perdu" &&
        prospect.statut !== "Converti",
    ).length;

  const chargeTech = (nom: string) =>
    interventions.filter(
      (intervention) =>
        intervention.technicien === nom &&
        (intervention.statut === "Planifiée" || intervention.statut === "En cours"),
    ).length;

  const workload = (member: User) => {
    if (member.role === RoleSTS.COMMERCIAL) {
      return { count: chargeCommercial(member.name ?? ""), label: "prospects actifs" };
    }
    if (member.role === RoleSTS.TECHNICIEN) {
      return { count: chargeTech(member.name ?? ""), label: "interventions en cours" };
    }
    return { count: 0, label: "tâche assignée" };
  };

  const toggleMember = async (member: User, isActive: boolean) => {
    setPendingId(member.id);
    try {
      await updateMembre(member.id, { isActive });
      toast.success(`${member.name ?? member.email} ${isActive ? "activé" : "désactivé"}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "La mise à jour du membre a échoué."));
    } finally {
      setPendingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;

    setPendingId(toDelete.id);
    try {
      await removeMembre(toDelete.id);
      toast.success(`${toDelete.name ?? toDelete.email} supprimé`);
      setToDelete(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "La suppression du membre a échoué."));
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <PageHeader
        title="Équipe"
        subtitle="Gérez les membres et leurs accès à STS SARL"
        actions={
          <Button onClick={() => setEditing({ mode: "create", role: RoleSTS.TECHNICIEN })}>
            <Plus className="mr-1.5 h-4 w-4" /> Nouveau membre
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-1.5 border-b border-border pb-3">
        {(["ALL", ...EQUIPE_ROLES] as const).map((role) => {
          const active = tab === role;
          const label = role === "ALL" ? "Tous" : ROLE_LABEL[role];

          return (
            <button
              key={role}
              type="button"
              onClick={() => setTab(role)}
              className={[
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-all",
                active
                  ? "border-foreground bg-foreground text-background shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:border-foreground/40 hover:text-foreground",
              ].join(" ")}
            >
              <span>{label}</span>
              <span
                className={[
                  "rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                  active ? "bg-background/20 text-background" : "bg-muted text-foreground/70",
                ].join(" ")}
              >
                {counts[role] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] max-w-md flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un nom, un email ou un téléphone…"
            className="pl-8"
          />
        </div>
        <Select
          value={activeFilter}
          onValueChange={(value: "ALL" | "ACTIVE" | "INACTIVE") => setActiveFilter(value)}
        >
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-1.5 h-3.5 w-3.5" />
            <SelectValue placeholder="État" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les états</SelectItem>
            <SelectItem value="ACTIVE">Actifs</SelectItem>
            <SelectItem value="INACTIVE">Inactifs</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="hidden overflow-hidden p-0 md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="py-3 pl-4 pr-2 font-semibold">Membre</th>
                <th className="px-2 py-3 font-semibold">Contact</th>
                <th className="px-2 py-3 font-semibold">Rôle</th>
                <th className="px-2 py-3 font-semibold">Charge</th>
                <th className="px-2 py-3 font-semibold">État</th>
                <th className="px-2 py-3 font-semibold">Ajouté le</th>
                <th className="py-3 pl-2 pr-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    Aucun membre ne correspond aux filtres.
                  </td>
                </tr>
              )}
              {filtered.map((member) => {
                const memberWorkload = workload(member);
                const role = member.role as EquipeRole;

                return (
                  <tr
                    key={member.id}
                    onClick={() => setEditing({ mode: "edit", membre: member })}
                    className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-muted/40"
                  >
                    <td className="py-3 pl-4 pr-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {initials(member.name ?? member.email)}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium">{member.name ?? member.email}</div>
                          <div className="text-xs text-muted-foreground">{ROLE_LABEL[role]}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      {member.phone && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" /> {member.phone}
                        </div>
                      )}
                      <div className="flex max-w-[220px] items-center gap-1 truncate text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" /> {member.email}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <Badge variant="outline" className={ROLE_STYLE[role]}>
                        {ROLE_LABEL[role]}
                      </Badge>
                    </td>
                    <td className="px-2 py-3 text-xs text-muted-foreground">
                      {memberWorkload.count} {memberWorkload.label}
                    </td>
                    <td className="px-2 py-3">
                      <Badge
                        variant="outline"
                        className={
                          member.isActive
                            ? "border-success/30 bg-success/15 text-success"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {member.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </td>
                    <td className="px-2 py-3 text-xs text-muted-foreground">
                      {formatDate(member.createdAt)}
                    </td>
                    <td
                      className="py-3 pl-2 pr-4 text-right"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <Switch
                          checked={member.isActive}
                          disabled={pendingId === member.id}
                          onCheckedChange={(isActive) => void toggleMember(member, isActive)}
                          aria-label={member.isActive ? "Désactiver" : "Activer"}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditing({ mode: "edit", membre: member })}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span className="sr-only">Modifier le membre</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setToDelete(member)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Supprimer le membre</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="space-y-2 md:hidden">
        {filtered.length === 0 && (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            Aucun membre ne correspond aux filtres.
          </Card>
        )}
        {filtered.map((member) => {
          const memberWorkload = workload(member);
          return (
            <MembreCard
              key={member.id}
              m={member}
              charge={memberWorkload.count}
              chargeLabel={memberWorkload.label}
              isPending={pendingId === member.id}
              onEdit={() => setEditing({ mode: "edit", membre: member })}
              onDelete={() => setToDelete(member)}
              onToggle={(isActive) => void toggleMember(member, isActive)}
            />
          );
        })}
      </div>

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
            <AlertDialogCancel disabled={pendingId === toDelete?.id}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={pendingId === toDelete?.id}
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
            >
              {pendingId === toDelete?.id ? "Suppression..." : "Supprimer"}
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
  isPending,
  onEdit,
  onDelete,
  onToggle,
}: {
  m: User;
  charge: number;
  chargeLabel: string;
  isPending: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (actif: boolean) => void;
}) {
  const role = m.role as EquipeRole;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-semibold truncate">{m.name ?? m.email}</div>
            <Badge variant="outline" className={ROLE_STYLE[role]}>
              {ROLE_LABEL[role]}
            </Badge>
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
          <Switch
            checked={m.isActive}
            disabled={isPending}
            onCheckedChange={onToggle}
            aria-label="Actif"
          />
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={isPending}
              onClick={onEdit}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              disabled={isPending}
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
