import db from '../db/index.js';

/**
 * List audit logs for the tenant with optional filters
 */
export async function listAuditLogs(req, res) {
  const { tenantId } = req.user;
  const { action, status, email, limit = 50, page = 1 } = req.query;

  try {
    const parsedLimit = Math.min(parseInt(limit) || 50, 100);
    const parsedPage = Math.max(parseInt(page) || 1, 1);
    const offset = (parsedPage - 1) * parsedLimit;

    // Start query on audit_logs
    let query = db('audit_logs')
      .where('tenant_id', tenantId);

    // Apply filters dynamically
    if (action) {
      query = query.where('action', action);
    }
    if (status) {
      query = query.where('status', status);
    }
    if (email) {
      // Support substring searches on user_email
      query = query.whereILike ? query.whereILike('user_email', `%${email}%`) : query.where('user_email', 'like', `%${email}%`);
    }

    // Clone query for counting totals
    const countQuery = query.clone();

    // Fetch total matching records
    const totalRecordsResult = await countQuery.count('id as total').first();
    const totalRecords = parseInt(totalRecordsResult.total || '0');

    // Fetch actual data
    const logs = await query
      .select('id', 'user_id', 'user_email', 'action', 'resource', 'resource_id', 'status', 'ip_address', 'user_agent', 'payload', 'created_at')
      .orderBy('created_at', 'desc')
      .limit(parsedLimit)
      .offset(offset);

    // Format logs: parse payload text back to JSON if stored as text string (SQLite)
    const formattedLogs = logs.map(log => {
      let parsedPayload = null;
      if (log.payload) {
        if (typeof log.payload === 'string') {
          try {
            parsedPayload = JSON.parse(log.payload);
          } catch (e) {
            parsedPayload = log.payload;
          }
        } else {
          parsedPayload = log.payload;
        }
      }
      return {
        ...log,
        payload: parsedPayload
      };
    });

    res.json({
      logs: formattedLogs,
      pagination: {
        total: totalRecords,
        limit: parsedLimit,
        page: parsedPage,
        pages: Math.ceil(totalRecords / parsedLimit)
      }
    });
  } catch (error) {
    console.error('List audit logs error:', error);
    res.status(500).json({ error: 'Failed to retrieve organization audit logs.' });
  }
}
