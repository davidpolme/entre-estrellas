# Entre Estrellas

Aplicación web para crear una constelación comunitaria durante un Live de TikTok. Cada participante es una estrella, cada carta entre dos personas genera una conexión visible en la constelación.

## Stack

- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4, Framer Motion
- **Backend**: AWS Amplify Gen 2, Cognito, AppSync, DynamoDB On-Demand, Lambda
- **Hosting**: AWS Amplify Hosting

## Requisitos

- Node.js 22+
- npm
- AWS CLI (para deploy)
- Cuenta AWS con Amplify Gen 2 habilitado

## Desarrollo local

```bash
npm install
npm run dev
```

## Variables de entorno

Copiar `.env.example` a `.env` y llenar los valores provistos por Amplify:

```bash
VITE_AWS_REGION=us-east-1
VITE_USER_POOL_ID=us-east-1_xxxxx
VITE_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxx
VITE_APPSYNC_ENDPOINT=https://xxxxxxxxxx.appsync-api.us-east-1.amazonaws.com/graphql
```

**ADVERTENCIA**: `VITE_*` son valores públicos (visibles desde el navegador). Secretos reales (tokens, API keys, contraseñas) nunca deben estar aquí.

## Arquitectura

```
Usuarios → Amplify Hosting (React + TS) → Cognito (auth)
                                        → AppSync (GraphQL + Realtime)
                                            → DynamoDB On-Demand
                                            → Lambda (lógica especializada)
```

## Servicios AWS

| Servicio | Uso |
|----------|-----|
| Cognito | Autenticación (username + password) |
| AppSync | API GraphQL con suscripciones realtime |
| DynamoDB | Almacenamiento On-Demand (sin capacidad provisionada) |
| Lambda | Lógica de negocio (asignaciones, envío de cartas, etc.) |
| Amplify Hosting | Hosting estático + CI/CD |
| CloudWatch | Logs esenciales |

## Seguridad

- Autorización por Cognito Groups (admins) y claims
- AppSync con default auth mode = userPool
- Mínimo privilegio IAM en todos los roles
- `senderId` se obtiene del token Cognito, nunca del frontend
- Las cartas solo son visibles para emisor y receptor
- No se usa `dangerouslySetInnerHTML`
- Secretos en AWS Parameter Store (SecureString), no en el repo
- `.env` en `.gitignore`

## Comandos

```bash
npm run dev      # Desarrollo
npm run build    # Build producción
npm run preview  # Vista previa del build
npm run lint     # Linting con oxlint
```

## Deploy

Push a `main` → GitHub Actions deploys automáticamente a Amplify.

O manual:

```bash
npx amplify deploy
```

## Estructura del proyecto

```
src/
  amplify/configure.ts       # Configuración de Amplify
  components/
    admin/AdminPanel.tsx      # Panel de administración
    auth/LoginForm.tsx        # Formulario de login
    auth/RegisterForm.tsx     # Formulario de registro
    constellation/ConstellationCanvas.tsx  # Canvas con estrellas y conexiones
    letters/LetterEditor.tsx  # Editor de cartas
    letters/LetterCard.tsx    # Tarjeta de carta
    letters/CommunityLetterPrompt.tsx  # Modal de carta comunitaria
    ui/Modal.tsx              # Modal reutilizable
    ui/StarColorPicker.tsx    # Selector de color de estrella
  hooks/
    useAuth.ts                # Hook de autenticación Cognito
    useConstellation.ts       # Hook de estado de la constelación
    useLetters.ts             # Hook de cartas y asignaciones
    useEvent.ts               # Hook de estado del evento
  graphql/operations.ts      # Queries, mutations y subscriptions GraphQL
  pages/
    LoginPage.tsx             # Pantalla de login/registro
    ConstellationPage.tsx     # Pantalla principal de la constelación
    AdminPage.tsx             # Pantalla de admin
  types/index.ts             # Tipos compartidos
amplify/
  backend.ts                  # Definición del backend Amplify Gen 2
  auth/resource.ts            # Configuración de Cognito
  data/resource.ts            # Schema de AppSync + resolvers
  functions/                  # Lambda handlers
```

## Modelos DynamoDB

- `UserProfile` - Perfil de usuario (username, starColor, posición)
- `Letter` - Cartas (COMMUNITY o DIRECT)
- `Connection` - Conexiones entre usuarios (letterCount, sin líneas duplicadas)
- `CommunityAssignment` - Asignación uno-a-uno para carta comunitaria (derangement)
- `Event` - Estado del evento (REGISTRATION_OPEN → ACTIVE → FINISHED)

## Licencia

MIT