import { useMemo, useState } from "react";
import {
  Building2,
  ExternalLink,
  Eye,
  Filter,
  LoaderCircle,
  Mail,
  Phone,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { useApplicantActions, useApplicants } from "@/features/applicant/api/use-applicant";
import { ApplyStatus, TypeApplicant } from "@/features/interface/enum";
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
  const [selected, setSelected] = useState<Applicant | null>(null);
  const [toDelete, setToDelete] = useState<Applicant | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [tab, setTab] = useState<ApplyStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeApplicant | "ALL">("ALL");

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
            onStatusChange={(status) => void changeStatus(selected, status)}
          />
        )}
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
  onStatusChange,
}: {
  applicant: Applicant;
  isPending: boolean;
  onOpen: () => void;
  onDelete: () => void;
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
  onStatusChange,
}: {
  applicant: Applicant;
  isPending: boolean;
  onClose: () => void;
  onDelete: () => void;
  onStatusChange: (status: ApplyStatus) => void;
}) {
  return (
    <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex flex-wrap items-center gap-2">
          {applicant.fullName}
          <Badge variant="outline" className={STATUS_STYLE[applicant.statut]}>
            {STATUS_LABEL[applicant.statut]}
          </Badge>
        </DialogTitle>
        <DialogDescription>
          Candidature reçue le {formatDate(applicant.appliedAt || applicant.createdAt)}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 text-sm sm:grid-cols-2">
        <ApplicantField label="Entreprise" value={applicant.companyName || "Indépendant"} />
        <ApplicantField label="Métier" value={formatApplicantType(applicant.type)} capitalize />
        <ApplicantField label="Email" value={applicant.email} />
        <ApplicantField label="Téléphone" value={applicant.phone} />
        <ApplicantField
          label="Années d'existence"
          value={applicant.yearsOfExist || "Non renseigné"}
        />
        <div>
          <div className="mb-1 text-xs font-medium text-muted-foreground">Statut</div>
          <Select
            value={applicant.statut}
            onValueChange={(status: ApplyStatus) => onStatusChange(status)}
            disabled={isPending}
          >
            <SelectTrigger>
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
        </div>
        <div className="sm:col-span-2">
          <div className="mb-1 text-xs font-medium text-muted-foreground">Présentation</div>
          <div className="whitespace-pre-wrap rounded-md border bg-muted/30 p-3">
            {applicant.description || "Aucune description fournie."}
          </div>
        </div>
      </div>

      <DialogFooter className="gap-2 sm:justify-between">
        <Button variant="destructive" onClick={onDelete}>
          <Trash2 className="h-4 w-4" /> Supprimer
        </Button>
        <div className="flex gap-2">
          {applicant.resumeUrl && (
            <Button asChild variant="outline">
              <a href={applicant.resumeUrl} target="_blank" rel="noreferrer">
                Voir le CV <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
          <Button onClick={onClose}>Fermer</Button>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}

function ApplicantField({
  label,
  value,
  capitalize = false,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className={capitalize ? "mt-1 capitalize" : "mt-1 break-words"}>{value}</div>
    </div>
  );
}
