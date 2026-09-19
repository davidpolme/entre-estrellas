# Entre Estrellas

Aplicación web para crear una constelación comunitaria durante un Live de TikTok. Cada participante es una estrella, cada carta entre dos personas genera una conexión visible en la constelación.

## Stack

- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4, Framer Motion
- **Backend**: AWS Amplify Gen 2, AppSync, DynamoDB On-Demand, Lambda
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

Amplify genera `amplify_outputs.json` automáticamente durante `ampx sandbox` y `ampx pipeline-deploy`. Este archivo contiene la URL y la API key pública de AppSync, está ignorado por Git y no requiere variables `VITE_*`.

Para desarrollo local:

```bash
npx ampx sandbox --once
npm run dev
```

## Arquitectura

```
Usuarios → Amplify Hosting (React + TS) → AppSync (GraphQL + Realtime)
                                            → Lambda (sesiones + lógica)
                                            → DynamoDB On-Demand
```

## Servicios AWS

| Servicio | Uso |
|----------|-----|
| AppSync | API GraphQL con suscripciones realtime |
| DynamoDB | Almacenamiento On-Demand (sin capacidad provisionada) |
| Lambda | Lógica de negocio (asignaciones, envío de cartas, etc.) |
| Amplify Hosting | Hosting estático + CI/CD |
| CloudWatch | Logs esenciales |

## Seguridad

- Autenticación sencilla con username, hash scrypt y tokens de sesión en DynamoDB
- AppSync usa API key pública; las mutaciones sensibles validan el token de sesión en Lambda
- Mínimo privilegio IAM en todos los roles
- `senderId` se obtiene de la sesión, nunca del frontend
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

El backend de producción usa la app Amplify `d3iagemp3niay5`. La cuenta/región debe estar inicializada una vez con CDK.

```bash
npx cdk bootstrap aws://ACCOUNT_ID/us-east-1
CI=1 npx ampx pipeline-deploy --branch main --app-id d3iagemp3niay5
```

Después, un push a `main` ejecuta GitHub Actions y Amplify Hosting. GitHub requiere `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` y `AWS_REGION`; `AMPLIFY_APP_ID` es opcional porque el workflow tiene el ID actual como valor predeterminado.

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
    useAuth.ts                # Hook de autenticación por sesión
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
  data/resource.ts            # Schema de AppSync + resolvers
  functions/                  # Lambda handlers
```

## Modelos DynamoDB

- `UserProfile` - Perfil público (username, starColor, posición)
- `UserCredential` - Username único y hash de contraseña, sin operaciones GraphQL públicas
- `Session` - Tokens de sesión, sin operaciones GraphQL públicas
- `Letter` - Cartas (COMMUNITY o DIRECT)
- `Connection` - Conexiones entre usuarios (letterCount, sin líneas duplicadas)
- `CommunityAssignment` - Asignación uno-a-uno para carta comunitaria (derangement)
- `Event` - Estado del evento (REGISTRATION_OPEN → ACTIVE → FINISHED)

## Licencia

MIT