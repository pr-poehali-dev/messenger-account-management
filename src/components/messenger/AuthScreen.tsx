import { useState } from 'react';
import Icon from '@/components/ui/icon';

interface AuthScreenProps {
  onAuth: (user: { name: string; username: string; avatar: string }) => void;
}

export default function AuthScreen({ onAuth }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ name: '', username: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'register') {
      if (!form.name.trim() || !form.username.trim() || !form.password.trim()) {
        setError('Заполните все поля');
        return;
      }
      if (form.password.length < 6) {
        setError('Пароль должен быть не менее 6 символов');
        return;
      }
      const users = JSON.parse(localStorage.getItem('vector_users') || '[]');
      if (users.find((u: { username: string }) => u.username === form.username)) {
        setError('Имя пользователя уже занято');
        return;
      }
      const newUser = {
        name: form.name,
        username: form.username,
        password: form.password,
        avatar: form.name.charAt(0).toUpperCase(),
      };
      users.push(newUser);
      localStorage.setItem('vector_users', JSON.stringify(users));
      localStorage.setItem('vector_current_user', JSON.stringify(newUser));
      onAuth(newUser);
    } else {
      if (!form.username.trim() || !form.password.trim()) {
        setError('Заполните все поля');
        return;
      }
      const users = JSON.parse(localStorage.getItem('vector_users') || '[]');
      const user = users.find(
        (u: { username: string; password: string }) =>
          u.username === form.username && u.password === form.password
      );
      if (!user) {
        setError('Неверный логин или пароль');
        return;
      }
      localStorage.setItem('vector_current_user', JSON.stringify(user));
      onAuth(user);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-primary/3 blur-3xl" />
      </div>

      <div className="w-full max-w-sm animate-scale-in relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/15 mb-4">
            <Icon name="Zap" size={32} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Вектор</h1>
          <p className="text-muted-foreground text-sm mt-1">Современный мессенджер</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-2xl">
          <div className="flex bg-secondary rounded-xl p-1 mb-6">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                mode === 'login' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Вход
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                mode === 'register' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Регистрация
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <div className="animate-fade-in">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Имя</label>
                <input
                  type="text"
                  placeholder="Ваше имя"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Имя пользователя</label>
              <input
                type="text"
                placeholder="@username"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Пароль</label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-xl px-3 py-2 animate-fade-in">
                <Icon name="AlertCircle" size={14} />
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 rounded-xl transition-all duration-200 text-sm mt-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
