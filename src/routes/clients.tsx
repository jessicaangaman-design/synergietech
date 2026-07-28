import { Building2, Mail, MapPin, Phone, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useClients } from "@/features/clients/api/use-client";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

export function ClientsPage() {
  const { clients, error, mutate, isLoading } = useClients();
  const [search, setSearch] = useState("");

  const filteredClients = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("fr");
    if (!query) return clients;

    return clients.filter((client) =>
      [client.name, client.companyName, client.email, client.phone, client.address].some((value) =>
        value?.toLocaleLowerCase("fr").includes(query),
      ),
    );
  }, [clients, search]);

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Clients"
        subtitle="Consultez et recherchez les clients de Synergie Tech Solutions"
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nom, entreprise, téléphone, e-mail…"
            className="pl-9"
          />
        </div>
        <Badge variant="outline" className="w-fit">
          <Users className="mr-1.5 h-3.5 w-3.5" />
          {clients.length} client{clients.length > 1 ? "s" : ""}
        </Badge>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Chargement impossible</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>Les clients n’ont pas pu être récupérés depuis l’API.</span>
            <Button variant="outline" size="sm" onClick={() => void mutate()}>
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Adresse</TableHead>
              <TableHead>Origine</TableHead>
              <TableHead>Créé le</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: 5 }).map((__, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Skeleton className="h-5 w-full max-w-40" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!isLoading &&
              filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="font-medium">{client.name}</div>
                    {client.companyName && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        {client.companyName}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {client.phone}
                      </div>
                      {client.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {client.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex max-w-xs items-start gap-1.5 text-xs">
                      <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                      {client.address}
                    </div>
                  </TableCell>
                  <TableCell>
                    {client.prospectId ? (
                      <Badge variant="outline">Prospect converti</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Ajout direct</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(client.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        {!isLoading && !error && filteredClients.length === 0 && (
          <div className="grid min-h-48 place-items-center px-4 text-center">
            <div>
              <Users className="mx-auto h-8 w-8 text-muted-foreground/60" />
              <p className="mt-3 text-sm font-medium">
                {search ? "Aucun client ne correspond à la recherche" : "Aucun client enregistré"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {search
                  ? "Essayez avec un autre nom, numéro ou e-mail."
                  : "Les clients retournés par l’API apparaîtront ici."}
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
