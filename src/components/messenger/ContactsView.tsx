import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { User } from './types';
import { api } from '@/lib/api';

interface ContactsViewProps {
  currentUser: User;
}

interface ServerUser {
  id: number;
  username: string;
  name: string;
  avatar: string;
  bio: string;
  last_seen: string;
}

function isOnline(lastSeen: string) {
  return Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000;
}

export default function ContactsView({ currentUser }: ContactsViewProps) {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<ServerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingChat, setOpeningChat] = useState<number | null>(null);
  const [notification, setNotification] = useState('');

  useEffect(() => { loadUsers(); }, []);

  useEffect(() => {
    const t = setTimeout(() => loadUsers(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadUsers = async (q = '') => {
    try {
      const data = await api.getUsers(q);
      setUsers(data.users.filter((u: ServerUser) => u.username !== currentUser.username));
    } finally {
      setLoading(false);
    }
  };

  const startChat = async (user: ServerUser) => {
    setOpeningChat(user.id);
    try {
      await api.createChat(currentUser.id, user.id);
      setNotification(`Чат с ${user.name} открыт — перейдите в Сообщения`);
      setTimeout(() => setNotification(''), 3000);
    } catch {
      setNotification('Ошибка при создании чата');
      setTimeout(() => setNotification(''), 2500);
    } finally {
      setOpeningChat(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold mb-3">Контакты</h2>
        <div className="relative">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text" placeholder="Поиск по имени или @username..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-secondary border border-border rounded-xl pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
        </div>
      </div>

      {notification && (
        <div className="mx-4 mt-3 flex items-center gap-2 text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2.5 text-sm animate-fade-in">
          <Icon name="CheckCircle" size={16} />
          {notification}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center h-20 text-muted-foreground">
            <Icon name="Loader" size={20} className="animate-spin" />
          </div>
        )}
        {!loading && users.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <Icon name="UserX" size={32} className="mb-2 opacity-30" />
            <p className="text-sm">{search ? 'Никого не найдено' : 'Пока нет других пользователей'}</p>
          </div>
        )}
        {!loading && users.length > 0 && (
          <div>
            <div className="px-4 pt-4 pb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Пользователи · {users.length}</span>
            </div>
            {users.map((user, i) => (
              <div key={user.id} className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors animate-fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                    {user.avatar || user.name.charAt(0).toUpperCase()}
                  </div>
                  {isOnline(user.last_seen) && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">@{user.username}{user.bio ? ` · ${user.bio}` : ''}</p>
                </div>
                <button
                  onClick={() => startChat(user)}
                  disabled={openingChat === user.id}
                  className="p-2 rounded-xl text-primary hover:bg-primary/10 transition-all disabled:opacity-50"
                  title="Написать сообщение"
                >
                  {openingChat === user.id
                    ? <Icon name="Loader" size={16} className="animate-spin" />
                    : <Icon name="MessageCircle" size={16} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
