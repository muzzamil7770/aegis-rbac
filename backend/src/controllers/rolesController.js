import crypto from 'crypto';
import db from '../db/index.js';
import * as auditLogger from '../services/auditLogger.js';

/**
 * List all roles for the tenant, including their mapped permissions
 */
export async function listRoles(req, res) {
  const { tenantId } = req.user;

  try {
    const rolesList = await db('roles')
      .where('tenant_id', tenantId)
      .select('id', 'name', 'description', 'is_system', 'created_at');

    const roleIds = rolesList.map(r => r.id);
    let permMappings = [];
    if (roleIds.length > 0) {
      permMappings = await db('role_permissions')
        .whereIn('role_id', roleIds)
        .select('role_id', 'permission_id');
    }

    const rolesWithPermissions = rolesList.map((role) => {
      const permissions = permMappings
        .filter(m => m.role_id === role.id)
        .map(m => m.permission_id);
      return { ...role, permissions };
    });

    res.json(rolesWithPermissions);
  } catch (error) {
    console.error('List roles error:', error);
    res.status(500).json({ error: 'Failed to retrieve tenant roles.' });
  }
}

/**
 * Get all available permissions in the system
 */
export async function getPermissions(req, res) {
  try {
    const permissions = await db('permissions').select('id', 'name', 'description', 'module');
    res.json(permissions);
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({ error: 'Failed to retrieve system permissions.' });
  }
}

/**
 * Create a new custom role for the tenant
 */
export async function createRole(req, res) {
  const { tenantId } = req.user;
  const { name, description, permissionIds = [] } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Role name is required.' });
  }

  const normalizedName = name.trim();

  try {
    // Check if role name already exists in tenant
    const existingRole = await db('roles')
      .where({ tenant_id: tenantId })
      .whereRaw('LOWER(name) = ?', [normalizedName.toLowerCase()])
      .first();

    if (existingRole) {
      return res.status(409).json({ error: 'A role with this name already exists in your organization.' });
    }

    // Verify all permissionIds exist in system
    if (permissionIds.length > 0) {
      const validPerms = await db('permissions')
        .whereIn('id', permissionIds)
        .select('id');
      
      if (validPerms.length !== permissionIds.length) {
        return res.status(400).json({ error: 'One or more assigned permissions are invalid.' });
      }
    }

    const roleId = crypto.randomUUID();

    await db.transaction(async (trx) => {
      // 1. Insert role
      await trx('roles').insert({
        id: roleId,
        tenant_id: tenantId,
        name: normalizedName,
        description: description ? description.trim() : null,
        is_system: false,
        created_at: new Date(),
        updated_at: new Date()
      });

      // 2. Insert role permission mappings
      if (permissionIds.length > 0) {
        const mappings = permissionIds.map((pId) => ({
          role_id: roleId,
          permission_id: pId
        }));
        await trx('role_permissions').insert(mappings);
      }

      // 3. Log event
      auditLogger.logEvent({
        tenantId,
        userId: req.user.userId,
        userEmail: req.user.email,
        action: 'role.create',
        resource: 'roles',
        resourceId: roleId,
        status: 'success',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        payload: { name: normalizedName, description, permissionIds }
      });
    });

    res.status(201).json({ id: roleId, name: normalizedName, description, is_system: false, permissions: permissionIds });
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({ error: 'Failed to create role.' });
  }
}

/**
 * Update an existing role in the tenant
 */
export async function updateRole(req, res) {
  const { tenantId } = req.user;
  const { id } = req.params;
  const { name, description, permissionIds } = req.body;

  try {
    // 1. Resolve role
    const targetRole = await db('roles').where({ tenant_id: tenantId, id }).first();
    if (!targetRole) {
      return res.status(404).json({ error: 'Role not found in this organization.' });
    }

    // 2. Strict checks on System Roles
    if (targetRole.is_system) {
      if (name && name.trim().toLowerCase() !== targetRole.name.toLowerCase()) {
        return res.status(400).json({ error: 'Cannot rename system-defined roles.' });
      }
      if (targetRole.name === 'Owner') {
        return res.status(400).json({ error: 'The permissions of the Owner role are absolute and cannot be modified.' });
      }
    }

    // 3. Validate permissionIds if provided
    if (permissionIds && permissionIds.length > 0) {
      const validPerms = await db('permissions')
        .whereIn('id', permissionIds)
        .select('id');
      
      if (validPerms.length !== permissionIds.length) {
        return res.status(400).json({ error: 'One or more assigned permissions are invalid.' });
      }
    }

    const updates = {};
    if (name !== undefined && !targetRole.is_system) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();
    updates.updated_at = new Date();

    await db.transaction(async (trx) => {
      // 1. Update role details
      if (Object.keys(updates).length > 0) {
        await trx('roles').where({ id }).update(updates);
      }

      // 2. Update permissions if specified
      if (permissionIds !== undefined) {
        // Delete current permission associations
        await trx('role_permissions').where('role_id', id).del();

        // Insert new associations
        if (permissionIds.length > 0) {
          const mappings = permissionIds.map((pId) => ({
            role_id: id,
            permission_id: pId
          }));
          await trx('role_permissions').insert(mappings);
        }
      }

      // 3. Log event
      auditLogger.logEvent({
        tenantId,
        userId: req.user.userId,
        userEmail: req.user.email,
        action: 'role.update',
        resource: 'roles',
        resourceId: id,
        status: 'success',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        payload: {
          name: name !== undefined ? name : targetRole.name,
          description: description !== undefined ? description : targetRole.description,
          permissionsChanged: permissionIds !== undefined,
          permissionIds
        }
      });
    });

    res.json({ message: 'Role updated successfully.' });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Failed to update role.' });
  }
}

/**
 * Delete a role from the tenant
 */
export async function deleteRole(req, res) {
  const { tenantId } = req.user;
  const { id } = req.params;

  try {
    // 1. Resolve role
    const targetRole = await db('roles').where({ tenant_id: tenantId, id }).first();
    if (!targetRole) {
      return res.status(404).json({ error: 'Role not found in this organization.' });
    }

    // 2. Enforce that system roles cannot be deleted
    if (targetRole.is_system) {
      return res.status(400).json({ error: 'System-defined roles cannot be deleted.' });
    }

    // 3. Prevent deleting role if assigned to users
    const assignmentCheck = await db('user_roles')
      .where('role_id', id)
      .count('user_id as count')
      .first();
    
    if (parseInt(assignmentCheck.count || '0') > 0) {
      return res.status(400).json({
        error: 'Cannot delete role while it is assigned to users. Detach it from all users first.'
      });
    }

    // 4. Delete Role
    await db('roles').where({ tenant_id: tenantId, id }).del();

    // 5. Log event
    auditLogger.logEvent({
      tenantId,
      userId: req.user.userId,
      userEmail: req.user.email,
      action: 'role.delete',
      resource: 'roles',
      resourceId: id,
      status: 'success',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      payload: { deletedRoleName: targetRole.name }
    });

    res.json({ message: 'Role deleted successfully.' });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ error: 'Failed to delete role.' });
  }
}
