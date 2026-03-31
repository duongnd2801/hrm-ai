'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  isActive: boolean;
}

interface PageResponse {
  content: User[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRole, setNewRole] = useState('EMPLOYEE');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/users', {
        params: { page, size: 20 },
      });
      setUsers(response.data.content || []);
      setTotalPages(response.data.totalPages || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchEmail.trim()) {
      fetchUsers();
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/users/search', {
        params: { email: searchEmail, page: 0, size: 20 },
      });
      setUsers(response.data.content || []);
      setTotalPages(response.data.totalPages || 0);
      setPage(0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!window.confirm('Reset password for this user to default (Emp@123)?')) return;

    try {
      await api.post(`/api/users/${userId}/reset-password`);
      setSuccess('Password reset successfully');
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password');
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;

    try {
      await api.put(`/api/users/${selectedUser.id}/role`, { role: newRole });
      setSuccess('Role updated successfully');
      setShowRoleModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!window.confirm(`Delete user ${email}? This action cannot be undone.`)) return;

    try {
      await api.delete(`/api/users/${userId}`);
      setSuccess('User deleted successfully');
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      case 'HR':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'MANAGER':
        return 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="min-h-screen px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">User Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage user accounts, roles, and permissions</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-700 dark:text-red-200 font-bold">✕</button>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-200 rounded-lg">
          {success}
          <button onClick={() => setSuccess('')} className="ml-2 text-green-700 dark:text-green-200 font-bold">✕</button>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-8 flex gap-4">
        <input
          type="email"
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          placeholder="Search by email..."
          className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
        />
        <button
          onClick={handleSearch}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
        >
          Search
        </button>
        <button
          onClick={() => {
            setSearchEmail('');
            setPage(0);
            fetchUsers();
          }}
          className="px-6 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition font-semibold"
        >
          Clear
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">No users found</div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-700 dark:text-gray-300 font-semibold">Email</th>
                  <th className="px-6 py-3 text-left text-gray-700 dark:text-gray-300 font-semibold">Role</th>
                  <th className="px-6 py-3 text-left text-gray-700 dark:text-gray-300 font-semibold">Created At</th>
                  <th className="px-6 py-3 text-left text-gray-700 dark:text-gray-300 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-gray-900 dark:text-white">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setNewRole(user.role);
                          setShowRoleModal(true);
                        }}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition"
                      >
                        Change Role
                      </button>
                      <button
                        onClick={() => handleResetPassword(user.id)}
                        className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition"
                      >
                        Reset Pass
                      </button>
                      {user.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {page + 1} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-500 disabled:opacity-50 transition"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-500 disabled:opacity-50 transition"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Role Update Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Change Role</h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">User: {selectedUser.email}</p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="ADMIN">ADMIN</option>
                <option value="HR">HR</option>
                <option value="MANAGER">MANAGER</option>
                <option value="EMPLOYEE">EMPLOYEE</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleUpdateRole}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition"
              >
                Update
              </button>
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedUser(null);
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
