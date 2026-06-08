import db from '../db/index.js';
import crypto from 'crypto';

/**
 * Log an audit event to the database asynchronously.
 * 
 * @param {Object} logParams
 * @param {string} logParams.tenantId - The tenant's ID
 * @param {string} [logParams.userId] - The ID of the user performing the action
 * @param {string} [logParams.userEmail] - The email of the user performing the action
 * @param {string} logParams.action - The action name (e.g. 'auth.login', 'user.create')
 * @param {string} logParams.resource - The resource type (e.g. 'users', 'roles')
 * @param {string} [logParams.resourceId] - The ID of the target resource
 * @param {string} logParams.status - The status of the action ('success' or 'failure')
 * @param {string} logParams.ipAddress - The IP address of the client
 * @param {string} [logParams.userAgent] - The browser User Agent
 * @param {Object} [logParams.payload] - Additional details (changes, reason, etc.)
 */
export function logEvent({
  tenantId,
  userId = null,
  userEmail = null,
  action,
  resource,
  resourceId = null,
  status,
  ipAddress,
  userAgent = null,
  payload = null
}) {
  // Generate random UUID for log entry
  const logId = crypto.randomUUID();

  // Parse payload to JSON string (Knex will stringify json types automatically, 
  // but let's make sure it is safe or clean)
  const safePayload = payload ? { ...payload } : null;
  
  // Exclude sensitive fields from being logged in payload
  if (safePayload) {
    const sensitiveFields = ['password', 'passwordConfirm', 'token', 'refreshToken', 'password_hash'];
    for (const field of sensitiveFields) {
      if (field in safePayload) {
        safePayload[field] = '[REDACTED]';
      }
    }
  }

  // Insert into db. We do not block the thread (no 'await'), but we do catch errors.
  db('audit_logs')
    .insert({
      id: logId,
      tenant_id: tenantId,
      user_id: userId,
      user_email: userEmail,
      action,
      resource,
      resource_id: resourceId,
      status,
      ip_address: ipAddress || 'unknown',
      user_agent: userAgent,
      payload: safePayload ? JSON.stringify(safePayload) : null,
      created_at: new Date()
    })
    .then(() => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[AUDIT LOG] ${action} by ${userEmail || 'System'} - Status: ${status}`);
      }
    })
    .catch((err) => {
      console.error('[AUDIT LOG ERROR] Failed to record audit log:', err);
    });
}
