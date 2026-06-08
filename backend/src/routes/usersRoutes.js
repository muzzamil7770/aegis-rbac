import express from 'express';
import { listUsers, createUser, updateUser, deleteUser } from '../controllers/usersController.js';
import { authenticateJWT, requirePermission } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateJWT);

router.get('/', requirePermission('users:read'), listUsers);
router.post('/', requirePermission('users:create'), createUser);
router.put('/:id', requirePermission('users:update'), updateUser);
router.delete('/:id', requirePermission('users:delete'), deleteUser);

export default router;
