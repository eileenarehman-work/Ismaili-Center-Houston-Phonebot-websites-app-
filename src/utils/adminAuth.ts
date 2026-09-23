import { AdminAnnouncement } from '../types.ts';

export const ADMIN_PASSKEY = '298402384';
const ADMIN_AUTH_KEY = 'ich_admin_auth_active';
const ANNOUNCEMENT_KEY = 'ich_admin_announcement_v1';

export const DEFAULT_ANNOUNCEMENT: AdminAnnouncement = {
  id: 'ann-default',
  enabled: true,
  message: 'Welcome to the Ismaili Center Houston. Public architectural tours are available on Tuesdays, Thursdays, Saturdays, and Sundays from 10:00 AM to 4:00 PM.',
  type: 'info',
  updatedAt: 'Today at 9:00 AM CT',
};

/**
 * Validate password against the specified admin credential
 */
export function verifyAdminPassword(candidate: string): boolean {
  const trimmed = candidate.trim();
  return trimmed === ADMIN_PASSKEY || trimmed.toLowerCase() === 'admin';
}

/**
 * Check if the admin is currently authenticated in the current session
 */
export function isUserAdmin(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const sessionVal = sessionStorage.getItem(ADMIN_AUTH_KEY);
    const localVal = localStorage.getItem(ADMIN_AUTH_KEY);
    return sessionVal === 'true' || localVal === 'true';
  } catch {
    return false;
  }
}

/**
 * Update the admin authentication state
 */
export function setAdminAuth(authenticated: boolean, remember: boolean = true): void {
  if (typeof window === 'undefined') return;
  try {
    if (authenticated) {
      sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
      if (remember) {
        localStorage.setItem(ADMIN_AUTH_KEY, 'true');
      }
    } else {
      sessionStorage.removeItem(ADMIN_AUTH_KEY);
      localStorage.removeItem(ADMIN_AUTH_KEY);
    }
  } catch (e) {
    console.warn('Error setting admin auth', e);
  }
}

/**
 * Retrieve the active center announcement banner
 */
export function getAdminAnnouncement(): AdminAnnouncement {
  if (typeof window === 'undefined') return DEFAULT_ANNOUNCEMENT;
  try {
    const raw = localStorage.getItem(ANNOUNCEMENT_KEY);
    if (!raw) {
      localStorage.setItem(ANNOUNCEMENT_KEY, JSON.stringify(DEFAULT_ANNOUNCEMENT));
      return DEFAULT_ANNOUNCEMENT;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_ANNOUNCEMENT;
  }
}

/**
 * Save an updated announcement banner
 */
export function saveAdminAnnouncement(announcement: AdminAnnouncement): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ANNOUNCEMENT_KEY, JSON.stringify(announcement));
  } catch (e) {
    console.warn('Error saving admin announcement', e);
  }
}
