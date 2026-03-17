import { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { User, Chat, Message } from './types';

interface ChatsViewProps {
  currentUser: User;
}

const DEMO_CHATS: Chat[] = [
  {
    id: 'demo_1',
    participants: ['demo_alex', 'me'],
    messages: [
      { id: '1', text: 'Привет! Как дела?', from: 'demo_alex', timestamp: Date.now() - 3600000, read: true },
      { id: '2', text: 'Отлично, спасибо! А у тебя?', from: 'me', timestamp: Date.now() - 3500000, read: true },
      { id: '3', text: 'Тоже хорошо 😊 Встретимся сегодня?', from: 'demo_alex', timestamp: Date.now() - 600000, read: false },
    ]
  },
  {
    id: 'demo_2',
    participants: ['demo_maria', 'me'],
    messages: [
      { id: '1', text: 'Посмотри файл, который я отправила', from: 'demo_maria', timestamp: Date.now() - 86400000, read: true },
      { id: '2', text: 'Увидел, спасибо!', from: 'me', timestamp: Date.now() - 82800000, read: true },
    ]
  }
];

const DEMO_USERS: Record<string, { name: string; avatar: string; online: boolean }> = {
  demo_alex: { name: 'Алексей Иванов', avatar: 'А', online: true },
  demo_maria: { name: 'Мария Смирнова', avatar: 'М', online: false },
};

function formatTime(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - ts;
  if (diff < 86400000 && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('ru', { day: '2-digit', month: '2-digit' });
}

export default function ChatsView({ currentUser }: ChatsViewProps) {
  const [chats, setChats] = useState<Chat[]>(() => {
    const saved = localStorage.getItem(`vector_chats_${currentUser.username}`);
    return saved ? JSON.parse(saved) : DEMO_CHATS;
  });
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages.length]);

  const saveChats = (updated: Chat[]) => {
    setChats(updated);
    localStorage.setItem(`vector_chats_${currentUser.username}`, JSON.stringify(updated));
  };

  const sendMessage = () => {
    if (!message.trim() || !activeChat) return;
    const newMsg: Message = {
      id: Date.now().toString(),
      text: message.trim(),
      from: currentUser.username,
      timestamp: Date.now(),
      read: false,
    };
    const updated = chats.map(c =>
      c.id === activeChat.id ? { ...c, messages: [...c.messages, newMsg] } : c
    );
    saveChats(updated);
    setActiveChat(prev => prev ? { ...prev, messages: [...prev.messages, newMsg] } : prev);
    setMessage('');
  };

  const getOtherParticipant = (chat: Chat) => {
    return chat.participants.find(p => p !== currentUser.username && p !== 'me') || '';
  };

  const filteredChats = chats.filter(chat => {
    if (!search.trim()) return true;
    const other = getOtherParticipant(chat);
    const info = DEMO_USERS[other];
    const name = info?.name.toLowerCase() || other.toLowerCase();
    const q = search.toLowerCase();
    const hasMsg = chat.messages.some(m => m.text.toLowerCase().includes(q));
    return name.includes(q) || hasMsg;
  });

  return (
    <div className="flex h-full">
      <div className={`flex flex-col border-r border-border ${activeChat ? 'hidden md:flex md:w-72 lg:w-80' : 'flex w-full md:w-72 lg:w-80'}`}>
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold mb-3">Сообщения</h2>
          <div className="relative">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Поиск чатов..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredChats.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
              <Icon name="MessageSquare" size={32} className="mb-2 opacity-30" />
              Ничего не найдено
            </div>
          )}
          {filteredChats.map(chat => {
            const other = getOtherParticipant(chat);
            const info = DEMO_USERS[other];
            const lastMsg = chat.messages[chat.messages.length - 1];
            const unread = chat.messages.filter(m => m.from !== currentUser.username && m.from !== 'me' && !m.read).length;
            const isActive = activeChat?.id === chat.id;
            return (
              <button
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 transition-colors text-left ${isActive ? 'bg-primary/10 border-r-2 border-primary' : ''}`}
              >
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                    {info?.avatar || other.charAt(0).toUpperCase()}
                  </div>
                  {info?.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm truncate">{info?.name || other}</span>
                    {lastMsg && <span className="text-xs text-muted-foreground ml-2 shrink-0">{formatTime(lastMsg.timestamp)}</span>}
                  </div>
                  {lastMsg && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {(lastMsg.from === currentUser.username || lastMsg.from === 'me') && <span className="text-primary/70">Вы: </span>}
                      {lastMsg.text}
                    </p>
                  )}
                </div>
                {unread > 0 && (
                  <span className="shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                    {unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className={`flex-1 flex flex-col ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        {!activeChat ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Icon name="MessageCircle" size={36} className="opacity-40" />
            </div>
            <p className="text-sm font-medium">Выберите чат</p>
            <p className="text-xs mt-1 opacity-60">чтобы начать общение</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/50">
              <button
                onClick={() => setActiveChat(null)}
                className="md:hidden text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <Icon name="ArrowLeft" size={20} />
              </button>
              {(() => {
                const other = getOtherParticipant(activeChat);
                const info = DEMO_USERS[other];
                return (
                  <>
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                        {info?.avatar || other.charAt(0).toUpperCase()}
                      </div>
                      {info?.online && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-background" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{info?.name || other}</p>
                      <p className={`text-xs ${info?.online ? 'text-green-500' : 'text-muted-foreground'}`}>
                        {info?.online ? 'В сети' : 'Не в сети'}
                      </p>
                    </div>
                  </>
                );
              })()}
              <div className="ml-auto flex gap-1">
                <button className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                  <Icon name="Phone" size={18} />
                </button>
                <button className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                  <Icon name="Video" size={18} />
                </button>
                <button className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                  <Icon name="MoreVertical" size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {activeChat.messages.map((msg, i) => {
                const isMe = msg.from === currentUser.username || msg.from === 'me';
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`} style={{ animationDelay: `${i * 0.02}s` }}>
                    <div className={`max-w-[70%] px-4 py-2.5 ${isMe ? 'msg-bubble-out' : 'msg-bubble-in'}`}>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-xs opacity-50">{formatTime(msg.timestamp)}</span>
                        {isMe && <Icon name="CheckCheck" size={12} className="opacity-50" />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="px-4 py-3 border-t border-border bg-card/30">
              <div className="flex gap-2 items-end">
                <button className="p-2.5 text-muted-foreground hover:text-primary transition-colors rounded-xl hover:bg-secondary">
                  <Icon name="Paperclip" size={18} />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Напишите сообщение..."
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!message.trim()}
                  className="p-2.5 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-primary-foreground rounded-xl transition-all hover:scale-105 active:scale-95"
                >
                  <Icon name="Send" size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
