import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Header from '../components/Header';
import Modal from '../components/Modal';
import { 
  ShieldCheck, 
  Plus, 
  Edit, 
  Trash2, 
  AlertCircle, 
  Check, 
  ShieldAlert,
  Info
} from 'lucide-react';

export default function RolesPage() {
  const { hasPermission } = useAuth();

  // State
  const [roles, setRoles] = useState([]);
  const [permissionsList, setPermissionsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Selected/Form states
  const [selectedRole, setSelectedRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissionIds: []
  });

  const canCreate = hasPermission('roles:create');
  const canUpdate = hasPermission('roles:update');
  const canDelete = hasPermission('roles:delete');

  useEffect(() => {
    fetchRolesAndPermissions();
  }, []);

  async function fetchRolesAndPermissions() {
    setLoading(true);
    try {
      const rolesRes = await api.get('/roles');
      setRoles(rolesRes.data);

      const permsRes = await api.get('/roles/permissions');
      setPermissionsList(permsRes.data);
    } catch (err) {
      console.error('Failed to load roles page data:', err);
    } finally {
      setLoading(false);
    }
  }

  // Group permissions by module
  const groupedPermissions = permissionsList.reduce((acc, perm) => {
    const mod = perm.module || 'System';
    acc[mod] = acc[mod] || [];
    acc[mod].push(perm);
    return acc;
  }, {});

  // Form helpers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePermissionToggle = (permId) => {
    setFormData(prev => {
      const alreadyChecked = prev.permissionIds.includes(permId);
      return {
        ...prev,
        permissionIds: alreadyChecked 
          ? prev.permissionIds.filter(id => id !== permId) 
          : [...prev.permissionIds, permId]
      };
    });
  };

  // Open Create
  const handleOpenCreate = () => {
    setFormData({ name: '', description: '', permissionIds: [] });
    setActionError('');
    setActionSuccess('');
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setActionError('');
    try {
      await api.post('/roles', formData);
      setActionSuccess('Role successfully created!');
      setTimeout(() => {
        setIsCreateOpen(false);
        fetchRolesAndPermissions();
      }, 1500);
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to create role.');
    }
  };

  // Open Edit
  const handleOpenEdit = (roleToEdit) => {
    setSelectedRole(roleToEdit);
    setFormData({
      name: roleToEdit.name,
      description: roleToEdit.description || '',
      permissionIds: roleToEdit.permissions
    });
    setActionError('');
    setActionSuccess('');
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setActionError('');
    try {
      await api.put(`/roles/${selectedRole.id}`, {
        name: selectedRole.is_system ? undefined : formData.name, // don't send name for system roles
        description: formData.description,
        permissionIds: selectedRole.name === 'Owner' ? undefined : formData.permissionIds // Owner permissions are static
      });
      setActionSuccess('Role updated successfully!');
      setTimeout(() => {
        setIsEditOpen(false);
        fetchRolesAndPermissions();
      }, 1500);
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to update role.');
    }
  };

  // Open Delete
  const handleOpenDelete = (roleToDelete) => {
    setSelectedRole(roleToDelete);
    setActionError('');
    setIsDeleteOpen(true);
  };

  const handleDeleteSubmit = async () => {
    setActionError('');
    try {
      await api.delete(`/roles/${selectedRole.id}`);
      setIsDeleteOpen(false);
      fetchRolesAndPermissions();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to delete role.');
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
      <Header title="Roles & Security Permissions" />

      <main className="flex-1 overflow-y-auto p-8 space-y-6">
        {/* Info card */}
        <div className="p-4 rounded-xl bg-brand-500/5 border border-brand-500/10 flex gap-3 text-sm text-slate-300">
          <Info className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-brand-300">Dynamic RBAC Registry:</span> Custom roles created here apply instantly to any assigned team member. System-defined roles (Owner, Admin, Member, Viewer) have established base schemas that protect tenant structures.
          </div>
        </div>

        {/* Action bar */}
        <div className="flex justify-between items-center">
          <h3 className="text-base font-bold font-outfit text-white tracking-wide">Available System Roles</h3>
          {canCreate && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 transition-all duration-200 shadow-glow"
            >
              <Plus className="w-4.5 h-4.5" />
              <span>Create Custom Role</span>
            </button>
          )}
        </div>

        {/* Roles Cards Grid */}
        {loading ? (
          <div className="py-20 text-center text-slate-500">Loading roles schema...</div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {roles.map((role) => (
              <div 
                key={role.id} 
                className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-glass flex flex-col justify-between hover:border-slate-700/60 transition-all duration-200"
              >
                <div>
                  {/* Title Bar */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h4 className="text-lg font-bold font-outfit text-white tracking-wide">{role.name}</h4>
                        {role.is_system ? (
                          <span className="inline-flex px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            System Role
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-brand-500/10 text-brand-400 border border-brand-500/20">
                            Custom Role
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 font-mono mt-1 select-all">{role.id}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {canUpdate && (
                        <button
                          onClick={() => handleOpenEdit(role)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-400 hover:bg-slate-800 transition-all"
                          title="Edit Role Schema"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      
                      {canDelete && !role.is_system && (
                        <button
                          onClick={() => handleOpenDelete(role)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all"
                          title="Delete Custom Role"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-400 leading-relaxed mb-4">{role.description || 'No description provided.'}</p>
                </div>

                {/* Permissions tag list */}
                <div>
                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">Permissions Coverage</h5>
                  <div className="flex flex-wrap gap-1.5">
                    {role.name === 'Owner' ? (
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                        * All System Permissions Granted
                      </span>
                    ) : role.permissions.length === 0 ? (
                      <span className="text-xs text-slate-600 italic">No permissions assigned.</span>
                    ) : (
                      role.permissions.map((perm) => (
                        <span 
                          key={perm} 
                          className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700/60"
                        >
                          {perm}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* CREATE ROLE MODAL */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Custom Role">
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
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Role Name</label>
            <input
              type="text"
              name="name"
              required
              placeholder="e.g. Content Moderator"
              value={formData.name}
              onChange={handleInputChange}
              className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm font-medium transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</label>
            <textarea
              name="description"
              rows={2}
              placeholder="Describe scope of authority..."
              value={formData.description}
              onChange={handleInputChange}
              className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm font-medium transition-all duration-200 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Assign Permissions</label>
            <div className="space-y-4 max-h-60 overflow-y-auto p-3 bg-slate-950 border border-slate-800 rounded-xl">
              {Object.keys(groupedPermissions).map((moduleName) => (
                <div key={moduleName} className="space-y-1.5">
                  <h6 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-900 pb-1">{moduleName}</h6>
                  <div className="grid grid-cols-1 gap-2 pl-1">
                    {groupedPermissions[moduleName].map((perm) => (
                      <label 
                        key={perm.id} 
                        className="flex items-start gap-2.5 cursor-pointer text-slate-300 hover:text-slate-100 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={formData.permissionIds.includes(perm.id)}
                          onChange={() => handlePermissionToggle(perm.id)}
                          className="mt-0.5 rounded border-slate-800 text-brand-600 focus:ring-brand-500 bg-slate-900"
                        />
                        <div>
                          <p className="text-xs font-semibold">{perm.name}</p>
                          <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{perm.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full flex justify-center py-2.5 px-4 rounded-xl border border-transparent text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 transition-all duration-200 shadow-glow"
            >
              Save Custom Role
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT ROLE MODAL */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Edit Role: ${selectedRole?.name}`}>
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
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Role Name</label>
            <input
              type="text"
              name="name"
              required
              disabled={selectedRole?.is_system}
              placeholder="e.g. Content Moderator"
              value={formData.name}
              onChange={handleInputChange}
              className={`block w-full px-4 py-2.5 border rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none text-sm font-medium transition-all duration-200 ${
                selectedRole?.is_system 
                  ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed' 
                  : 'bg-slate-950 border-slate-800 focus:ring-2 focus:ring-brand-500 focus:border-brand-500'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</label>
            <textarea
              name="description"
              rows={2}
              placeholder="Describe scope of authority..."
              value={formData.description}
              onChange={handleInputChange}
              className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm font-medium transition-all duration-200 resize-none"
            />
          </div>

          {selectedRole?.name === 'Owner' ? (
            <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/15 flex gap-2.5 text-xs text-indigo-300">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 text-indigo-400" />
              <span>The Owner role represents absolute control over the organization tenant. Its permissions cannot be modified.</span>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Configure Permissions</label>
              <div className="space-y-4 max-h-60 overflow-y-auto p-3 bg-slate-950 border border-slate-800 rounded-xl">
                {Object.keys(groupedPermissions).map((moduleName) => (
                  <div key={moduleName} className="space-y-1.5">
                    <h6 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-900 pb-1">{moduleName}</h6>
                    <div className="grid grid-cols-1 gap-2 pl-1">
                      {groupedPermissions[moduleName].map((perm) => (
                        <label 
                          key={perm.id} 
                          className="flex items-start gap-2.5 cursor-pointer text-slate-300 hover:text-slate-100 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={formData.permissionIds.includes(perm.id)}
                            onChange={() => handlePermissionToggle(perm.id)}
                            className="mt-0.5 rounded border-slate-800 text-brand-600 focus:ring-brand-500 bg-slate-900"
                          />
                          <div>
                            <p className="text-xs font-semibold">{perm.name}</p>
                            <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{perm.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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

      {/* DELETE CONFIRMATION MODAL */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Custom Role">
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
              <p className="font-semibold text-red-300">Are you sure?</p>
              <p className="mt-1 text-slate-400 leading-relaxed">
                This will delete the custom role <span className="font-bold text-white">{selectedRole?.name}</span>. 
                This action cannot be completed if this role is currently assigned to users.
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
