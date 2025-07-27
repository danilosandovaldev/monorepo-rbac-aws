import React, { useState, useEffect } from 'react';

interface UserGroup {
  userId: string;
  appId: string;
  groupId: string;
  email: string;
}

interface Application {
  appId: string;
  name: string;
  description: string;
}

interface GroupPermission {
  appId: string;
  groupId: string;
  permissions: string[];
}

export const UserManagement: React.FC = () => {
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [groupPermissions, setGroupPermissions] = useState<GroupPermission[]>([]);
  const [selectedApp, setSelectedApp] = useState<string>('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserGroup, setNewUserGroup] = useState('');

  useEffect(() => {
    // Simular datos para demostración
    setApplications([
      { appId: 'app1', name: 'E-commerce App', description: 'Aplicación de comercio electrónico' },
      { appId: 'app2', name: 'Admin Dashboard', description: 'Panel de administración' }
    ]);

    setGroupPermissions([
      { appId: 'app1', groupId: 'customers', permissions: ['read:products', 'create:orders', 'read:orders'] },
      { appId: 'app1', groupId: 'admins', permissions: ['read:products', 'write:products', 'read:orders', 'write:orders', 'read:users'] },
      { appId: 'app2', groupId: 'operators', permissions: ['read:dashboard', 'read:reports'] },
      { appId: 'app2', groupId: 'admins', permissions: ['read:dashboard', 'write:dashboard', 'read:reports', 'write:reports', 'manage:users'] }
    ]);

    setUserGroups([
      { userId: 'user1', appId: 'app1', groupId: 'customers', email: 'customer@example.com' },
      { userId: 'user2', appId: 'app1', groupId: 'admins', email: 'admin@example.com' },
      { userId: 'user2', appId: 'app2', groupId: 'admins', email: 'admin@example.com' }
    ]);
  }, []);

  const getGroupsForApp = (appId: string) => {
    return groupPermissions.filter(gp => gp.appId === appId);
  };

  const getUsersForApp = (appId: string) => {
    return userGroups.filter(ug => ug.appId === appId);
  };

  const addUserToGroup = () => {
    if (newUserEmail && newUserGroup && selectedApp) {
      const newUser: UserGroup = {
        userId: `user${Date.now()}`,
        appId: selectedApp,
        groupId: newUserGroup,
        email: newUserEmail
      };
      setUserGroups([...userGroups, newUser]);
      setNewUserEmail('');
      setNewUserGroup('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Gestión de Usuarios RBAC</h1>

        {/* Selector de aplicación */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Seleccionar Aplicación</h2>
          <select
            value={selectedApp}
            onChange={(e) => setSelectedApp(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Selecciona una aplicación</option>
            {applications.map(app => (
              <option key={app.appId} value={app.appId}>
                {app.name} - {app.description}
              </option>
            ))}
          </select>
        </div>

        {selectedApp && (
          <>
            {/* Grupos y permisos */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Grupos y Permisos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getGroupsForApp(selectedApp).map(group => (
                  <div key={group.groupId} className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-2 capitalize">{group.groupId}</h3>
                    <div className="space-y-1">
                      {group.permissions.map(permission => (
                        <span
                          key={permission}
                          className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2 mb-1"
                        >
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Usuarios asignados */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Usuarios Asignados</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Grupo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Permisos
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getUsersForApp(selectedApp).map(user => {
                      const permissions = groupPermissions.find(
                        gp => gp.appId === selectedApp && gp.groupId === user.groupId
                      )?.permissions || [];
                      
                      return (
                        <tr key={`${user.userId}-${user.appId}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                            {user.groupId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex flex-wrap gap-1">
                              {permissions.map(permission => (
                                <span
                                  key={permission}
                                  className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
                                >
                                  {permission}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Agregar usuario */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Agregar Usuario al Grupo</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="email"
                  placeholder="Email del usuario"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <select
                  value={newUserGroup}
                  onChange={(e) => setNewUserGroup(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Seleccionar grupo</option>
                  {getGroupsForApp(selectedApp).map(group => (
                    <option key={group.groupId} value={group.groupId}>
                      {group.groupId}
                    </option>
                  ))}
                </select>
                <button
                  onClick={addUserToGroup}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium"
                >
                  Agregar Usuario
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};