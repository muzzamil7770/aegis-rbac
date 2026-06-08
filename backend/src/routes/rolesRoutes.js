import express from 'express';
import { listRoles, getPermissions, createRole, updateRole, deleteRole } from '../controllers/rolesController.js';
import { authenticateJWT, requirePermission } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateJWT);

// Permissions registry retrieval (needs roles:read or roles:create or roles:update to bind them)
router.get('/permissions', getPermissions);

// Roles CRUD
router.get('/', requirePermission('roles:read'), listRoles);
router.post('/', requirePermission('roles:create'), createRole);
router.put('/:id', requirePermission('roles:update'), updateRole);
router.delete('/:id', requirePermission('roles:delete'), deleteRole);

export default router;
