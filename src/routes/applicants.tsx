import { useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ExternalLink,
  Eye,
  EyeOff,
  Filter,
  KeyRound,
  LoaderCircle,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";

import { useApplicantActions, useApplicants } from "@/features/applicant/api/use-applicant";
import { useEquipeActions, useUsers } from "@/features/equipe/api/use-equipe";
import { ApplyStatus, RoleSTS, TypeApplicant } from "@/features/interface/enum";
import type { Applicant } from "@/features/interface/applicant.type";
import { getApiErrorMessage } from "@/lib/api/client";
import { formatDate } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

const STATUSES: ApplyStatus[] = [ApplyStatus.PENDING, ApplyStatus.APPROVED, ApplyStatus.REJECTED];
const APPLICANT_TYPES = Object.values(TypeApplicant);

const STATUS_LABEL: Record<ApplyStatus, string> = {
  [ApplyStatus.PENDING]: "En attente",
  [ApplyStatus.APPROVED]: "Approuvée",
  [ApplyStatus.REJECTED]: "Rejetée",
};

const STATUS_STYLE: Record<ApplyStatus, string> = {
  [ApplyStatus.PENDING]: "bg-warning/15 text-warning border-warning/30",
  [ApplyStatus.APPROVED]: "bg-success/15 text-success border-success/30",
  [ApplyStatus.REJECTED]: "bg-destructive/10 text-destructive border-destructive/20",
};

const STATUS_DOT: Record<ApplyStatus, string> = {
  [ApplyStatus.PENDING]: "bg-warning",
  [ApplyStatus.APPROVED]: "bg-success",
  [ApplyStatus.REJECTED]: "bg-destructive",
};

const STATUS_BAR: Record<ApplyStatus, string> = {
  [ApplyStatus.PENDING]: "bg-warning",
  [ApplyStatus.APPROVED]: "bg-success",
  [ApplyStatus.REJECTED]: "bg-destructive",
};

function formatApplicantType(type: TypeApplicant) {
  return type.replaceAll("_", " ").toLocaleLowerCase("fr-FR");
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function ApplicantsPage() {
  const { applicants, error, isLoading } = useApplicants();
  const { validateApplicant, removeApplicant } = useApplicantActions();
  const { users } = useUsers();
  const { addMembre } = useEquipeActions();
  const [selected, setSelected] = useState<Applicant | null>(null);
  const [toDelete, setToDelete] = useState<Applicant | null>(null);
  const [toPromote, setToPromote] = useState<Applicant | null>(null);
  const [initialPassword, setInitialPassword] = useState("");
  const [showInitialPassword, setShowInitialPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [isCreatingTechnician, setIsCreatingTechnician] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [tab, setTab] = useState<ApplyStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeApplicant | "ALL">("ALL");

  const isTechnician = (applicant: Applicant) =>
    users.some(
      (user) =>
        user.role === RoleSTS.TECHNICIEN &&
        user.email.toLocaleLowerCase("fr-FR") === applicant.email.toLocaleLowerCase("fr-FR"),
    );

  const openTechnicianDialog = (applicant: Applicant) => {
    setInitialPassword("");
    setShowInitialPassword(false);
    setPasswordTouched(false);
    setSelected(null);
    setToPromote(applicant);
  };

  const counts = useMemo(() => {
    const result: Record<string, number> = { ALL: applicants.length };
    for (const status of STATUSES) result[status] = 0;
    for (const applicant of applicants) result[applicant.statut]++;
    return result;
  }, [applicants]);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("fr-FR");

    return applicants
      .filter(
        (applicant) =>
          (tab === "ALL" || applicant.statut === tab) &&
          (typeFilter === "ALL" || applicant.type === typeFilter) &&
          (query === "" ||
            applicant.fullName.toLocaleLowerCase("fr-FR").includes(query) ||
            applicant.companyName.toLocaleLowerCase("fr-FR").includes(query) ||
            applicant.email.toLocaleLowerCase("fr-FR").includes(query) ||
            applicant.phone.toLocaleLowerCase("fr-FR").includes(query)),
      )
      .sort(
        (first, second) =>
          new Date(second.appliedAt || second.createdAt).getTime() -
          new Date(first.appliedAt || first.createdAt).getTime(),
      );
  }, [applicants, search, tab, typeFilter]);

  const changeStatus = async (applicant: Applicant, statut: ApplyStatus) => {
    setPendingId(applicant.id);
    try {
      await validateApplicant(applicant.id, statut);
      setSelected((current) => (current?.id === applicant.id ? { ...current, statut } : current));
      toast.success(`Candidature ${STATUS_LABEL[statut].toLocaleLowerCase("fr-FR")}`);
    } catch (updateError) {
      toast.error(getApiErrorMessage(updateError, "La mise à jour de la candidature a échoué."));
    } finally {
      setPendingId(null);
    }
  };

  const deleteApplicant = async () => {
    if (!toDelete) return;

    setPendingId(toDelete.id);
    try {
      await removeApplicant(toDelete.id);
      toast.success("Candidature supprimée");
      setSelected((current) => (current?.id === toDelete.id ? null : current));
      setToDelete(null);
    } catch (deleteError) {
      toast.error(getApiErrorMessage(deleteError, "La suppression de la candidature a échoué."));
    } finally {
      setPendingId(null);
    }
  };

  const createTechnician = async () => {
    if (!toPromote) return;
    if (initialPassword.length < 6) {
      setPasswordTouched(true);
      return;
    }

    setIsCreatingTechnician(true);
    try {
      await addMembre({
        name: toPromote.fullName,
        email: toPromote.email,
        phone: toPromote.phone || undefined,
        password: initialPassword,
        role: RoleSTS.TECHNICIEN,
        isActive: true,
      });
      toast.success(`${toPromote.fullName} a été ajouté aux techniciens`);
      setToPromote(null);
      setInitialPassword("");
      setShowInitialPassword(false);
      setPasswordTouched(false);
    } catch (createError) {
      toast.error(getApiErrorMessage(createError, "La création du technicien a échoué."));
    } finally {
      setIsCreatingTechnician(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <PageHeader
        title="Candidatures"
        subtitle="Consultez et traitez les demandes des prestataires"
      />

      {isLoading && (
        <Card className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
          <LoaderCircle className="h-4 w-4 animate-spin" /> Chargement des candidatures...
        </Card>
      )}

      {error && !isLoading && (
        <Card className="border-destructive/30 p-6 text-sm text-destructive">
          {getApiErrorMessage(error, "Impossible de charger les candidatures.")}
        </Card>
      )}

      {!isLoading && !error && (
        <>
          <div className="flex flex-wrap items-center gap-1.5 border-b border-border pb-3">
            {(["ALL", ...STATUSES] as const).map((status) => {
              const active = tab === status;
              const label = status === "ALL" ? "Toutes" : STATUS_LABEL[status];

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setTab(status)}
                  className={[
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-all",
                    active
                      ? "border-foreground bg-foreground text-background shadow-sm"
                      : "border-border bg-card text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                  ].join(" ")}
                >
                  {status !== "ALL" && (
                    <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />
                  )}
                  <span>{label}</span>
                  <span
                    className={[
                      "rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                      active ? "bg-background/20 text-background" : "bg-muted text-foreground/70",
                    ].join(" ")}
                  >
                    {counts[status] ?? 0}
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
                placeholder="Rechercher un candidat, une entreprise, un contact…"
                className="pl-8"
              />
            </div>
            <Select
              value={typeFilter}
              onValueChange={(value: TypeApplicant | "ALL") => setTypeFilter(value)}
            >
              <SelectTrigger className="w-[220px]">
                <Filter className="mr-1.5 h-3.5 w-3.5" />
                <SelectValue placeholder="Métier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les métiers</SelectItem>
                {APPLICANT_TYPES.map((type) => (
                  <SelectItem key={type} value={type} className="capitalize">
                    {formatApplicantType(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card className="hidden overflow-hidden p-0 md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/50">
                  <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="py-3 pl-4 pr-2 font-semibold">Candidat</th>
                    <th className="px-2 py-3 font-semibold">Contact</th>
                    <th className="px-2 py-3 font-semibold">Métier</th>
                    <th className="px-2 py-3 font-semibold">Expérience</th>
                    <th className="px-2 py-3 font-semibold">Statut</th>
                    <th className="px-2 py-3 font-semibold">Reçue le</th>
                    <th className="py-3 pl-2 pr-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        Aucune candidature ne correspond aux filtres.
                      </td>
                    </tr>
                  )}
                  {filtered.map((applicant) => (
                    <tr
                      key={applicant.id}
                      onClick={() => setSelected(applicant)}
                      className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-muted/40"
                    >
                      <td className="py-3 pl-4 pr-2">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                              {initials(applicant.fullName)}
                            </div>
                            <span
                              className={`absolute -left-1 top-0 h-9 w-1 rounded-full ${STATUS_BAR[applicant.statut]}`}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-medium text-foreground">
                              {applicant.fullName}
                            </div>
                            <div className="flex max-w-[220px] items-center gap-1 truncate text-xs text-muted-foreground">
                              <Building2 className="h-3 w-3" />
                              {applicant.companyName || "Indépendant"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" /> {applicant.phone}
                        </div>
                        <div className="flex max-w-[220px] items-center gap-1 truncate text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" /> {applicant.email}
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <Badge variant="outline" className="font-normal capitalize">
                          {formatApplicantType(applicant.type)}
                        </Badge>
                      </td>
                      <td className="px-2 py-3 text-xs text-muted-foreground">
                        {applicant.yearsOfExist || "—"}
                      </td>
                      <td className="px-2 py-3">
                        <Badge variant="outline" className={STATUS_STYLE[applicant.statut]}>
                          <span
                            className={`mr-1.5 h-1.5 w-1.5 rounded-full ${STATUS_DOT[applicant.statut]}`}
                          />
                          {STATUS_LABEL[applicant.statut]}
                        </Badge>
                      </td>
                      <td className="px-2 py-3 text-xs text-muted-foreground">
                        {formatDate(applicant.appliedAt || applicant.createdAt)}
                      </td>
                      <td
                        className="py-3 pl-2 pr-4 text-right"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {applicant.statut === ApplyStatus.APPROVED && (
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              disabled={isTechnician(applicant)}
                              title={
                                isTechnician(applicant)
                                  ? "Déjà ajouté aux techniciens"
                                  : "Ajouter comme technicien"
                              }
                              onClick={() => openTechnicianDialog(applicant)}
                            >
                              <UserPlus className="h-3.5 w-3.5" />
                              <span className="sr-only">
                                {isTechnician(applicant)
                                  ? "Déjà technicien"
                                  : "Ajouter comme technicien"}
                              </span>
                            </Button>
                          )}
                          <Select
                            value={applicant.statut}
                            onValueChange={(status: ApplyStatus) =>
                              void changeStatus(applicant, status)
                            }
                            disabled={pendingId === applicant.id}
                          >
                            <SelectTrigger className="h-8 w-[125px] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUSES.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {STATUS_LABEL[status]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setSelected(applicant)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span className="sr-only">Voir la candidature</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setToDelete(applicant)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="sr-only">Supprimer la candidature</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="space-y-2 md:hidden">
            {filtered.length === 0 && (
              <Card className="p-8 text-center text-sm text-muted-foreground">
                Aucune candidature ne correspond aux filtres.
              </Card>
            )}
            {filtered.map((applicant) => (
              <ApplicantCard
                key={applicant.id}
                applicant={applicant}
                isPending={pendingId === applicant.id}
                onOpen={() => setSelected(applicant)}
                onDelete={() => setToDelete(applicant)}
                onPromote={() => openTechnicianDialog(applicant)}
                isTechnician={isTechnician(applicant)}
                onStatusChange={(nextStatus) => void changeStatus(applicant, nextStatus)}
              />
            ))}
          </div>
        </>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        {selected && (
          <ApplicantDialog
            applicant={selected}
            isPending={pendingId === selected.id}
            onClose={() => setSelected(null)}
            onDelete={() => setToDelete(selected)}
            onPromote={() => openTechnicianDialog(selected)}
            isTechnician={isTechnician(selected)}
            onStatusChange={(status) => void changeStatus(selected, status)}
          />
        )}
      </Dialog>

      <Dialog
        open={!!toPromote}
        onOpenChange={(open) => {
          if (!open && !isCreatingTechnician) {
            setToPromote(null);
            setInitialPassword("");
            setShowInitialPassword(false);
            setPasswordTouched(false);
          }
        }}
      >
        <DialogContent className="max-w-lg gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b bg-muted/30 px-6 py-5 pr-12 text-left">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UserPlus className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <DialogTitle>Ajouter à l’équipe technique</DialogTitle>
                <DialogDescription>
                  Créez son accès à partir de la candidature approuvée.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 px-6 py-5">
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {toPromote ? initials(toPromote.fullName) : ""}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-semibold">{toPromote?.fullName}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 text-success" />
                    Candidature approuvée · Futur technicien
                  </div>
                </div>
              </div>
              <div className="mt-4 grid gap-2 border-t pt-3 text-sm sm:grid-cols-2">
                <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="truncate">{toPromote?.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>{toPromote?.phone || "Non renseigné"}</span>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="technician-password" className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-muted-foreground" /> Mot de passe initial
              </Label>
              <div className="relative mt-1.5">
                <Input
                  id="technician-password"
                  type={showInitialPassword ? "text" : "password"}
                  value={initialPassword}
                  onChange={(event) => {
                    setInitialPassword(event.target.value);
                    setPasswordTouched(true);
                  }}
                  onBlur={() => setPasswordTouched(true)}
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="6 caractères minimum"
                  className="pr-10"
                  aria-invalid={passwordTouched && initialPassword.length < 6}
                  aria-describedby="technician-password-help"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-9 w-9 text-muted-foreground"
                  onClick={() => setShowInitialPassword((visible) => !visible)}
                  aria-label={
                    showInitialPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"
                  }
                >
                  {showInitialPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div id="technician-password-help" className="mt-1.5 text-xs">
                {passwordTouched && initialPassword.length < 6 ? (
                  <span className="text-destructive">
                    Saisissez au moins 6 caractères pour continuer.
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    À transmettre au technicien pour sa première connexion.
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>
                Le compte sera créé immédiatement avec le rôle Technicien et sera actif dès sa
                création.
              </span>
            </div>
          </div>

          <DialogFooter className="border-t bg-muted/20 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              disabled={isCreatingTechnician}
              onClick={() => {
                setToPromote(null);
                setInitialPassword("");
              }}
            >
              Annuler
            </Button>
            <Button
              type="button"
              disabled={isCreatingTechnician || initialPassword.length < 6}
              onClick={() => void createTechnician()}
            >
              <UserPlus className="h-4 w-4" />
              {isCreatingTechnician ? "Ajout..." : "Créer le technicien"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la candidature de {toDelete?.fullName} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est définitive et supprimera le dossier de candidature.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pendingId === toDelete?.id}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={pendingId === toDelete?.id}
              onClick={(event) => {
                event.preventDefault();
                void deleteApplicant();
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

function ApplicantCard({
  applicant,
  isPending,
  onOpen,
  onDelete,
  onPromote,
  isTechnician,
  onStatusChange,
}: {
  applicant: Applicant;
  isPending: boolean;
  onOpen: () => void;
  onDelete: () => void;
  onPromote: () => void;
  isTechnician: boolean;
  onStatusChange: (status: ApplyStatus) => void;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="truncate font-semibold">{applicant.fullName}</div>
            <Badge variant="outline" className={STATUS_STYLE[applicant.statut]}>
              {STATUS_LABEL[applicant.statut]}
            </Badge>
          </div>
          <div className="mt-1 truncate text-xs text-muted-foreground">
            {applicant.companyName || "Candidat indépendant"}
          </div>
          <Badge variant="outline" className="mt-3 capitalize">
            {formatApplicantType(applicant.type)}
          </Badge>
          <div className="mt-3 space-y-1 text-xs text-muted-foreground">
            <div className="truncate">✉️ {applicant.email}</div>
            <div>📞 {applicant.phone}</div>
            <div>Reçue le {formatDate(applicant.appliedAt || applicant.createdAt)}</div>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Select
            value={applicant.statut}
            onValueChange={(status: ApplyStatus) => onStatusChange(status)}
            disabled={isPending}
          >
            <SelectTrigger className="h-8 w-[125px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {STATUS_LABEL[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {applicant.statut === ApplyStatus.APPROVED && (
            <Button variant="outline" size="sm" disabled={isTechnician} onClick={onPromote}>
              <UserPlus className="h-3.5 w-3.5" />
              {isTechnician ? "Déjà technicien" : "Ajouter comme technicien"}
            </Button>
          )}
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onOpen}>
              <Eye className="h-3.5 w-3.5" />
              <span className="sr-only">Voir la candidature</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="sr-only">Supprimer la candidature</span>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function ApplicantDialog({
  applicant,
  isPending,
  onClose,
  onDelete,
  onPromote,
  isTechnician,
  onStatusChange,
}: {
  applicant: Applicant;
  isPending: boolean;
  onClose: () => void;
  onDelete: () => void;
  onPromote: () => void;
  isTechnician: boolean;
  onStatusChange: (status: ApplyStatus) => void;
}) {
  return (
    <DialogContent className="grid max-h-[92vh] max-w-2xl grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0">
      <div className={`h-1.5 w-full ${STATUS_BAR[applicant.statut]}`} />

      <div className="min-h-0 overflow-y-auto">
        <DialogHeader className="border-b bg-muted/25 px-6 py-5 pr-12 text-left">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-lg font-semibold text-primary-foreground shadow-sm">
              {initials(applicant.fullName)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="text-xl">{applicant.fullName}</DialogTitle>
                <Badge variant="outline" className={STATUS_STYLE[applicant.statut]}>
                  <span
                    className={`mr-1.5 h-1.5 w-1.5 rounded-full ${STATUS_DOT[applicant.statut]}`}
                  />
                  {STATUS_LABEL[applicant.statut]}
                </Badge>
              </div>
              <DialogDescription className="mt-1.5 flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                Reçue le {formatDate(applicant.appliedAt || applicant.createdAt)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 px-6 py-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <a
              href={`mailto:${applicant.email}`}
              className="group flex min-w-0 items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Mail className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">Adresse e-mail</div>
                <div className="truncate text-sm font-medium group-hover:text-primary">
                  {applicant.email}
                </div>
              </div>
            </a>
            <a
              href={`tel:${applicant.phone}`}
              className="group flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Phone className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Téléphone</div>
                <div className="text-sm font-medium group-hover:text-primary">
                  {applicant.phone || "Non renseigné"}
                </div>
              </div>
            </a>
          </div>

          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Informations professionnelles
            </h3>
            <div className="grid overflow-hidden rounded-xl border sm:grid-cols-3">
              <div className="border-b p-4 sm:border-b-0 sm:border-r">
                <Building2 className="mb-2 h-4 w-4 text-muted-foreground" />
                <div className="text-xs text-muted-foreground">Entreprise</div>
                <div className="mt-1 text-sm font-medium">
                  {applicant.companyName || "Indépendant"}
                </div>
              </div>
              <div className="border-b p-4 sm:border-b-0 sm:border-r">
                <BriefcaseBusiness className="mb-2 h-4 w-4 text-muted-foreground" />
                <div className="text-xs text-muted-foreground">Métier</div>
                <div className="mt-1 text-sm font-medium capitalize">
                  {formatApplicantType(applicant.type)}
                </div>
              </div>
              <div className="p-4">
                <CalendarDays className="mb-2 h-4 w-4 text-muted-foreground" />
                <div className="text-xs text-muted-foreground">Expérience</div>
                <div className="mt-1 text-sm font-medium">
                  {applicant.yearsOfExist || "Non renseignée"}
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Présentation
            </h3>
            <div className="min-h-24 whitespace-pre-wrap rounded-xl border bg-muted/20 p-4 text-sm leading-relaxed">
              {applicant.description || "Aucune description fournie."}
            </div>
          </section>

          <section className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-medium">Traitement de la candidature</div>
              <div className="text-xs text-muted-foreground">
                Modifiez le statut pour accepter ou refuser cette demande.
              </div>
            </div>
            <Select
              value={applicant.statut}
              onValueChange={(status: ApplyStatus) => onStatusChange(status)}
              disabled={isPending}
            >
              <SelectTrigger className="w-full bg-background sm:w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_LABEL[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </section>
        </div>
      </div>

      <DialogFooter className="flex-col-reverse gap-2 border-t bg-muted/20 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="ghost"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" /> Supprimer
        </Button>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          {applicant.resumeUrl && (
            <Button asChild variant="outline">
              <a href={applicant.resumeUrl} target="_blank" rel="noreferrer">
                Voir le CV <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
          {applicant.statut === ApplyStatus.APPROVED && (
            <Button disabled={isTechnician} onClick={onPromote}>
              <UserPlus className="h-4 w-4" />
              {isTechnician ? "Déjà technicien" : "Ajouter comme technicien"}
            </Button>
          )}
        </div>
      </DialogFooter>
    </DialogContent>
  );
}
