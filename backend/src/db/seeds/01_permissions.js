export async function seed(knex) {
  // Deletes ALL existing entries in role_permissions first to prevent foreign key errors,
  // but we can just do insert ... on conflict do nothing or ignore.
  // We'll clean up role_permissions and user_roles in seed or use insert ignore.
  
  const permissionsList = [
    // Users Management Module
    { id: 'users:read', name: 'Read Users', description: 'Allows viewing users list and details', module: 'Users' },
    { id: 'users:create', name: 'Create Users', description: 'Allows creating new users', module: 'Users' },
    { id: 'users:update', name: 'Update Users', description: 'Allows updating user profiles, statuses, and role assignments', module: 'Users' },
    { id: 'users:delete', name: 'Delete Users', description: 'Allows deleting users from the tenant', module: 'Users' },

    // Roles Management Module
    { id: 'roles:read', name: 'Read Roles', description: 'Allows viewing roles and their permissions', module: 'Roles' },
    { id: 'roles:create', name: 'Create Roles', description: 'Allows creating custom roles and assigning permissions', module: 'Roles' },
    { id: 'roles:update', name: 'Update Roles', description: 'Allows updating custom roles and modifying their permissions', module: 'Roles' },
    { id: 'roles:delete', name: 'Delete Roles', description: 'Allows deleting custom roles', module: 'Roles' },

    // Audit Logs Module
    { id: 'audit:read', name: 'Read Audit Logs', description: 'Allows viewing security and action logs', module: 'Audit Logs' },

    // Tenant & Settings Module
    { id: 'tenant:update', name: 'Update Tenant Settings', description: 'Allows updating organization details and configuration', module: 'Tenant Settings' }
  ];

  // Insert or update permissions
  for (const perm of permissionsList) {
    const existing = await knex('permissions').where('id', perm.id).first();
    if (existing) {
      await knex('permissions').where('id', perm.id).update(perm);
    } else {
      await knex('permissions').insert(perm);
    }
  }
}
