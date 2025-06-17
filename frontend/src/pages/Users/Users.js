import React from 'react';
import { Plus, User } from 'lucide-react';

const Users = () => {
    const users = [
        { id: 1, name: 'Admin User', email: 'admin@redcore360.com', role: 'Admin' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Manager' },
        { id: 3, name: 'John Doe', email: 'john@example.com', role: 'Staff' },
    ];
    
    const getRoleClass = (role) => {
        switch (role.toLowerCase()) {
            case 'admin': return 'bg-red-100 text-red-800';
            case 'manager': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600">Manage users and their roles.</p>
            </div>
            <button className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </button>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
            <ul className="divide-y divide-gray-200">
                {users.map(user => (
                    <li key={user.id} className="p-4 sm:p-6 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                                    <User className="h-6 w-6 text-gray-500"/>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                    <p className="text-sm text-gray-500">{user.email}</p>
                                </div>
                            </div>
                             <div className="flex items-center space-x-4">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleClass(user.role)}`}>
                                    {user.role}
                                </span>
                                <button className="text-red-600 hover:text-red-900 text-sm font-medium">Edit</button>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    </div>
  );
};

export default Users;
