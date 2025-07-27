# Monorepo RBAC AWS - Servicio de Autenticación para Aplicaciones Externas

Servicio de autenticación y autorización RBAC que permite a aplicaciones externas integrar autenticación segura mediante callbacks OAuth2.

## Arquitectura

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: AWS AppSync (GraphQL) + API Gateway + Lambda (inline en CDK)
- **Autenticación**: AWS Cognito con OAuth2
- **Autorización**: Amazon Verified Permissions (AVP)
- **Infraestructura**: AWS CDK

## Estructura del Proyecto

```text
monorepo-rbac-aws/
├── infra/          # Infraestructura como código (CDK)
│   ├── lib/        # Stacks: Auth, AVP, AppSync, CallbackApi
│   └── bin/        # Punto de entrada CDK
├── frontend/       # Aplicación React/TypeScript
│   ├── src/pages/  # Vistas: SignIn, SignUp, Callback, ExternalAuth
│   └── src/hooks/  # Hook de autenticación
├── shared/         # Tipos TypeScript compartidos
└── package.json    # Configuración del workspace
```

## Funcionalidades Principales

### 🔐 Servicio de Autenticación Externa

- **OAuth2 Authorization Code Flow**
- **Callbacks automáticos** a aplicaciones externas
- **Verificación de tokens JWT**
- **Gestión de estados personalizados**

### 🎯 Para Aplicaciones Externas

- **Integración simple** con 2 endpoints
- **Tokens JWT seguros** con información contextual
- **Grupos de usuarios por aplicación**
- **Permisos específicos por aplicación**
- **Identificación automática de aplicación**
- **Soporte para múltiples aplicaciones**

## Flujo de Integración

### 1. Redirigir a Autenticación

```javascript
const authUrl = `https://rbac-auth-service.auth.us-east-1.amazoncognito.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&response_type=code&scope=email+openid+profile&redirect_uri=https://tu-app.com/callback&state=optional-state`;

window.location.href = authUrl;
```

### 2. Recibir Callback

Tu aplicación recibirá:

```text
https://tu-app.com/callback?code=AUTH_CODE&state=optional-state
```

### 3. Intercambiar por Tokens

```javascript
const response = await fetch(`${CALLBACK_API_URL}/callback?code=${code}&redirect_uri=${redirect_uri}`);
const { access_token, id_token, user } = await response.json();
```

### 4. Verificar Tokens

```javascript
const response = await fetch(`${CALLBACK_API_URL}/verify`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'X-App-Id': 'your-app-id' // Opcional, se detecta automáticamente
  }
});
const { valid, user } = await response.json();
```

## Endpoints de la API

### `GET /callback`

Procesa el código de autorización y retorna tokens.

**Parámetros:**

- `code`: Código de autorización de Cognito
- `redirect_uri`: URL de callback de tu aplicación
- `state`: Estado opcional

**Respuesta:**

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "id_token": "eyJhbGciOiJSUzI1NiIs...",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "Usuario Ejemplo",
    "appId": "app1",
    "groupId": "customers",
    "permissions": ["read:products", "create:orders"]
  }
}
```

### `POST /verify`

Verifica la validez de un token JWT.

**Headers:**

- `Authorization: Bearer <token>`
- `X-App-Id: <app-id>` (opcional)

**Respuesta:**

```json
{
  "valid": true,
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "Usuario Ejemplo",
    "appId": "app1",
    "groupId": "customers",
    "permissions": ["read:products", "create:orders", "read:orders"]
  }
}
```

## Configuración

### 1. Desplegar Infraestructura

```bash
cd infra
npm install
npm run deploy
```

### 2. Configurar Variables de Entorno

```env
VITE_USER_POOL_ID=us-east-1_xxxxxxxxx
VITE_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_AUTH_URL=https://rbac-auth-service.auth.us-east-1.amazoncognito.com
VITE_CALLBACK_API_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod
```

### 3. Configurar URLs de Callback

En el AuthStack, agregar las URLs de tus aplicaciones:

```typescript
callbackUrls: [
  'https://tu-app.com/callback',
  'https://otra-app.com/auth/callback'
],
logoutUrls: [
  'https://tu-app.com/logout',
  'https://otra-app.com/auth/logout'
]
```

## Ejemplo de Integración Completa

### JavaScript/React

```javascript
class AuthService {
  constructor(config) {
    this.authUrl = config.authUrl;
    this.callbackApiUrl = config.callbackApiUrl;
    this.clientId = config.clientId;
    this.redirectUri = config.redirectUri;
  }

  // Iniciar autenticación
  login(state = null) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      scope: 'email openid profile',
      redirect_uri: this.redirectUri,
      ...(state && { state })
    });

    window.location.href = `${this.authUrl}/oauth2/authorize?${params}`;
  }

  // Procesar callback
  async handleCallback(code, state) {
    const response = await fetch(
      `${this.callbackApiUrl}/callback?code=${code}&redirect_uri=${this.redirectUri}&state=${state}`
    );
    return response.json();
  }

  // Verificar token
  async verifyToken(token) {
    const response = await fetch(`${this.callbackApiUrl}/verify`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }
}
```

## Características RBAC Multi-Aplicación

### 🏢 **Gestión de Aplicaciones**

- Registro automático de aplicaciones por callback URL
- Configuración independiente de permisos por app
- Aislamiento de datos entre aplicaciones

### 👥 **Grupos de Usuarios**

- Usuarios pueden pertenecer a diferentes grupos por aplicación
- Ejemplo: `admin` en App1, `user` en App2
- Gestión granular de membresías

### 🔐 **Permisos Contextuales**

- Permisos específicos por aplicación y grupo
- Formato: `action:resource` (ej: `read:products`, `write:orders`)
- Verificación automática con Amazon Verified Permissions

### 📊 **Ejemplos de Configuración**

**App1 (E-commerce):**

- `customers`: `read:products`, `create:orders`, `read:orders`
- `admins`: `read:products`, `write:products`, `read:orders`, `write:orders`

**App2 (Dashboard):**

- `operators`: `read:dashboard`, `read:reports`
- `admins`: `read:dashboard`, `write:dashboard`, `manage:users`

## Seguridad

- ✅ Tokens JWT firmados por Cognito
- ✅ Verificación de audiencia y emisor
- ✅ CORS configurado
- ✅ HTTPS obligatorio
- ✅ Estados personalizados para prevenir CSRF
- ✅ Aislamiento de permisos por aplicación
- ✅ Políticas AVP dinámicas

## Scripts Disponibles

- `npm run build` - Construir todos los proyectos
- `npm run deploy` - Desplegar infraestructura
- `npm run dev` - Ejecutar frontend en desarrollo

## Licencia

MIT
