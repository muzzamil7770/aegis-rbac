import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Header from '../components/Header';
import Modal from '../components/Modal';
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  AlertCircle, 
  Check, 
  Search,
  UserCheck,
  UserX
} from 'lucide-react';

export default function UsersPage() {
  const { user: currentUser, hasPermission } = useAuth();

  // State
  const [users, setUsers] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Selected/Form states
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roleIds: []
  });

  // Permissions checks
  const canCreate = hasPermission('users:create');
  const canUpdate = hasPermission('users:update');
  const canDelete = hasPermission('users:delete');

  useEffect(() => {
    fetchUsersAndRoles();
  }, []);

  async function fetchUsersAndRoles() {
    setLoading(true);
    try {
      const usersRes = await api.get('/users');
      setUsers(usersRes.data);

      if (hasPermission('roles:read')) {
        const rolesRes = await api.get('/roles');
        setRolesList(rolesRes.data);
      }
    } catch (err) {
      console.error('Failed to load users page data:', err);
    } finally {
      setLoading(false);
    }
  }

  // Handle inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleToggle = (roleId) => {
    setFormData(prev => {
      const alreadyChecked = prev.roleIds.includes(roleId);
      return {
        ...prev,
        roleIds: alreadyChecked 
          ? prev.roleIds.filter(id => id !== roleId) 
          : [...prev.roleIds, roleId]
      };
    });
  };

  // Create
  const handleOpenCreate = () => {
    setFormData({ name: '', email: '', password: '', roleIds: [] });
    setActionError('');
    setActionSuccess('');
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setActionError('');
    try {
      await api.post('/users', formData);
      setActionSuccess('User successfully created!');
      setTimeout(() => {
        setIsCreateOpen(false);
        fetchUsersAndRoles();
      }, 1500);
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to create user.');
    }
  };

  // Edit
  const handleOpenEdit = (userToEdit) => {
    setSelectedUser(userToEdit);
    setFormData({
      name: userToEdit.name,
      email: userToEdit.email,
      password: '', // blank password unless resetting
      status: userToEdit.status,
      roleIds: userToEdit.roles.map(r => r.id)
    });
    setActionError('');
    setActionSuccess('');
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setActionError('');
    try {
      await api.put(`/users/${selectedUser.id}`, {
        name: formData.name,
        status: formData.status,
        roleIds: formData.roleIds,
        password: formData.password || undefined // send only if resetting
      });
      setActionSuccess('User updated successfully!');
      setTimeout(() => {
        setIsEditOpen(false);
        fetchUsersAndRoles();
      }, 1500);
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to update user.');
    }
  };

  // Delete
  const handleOpenDelete = (userToDelete) => {
    setSelectedUser(userToDelete);
    setActionError('');
    setIsDeleteOpen(true);
  };

  const handleDeleteSubmit = async () => {
    setActionError('');
    try {
      await api.delete(`/users/${selectedUser.id}`);
      setIsDeleteOpen(false);
      fetchUsersAndRoles();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to delete user.');
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
      <Header title="Users Management" />

      <main className="flex-1 overflow-y-auto p-8 space-y-6">
        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          {/* Search */}
          <div className="relative max-w-md w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Search team members by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm font-medium transition-all duration-200"
            />
          </div>

          {/* Add user button */}
          {canCreate && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 transition-all duration-200 shadow-glow"
            >
              <UserPlus className="w-4.5 h-4.5" />
              <span>Add User</span>
            </button>
          )}
        </div>

        {/* Table Panel */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-glass overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-slate-500">Loading user registry database...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-20 text-center text-slate-500">
              <Users className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="font-semibold text-slate-400">No users found</p>
              <p className="text-xs text-slate-600 mt-1">Try refining your search keyword.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/40 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Name / ID</th>
                    <th className="px-6 py-4">Email Address</th>
                    <th className="px-6 py-4">Assigned Roles</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                  {filteredUsers.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/10 transition-colors">
                      {/* Name / Avatar */}
                      <td className="px-6 py-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-brand-600/10 border border-brand-500/20 text-brand-400 flex items-center justify-center font-bold font-outfit uppercase">
                          {item.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-100">{item.name}</p>
                          <p className="text-[10px] text-slate-600 font-mono select-all mt-0.5">{item.id}</p>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 font-medium">{item.email}</td>

                      {/* Roles */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {item.roles.length === 0 ? (
                            <span className="text-xs text-slate-600 italic">No Roles Assigned</span>
                          ) : (
                            item.roles.map((role) => (
                              <span 
                                key={role.id} 
                                className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-500/15 border border-brand-500/25 text-brand-400"
                              >
                                {role.name}
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          item.status === 'active' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {item.status === 'active' ? (
                            <UserCheck className="w-3 h-3" />
                          ) : (
                            <UserX className="w-3 h-3" />
                          )}
                          <span className="capitalize">{item.status}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canUpdate && (
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-2 rounded-lg text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 hover:border-brand-500/20 border border-transparent transition-all"
                              title="Edit User"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              onClick={() => handleOpenDelete(item)}
                              disabled={item.id === currentUser.userId}
                              className={`p-2 rounded-lg border border-transparent transition-all ${
                                item.id === currentUser.userId
                                  ? 'text-slate-700 cursor-not-allowed'
                                  : 'text-slate-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20'
                              }`}
                              title={item.id === currentUser.userId ? "Cannot delete yourself" : "Delete User"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* CREATE USER MODAL */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add New User">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {actionSuccess && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-2 text-sm font-semibold">
              <Check className="w-5 h-5 flex-shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}
          {actionError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-2 text-sm font-semibold">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Name</label>
            <input
              type="text"
              name="name"
              required
              placeholder="Full Name"
              value={formData.name}
              onChange={handleInputChange}
              className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm font-medium transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
            <input
              type="email"
              name="email"
              required
              placeholder="user@organization.com"
              value={formData.email}
              onChange={handleInputChange}
              className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm font-medium transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
            <input
              type="password"
              name="password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={handleInputChange}
              className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm font-medium transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Assign Access Roles</label>
            {rolesList.length === 0 ? (
              <p className="text-xs text-slate-600 italic">No roles available in tenant.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto p-1 bg-slate-950 border border-slate-800 rounded-xl">
                {rolesList.map((role) => (
                  <label 
                    key={role.id} 
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800/40 cursor-pointer text-slate-300 text-xs font-semibold"
                  >
                    <input
                      type="checkbox"
                      checked={formData.roleIds.includes(role.id)}
                      onChange={() => handleRoleToggle(role.id)}
                      className="rounded border-slate-800 text-brand-600 focus:ring-brand-500 bg-slate-900"
                    />
                    <span>{role.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full flex justify-center py-2.5 px-4 rounded-xl border border-transparent text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 transition-all duration-200 shadow-glow"
            >
              Save User
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT USER MODAL */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Edit: ${selectedUser?.name}`}>
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {actionSuccess && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-2 text-sm font-semibold">
              <Check className="w-5 h-5 flex-shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}
          {actionError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-2 text-sm font-semibold">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Name</label>
            <input
              type="text"
              name="name"
              required
              placeholder="Full Name"
              value={formData.name}
              onChange={handleInputChange}
              className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm font-medium transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm font-medium transition-all duration-200"
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Reset Password (Optional)</label>
            <input
              type="password"
              name="password"
              placeholder="Enter new password to reset"
              value={formData.password}
              onChange={handleInputChange}
              className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm font-medium transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Assigned Access Roles</label>
            <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto p-1 bg-slate-950 border border-slate-800 rounded-xl">
              {rolesList.map((role) => (
                <label 
                  key={role.id} 
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800/40 cursor-pointer text-slate-300 text-xs font-semibold"
                >
                  <input
                    type="checkbox"
                    checked={formData.roleIds.includes(role.id)}
                    onChange={() => handleRoleToggle(role.id)}
                    className="rounded border-slate-800 text-brand-600 focus:ring-brand-500 bg-slate-900"
                  />
                  <span>{role.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full flex justify-center py-2.5 px-4 rounded-xl border border-transparent text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 transition-all duration-200 shadow-glow"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE USER CONFIRMATION MODAL */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete User Account">
        <div className="space-y-4">
          {actionError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-2 text-sm font-semibold">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 text-slate-300 text-sm flex gap-3">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-300">Are you absolutely sure?</p>
              <p className="mt-1 text-slate-400 leading-relaxed">
                This will delete the user account for <span className="font-bold text-white">{selectedUser?.name}</span> ({selectedUser?.email}). 
                This action is irreversible. All current session keys will be revoked immediately.
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              onClick={() => setIsDeleteOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-slate-200 bg-slate-800/40 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteSubmit}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-500 transition-all duration-200 shadow-glow"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
