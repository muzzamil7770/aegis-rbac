import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import db from '../db/index.js';
import * as auditLogger from '../services/auditLogger.js';

/**
 * List all users in the tenant
 */
export async function listUsers(req, res) {
  const { tenantId } = req.user;

  try {
    // Fetch users in tenant
    const usersList = await db('users')
      .where('tenant_id', tenantId)
      .select('id', 'email', 'name', 'status', 'created_at', 'updated_at');

    // Fetch user-role mappings for all users in tenant
    const userIds = usersList.map(u => u.id);
    let roleMappings = [];
    if (userIds.length > 0) {
      roleMappings = await db('user_roles')
        .join('roles', 'user_roles.role_id', 'roles.id')
        .whereIn('user_roles.user_id', userIds)
        .select('user_roles.user_id', 'roles.id as role_id', 'roles.name as role_name');
    }

    // Attach roles to users
    const usersWithRoles = usersList.map((user) => {
      const roles = roleMappings
        .filter((mapping) => mapping.user_id === user.id)
        .map((mapping) => ({ id: mapping.role_id, name: mapping.role_name }));
      return { ...user, roles };
    });

    res.json(usersWithRoles);
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Failed to retrieve tenant users.' });
  }
}

/**
 * Create a new user in the tenant
 */
export async function createUser(req, res) {
  const { tenantId } = req.user;
  const { email, name, password, roleIds = [] } = req.body;

  if (!email || !name || !password) {
    return res.status(400).json({ error: 'email, name, and password are required.' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Check if email already registered in this tenant
    const existingUser = await db('users').where({ tenant_id: tenantId, email: normalizedEmail }).first();
    if (existingUser) {
      return res.status(409).json({ error: 'A user with this email address is already registered in this organization.' });
    }

    // Verify all roleIds belong to this tenant
    if (roleIds.length > 0) {
      const validRoles = await db('roles')
        .where('tenant_id', tenantId)
        .whereIn('id', roleIds)
        .select('id');
      
      if (validRoles.length !== roleIds.length) {
        return res.status(400).json({ error: 'One or more assigned roles are invalid for this organization.' });
      }
    }

    const userId = crypto.randomUUID();
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    await db.transaction(async (trx) => {
      // 1. Insert user
      await trx('users').insert({
        id: userId,
        tenant_id: tenantId,
        email: normalizedEmail,
        password_hash: passwordHash,
        name: name.trim(),
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      });

      // 2. Associate roles
      if (roleIds.length > 0) {
        const userRolesToInsert = roleIds.map((rId) => ({
          user_id: userId,
          role_id: rId
        }));
        await trx('user_roles').insert(userRolesToInsert);
      }

      // 3. Log event
      auditLogger.logEvent({
        tenantId,
        userId: req.user.userId,
        userEmail: req.user.email,
        action: 'user.create',
        resource: 'users',
        resourceId: userId,
        status: 'success',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        payload: { email: normalizedEmail, name, roleIds }
      });
    });

    res.status(201).json({ id: userId, email: normalizedEmail, name, status: 'active' });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user.' });
  }
}

/**
 * Update an existing user in the tenant
 */
export async function updateUser(req, res) {
  const { tenantId } = req.user;
  const { id } = req.params;
  const { name, status, password, roleIds } = req.body;

  try {
    // 1. Check if user exists in tenant
    const targetUser = await db('users').where({ tenant_id: tenantId, id }).first();
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found in this organization.' });
    }

    // 2. Prevent user from disabling themselves
    if (id === req.user.userId && status && status !== 'active') {
      return res.status(400).json({ error: 'You cannot deactivate or suspend your own account.' });
    }

    // 3. Validate roleIds if provided
    if (roleIds && roleIds.length > 0) {
      const validRoles = await db('roles')
        .where('tenant_id', tenantId)
        .whereIn('id', roleIds)
        .select('id');
      
      if (validRoles.length !== roleIds.length) {
        return res.status(400).json({ error: 'One or more assigned roles are invalid for this organization.' });
      }
    }

    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (status !== undefined) updates.status = status;
    if (password) {
      const salt = bcrypt.genSaltSync(10);
      updates.password_hash = bcrypt.hashSync(password, salt);
    }
    updates.updated_at = new Date();

    await db.transaction(async (trx) => {
      // 1. Update user details
      if (Object.keys(updates).length > 0) {
        await trx('users').where({ id }).update(updates);
      }

      // 2. Update roles if specified
      if (roleIds !== undefined) {
        // Prevent deleting own Owner/Admin role status if it makes the organization owner-less
        if (id === req.user.userId) {
          // Verify we aren't removing Owner role if they are the only Owner
          const userRoles = await trx('user_roles')
            .join('roles', 'user_roles.role_id', 'roles.id')
            .where('user_roles.user_id', id)
            .select('roles.name');
          const wasOwner = userRoles.some(r => r.name === 'Owner');

          const newRoles = await trx('roles').whereIn('id', roleIds).select('name');
          const isStillOwner = newRoles.some(r => r.name === 'Owner');

          if (wasOwner && !isStillOwner) {
            // Check if there are other owners
            const otherOwners = await trx('user_roles')
              .join('roles', 'user_roles.role_id', 'roles.id')
              .where('roles.tenant_id', tenantId)
              .where('roles.name', 'Owner')
              .whereNot('user_roles.user_id', id)
              .count('user_roles.user_id as count')
              .first();

            if (parseInt(otherOwners.count || '0') === 0) {
              throw new Error('Cannot remove Owner role. Organizations must have at least one active Owner.');
            }
          }
        }

        // Delete current role associations
        await trx('user_roles').where('user_id', id).del();

        // Insert new associations
        if (roleIds.length > 0) {
          const userRolesToInsert = roleIds.map((rId) => ({
            user_id: id,
            role_id: rId
          }));
          await trx('user_roles').insert(userRolesToInsert);
        }
      }

      // 3. Log event
      auditLogger.logEvent({
        tenantId,
        userId: req.user.userId,
        userEmail: req.user.email,
        action: 'user.update',
        resource: 'users',
        resourceId: id,
        status: 'success',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        payload: {
          name: name !== undefined ? name : targetUser.name,
          status: status !== undefined ? status : targetUser.status,
          rolesChanged: roleIds !== undefined,
          roleIds
        }
      });
    });

    res.json({ message: 'User updated successfully.' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: error.message || 'Failed to update user.' });
  }
}

/**
 * Delete a user from the tenant
 */
export async function deleteUser(req, res) {
  const { tenantId } = req.user;
  const { id } = req.params;

  try {
    // 1. Verify user exists in tenant
    const targetUser = await db('users').where({ tenant_id: tenantId, id }).first();
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found in this organization.' });
    }

    // 2. Prevent user from deleting themselves
    if (id === req.user.userId) {
      return res.status(400).json({ error: 'You cannot delete your own account.' });
    }

    // 3. Check if we are deleting the last Owner
    const userRoles = await db('user_roles')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .where('user_roles.user_id', id)
      .select('roles.name');
    const isOwner = userRoles.some(r => r.name === 'Owner');

    if (isOwner) {
      const otherOwners = await db('user_roles')
        .join('roles', 'user_roles.role_id', 'roles.id')
        .where('roles.tenant_id', tenantId)
        .where('roles.name', 'Owner')
        .whereNot('user_roles.user_id', id)
        .count('user_roles.user_id as count')
        .first();

      if (parseInt(otherOwners.count || '0') === 0) {
        return res.status(400).json({ error: 'Cannot delete the only Owner. Organizations must have at least one active Owner.' });
      }
    }

    // 4. Perform Delete
    await db('users').where({ tenant_id: tenantId, id }).del();

    // 5. Log event
    auditLogger.logEvent({
      tenantId,
      userId: req.user.userId,
      userEmail: req.user.email,
      action: 'user.delete',
      resource: 'users',
      resourceId: id,
      status: 'success',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      payload: { deletedUserEmail: targetUser.email, deletedUserName: targetUser.name }
    });

    res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
}
