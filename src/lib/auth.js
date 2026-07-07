/**
 * Utility for checking user role via Cloudflare Zero Trust.
 * In production, this makes an API call to an Edge Function
 * or backend route that parses the Cf-Access-Jwt-Assertion header/cookie.
 *
 * IMPORTANT DEPLOYMENT NOTE:
 * Cloudflare Access will attach the Cf-Access-Jwt-Assertion header to incoming requests.
 * The backend must validate this JWT to confirm the user possesses the axim_internal_admin role.
 * The decoded JWT payload will contain the identity and groups/roles. Specifically,
 * the system must check for the 'axim_internal_admin' role within this assertion to grant access.
 */
export async function verifyAdminRole() {
  try {
    const response = await fetch('/api/auth/verify-role');

    if (response.status === 401 || response.status === 403) {
      console.warn("[CLOUDFLARE_EDGE_BLOCK]");
      return false;
    }

    if (!response.ok) {
        return false;
    }

    const data = await response.json();
    return data.hasRole === true && data.role === 'axim_internal_admin';
  } catch (error) {
    console.error("Error verifying admin role:", error);
    return false;
  }
}
