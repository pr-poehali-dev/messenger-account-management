const AUTH_URL = 'https://functions.poehali.dev/72a4ff76-de06-4f18-b85a-a5ce9f3a0792';
const CHATS_URL = 'https://functions.poehali.dev/ac8a590f-f766-4067-82a6-6e083072b6fb';

async function post(url: string, action: string, body: object) {
  const res = await fetch(`${url}?action=${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  const parsed = typeof data === 'string' ? JSON.parse(data) : data;
  if (!res.ok) throw new Error(parsed.error || 'Ошибка сервера');
  return parsed;
}

async function get(url: string, action: string, params: Record<string, string> = {}) {
  const q = new URLSearchParams({ action, ...params });
  const res = await fetch(`${url}?${q}`);
  const data = await res.json();
  const parsed = typeof data === 'string' ? JSON.parse(data) : data;
  if (!res.ok) throw new Error(parsed.error || 'Ошибка сервера');
  return parsed;
}

export const api = {
  register: (name: string, username: string, password: string) =>
    post(AUTH_URL, 'register', { name, username, password }),

  login: (username: string, password: string) =>
    post(AUTH_URL, 'login', { username, password }),

  updateProfile: (id: number, name: string, bio: string, status: string) =>
    post(AUTH_URL, 'profile', { id, name, bio, status }),

  getUsers: (q = '') =>
    get(AUTH_URL, 'users', q ? { q } : {}),

  getChatList: (userId: number) =>
    get(CHATS_URL, 'list', { user_id: String(userId) }),

  createChat: (userId: number, otherId: number) =>
    post(CHATS_URL, 'create', { user_id: userId, other_id: otherId }),

  getMessages: (chatId: number, userId: number, since?: string) =>
    get(CHATS_URL, 'messages', { chat_id: String(chatId), user_id: String(userId), ...(since ? { since } : {}) }),

  sendMessage: (chatId: number, senderId: number, text: string) =>
    post(CHATS_URL, 'send', { chat_id: chatId, sender_id: senderId, text }),

  getUnread: (userId: number) =>
    get(CHATS_URL, 'unread', { user_id: String(userId) }),
};
