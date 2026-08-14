import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import { useContratActions } from "@/features/contrats/api/use-contrats";
import { exportMaintenanceContractPDF } from "@/features/contrats/maintenance-contract-pdf";
import { useClient } from "@/features/clients/api/use-client";
import type { Contrat } from "@/features/interface/contrats.type";
import { StatutContrat, TypeContrat } from "@/features/interface/enum";
import { BESOINS, type BesoinType } from "@/types";
import { getApiErrorMessage } from "@/lib/api/client";
import { formatFCFA } from "@/lib/formatters";
import { FieldError } from "@/components/PhoneField";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const maintenanceSchema = z.object({
  service: z.custom<BesoinType>(
    (value) => BESOINS.includes(value as BesoinType),
    "Sélectionnez le système à entretenir",
  ),
  siteDescription: z.string().trim().min(1, "Le site concerné est obligatoire").max(250),
  frequency: z.string().trim().min(1, "La fréquence est obligatoire").max(120),
  billingPeriod: z.enum(["MENSUELLE", "TRIMESTRIELLE", "ANNUELLE"]),
  durationMonths: z.number().int().min(1).max(120),
  startDate: z.string().min(1, "La date de début est obligatoire"),
  tacitRenewal: z.boolean(),
  outOfContractFee: z.number().min(0),
});

type MaintenanceFormValues = z.infer<typeof maintenanceSchema>;

