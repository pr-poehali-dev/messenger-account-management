import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { User } from './types';
import { api } from '@/lib/api';

interface ProfileViewProps {
  currentUser: User;
  onUpdate: (user: User) => void;
}

export default function ProfileView({ currentUser, onUpdate }: ProfileViewProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: currentUser.name, bio: currentUser.bio || '', status: currentUser.status || '' });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = await api.updateProfile(currentUser.id, form.name, form.bio, form.status);
      const updated = { ...currentUser, ...data.user };
      localStorage.setItem('vector_current_user', JSON.stringify(updated));
      onUpdate(updated);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Профиль</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-md mx-auto">
          <div className="flex flex-col items-center py-8 animate-scale-in">
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-3xl">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-all hover:scale-110">
                <Icon name="Camera" size={14} />
              </button>
            </div>
            {!editing ? (
              <>
                <h3 className="text-xl font-semibold">{currentUser.name}</h3>
                <p className="text-muted-foreground text-sm mt-0.5">@{currentUser.username}</p>
                {currentUser.status && (
                  <p className="text-sm mt-2 text-primary">{currentUser.status}</p>
                )}
                {currentUser.bio && (
                  <p className="text-sm text-muted-foreground mt-2 text-center">{currentUser.bio}</p>
                )}
              </>
            ) : null}
          </div>

          {!editing ? (
            <div className="space-y-3 animate-fade-in">
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <InfoRow icon="User" label="Имя" value={currentUser.name} />
                <InfoRow icon="AtSign" label="Логин" value={`@${currentUser.username}`} border />
                <InfoRow icon="Heart" label="Статус" value={currentUser.status || 'Не указан'} border />
                <InfoRow icon="FileText" label="О себе" value={currentUser.bio || 'Не указано'} border />
              </div>

              {saved && (
                <div className="flex items-center gap-2 text-green-500 bg-green-500/10 rounded-xl px-4 py-3 text-sm animate-fade-in">
                  <Icon name="CheckCircle" size={16} />
                  Профиль успешно сохранён
                </div>
              )}

              <button
                onClick={() => setEditing(true)}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
              >
                Редактировать профиль
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Имя</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Статус</label>
                  <input
                    type="text"
                    placeholder="Что у вас нового?"
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">О себе</label>
                  <textarea
                    rows={3}
                    placeholder="Расскажите о себе..."
                    value={form.bio}
                    onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 bg-secondary hover:bg-secondary/80 text-foreground font-medium py-2.5 rounded-xl transition-all text-sm"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground font-semibold py-2.5 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
                >
                  {saving && <Icon name="Loader" size={14} className="animate-spin" />}
                  Сохранить
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, border }: { icon: string; label: string; value: string; border?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${border ? 'border-t border-border' : ''}`}>
      <Icon name={icon as Parameters<typeof Icon>[0]['name']} size={16} className="text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}