import { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { User } from './types';
import ChatsView from './ChatsView';
import ContactsView from './ContactsView';
import ProfileView from './ProfileView';
import SettingsView from './SettingsView';

interface MessengerAppProps {
  currentUser: User;
  onLogout: () => void;
  onSwitch: (user: User) => void;
}

type Tab = 'chats' | 'contacts' | 'profile' | 'settings';

const tabs: { id: Tab; icon: string; label: string }[] = [
  { id: 'chats', icon: 'MessageCircle', label: 'Чаты' },
  { id: 'contacts', icon: 'Users', label: 'Контакты' },
  { id: 'profile', icon: 'User', label: 'Профиль' },
  { id: 'settings', icon: 'Settings', label: 'Настройки' },
];

const AVATAR_COLORS = [
  'bg-blue-500/20 text-blue-400',
  'bg-violet-500/20 text-violet-400',
  'bg-emerald-500/20 text-emerald-400',
  'bg-amber-500/20 text-amber-400',
  'bg-rose-500/20 text-rose-400',
  'bg-cyan-500/20 text-cyan-400',
];

function getColor(username: string) {
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function MessengerApp({ currentUser: initialUser, onLogout, onSwitch }: MessengerAppProps) {
  const [activeTab, setActiveTab] = useState<Tab>('chats');
  const [currentUser, setCurrentUser] = useState(initialUser);
  const [showAccounts, setShowAccounts] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  const allUsers: User[] = JSON.parse(localStorage.getItem('vector_users') || '[]');
  const otherUsers = allUsers.filter(u => u.username !== currentUser.username);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setShowAccounts(false);
      }
    };
    if (showAccounts) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showAccounts]);

  const handleSwitch = (user: User) => {
    localStorage.setItem('vector_current_user', JSON.stringify(user));
    setShowAccounts(false);
    onSwitch(user);
  };

  const renderView = () => {
    switch (activeTab) {
      case 'chats': return <ChatsView currentUser={currentUser} />;
      case 'contacts': return <ContactsView currentUser={currentUser} />;
      case 'profile': return <ProfileView currentUser={currentUser} onUpdate={u => { setCurrentUser(u); }} />;
      case 'settings': return <SettingsView currentUser={currentUser} onLogout={onLogout} />;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside className="flex flex-col items-center py-4 px-2 border-r border-border bg-[hsl(var(--sidebar-background))] w-16 shrink-0">
        <div className="mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Icon name="Zap" size={20} className="text-primary" />
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
            >
              <Icon name={tab.icon as Parameters<typeof Icon>[0]['name']} size={20} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto relative" ref={popupRef}>
          <button
            onClick={() => setShowAccounts(v => !v)}
            title="Переключить аккаунт"
            className={`relative w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-200 ring-2 ${showAccounts ? 'ring-primary scale-110' : 'ring-transparent hover:ring-primary/50 hover:scale-105'} ${getColor(currentUser.username)}`}
          >
            {currentUser.name.charAt(0).toUpperCase()}
            {otherUsers.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-primary text-[8px] text-primary-foreground flex items-center justify-center font-bold leading-none">
                {otherUsers.length}
              </span>
            )}
          </button>

          {showAccounts && (
            <div className="absolute bottom-12 left-0 z-50 w-64 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in origin-bottom-left">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Аккаунты</p>
              </div>

              <div className="py-1">
                <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/8">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm ${getColor(currentUser.username)}`}>
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{currentUser.name}</p>
                    <p className="text-xs text-muted-foreground truncate">@{currentUser.username}</p>
                  </div>
                  <Icon name="Check" size={16} className="text-primary shrink-0" />
                </div>

                {otherUsers.map((user, i) => (
                  <button
                    key={user.username}
                    onClick={() => handleSwitch(user)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/60 transition-colors text-left animate-fade-in"
                    style={{ animationDelay: `${i * 0.04}s` }}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm ${getColor(user.username)}`}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                    </div>
                    <Icon name="ArrowRight" size={14} className="text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>

              <div className="border-t border-border py-1">
                <button
                  onClick={() => { setShowAccounts(false); onLogout(); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-destructive/10 text-destructive transition-colors text-left text-sm font-medium"
                >
                  <Icon name="LogOut" size={16} />
                  Выйти
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-hidden animate-fade-in" key={activeTab}>
          {renderView()}
        </div>
      </main>
    </div>
  );
}
