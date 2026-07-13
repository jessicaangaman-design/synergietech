import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from "recharts";
import { Users, TrendingUp, Wallet, CalendarClock, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import {
  useStore,
  formatFCFA,
  formatDate,
  daysUntil,
} from "@/lib/store";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

const MOIS_COURTS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];


function Dashboard() {
  const prospects = useStore((s) => s.prospects);
  const contrats = useStore((s) => s.contrats);
  const interventions = useStore((s) => s.interventions);

  const stats = useMemo(() => {
    const actifs = prospects.filter((p) => !["Converti", "Perdu"].includes(p.statut)).length;
    const clos = prospects.filter((p) => ["Converti", "Perdu"].includes(p.statut)).length;
    const convertis = prospects.filter((p) => p.statut === "Converti").length;
    const tauxConv = clos > 0 ? Math.round((convertis / clos) * 100) : 0;
    const caActif = contrats
      .filter((c) => c.statut === "Actif" || c.statut === "En renouvellement")
      .reduce((s, c) => s + c.montant, 0);
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + 7);
    const semaineIntv = interventions.filter((i) => {
      const d = new Date(i.dateHeure);
      return d >= now && d <= weekEnd && i.statut === "Planifiée";
    }).length;
    const echeance = contrats.filter((c) => {
      const j = daysUntil(c.echeance);
      return j >= 0 && j <= 30 && c.statut !== "Résilié" && c.statut !== "Brouillon";
    }).length;
    return { actifs, tauxConv, caActif, semaineIntv, echeance };
  }, [prospects, contrats, interventions]);

  const prospectsChart = useMemo(
    () =>
      PROSPECT_STATUTS.map((s) => ({
        statut: s,
        nombre: prospects.filter((p) => p.statut === s).length,
      })),
    [prospects],
  );

  const caParService = useMemo(() => {
    const map = new Map<string, number>();
    contrats
      .filter((c) => c.statut === "Actif" || c.statut === "En renouvellement")
      .forEach((c) => map.set(c.besoin, (map.get(c.besoin) || 0) + c.montant));
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [contrats]);

  const activites = useMemo(() => {
    const items: { date: string; texte: string; type: string }[] = [];
    const lastProspect = [...prospects].sort(
      (a, b) => +new Date(b.dateCreation) - +new Date(a.dateCreation),
    )[0];
    if (lastProspect)
      items.push({
        date: lastProspect.dateCreation,
        texte: `Nouveau prospect : ${lastProspect.nom}${lastProspect.entreprise ? ` (${lastProspect.entreprise})` : ""}`,
        type: "Prospect",
      });
    const lastContrat = [...contrats].sort(
      (a, b) => +new Date(b.dateSignature) - +new Date(a.dateSignature),
    )[0];
    if (lastContrat)
      items.push({
        date: lastContrat.dateSignature,
        texte: `Contrat ${lastContrat.type.toLowerCase()} — ${lastContrat.clientNom} (${formatFCFA(lastContrat.montant)})`,
        type: "Contrat",
      });
    const lastIntv = [...interventions]
      .filter((i) => i.statut === "Terminée")
      .sort((a, b) => +new Date(b.dateHeure) - +new Date(a.dateHeure))[0];
    if (lastIntv)
      items.push({
        date: lastIntv.dateHeure,
        texte: `Intervention terminée : ${lastIntv.type} — ${lastIntv.clientNom}`,
        type: "Intervention",
      });
    return items.sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [prospects, contrats, interventions]);

  return (
    <div className="p-6 lg:p-8 max-w-[1400px]">
      <PageHeader
        title="Tableau de bord commercial"
        subtitle="Vue synthétique de l'activité de Synergie Tech Solutions"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard icon={Users} label="Prospects actifs" value={stats.actifs} />
        <KpiCard icon={TrendingUp} label="Taux de conversion" value={`${stats.tauxConv}%`} />
        <KpiCard icon={Wallet} label="CA contrats actifs" value={formatFCFA(stats.caActif)} small />
        <KpiCard icon={CalendarClock} label="Interv. cette semaine" value={stats.semaineIntv} />
        <KpiCard
          icon={AlertTriangle}
          label="Échéances < 30j"
          value={stats.echeance}
          tone={stats.echeance > 0 ? "warning" : "default"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Prospects par statut</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={prospectsChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="statut" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Bar dataKey="nombre" radius={[6, 6, 0, 0]}>
                  {prospectsChart.map((d, i) => (
                    <Cell key={i} fill={STATUT_COLORS[d.statut] || "var(--chart-1)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">CA par type de service</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={caParService} dataKey="value" nameKey="name" innerRadius={45} outerRadius={85} paddingAngle={2}>
                  {caParService.map((_, i) => (
                    <Cell key={i} fill={`var(--chart-${(i % 7) + 1})`} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatFCFA(v)} contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dernières activités</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activites.map((a, i) => (
            <div key={i} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
              <Badge variant="outline" className="mt-0.5">
                {a.type}
              </Badge>
              <div className="flex-1 text-sm">{a.texte}</div>
              <div className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(a.date)}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  small,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  small?: boolean;
  tone?: "default" | "warning";
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
          <div
            className={`h-8 w-8 rounded-md grid place-items-center ${
              tone === "warning" ? "bg-warning/15 text-warning" : "bg-accent/15 text-accent"
            }`}
          >
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className={`font-semibold text-foreground ${small ? "text-lg" : "text-2xl"}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
