import { config } from '../config.js';

export async function authMiddleware(req, _res, next) {
  const authHeader = req.headers.authorization || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  // MVP auth mode:
  // - if Bearer token exists, treat it as opaque identity token and map a stable user id
  // - else fallback to x-user-id / configured dev user id
  const fallbackUserId = req.headers['x-user-id'] || config.devUserId;
  const userId = bearer ? `token:${bearer.slice(0, 16)}` : fallbackUserId;

  req.user = { id: String(userId) };
  next();
}