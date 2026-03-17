import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { User } from './types';
import ChatsView from './ChatsView';
import ContactsView from './ContactsView';
import ProfileView from './ProfileView';
import SettingsView from './SettingsView';

interface MessengerAppProps {
  currentUser: User;
  onLogout: () => void;
}

type Tab = 'chats' | 'contacts' | 'profile' | 'settings';

const tabs: { id: Tab; icon: string; label: string }[] = [
  { id: 'chats', icon: 'MessageCircle', label: 'Чаты' },
  { id: 'contacts', icon: 'Users', label: 'Контакты' },
  { id: 'profile', icon: 'User', label: 'Профиль' },
  { id: 'settings', icon: 'Settings', label: 'Настройки' },
];

export default function MessengerApp({ currentUser: initialUser, onLogout }: MessengerAppProps) {
  const [activeTab, setActiveTab] = useState<Tab>('chats');
  const [currentUser, setCurrentUser] = useState(initialUser);

  const renderView = () => {
    switch (activeTab) {
      case 'chats': return <ChatsView currentUser={currentUser} />;
      case 'contacts': return <ContactsView currentUser={currentUser} />;
      case 'profile': return <ProfileView currentUser={currentUser} onUpdate={setCurrentUser} />;
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

        <div className="mt-auto">
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm cursor-pointer hover:bg-primary/30 transition-colors" title={currentUser.name}>
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
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
