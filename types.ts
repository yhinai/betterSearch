
export interface Attachment {
  type: 'image' | 'file';
  mimeType: string;
  data: string; // base64
  name?: string;
}

export interface GraphonSource {
  node_type: 'video' | 'document' | 'image';
  video_name?: string;
  start_time?: number;
  end_time?: number;
  time_limited_url?: string;
  pdf_name?: string;
  page_num?: number;
  text?: string;
  image_name?: string;
}

export interface Message {
  id: string;
  chatId?: string;
  role: 'user' | 'model' | 'system';
  text: string;
  comparisonText?: string;
  timestamp?: number;
  attachments?: Attachment[];
  graphonSources?: GraphonSource[];
}

export interface ChatSession {
  id: string;
  title: string;
  timestamp: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  timestamp: number;
}

export interface AppConfig {
  provider: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  mode: string;
  systemInstruction?: string;
  useGraphon?: boolean;  // Enable Knowledge Graph mode
  graphonGroupId?: string;  // Active Graphon group ID
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number; // 0-3
  explanation: string;
}
