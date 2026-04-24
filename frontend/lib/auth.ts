// All session state is now handled exclusively via React Context and HTTPOnly Cookies.
// This file only exports the types for backward compatibility, or you can delete the functions.
import { UserSession } from '@/types';

// The backend handles clearing cookies on /logout.
export function clearSession(): void {
  // No-op for legacy compatibility, actual clearance is done via backend HTTP cookies.
}
