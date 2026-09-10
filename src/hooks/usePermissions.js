// src/hooks/usePermissions.js
import useAuth from './useAuth';
import { canAccess } from '../utils/permissions';

/**
 * Returns { role, can(moduleKey) } for gating UI by the logged-in user's role.
 * Company Owner / Wholesaler / unknown role → full access (non-breaking).
 */
export default function usePermissions() {
  const { user } = useAuth();
  const role = user?.role || null;
  return {
    role,
    can: (moduleKey) => canAccess(role, moduleKey),
  };
}
