# AGENTS.md — Entre Estrellas

## Essential Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Production build (tsc + vite) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Oxlint (fast Rust-based linter) |
| `npx amplify deploy` | Deploy backend + frontend to AWS |

## Architecture

**Single-page React app** with no router library (App.tsx manages screens via state: `loading | login | constellation | admin`). The app conditionally renders one of three pages based on auth state.

```
App.tsx
  ├─ LoginPage        (not authenticated)
  │   ├─ LoginForm
  │   └─ RegisterForm
  ├─ ConstellationPage (authenticated, default)
  │   ├─ ConstellationCanvas  (HTML Canvas, no React DOM for stars)
  │   ├─ CommunityLetterPrompt → LetterEditor
  │   ├─ LetterEditor (direct letters)
  │   ├─ LetterCard (inbox)
  │   └─ Nav menu (logout, admin, inbox)
  └─ AdminPage        (isAdmin = true)
      └─ AdminPanel
```

### Data Flow

```
Cognito auth → token → AppSync (userPool mode)
                         → DynamoDB tables
                         → Lambda resolvers for custom mutations
                         → Subscriptions for realtime updates
```

## Critical Conventions

### GraphQL Pattern
All GraphQL operations are raw string templates in `src/graphql/operations.ts` (no codegen). Hooks cast `client.graphql()` results with `as any` because aws-amplify v6's type system doesn't support raw string queries. This is intentional — Amplify codegen adds complexity for 50-user scale.

### Auth / Security
- **Never trust `senderId` from frontend** — always extract from Cognito identity claims (`event.identity.claims.sub`).
- Admin authorization uses Cognito Groups (`admins`), checked via `fetchAuthSession().tokens.accessToken.payload['cognito:groups']`.
- Lambda handlers receive `event.identity` automatically from AppSync when configured with userPool auth.
- Letters are only readable by sender and recipient (ownerField in schema).

### DynamoDB Patterns
- All tables use On-Demand capacity (no provisioning).
- Table names follow pattern: `EntreEstrellas-{env}-{TableName}`.
- The `Event` table always has a single item with `id: 'current'`.
- Community assignments use `senderId` as the primary key (each user has exactly one).
- Connections are deduplicated: `(userAId, userBId)` is checked both ways before creating.

### State Management
No Redux, Zustand, or external state. Each domain has a custom hook:
- `useAuth` — Cognito auth state, login/register/logout
- `useConstellation` — Users, connections, selected user
- `useLetters` — Letters, unread count, send/mark read
- `useEvent` — Event status, admin stats, start/finish

Hooks use `useState` + `useEffect` + `useCallback`. Subscriptions are set up in `useEffect` with cleanup returning `unsubscribe()`.

### Canvas Architecture
`ConstellationCanvas` uses raw HTML Canvas 2D (not SVG, not react-force-graph). Stars are drawn as 5-pointed polygons with radial gradient glow. Connections are simple lines with opacity based on `letterCount`. Layout places the current user at center, others distributed in a circle with deterministic positions based on `userId.hashCode`.

**Why Canvas over SVG**: 50 stars is simple enough that React DOM overhead for SVG path elements is unnecessary. Canvas gives direct control over draw order and performance.

### Tailwind v4
Uses `@theme` directive in `index.css` for custom colors (`--color-space-*`, `--color-star-*`). No `tailwind.config.js` — v4 uses CSS-based configuration exclusively.

## Gotchas & Non-Obvious Patterns

1. **No email verification simplification**: Cognito is configured with `email: false` for sign-up. The RegisterForm has a verification step, but for a one-night event this can be bypassed by using `autoVerifiedAttributes: []`.

2. **Derangement algorithm**: The `startEvent` Lambda uses Fisher-Yates shuffle with retry (max 100 attempts) to find a permutation with no fixed points. For N < 2 it throws. This runs server-side only — never expose to frontend.

3. **TransactWriteItems for consistency**: `sendCommunityLetter` and `sendDirectLetter` use DynamoDB `TransactWriteItems` to atomically create the Letter, update the Connection, and mark the Assignment complete. This prevents phantom letters.

