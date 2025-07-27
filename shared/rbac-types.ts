export interface Application {
  appId: string;
  name: string;
  description: string;
  callbackUrls: string[];
  createdAt: string;
}

export interface UserGroup {
  userId: string;
  appId: string;
  groupId: string;
  assignedAt: string;
}

export interface GroupPermissions {
  appId: string;
  groupId: string;
  permissions: string[];
}

export interface UserWithGroups {
  id: string;
  email: string;
  givenName: string;
  familyName: string;
  groups: Array<{
    appId: string;
    groupId: string;
    permissions: string[];
  }>;
}