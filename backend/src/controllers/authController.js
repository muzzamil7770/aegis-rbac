import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../db/index.js';
import * as auditLogger from '../services/auditLogger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_rbac_jwt_signing_key_change_me_in_production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '2h';

/**
 * Handle new tenant registration
 */
export async function register(req, res) {
  const { tenantName, tenantSlug, email, name, password } = req.body;

  // Basic Validation
  if (!tenantName || !tenantSlug || !email || !name || !password) {
    return res.status(400).json({ error: 'All fields (tenantName, tenantSlug, email, name, password) are required.' });
  }

  // Format slug
  const formattedSlug = tenantSlug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');

  try {
    // Check if tenant slug already exists
    const existingTenant = await db('tenants').where('slug', formattedSlug).first();
    if (existingTenant) {
      return res.status(409).json({ error: 'An organization with this slug already exists.' });
    }

    // Create Tenant and Owner Transactionally
    await db.transaction(async (trx) => {
      const tenantId = crypto.randomUUID();
      const userId = crypto.randomUUID();
      
      // 1. Insert Tenant
      await trx('tenants').insert({
        id: tenantId,
        name: tenantName,
        slug: formattedSlug,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      });

      // 2. Hash Password
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(password, salt);

      // 3. Insert User
      await trx('users').insert({
        id: userId,
        tenant_id: tenantId,
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        name,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      });

      // 4. Retrieve All System Permissions
      const allPermissions = await trx('permissions').select('id');
      const permissionIds = allPermissions.map(p => p.id);

      // 5. Create Default Tenant Roles
      const ownerRoleId = crypto.randomUUID();
      const adminRoleId = crypto.randomUUID();
      const memberRoleId = crypto.randomUUID();
      const viewerRoleId = crypto.randomUUID();

      const rolesToInsert = [
        { id: ownerRoleId, tenant_id: tenantId, name: 'Owner', description: 'Full access to all system features and settings', is_system: true },
        { id: adminRoleId, tenant_id: tenantId, name: 'Admin', description: 'Administrative access except modifying billing and core tenant settings', is_system: true },
        { id: memberRoleId, tenant_id: tenantId, name: 'Member', description: 'Standard business team access', is_system: true },
        { id: viewerRoleId, tenant_id: tenantId, name: 'Viewer', description: 'Read-only access across all modules', is_system: true }
      ];

      await trx('roles').insert(rolesToInsert.map(r => ({
        ...r,
        created_at: new Date(),
        updated_at: new Date()
      })));

      // 6. Map Permissions to Roles
      // Owner gets ALL permissions
      const ownerPermissions = permissionIds.map(pId => ({ role_id: ownerRoleId, permission_id: pId }));

      // Admin gets all except 'tenant:update'
      const adminPermissions = permissionIds
        .filter(pId => pId !== 'tenant:update')
        .map(pId => ({ role_id: adminRoleId, permission_id: pId }));

      // Member gets standard read/writes (users:read, users:create, users:update, roles:read)
      const memberPermissions = ['users:read', 'users:create', 'users:update', 'roles:read'].map(pId => ({
        role_id: memberRoleId,
        permission_id: pId
      }));

      // Viewer gets read-only (users:read, roles:read)
      const viewerPermissions = ['users:read', 'roles:read'].map(pId => ({
        role_id: viewerRoleId,
        permission_id: pId
      }));

      const allMappings = [
        ...ownerPermissions,
        ...adminPermissions,
        ...memberPermissions,
        ...viewerPermissions
      ];

      await trx('role_permissions').insert(allMappings);

      // 7. Associate first user with Owner role
      await trx('user_roles').insert({
        user_id: userId,
        role_id: ownerRoleId
      });

      // 8. Log Registration Event
      auditLogger.logEvent({
        tenantId,
        userId,
        userEmail: email,
        action: 'auth.register',
        resource: 'tenants',
        resourceId: tenantId,
        status: 'success',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        payload: { tenantName, tenantSlug: formattedSlug, email, name }
      });
    });

    res.status(201).json({ message: 'Organization and administrator account successfully created.' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal Server Error during registration process.' });
  }
}

/**
 * Handle user login
 */
export async function login(req, res) {
  const { tenantSlug, email, password } = req.body;

  if (!tenantSlug || !email || !password) {
    return res.status(400).json({ error: 'tenantSlug, email, and password are required.' });
  }

  const slug = tenantSlug.toLowerCase().trim();
  const normalizedEmail = email.toLowerCase().trim();

  try {
    // 1. Resolve tenant
    const tenant = await db('tenants').where('slug', slug).first();
    if (!tenant) {
      return res.status(401).json({ error: 'Invalid organization details or credentials.' });
    }

    if (tenant.status !== 'active') {
      return res.status(403).json({ error: 'This organization account has been suspended.' });
    }

    // 2. Resolve user
    const user = await db('users').where({ tenant_id: tenant.id, email: normalizedEmail }).first();
    if (!user) {
      return res.status(401).json({ error: 'Invalid organization details or credentials.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: `Your account is currently ${user.status}. Contact your administrator.` });
    }

    // 3. Verify password
    const passwordValid = bcrypt.compareSync(password, user.password_hash);
    if (!passwordValid) {
      auditLogger.logEvent({
        tenantId: tenant.id,
        userEmail: normalizedEmail,
        action: 'auth.login',
        resource: 'users',
        resourceId: user.id,
        status: 'failure',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        payload: { reason: 'Invalid password' }
      });

      return res.status(401).json({ error: 'Invalid organization details or credentials.' });
    }

    // 4. Resolve Roles
    const userRoles = await db('user_roles')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .where('user_roles.user_id', user.id)
      .select('roles.id', 'roles.name');
    
    const roleIds = userRoles.map(r => r.id);
    const roleNames = userRoles.map(r => r.name);

    // 5. Resolve Permissions
    let permissions = [];
    if (roleIds.length > 0) {
      const rolePerms = await db('role_permissions')
        .whereIn('role_id', roleIds)
        .select('permission_id');
      permissions = [...new Set(rolePerms.map(rp => rp.permission_id))];
    }

    // 6. Generate JWT
    const payload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      tenantId: tenant.id,
      tenantName: tenant.name,
      tenantSlug: tenant.slug,
      roles: roleNames,
      permissions
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });

    // 7. Log Login Event
    auditLogger.logEvent({
      tenantId: tenant.id,
      userId: user.id,
      userEmail: user.email,
      action: 'auth.login',
      resource: 'users',
      resourceId: user.id,
      status: 'success',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug
      },
      roles: roleNames,
      permissions
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal Server Error during authentication.' });
  }
}

/**
 * Get profile information for logged-in user
 */
export async function me(req, res) {
  res.json({ user: req.user });
}
