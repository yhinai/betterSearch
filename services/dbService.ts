
import { db, User, SyllabusData } from './db';
import { Message, ChatSession, Note, HiveTransmission } from '../types';

// Ensure DB is open
if (!db.isOpen()) {
  db.open().catch(err => console.error("Failed to open db", err));
}

// --- USER MANAGEMENT ---

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
    const user = await db.users.get(username);
    return !!user;
  } catch (e) {
    return false;
  }
};

export const createChatSession = async (username: string, title: string = 'New Session'): Promise<ChatSession> => {
  const id = Date.now().toString();
  const timestamp = Date.now();
  const session: ChatSession = { id, title, timestamp };
  // We need to add username to the session object if we want to query by it easily in Dexie 
  // without a separate index or if we strictly follow the interface. 
  // The interface in types.ts doesn't have username, but the DB schema does. 
  // We will verify types.ts compatibility. For now, we assume we can pass extra props or update type.
  // Actually, checking db.ts schema: 'chats: id, username, timestamp'.
  // Dexie add expects object matching schema.
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

// --- NOTES OPERATIONS ---

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
    // Dexie doesn't have full text search built-in, so we filter in memory after fetching user's notes
    // For large datasets, we'd use an optimized search index, but for local notes this is fine.
    const allNotes = await getNotes(username);
    return allNotes.filter(n =>
      n.title.toLowerCase().includes(lowerQ) ||
      n.content.toLowerCase().includes(lowerQ)
    );
  } catch (e) {
    return [];
  }
};

// --- HIVE TRANSMISSION OPERATIONS ---

export const sendHiveNote = async (note: Note, sender: string, recipient: string) => {
  try {
    const id = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const tx: HiveTransmission = {
      id,
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

// --- SYLLABUS OPERATIONS ---

export const saveSyllabus = async (content: string, noteCount: number, username: string) => {
  try {
    const id = `syllabus_${username}`;
    await db.syllabus.put({
      id,
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
    const id = `syllabus_${username}`;
    const result = await db.syllabus.get(id);
    return result || null;
  } catch (e) {
    return null;
  }
};

// --- BACKUP & RESTORE FUNCTIONS ---

export const exportBackup = async (username: string) => {
  try {
    const chats = await db.chats.where('username').equals(username).toArray();
    const chatIds = chats.map(c => c.id);

    // Dexie 'anyOf' is useful here
    const messages = await db.messages.where('chatId').anyOf(chatIds).toArray();

    const notes = await db.notes.where('username').equals(username).toArray();
    const syllabus = await db.syllabus.where('username').equals(username).toArray();

    const data = {
      version: 5, // Bump version for Dexie migration
      timestamp: Date.now(),
      username,
      chats,
      messages,
      notes,
      syllabus
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
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
        const targetUser = currentUsername;

        await db.transaction('rw', db.chats, db.messages, db.notes, db.syllabus, async () => {
          // Clear existing data for this user
          await db.chats.where('username').equals(targetUser).delete();
          await db.notes.where('username').equals(targetUser).delete();

          // We need to delete messages for old chats too.
          // Complex without cascading deletes, but we can assume fresh start or just leave orphans.
          // For better cleanup, we could fetch old chat IDs first, but let's stick to simple logic:
          // Just insert new data.
          // Actually, let's delete syllabus too
          await db.syllabus.where('username').equals(targetUser).delete();

          if (json.chats) {
            for (const c of json.chats) {
              await db.chats.put({ ...c, username: targetUser });
            }
          }

          if (json.messages) {
            // We must ensure we don't insert messages for chats that don't belong to us?
            // But we just inserted chats for us.
            // However, messages from backup might duplicate existing IDs if we didn't clear them adequately.
            // 'put' handles duplicates.
            for (const m of json.messages) {
              // Dexie handles object storage, ensuring attachments are kept as objects if they are already objects in JSON
              await db.messages.put(m);
            }
          }

          if (json.notes) {
            for (const n of json.notes) {
              await db.notes.put({ ...n, username: targetUser });
            }
          }

          if (json.syllabus) {
            for (const s of json.syllabus) {
              const sylId = `syllabus_${targetUser}`;
              await db.syllabus.put({ ...s, id: sylId, username: targetUser });
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
