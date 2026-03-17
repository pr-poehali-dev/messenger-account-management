import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { User } from './types';

interface SettingsViewProps {
  currentUser: User;
  onLogout: () => void;
}

export default function SettingsView({ currentUser, onLogout }: SettingsViewProps) {
  const [notifications, setNotifications] = useState(true);
  const [sounds, setSounds] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Настройки</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-md mx-auto space-y-4">
          <div className="bg-card border border-border rounded-2xl overflow-hidden animate-fade-in">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-sm">{currentUser.name}</p>
                <p className="text-xs text-muted-foreground">@{currentUser.username}</p>
              </div>
            </div>
          </div>

          <div className="animate-fade-in" style={{ animationDelay: '0.05s' }}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">Уведомления</p>
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <ToggleRow
                icon="Bell"
                label="Уведомления"
                description="Показывать новые сообщения"
                value={notifications}
                onChange={setNotifications}
              />
              <ToggleRow
                icon="Volume2"
                label="Звуки"
                description="Звуки при получении сообщений"
                value={sounds}
                onChange={setSounds}
                border
              />
            </div>
          </div>

          <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">Приложение</p>
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <SettingRow icon="Shield" label="Конфиденциальность" />
              <SettingRow icon="HelpCircle" label="Помощь и поддержка" border />
              <SettingRow icon="Info" label="О приложении" border description="Вектор v1.0" />
            </div>
          </div>

          <div className="animate-fade-in" style={{ animationDelay: '0.15s' }}>
            {!showLogoutConfirm ? (
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full flex items-center justify-center gap-2 bg-destructive/10 hover:bg-destructive/20 text-destructive font-medium py-3 rounded-xl transition-all text-sm border border-destructive/20"
              >
                <Icon name="LogOut" size={16} />
                Выйти из аккаунта
              </button>
            ) : (
              <div className="bg-card border border-destructive/30 rounded-2xl p-4 space-y-3 animate-scale-in">
                <div className="flex items-center gap-2 text-destructive">
                  <Icon name="AlertTriangle" size={16} />
                  <p className="text-sm font-medium">Выйти из аккаунта?</p>
                </div>
                <p className="text-xs text-muted-foreground">Вы можете войти снова в любое время</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 bg-secondary hover:bg-secondary/80 text-foreground font-medium py-2 rounded-xl transition-all text-sm"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={onLogout}
                    className="flex-1 bg-destructive hover:bg-destructive/90 text-white font-medium py-2 rounded-xl transition-all text-sm"
                  >
                    Выйти
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ icon, label, description, value, onChange, border }: {
  icon: string; label: string; description: string; value: boolean; onChange: (v: boolean) => void; border?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${border ? 'border-t border-border' : ''}`}>
      <Icon name={icon as Parameters<typeof Icon>[0]['name']} size={18} className="text-primary shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-all duration-200 ${value ? 'bg-primary' : 'bg-secondary border border-border'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200 ${value ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  );
}

function SettingRow({ icon, label, description, border }: {
  icon: string; label: string; description?: string; border?: boolean;
}) {
  return (
    <button className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left ${border ? 'border-t border-border' : ''}`}>
      <Icon name={icon as Parameters<typeof Icon>[0]['name']} size={18} className="text-primary shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
    </button>
  );
}
