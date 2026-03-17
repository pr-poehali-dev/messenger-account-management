export interface User {
  id: number;
  name: string;
  username: string;
  avatar: string;
  bio?: string;
  status?: string;
}

export interface ServerMessage {
  id: number;
  text: string;
  sender_id: number;
  created_at: string;
  is_read: boolean;
  sender: { username: string; name: string; avatar: string };
}

export interface ServerChat {
  id: number;
  participant: {
    id: number;
    username: string;
    name: string;
    avatar: string;
    last_seen: string;
  };
  last_message: {
    text: string;
    created_at: string;
    sender_id: number;
  } | null;
}
