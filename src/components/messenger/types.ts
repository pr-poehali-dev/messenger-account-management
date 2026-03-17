export interface User {
  name: string;
  username: string;
  avatar: string;
  password?: string;
  bio?: string;
  status?: string;
}

export interface Message {
  id: string;
  text: string;
  from: string;
  timestamp: number;
  read: boolean;
}

export interface Chat {
  id: string;
  participants: string[];
  messages: Message[];
  lastSeen?: number;
}

export interface Contact {
  username: string;
  name: string;
  avatar: string;
  online?: boolean;
  lastSeen?: number;
}