export function MaintenanceContractDialog({
  source,
  onClose,
}: {
  source: Contrat;
  onClose: () => void;
}) {
  const { addContrat } = useContratActions();
  const { client: linkedClient, isLoading: isClientLoading } = useClient(source.clientId);
  const client = linkedClient ?? source.client;
  const sourceTotal = (source.lignes ?? []).reduce(
    (total, line) => total + line.quantite * line.prixUnitaire,
    0,
  );
  const quoteTotal = sourceTotal || source.montant;
  const clientName = client?.companyName || client?.name || "Client";

  const {
    control,
    clearErrors,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      service: "vidéosurveillance",
      siteDescription: client?.address || "",
      frequency: "Un passage mensuel",
      billingPeriod: "TRIMESTRIELLE",
      durationMonths: 12,
      startDate: new Date().toISOString().slice(0, 10),
      tacitRenewal: true,
      outOfContractFee: 25_000,
    },
  });

  const durationMonths = watch("durationMonths");
  const monthlyAmount = durationMonths > 0 ? quoteTotal / durationMonths : 0;

  useEffect(() => {
    if (linkedClient) {
      if (linkedClient.address) {
        setValue("siteDescription", linkedClient.address, { shouldValidate: true });
      }
    }
  }, [linkedClient, setValue]);

  const submit = async (values: MaintenanceFormValues) => {
    clearErrors("root.server");

    if (!source.clientId) {
      setError("root.server", {
        type: "server",
        message: "Ce devis n'est associé à aucun client.",
      });
      return;
    }

    if (quoteTotal <= 0) {
      setError("root.server", {
        type: "server",
        message: "Le montant total du devis doit être supérieur à zéro.",
      });
      return;
    }

    const startDate = new Date(`${values.startDate}T00:00:00`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + values.durationMonths);

    try {
      await addContrat({
        type: TypeContrat.MAINTENANCE,
        clientId: source.clientId,
        statut: StatutContrat.ACTIF,
        montant: quoteTotal,
        dateSignature: startDate.toISOString(),
        dateEcheance: endDate.toISOString(),
        dureeMois: values.durationMonths,
        lignes: [
          {
            designation: `Entretien ${values.service} — ${values.frequency}`,
            quantite: values.durationMonths,
            prixUnitaire: quoteTotal / values.durationMonths,
          },
        ],
      });

      exportMaintenanceContractPDF({
        clientName,
        clientRepresentative: client?.companyName ? client.name : undefined,
        clientAddress: client?.address,
        service: values.service,
        siteDescription: values.siteDescription,
        frequency: values.frequency,
        monthlyAmount: quoteTotal / values.durationMonths,
        billingPeriod: values.billingPeriod,
        durationMonths: values.durationMonths,
        startDate: startDate.toISOString(),
        tacitRenewal: values.tacitRenewal,
        outOfContractFee: values.outOfContractFee,
      });

      toast.success("Contrat d'entretien créé et PDF généré");
      onClose();
    } catch (error) {
      const message = getApiErrorMessage(error, "La création du contrat d'entretien a échoué.");
      setError("root.server", { type: "server", message });
      toast.error(message);
    }
  };

  return (
    <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Créer le contrat d’entretien</DialogTitle>
        <DialogDescription>
          Les informations de {clientName} sont reprises du devis. Total du devis source :{" "}
          {formatFCFA(quoteTotal)}.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(submit)} className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Système à entretenir</Label>
          <Controller
            name="service"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger aria-invalid={!!errors.service}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BESOINS.map((service) => (
                    <SelectItem key={service} value={service} className="capitalize">
                      {service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError message={errors.service?.message} />
        </div>

        <div>
          <Label>Site concerné</Label>
          <Controller
            name="siteDescription"
            control={control}
            render={({ field }) => <Input {...field} aria-invalid={!!errors.siteDescription} />}
          />
          <FieldError message={errors.siteDescription?.message} />
        </div>

        <div>
          <Label>Fréquence des interventions</Label>
          <Controller
            name="frequency"
            control={control}
            render={({ field }) => <Input {...field} aria-invalid={!!errors.frequency} />}
          />
          <FieldError message={errors.frequency?.message} />
        </div>

        <div>
          <Label>Montant mensuel TTC (calculé)</Label>
          <div className="flex h-9 items-center rounded-md border border-input bg-muted/40 px-3 font-mono text-sm">
            {formatFCFA(monthlyAmount)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Total du devis ÷ {durationMonths || 0} mois
          </div>
        </div>

        <div>
          <Label>Périodicité de facturation</Label>
          <Controller
            name="billingPeriod"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MENSUELLE">Mensuelle</SelectItem>
                  <SelectItem value="TRIMESTRIELLE">Trimestrielle</SelectItem>
                  <SelectItem value="ANNUELLE">Annuelle</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div>
          <Label>Durée du contrat (mois)</Label>
          <Controller
            name="durationMonths"
            control={control}
            render={({ field }) => (
              <Input
                type="number"
                min={1}
                max={120}
                value={field.value}
                onChange={(event) => field.onChange(Number(event.target.value))}
              />
            )}
          />
        </div>

        <div>
          <Label>Date de début</Label>
          <Controller
            name="startDate"
            control={control}
            render={({ field }) => <Input {...field} type="date" />}
          />
          <FieldError message={errors.startDate?.message} />
        </div>

        <div>
          <Label>Intervention hors contrat (FCFA)</Label>
          <Controller
            name="outOfContractFee"
            control={control}
            render={({ field }) => (
              <Input
                type="number"
                min={0}
                value={field.value}
                onChange={(event) => field.onChange(Number(event.target.value))}
              />
            )}
          />
        </div>

        <Controller
          name="tacitRenewal"
          control={control}
          render={({ field }) => (
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <Checkbox
                checked={field.value}
                onCheckedChange={(value) => field.onChange(!!value)}
              />
              Renouvellement par tacite reconduction
            </label>
          )}
        />

        <div className="rounded-md border bg-muted/30 p-3 text-sm sm:col-span-2">
          Montant total repris du devis : <strong>{formatFCFA(quoteTotal)}</strong>
        </div>

        <div className="sm:col-span-2">
          <FieldError message={errors.root?.server?.message} />
        </div>

        <DialogFooter className="sm:col-span-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting || (isClientLoading && !source.client)}>
            {isClientLoading && !source.client
              ? "Chargement du client..."
              : isSubmitting
                ? "Création..."
                : "Créer et générer le PDF"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
