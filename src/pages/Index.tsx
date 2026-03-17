import { useState, useEffect } from 'react';
import AuthScreen from '@/components/messenger/AuthScreen';
import MessengerApp from '@/components/messenger/MessengerApp';
import { User } from '@/components/messenger/types';

export default function Index() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('vector_current_user');
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem('vector_current_user');
      }
    }
  }, []);

  const handleAuth = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('vector_current_user');
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <AuthScreen onAuth={handleAuth} />;
  }

  return <MessengerApp currentUser={currentUser} onLogout={handleLogout} />;
}
