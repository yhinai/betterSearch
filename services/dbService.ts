/**
 * Database Service - Dexie IndexedDB wrapper
 * Handles all local storage operations for chats, messages, notes, and syllabus
 */

import Dexie, { Table } from 'dexie';
import { ChatSession, Message, Note, HiveTransmission } from '../types';

// --- Database Schema ---

export interface User {
  username: string;
  lastLogin: number;
}

export interface SyllabusData {
  id: string;
  content: string;
  noteCount: number;
  timestamp: number;
  username: string;
}

class BetterSearchDB extends Dexie {
  chats!: Table<ChatSession>;
  messages!: Table<Message>;
  notes!: Table<Note>;
  syllabus!: Table<SyllabusData>;
  hive_transmissions!: Table<HiveTransmission>;
  users!: Table<User>;

  constructor() {
    super('betterSearch_db');
    this.version(1).stores({
      chats: 'id, username, timestamp',
      messages: 'id, chatId, role, timestamp',
      notes: 'id, username, title',
      syllabus: 'id, username',
      hive_transmissions: 'id, recipient, timestamp',
      users: 'username'
    });
  }
}

const db = new BetterSearchDB();
if (!db.isOpen()) {
  db.open().catch(err => console.error("Failed to open db", err));
}

// --- User Management ---

export const ensureUserExists = async (username: string) => {
  try {
    const user = await db.users.get(username);
    if (!user) {
      await db.users.add({ username, lastLogin: Date.now() });
    } else {
      await db.users.update(username, { lastLogin: Date.now() });
    }
  } catch (e) {
    console.error("Failed to ensure user exists", e);
  }
};

export const checkUserExists = async (username: string): Promise<boolean> => {
  try {
    return !!(await db.users.get(username));
  } catch (e) {
    return false;
  }
};

// --- Chat Operations ---

export const createChatSession = async (username: string, title: string = 'New Session'): Promise<ChatSession> => {
  const id = Date.now().toString();
  const session: ChatSession = { id, title, timestamp: Date.now() };
  await db.chats.add({ ...session, username } as any);
  return session;
};

export const getChatSessions = async (username: string): Promise<ChatSession[]> => {
  try {
    return await db.chats.where('username').equals(username).reverse().sortBy('timestamp');
  } catch (e) {
    return [];
  }
};

export const saveMessage = async (message: Message) => {
  try {
    await db.messages.put(message);
  } catch (e) {
    console.error("Failed to save message", e);
  }
};

export const getMessagesByChatId = async (chatId: string): Promise<Message[]> => {
  try {
    return await db.messages.where('chatId').equals(chatId).sortBy('timestamp');
  } catch (e) {
    return [];
  }
};

export const updateChatTitle = async (chatId: string, title: string) => {
  try {
    await db.chats.update(chatId, { title });
  } catch (e) {
    console.error("Failed to update title", e);
  }
};

export const deleteChatSession = async (chatId: string) => {
  try {
    await db.transaction('rw', db.chats, db.messages, async () => {
      await db.messages.where('chatId').equals(chatId).delete();
      await db.chats.delete(chatId);
    });
  } catch (e) {
    console.error("Failed to delete session", e);
  }
};

// --- Notes Operations ---

export const saveNote = async (note: Note, username: string) => {
  try {
    await db.notes.put({ ...note, username } as any);
  } catch (e) {
    console.error("Failed to save note", e);
  }
};

export const getNotes = async (username: string): Promise<Note[]> => {
  try {
    return await db.notes.where('username').equals(username).reverse().sortBy('timestamp');
  } catch (e) {
    return [];
  }
};

export const deleteNote = async (id: string) => {
  try {
    await db.notes.delete(id);
  } catch (e) {
    console.error("Failed to delete note", e);
  }
};

export const searchNotes = async (username: string, query: string): Promise<Note[]> => {
  try {
    const lowerQ = query.toLowerCase();
    const allNotes = await getNotes(username);
    return allNotes.filter(n =>
      n.title.toLowerCase().includes(lowerQ) ||
      n.content.toLowerCase().includes(lowerQ)
    );
  } catch (e) {
    return [];
  }
};

// --- Hive Transmission Operations ---

export const sendHiveNote = async (note: Note, sender: string, recipient: string) => {
  try {
    const tx: HiveTransmission = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: note.title,
      content: note.content,
      sender,
      recipient,
      timestamp: Date.now()
    };
    await db.hive_transmissions.add(tx);
  } catch (e) {
    console.error("Failed to transmit note", e);
    throw e;
  }
};

export const getHiveTransmissions = async (recipient: string): Promise<HiveTransmission[]> => {
  try {
    return await db.hive_transmissions.where('recipient').equals(recipient).reverse().sortBy('timestamp');
  } catch (e) {
    return [];
  }
};

export const deleteHiveTransmission = async (id: string) => {
  try {
    await db.hive_transmissions.delete(id);
  } catch (e) {
    console.error("Failed to delete transmission", e);
  }
};

// --- Syllabus Operations ---

export const saveSyllabus = async (content: string, noteCount: number, username: string) => {
  try {
    await db.syllabus.put({
      id: `syllabus_${username}`,
      content,
      noteCount,
      timestamp: Date.now(),
      username
    });
  } catch (e) {
    console.error("Failed to save syllabus", e);
  }
};

export const getSyllabus = async (username: string): Promise<{ content: string, noteCount: number, timestamp: number } | null> => {
  try {
    return (await db.syllabus.get(`syllabus_${username}`)) || null;
  } catch (e) {
    return null;
  }
};

// --- Backup & Restore ---

export const exportBackup = async (username: string) => {
  try {
    const chats = await db.chats.where('username').equals(username).toArray();
    const messages = await db.messages.where('chatId').anyOf(chats.map(c => c.id)).toArray();
    const notes = await db.notes.where('username').equals(username).toArray();
    const syllabus = await db.syllabus.where('username').equals(username).toArray();

    const blob = new Blob([JSON.stringify({
      version: 5,
      timestamp: Date.now(),
      username,
      chats,
      messages,
      notes,
      syllabus
    }, null, 2)], { type: 'application/json' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bettersearch_${username}_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch (e) {
    console.error("Export failed", e);
    return false;
  }
};

export const importBackup = async (file: File, currentUsername: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);

        await db.transaction('rw', db.chats, db.messages, db.notes, db.syllabus, async () => {
          await db.chats.where('username').equals(currentUsername).delete();
          await db.notes.where('username').equals(currentUsername).delete();
          await db.syllabus.where('username').equals(currentUsername).delete();

          if (json.chats) {
            for (const c of json.chats) await db.chats.put({ ...c, username: currentUsername });
          }
          if (json.messages) {
            for (const m of json.messages) await db.messages.put(m);
          }
          if (json.notes) {
            for (const n of json.notes) await db.notes.put({ ...n, username: currentUsername });
          }
          if (json.syllabus) {
            for (const s of json.syllabus) {
              await db.syllabus.put({ ...s, id: `syllabus_${currentUsername}`, username: currentUsername });
            }
          }
        });
        resolve(true);
      } catch (err) {
        console.error("Import failed", err);
        reject(err);
      }
    };
    reader.readAsText(file);
  });
};
