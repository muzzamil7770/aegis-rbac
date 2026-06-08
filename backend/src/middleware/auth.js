import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_rbac_jwt_signing_key_change_me_in_production';

/**
 * Authenticates requests using a Bearer token in the Authorization header.
 */
export function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
      if (err) {
        return res.status(403).json({ error: 'Forbidden: Invalid or expired security token.' });
      }

      req.user = decodedUser;
      next();
    });
  } else {
    return res.status(401).json({ error: 'Unauthorized: Security token is missing or malformed.' });
  }
}

/**
 * Guard middleware that checks if the authenticated user has a specific permission.
 * 
 * @param {string} permission - The permission required (e.g. 'users:read')
 */
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Session details missing.' });
    }

    const { permissions = [] } = req.user;

    // Check if permission exists in user's permission set
    if (permissions.includes(permission)) {
      return next();
    }

    return res.status(403).json({
      error: `Forbidden: You do not have the necessary permission to execute this operation (${permission}).`
    });
  };
}

/**
 * Guard middleware that checks if the authenticated user has ANY of the specified permissions.
 * 
 * @param {string[]} permissionsArray - List of permission IDs
 */
export function requireAnyPermission(permissionsArray) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Session details missing.' });
    }

    const { permissions = [] } = req.user;

    const hasAny = permissionsArray.some((perm) => permissions.includes(perm));
    if (hasAny) {
      return next();
    }

    return res.status(403).json({
      error: `Forbidden: You lack the required authorization levels.`
    });
  };
}
