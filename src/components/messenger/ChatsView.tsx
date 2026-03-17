import { useState, useRef, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { User, ServerChat, ServerMessage } from './types';
import { api } from '@/lib/api';

interface ChatsViewProps {
  currentUser: User;
}

function formatTime(ts: string | number) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000 && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('ru', { day: '2-digit', month: '2-digit' });
}

function isOnline(lastSeen: string) {
  return Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000;
}

export default function ChatsView({ currentUser }: ChatsViewProps) {
  const [chats, setChats] = useState<ServerChat[]>([]);
  const [activeChat, setActiveChat] = useState<ServerChat | null>(null);
  const [messages, setMessages] = useState<ServerMessage[]>([]);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMsgTime = useRef<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadChats = useCallback(async () => {
    try {
      const data = await api.getChatList(currentUser.id);
      setChats(data.chats);
    } finally {
      setLoading(false);
    }
  }, [currentUser.id]);

  const loadMessages = useCallback(async (chatId: number, since?: string) => {
    const data = await api.getMessages(chatId, currentUser.id, since);
    if (data.messages.length > 0) {
      lastMsgTime.current = data.messages[data.messages.length - 1].created_at;
      if (since) {
        setMessages(prev => [...prev, ...data.messages]);
      } else {
        setMessages(data.messages);
        if (data.messages.length > 0) {
          lastMsgTime.current = data.messages[data.messages.length - 1].created_at;
        }
      }
    }
  }, [currentUser.id]);

  useEffect(() => { loadChats(); }, [loadChats]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    if (!activeChat) { if (pollRef.current) clearInterval(pollRef.current); return; }

    loadMessages(activeChat.id);

    pollRef.current = setInterval(async () => {
      if (lastMsgTime.current) {
        await loadMessages(activeChat.id, lastMsgTime.current);
      }
      await loadChats();
    }, 3000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeChat?.id]);

  const openChat = async (chat: ServerChat) => {
    setActiveChat(chat);
    setMessages([]);
    lastMsgTime.current = null;
  };

  const sendMessage = async () => {
    if (!message.trim() || !activeChat || sending) return;
    const text = message.trim();
    setMessage('');
    setSending(true);

    const optimistic: ServerMessage = {
      id: Date.now(),
      text,
      sender_id: currentUser.id,
      created_at: new Date().toISOString(),
      is_read: false,
      sender: { username: currentUser.username, name: currentUser.name, avatar: currentUser.avatar },
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      const data = await api.sendMessage(activeChat.id, currentUser.id, text);
      setMessages(prev => prev.map(m => m.id === optimistic.id ? { ...data.message, sender: optimistic.sender } : m));
      lastMsgTime.current = data.message.created_at;
      loadChats();
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setMessage(text);
    } finally {
      setSending(false);
    }
  };

  const filteredChats = chats.filter(chat => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      chat.participant.name.toLowerCase().includes(q) ||
      chat.participant.username.toLowerCase().includes(q) ||
      chat.last_message?.text.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex h-full">
      <div className={`flex flex-col border-r border-border ${activeChat ? 'hidden md:flex md:w-72 lg:w-80' : 'flex w-full md:w-72 lg:w-80'}`}>
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold mb-3">Сообщения</h2>
          <div className="relative">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text" placeholder="Поиск чатов..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center h-20 text-muted-foreground">
              <Icon name="Loader" size={20} className="animate-spin" />
            </div>
          )}
          {!loading && filteredChats.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
              <Icon name="MessageSquare" size={32} className="mb-2 opacity-30" />
              {search ? 'Ничего не найдено' : 'Нет чатов. Начните общение через Контакты'}
            </div>
          )}
          {filteredChats.map((chat, i) => {
            const online = isOnline(chat.participant.last_seen);
            const isActive = activeChat?.id === chat.id;
            return (
              <button
                key={chat.id}
                onClick={() => openChat(chat)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 transition-colors text-left animate-fade-in ${isActive ? 'bg-primary/10 border-r-2 border-primary' : ''}`}
                style={{ animationDelay: `${i * 0.03}s` }}
              >
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                    {chat.participant.avatar || chat.participant.name.charAt(0).toUpperCase()}
                  </div>
                  {online && <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm truncate">{chat.participant.name}</span>
                    {chat.last_message && (
                      <span className="text-xs text-muted-foreground ml-2 shrink-0">{formatTime(chat.last_message.created_at)}</span>
                    )}
                  </div>
                  {chat.last_message && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {chat.last_message.sender_id === currentUser.id && <span className="text-primary/70">Вы: </span>}
                      {chat.last_message.text}
                    </p>
                  )}
                </div>
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
              <button onClick={() => setActiveChat(null)} className="md:hidden text-muted-foreground hover:text-foreground transition-colors p-1">
                <Icon name="ArrowLeft" size={20} />
              </button>
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                  {activeChat.participant.avatar || activeChat.participant.name.charAt(0).toUpperCase()}
                </div>
                {isOnline(activeChat.participant.last_seen) && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-background" />
                )}
              </div>
              <div>
                <p className="font-semibold text-sm">{activeChat.participant.name}</p>
                <p className={`text-xs ${isOnline(activeChat.participant.last_seen) ? 'text-green-500' : 'text-muted-foreground'}`}>
                  {isOnline(activeChat.participant.last_seen) ? 'В сети' : 'Не в сети'}
                </p>
              </div>
              <div className="ml-auto flex gap-1">
                <button className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                  <Icon name="Phone" size={18} />
                </button>
                <button className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                  <Icon name="Video" size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.map((msg) => {
                const isMe = msg.sender_id === currentUser.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                    <div className={`max-w-[70%] px-4 py-2.5 ${isMe ? 'msg-bubble-out' : 'msg-bubble-in'}`}>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-xs opacity-50">{formatTime(msg.created_at)}</span>
                        {isMe && <Icon name={msg.is_read ? 'CheckCheck' : 'Check'} size={12} className={msg.is_read ? 'text-primary opacity-70' : 'opacity-40'} />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="px-4 py-3 border-t border-border bg-card/30">
              <div className="flex gap-2 items-end">
                <div className="flex-1 relative">
                  <input
                    type="text" value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Напишите сообщение..."
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!message.trim() || sending}
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
