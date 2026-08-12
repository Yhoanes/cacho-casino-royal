/**
 * session.js
 * Persistent user identity and room session management using sessionStorage.
 * Using sessionStorage ensures tab isolation during multi-tab local testing
 * while seamlessly supporting F5 / mobile tab memory reloads!
 */

const SESSION_KEY = 'cacho_session_v2';
const USER_ID_KEY = 'cacho_user_id_v2';

export function getOrCreateUserId() {
  try {
    let userId = sessionStorage.getItem(USER_ID_KEY);
    if (!userId) {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        userId = crypto.randomUUID();
      } else {
        userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      }
      sessionStorage.setItem(USER_ID_KEY, userId);
    }
    return userId;
  } catch (e) {
    return 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  }
}

export function getStoredSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function saveStoredSession({ roomCode, playerName, avatar }) {
  try {
    const userId = getOrCreateUserId();
    const session = {
      userId,
      roomCode,
      playerName,
      avatar,
      updatedAt: Date.now(),
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  } catch (e) {
    console.error('Failed to save session:', e);
  }
}

export function clearStoredSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch (e) {
    console.error('Failed to clear session:', e);
  }
}
