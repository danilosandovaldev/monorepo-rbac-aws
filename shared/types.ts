export interface User {
  id: string;
  email: string;
  givenName: string;
  familyName: string;
  role?: string;
  permissions?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
}

export interface AuthContext {
  user: User | null;
  isAuthenticated: boolean;
  token?: string;
}

export interface AVPRequest {
  principal: {
    entityType: string;
    entityId: string;
  };
  action: {
    actionType: string;
    actionId: string;
  };
  resource: {
    entityType: string;
    entityId: string;
  };
}

export interface AVPResponse {
  decision: 'ALLOW' | 'DENY';
  determining_policies?: string[];
  errors?: string[];
}