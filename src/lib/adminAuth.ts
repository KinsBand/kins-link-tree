// src/lib/adminAuth.ts
// Lightweight client-side admin authorization manager for Kins Dashboard & Dev Heatmap

const STORAGE_AUTH_KEY = 'kins_admin_auth_token';
const STORAGE_CUSTOM_PIN_KEY = 'kins_admin_custom_pin';
const DEFAULT_PASSCODE = 'kins2026';

export function getAdminPasscode(): string {
  if (typeof window === 'undefined') return DEFAULT_PASSCODE;
  return localStorage.getItem(STORAGE_CUSTOM_PIN_KEY) || DEFAULT_PASSCODE;
}

export function setCustomAdminPasscode(newPasscode: string): boolean {
  if (typeof window === 'undefined' || !newPasscode || newPasscode.trim().length < 4) {
    return false;
  }
  localStorage.setItem(STORAGE_CUSTOM_PIN_KEY, newPasscode.trim());
  return true;
}

export function isUserAdmin(): boolean {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem(STORAGE_AUTH_KEY);
  return token === 'authenticated_' + getAdminPasscode();
}

export function authenticateAdmin(passcode: string): boolean {
  if (typeof window === 'undefined') return false;
  const correctPin = getAdminPasscode();
  if (passcode.trim() === correctPin) {
    localStorage.setItem(STORAGE_AUTH_KEY, 'authenticated_' + correctPin);
    return true;
  }
  return false;
}

export function logoutAdmin(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_AUTH_KEY);
}
