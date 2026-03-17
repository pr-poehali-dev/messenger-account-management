import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { User } from './types';

interface ContactsViewProps {
  currentUser: User;
}

const ALL_USERS = [
  { username: 'demo_alex', name: 'Алексей Иванов', avatar: 'А', online: true, bio: 'Разработчик' },
  { username: 'demo_maria', name: 'Мария Смирнова', avatar: 'М', online: false, bio: 'Дизайнер' },
  { username: 'demo_dmitry', name: 'Дмитрий Козлов', avatar: 'Д', online: true, bio: 'Менеджер проектов' },
  { username: 'demo_anna', name: 'Анна Петрова', avatar: 'А', online: false, bio: 'Маркетолог' },
  { username: 'demo_sergey', name: 'Сергей Волков', avatar: 'С', online: true, bio: 'Аналитик данных' },
  { username: 'demo_elena', name: 'Елена Морозова', avatar: 'Е', online: false, bio: 'UX исследователь' },
];

export default function ContactsView({ currentUser }: ContactsViewProps) {
  const [search, setSearch] = useState('');
  const [added, setAdded] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem(`vector_contacts_${currentUser.username}`) || '["demo_alex","demo_maria"]');
  });

  const toggleContact = (username: string) => {
    const updated = added.includes(username)
      ? added.filter(u => u !== username)
      : [...added, username];
    setAdded(updated);
    localStorage.setItem(`vector_contacts_${currentUser.username}`, JSON.stringify(updated));
  };

  const filtered = ALL_USERS.filter(u => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.bio.toLowerCase().includes(q);
  });

  const myContacts = filtered.filter(u => added.includes(u.username));
  const others = filtered.filter(u => !added.includes(u.username));

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold mb-3">Контакты</h2>
        <div className="relative">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Поиск контактов..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-secondary border border-border rounded-xl pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {myContacts.length > 0 && (
          <div>
            <div className="px-4 pt-4 pb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Мои контакты · {myContacts.length}</span>
            </div>
            {myContacts.map((user, i) => (
              <ContactRow
                key={user.username}
                user={user}
                isAdded={true}
                onToggle={() => toggleContact(user.username)}
                index={i}
              />
            ))}
          </div>
        )}

        {others.length > 0 && (
          <div>
            <div className="px-4 pt-4 pb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Другие пользователи</span>
            </div>
            {others.map((user, i) => (
              <ContactRow
                key={user.username}
                user={user}
                isAdded={false}
                onToggle={() => toggleContact(user.username)}
                index={i}
              />
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <Icon name="UserX" size={32} className="mb-2 opacity-30" />
            <p className="text-sm">Никого не найдено</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ContactRow({ user, isAdded, onToggle, index }: {
  user: { username: string; name: string; avatar: string; online: boolean; bio: string };
  isAdded: boolean;
  onToggle: () => void;
  index: number;
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors animate-fade-in"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="relative shrink-0">
        <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
          {user.avatar}
        </div>
        {user.online && (
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{user.name}</p>
        <p className="text-xs text-muted-foreground truncate">{user.bio}</p>
      </div>
      <div className="flex items-center gap-2">
        {isAdded && (
          <button className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
            <Icon name="MessageCircle" size={16} />
          </button>
        )}
        <button
          onClick={onToggle}
          className={`p-2 rounded-xl transition-all ${
            isAdded
              ? 'text-destructive hover:bg-destructive/10'
              : 'text-primary hover:bg-primary/10'
          }`}
        >
          <Icon name={isAdded ? 'UserMinus' : 'UserPlus'} size={16} />
        </button>
      </div>
    </div>
  );
}
