export interface User {
  id: string;
  email: string;
  givenName: string;
  familyName: string;
  role?: string;
  permissions?: string[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface SignUpData {
  email: string;
  password: string;
  givenName: string;
  familyName: string;
}

export interface ResetPasswordData {
  email: string;
}