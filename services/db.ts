
import Dexie, { Table } from 'dexie';
import { ChatSession, Message, Note, HiveTransmission } from '../types';

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

export class BetterSearchDB extends Dexie {
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
            messages: 'id, chatId, role, timestamp', // Index role for efficient filtering if needed
            notes: 'id, username, title',
            syllabus: 'id, username',
            hive_transmissions: 'id, recipient, timestamp',
            users: 'username'
        });
    }
}

export const db = new BetterSearchDB();
