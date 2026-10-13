import { NextRequest } from 'next/server';

export function getSafeHeaderUser(req: NextRequest, fallback: string = 'system'): string {
  const raw = req.headers.get('x-user');
  if (!raw) return fallback;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function getSafeHeaderRole(req: NextRequest, fallback: string = 'staff'): string {
  const raw = req.headers.get('x-user-role');
  if (!raw) return fallback;
  try {
    return decodeURIComponent(raw).toLowerCase();
  } catch {
    return raw.toLowerCase();
  }
}

export function getCurrentUser(
  req: NextRequest,
  body?: { currentUser?: string } | null,
  fallback: string = 'system'
): string {
  if (body?.currentUser && typeof body.currentUser === 'string' && body.currentUser.trim()) {
    return body.currentUser.trim();
  }
  return getSafeHeaderUser(req, fallback);
}
