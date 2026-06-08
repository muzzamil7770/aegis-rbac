import express from 'express';
import { listAuditLogs } from '../controllers/auditController.js';
import { authenticateJWT, requirePermission } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateJWT);

router.get('/', requirePermission('audit:read'), listAuditLogs);

export default router;
