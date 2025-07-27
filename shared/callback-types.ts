export interface CallbackRequest {
  code: string;
  state?: string;
  redirect_uri: string;
}

export interface CallbackResponse {
  access_token: string;
  id_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    appId: string;
    groupId: string;
    permissions: string[];
  };
}

export interface VerifyTokenRequest {
  token: string;
}

export interface VerifyTokenResponse {
  valid: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    appId: string;
    groupId: string;
    permissions: string[];
  };
  error?: string;
}

export interface ExternalAppConfig {
  clientId: string;
  redirectUri: string;
  scopes: string[];
  state?: string;
}

export interface AuthorizationUrlParams {
  client_id: string;
  response_type: 'code';
  scope: string;
  redirect_uri: string;
  state?: string;
}