4. **Subscription resilience**: If subscriptions fail (e.g., AppSync not configured in dev), the catch block silently ignores the error. The app still works — it just requires manual refresh.

5. **Mobile keyboard**: All letter editing uses position: relative layouts with `100dvh` on the root. The `100dvh` (not `100vh`) is critical to prevent the address bar from hiding content when the keyboard opens.

6. **TypeScript 6.0 quirks**: `baseUrl` + `paths` is deprecated. The tsconfig uses `"ignoreDeprecations": "6.0"` to silence it. The `@/` alias needs both `vite.config.ts` resolve.alias AND `tsconfig.app.json` paths.

7. **Lambda handler callers**: AppSync Lambda resolvers pass arguments in `event.arguments`, identity in `event.identity.claims.sub`. Lambda functions should NOT use `APIGatewayProxyEvent` types — use `any` and destructure.

8. **UUID package**: The Lambda handlers import `uuid` for generating IDs. This package is NOT in the root `package.json` — individual Lambda function packages need their own `package.json` with `uuid` dependency when deployed.

9. **No `allow.owner()` misuse**: The `UserProfile` model uses `allow.owner()` which by default matches `owner: String` field matching the Cognito sub. The `Letter` model uses `allow.ownerDefinedIn('recipientId')` and `allow.ownerDefinedIn('senderId')` to restrict visibility.

10. **Environment variable injection**: All `VITE_*` env vars are injected at build time via Amplify Hosting / GitHub Actions. They become part of the JS bundle — never put secrets in them.

## File Organization Rules

- **Components** go in `components/{domain}/` (not flat). Domain = auth, constellation, letters, ui, admin.
- **Hooks** are flat in `hooks/`. Each hook maps to one domain concept.
- **Pages** compose components + hooks. Pages are the only files that import from multiple domains.
- **Lambda handlers** live in `amplify/functions/{functionName}/handler.ts`. Each function is a directory because Amplify may need a separate `package.json`.
- **Types** are centralized in `types/index.ts`. No scattered type definitions.

## Lambda Functions Structure

Each function in `amplify/functions/{name}/` requires three files:

| File | Purpose |
|------|---------|
| `handler.ts` | Runtime logic (DynamoDB calls, business logic) |
| `resource.ts` | Defines the function via `defineFunction()` for Amplify Gen 2 |
| `package.json` | Lists Node.js dependencies (bundled by esbuild at deploy time) |

Table names are injected via environment variables (`TABLE_USERPROFILE`, `TABLE_LETTER`, etc.) — defined in `amplify/backend.ts`. Handlers use `process.env.TABLE_*` instead of constructing names.

IAM permissions are granted in `amplify/backend.ts` via `PolicyStatement` for DynamoDB CRUD on all model tables.

## Deployment Checklist

### Before first deploy (local)
1. `npm run build` passes
2. `aws configure` done (Access Key ID + Secret Access Key)
3. **Optional**: `npx amplify sandbox` to test backend locally

### AWS Console setup
1. **Amplify Console** → Create app → Hosting → GitHub → connect repo (branch `main`)
2. Amplify auto-detects `amplify/` directory and deploys backend + frontend together
3. After deploy, Amplify outputs: `VITE_USER_POOL_ID`, `VITE_USER_POOL_CLIENT_ID`, `VITE_APPSYNC_ENDPOINT`
4. Set these as **Environment variables** in Amplify Console (Hosting → Environment variables)

### Post-deploy
5. **Cognito** → User Pools → el pool creado → Create group `admins` → add the admin user manually
6. Verify AppSync API is deployed with userPool auth mode
7. `.env.example` contains only public variable names (no values)

### Redeploy
Push to `main` → GitHub Actions workflow deploys automatically. Or: `npx amplify deploy`

## Testing

No test framework is configured yet. Priority tests to add:

- **Derangement algorithm**: verify no fixed points for N=2,3,10,50,100
- **sendLetter validations**: unauthenticated, self-letter, empty content, community letter not completed
- **Connection deduplication**: multiple letters between same pair produce one connection with incremented `letterCount`