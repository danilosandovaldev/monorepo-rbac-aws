export interface User {
  id: string;
  email: string;
  name: string;
  appId: string;
  groupId: string;
  permissions: string[];
}

export interface AuthTokens {
  access_token: string;
  id_token: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}