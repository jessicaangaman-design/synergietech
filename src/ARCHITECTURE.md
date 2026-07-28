# Architecture front-end

```text
index.html                            # Point d'entrée HTML Vite
src/
├── main.tsx                        # Montage React, BrowserRouter
├── App.tsx                         # Routes, providers et protection auth
├── routes/                         # Pages React chargées à la demande
├── components/
│   ├── ui/                         # Primitives shadcn sans logique métier
│   └── *.tsx                       # Composants partagés
├── features/
│   ├── auth/api/
│   │   └── login.ts                # Connexion et extraction du token
│   ├── prospects/api/
│   │   └── use-prospects.ts        # useProspects, useProspect et actions
│   ├── contrats/api/
│   │   └── use-contrats.ts         # useContrats, useContrat et actions
│   ├── interventions/api/
│   │   └── use-interventions.ts    # Hooks et actions des interventions
│   └── equipe/api/
│       └── use-equipe.ts           # Hooks et actions de l'équipe
├── types/                          # Types métier séparés par domaine
├── lib/
│   ├── api/
│   │   ├── client.ts               # Client HTTP fetch typé
│   │   └── endpoints.ts            # URLs centralisées
│   ├── formatters.ts
│   ├── validation.ts
│   └── utils.ts
└── styles.css                      # Tokens shadcn et styles globaux
```

## Démarrage de l’application

Le flux standard React Vite est :

```text
index.html → src/main.tsx → src/App.tsx → React Router → page
```

`main.tsx` monte React dans `#root` et installe `BrowserRouter`. `App.tsx` contient les
providers globaux, les routes privées et le chargement différé des pages.

## Convention des hooks

Chaque ressource expose deux hooks de lecture conformes au même contrat :

```ts
const { prospects, error, mutate, isLoading } = useProspects();
const { prospect, error, mutate, isLoading } = useProspect(id);
```

Les écritures sont regroupées dans un hook d’actions :

```ts
const { addProspect, updateProspect, convertirProspect } = useProspectActions();
```

Une action appelle l’API, puis invalide avec SWR la liste et la ressource concernées. Il n’y a
plus de store global, de données en mémoire ou de seeder.

## Configuration

L’URL du backend est obligatoire :

```env
VITE_API_URL=https://api.example.com/v1
VITE_AUTH_TOKEN_KEY=token
```

Le client HTTP lit le token dans `localStorage`, sous la clé configurée par
`VITE_AUTH_TOKEN_KEY`, puis ajoute automatiquement :

```http
Authorization: Bearer <token>
```

Les fonctions `setAuthToken`, `getAuthToken` et `removeAuthToken` se trouvent dans
`lib/auth/token-storage.ts`.

## Contrat REST

| Domaine       | Lecture              | Création              | Modification               | Suppression          |
| ------------- | -------------------- | --------------------- | -------------------------- | -------------------- |
| Prospects     | `GET /prospects`     | `POST /prospects`     | `PATCH /prospects/:id`     | —                    |
| Contrats      | `GET /contrats`      | `POST /contrats`      | `PATCH /contrats/:id`      | —                    |
| Interventions | `GET /interventions` | `POST /interventions` | `PATCH /interventions/:id` | —                    |
| Équipe        | `GET /equipe`        | `POST /equipe`        | `PATCH /equipe/:id`        | `DELETE /equipe/:id` |

Actions complémentaires :

- `POST /prospects/:id/notes`
- `POST /prospects/:id/convert`
- `POST /contrats/:id/lignes`
- `PATCH /contrats/:id/lignes/:ligneId`
- `DELETE /contrats/:id/lignes/:ligneId`
