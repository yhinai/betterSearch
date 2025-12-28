/**
 * ElevenLabs Comprehensive Voice Service
 * Full integration with ElevenLabs API for voice, audio, and AI features
 */

import { MODELS } from '../constants';

const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';

// Default voice ID (Rachel - clear, professional voice)
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

// ========================================
// CORE: Signed URL for Agent Connection
// ========================================

export const getSignedUrl = async (agentId: string, apiKey: string): Promise<string> => {
    const response = await fetch(`${ELEVENLABS_API_BASE}/convai/conversation/get-signed-url?agent_id=${agentId}`, {
        method: 'GET',
        headers: { 'xi-api-key': apiKey },
    });

    if (!response.ok) throw new Error(`Failed to get signed URL: ${response.statusText}`);
    const data = await response.json();
    return data.signed_url;
};

// ========================================
// TEXT-TO-SPEECH (TTS)
// ========================================

export interface TTSOptions {
    voiceId?: string;
    modelId?: string;
    stability?: number;
    similarityBoost?: number;
    style?: number;
    useSpeakerBoost?: boolean;
    speed?: number;
    language?: string;
}

export const speakText = async (
    text: string,
    apiKey: string,
    options: TTSOptions = {}
): Promise<HTMLAudioElement> => {
    const {
        voiceId = DEFAULT_VOICE_ID,
        modelId = MODELS.ELEVEN_FLASH,
        stability = 0.5,
        similarityBoost = 0.75,
        style = 0,
        useSpeakerBoost = true,
        speed = 1.0,
    } = options;

    const response = await fetch(`${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}/stream`, {
        method: 'POST',
        headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            text,
            model_id: modelId,
            voice_settings: {
                stability,
                similarity_boost: similarityBoost,
                style,
                use_speaker_boost: useSpeakerBoost,
            },
            speed,
        }),
    });

    if (!response.ok) throw new Error(`TTS failed: ${response.statusText}`);

    const blob = await response.blob();
    const audio = new Audio(URL.createObjectURL(blob));
    audio.play();
    return audio;
};

// Non-playing version that returns blob
export const textToSpeechBlob = async (
    text: string,
    apiKey: string,
    options: TTSOptions = {}
): Promise<Blob> => {
    const { voiceId = DEFAULT_VOICE_ID, modelId = MODELS.ELEVEN_FLASH } = options;

    const response = await fetch(`${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            text,
            model_id: modelId,
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
    });

    if (!response.ok) throw new Error(`TTS failed: ${response.statusText}`);
    return response.blob();
};

// ========================================
// SPEECH-TO-TEXT (STT) - Scribe
// ========================================

export interface STTOptions {
    languageCode?: string;
    diarize?: boolean;
}

export const transcribeAudio = async (
    audioBlob: Blob,
    apiKey: string,
    options: STTOptions = {}
): Promise<string> => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    if (options.languageCode) {
        formData.append('language_code', options.languageCode);
    }
    if (options.diarize) {
        formData.append('diarize', 'true');
    }

    const response = await fetch(`${ELEVENLABS_API_BASE}/speech-to-text`, {
        method: 'POST',
        headers: { 'xi-api-key': apiKey },
        body: formData,
    });

    if (!response.ok) throw new Error(`STT failed: ${response.statusText}`);
    const data = await response.json();
    return data.text || '';
};

// ========================================
// SOUND EFFECTS
// ========================================

export const generateSoundEffect = async (
    description: string,
    apiKey: string,
    durationSeconds: number = 1.5,
    loop: boolean = false
): Promise<HTMLAudioElement> => {
    const response = await fetch(`${ELEVENLABS_API_BASE}/sound-generation`, {
        method: 'POST',
        headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            text: description,
            duration_seconds: Math.max(0.5, Math.min(5, durationSeconds)),
        }),
    });

    if (!response.ok) throw new Error(`Sound effect failed: ${response.statusText}`);

    const blob = await response.blob();
    const audio = new Audio(URL.createObjectURL(blob));
    audio.loop = loop;
    audio.play();
    return audio;
};

// Pre-defined achievement sounds
export const playAchievementSound = (apiKey: string) =>
    generateSoundEffect("Triumphant digital success chime, sparkling and positive", apiKey, 1.5);

export const playErrorSound = (apiKey: string) =>
    generateSoundEffect("Soft digital error notification, not harsh", apiKey, 0.8);

export const playNotificationSound = (apiKey: string) =>
    generateSoundEffect("Gentle notification ping, soft and modern", apiKey, 0.5);

// ========================================
// VOICE MANAGEMENT
// ========================================

export interface Voice {
    voice_id: string;
    name: string;
    category?: string;
    description?: string;
    labels?: Record<string, string>;
    preview_url?: string;
}

export const getVoices = async (apiKey: string): Promise<Voice[]> => {
    const response = await fetch(`${ELEVENLABS_API_BASE}/voices`, {
        method: 'GET',
        headers: { 'xi-api-key': apiKey },
    });

    if (!response.ok) throw new Error(`Failed to fetch voices: ${response.statusText}`);
    const data = await response.json();
    return data.voices || [];
};

export const searchVoices = async (
    apiKey: string,
    query: string,
    sort: 'created_at_unix' | 'name' = 'name',
    sortDirection: 'asc' | 'desc' = 'asc'
): Promise<Voice[]> => {
    const voices = await getVoices(apiKey);
    const lowerQuery = query.toLowerCase();
    return voices
        .filter(v =>
            v.name.toLowerCase().includes(lowerQuery) ||
            v.description?.toLowerCase().includes(lowerQuery) ||
            v.category?.toLowerCase().includes(lowerQuery)
        )
        .sort((a, b) => {
            if (sort === 'name') {
                return sortDirection === 'asc'
                    ? a.name.localeCompare(b.name)
                    : b.name.localeCompare(a.name);
            }
            return 0;
        });
};

export const getVoice = async (apiKey: string, voiceId: string): Promise<Voice> => {
    const response = await fetch(`${ELEVENLABS_API_BASE}/voices/${voiceId}`, {
        method: 'GET',
        headers: { 'xi-api-key': apiKey },
    });

    if (!response.ok) throw new Error(`Failed to fetch voice: ${response.statusText}`);
    return response.json();
};

export const searchVoiceLibrary = async (
    apiKey: string,
    query: string,
    page: number = 0,
    pageSize: number = 10
): Promise<Voice[]> => {
    const params = new URLSearchParams({
        page_size: pageSize.toString(),
        page: page.toString(),
    });
    if (query) params.append('search', query);

    const response = await fetch(`${ELEVENLABS_API_BASE}/shared-voices?${params}`, {
        method: 'GET',
        headers: { 'xi-api-key': apiKey },
    });

    if (!response.ok) throw new Error(`Failed to search voice library: ${response.statusText}`);
    const data = await response.json();
    return data.voices || [];
};

// ========================================
// VOICE CLONING
// ========================================

export const cloneVoice = async (
    apiKey: string,
    name: string,
    audioFiles: File[],
    description?: string
): Promise<Voice> => {
    const formData = new FormData();
    formData.append('name', name);
    if (description) formData.append('description', description);

    audioFiles.forEach((file, i) => {
        formData.append('files', file);
    });

    const response = await fetch(`${ELEVENLABS_API_BASE}/voices/add`, {
        method: 'POST',
        headers: { 'xi-api-key': apiKey },
        body: formData,
    });

    if (!response.ok) throw new Error(`Voice clone failed: ${response.statusText}`);
    return response.json();
};

// ========================================
// SPEECH-TO-SPEECH (Voice Transform)
// ========================================

export const speechToSpeech = async (
    apiKey: string,
    audioBlob: Blob,
    targetVoiceId: string
): Promise<HTMLAudioElement> => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'input.webm');
    formData.append('model_id', MODELS.ELEVEN_FLASH);

    const response = await fetch(`${ELEVENLABS_API_BASE}/speech-to-speech/${targetVoiceId}`, {
        method: 'POST',
        headers: { 'xi-api-key': apiKey },
        body: formData,
    });

    if (!response.ok) throw new Error(`Speech-to-speech failed: ${response.statusText}`);

    const blob = await response.blob();
    const audio = new Audio(URL.createObjectURL(blob));
    audio.play();
    return audio;
};

// ========================================
// AUDIO ISOLATION (Remove Background)
// ========================================

export const isolateAudio = async (
    apiKey: string,
    audioBlob: Blob
): Promise<Blob> => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'input.mp3');

    const response = await fetch(`${ELEVENLABS_API_BASE}/audio-isolation`, {
        method: 'POST',
        headers: { 'xi-api-key': apiKey },
        body: formData,
    });

    if (!response.ok) throw new Error(`Audio isolation failed: ${response.statusText}`);
    return response.blob();
};

// ========================================
// MUSIC COMPOSITION
// ========================================

export interface CompositionPlan {
    plan: any; // Complex nested structure
}

export const createCompositionPlan = async (
    apiKey: string,
    prompt: string,
    lengthMs?: number
): Promise<CompositionPlan> => {
    const body: any = { prompt };
    if (lengthMs) body.music_length_ms = lengthMs;

    const response = await fetch(`${ELEVENLABS_API_BASE}/music/create-composition-plan`, {
        method: 'POST',
        headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error(`Composition plan failed: ${response.statusText}`);
    return response.json();
};

export const composeMusic = async (
    apiKey: string,
    prompt: string,
    lengthMs: number = 30000
): Promise<HTMLAudioElement> => {
    const response = await fetch(`${ELEVENLABS_API_BASE}/music/generate`, {
        method: 'POST',
        headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            prompt,
            music_length_ms: Math.max(10000, Math.min(300000, lengthMs)),
        }),
    });

    if (!response.ok) throw new Error(`Music composition failed: ${response.statusText}`);

    const blob = await response.blob();
    const audio = new Audio(URL.createObjectURL(blob));
    audio.play();
    return audio;
};

// ========================================
// AGENTS & KNOWLEDGE BASE
// ========================================

export interface Agent {
    agent_id: string;
    name: string;
    // ... other fields
}

export const listAgents = async (apiKey: string): Promise<Agent[]> => {
    const response = await fetch(`${ELEVENLABS_API_BASE}/convai/agents`, {
        method: 'GET',
        headers: { 'xi-api-key': apiKey },
    });

    if (!response.ok) throw new Error(`Failed to list agents: ${response.statusText}`);
    const data = await response.json();
    return data.agents || [];
};

export const getAgent = async (apiKey: string, agentId: string): Promise<Agent> => {
    const response = await fetch(`${ELEVENLABS_API_BASE}/convai/agents/${agentId}`, {
        method: 'GET',
        headers: { 'xi-api-key': apiKey },
    });

    if (!response.ok) throw new Error(`Failed to get agent: ${response.statusText}`);
    return response.json();
};

export const addKnowledgeBase = async (
    apiKey: string,
    agentId: string,
    name: string,
    content: { url?: string; text?: string; file?: File }
): Promise<void> => {
    const formData = new FormData();
    formData.append('name', name);

    if (content.url) formData.append('url', content.url);
    if (content.text) formData.append('text', content.text);
    if (content.file) formData.append('file', content.file);

    const response = await fetch(`${ELEVENLABS_API_BASE}/convai/agents/${agentId}/knowledge-base`, {
        method: 'POST',
        headers: { 'xi-api-key': apiKey },
        body: formData,
    });

    if (!response.ok) throw new Error(`Failed to add knowledge base: ${response.statusText}`);
};

// ========================================
// CONVERSATIONS
// ========================================

export interface Conversation {
    conversation_id: string;
    agent_id: string;
    start_time_unix: number;
    end_time_unix?: number;
    transcript?: string;
}

export const listConversations = async (
    apiKey: string,
    agentId?: string,
    pageSize: number = 30
): Promise<Conversation[]> => {
    const params = new URLSearchParams({ page_size: pageSize.toString() });
    if (agentId) params.append('agent_id', agentId);

    const response = await fetch(`${ELEVENLABS_API_BASE}/convai/conversations?${params}`, {
        method: 'GET',
        headers: { 'xi-api-key': apiKey },
    });

    if (!response.ok) throw new Error(`Failed to list conversations: ${response.statusText}`);
    const data = await response.json();
    return data.conversations || [];
};

export const getConversation = async (
    apiKey: string,
    conversationId: string
): Promise<Conversation> => {
    const response = await fetch(`${ELEVENLABS_API_BASE}/convai/conversations/${conversationId}`, {
        method: 'GET',
        headers: { 'xi-api-key': apiKey },
    });

    if (!response.ok) throw new Error(`Failed to get conversation: ${response.statusText}`);
    return response.json();
};

// ========================================
// SUBSCRIPTION & MODELS
// ========================================

export interface Subscription {
    tier: string;
    character_count: number;
    character_limit: number;
    can_extend_character_limit: boolean;
    next_character_count_reset_unix: number;
}

export const checkSubscription = async (apiKey: string): Promise<Subscription> => {
    const response = await fetch(`${ELEVENLABS_API_BASE}/user/subscription`, {
        method: 'GET',
        headers: { 'xi-api-key': apiKey },
    });

    if (!response.ok) throw new Error(`Failed to check subscription: ${response.statusText}`);
    return response.json();
};

export interface Model {
    model_id: string;
    name: string;
    can_be_finetuned: boolean;
    can_do_text_to_speech: boolean;
    can_do_voice_conversion: boolean;
    description: string;
    languages: { language_id: string; name: string }[];
}

export const listModels = async (apiKey: string): Promise<Model[]> => {
    const response = await fetch(`${ELEVENLABS_API_BASE}/models`, {
        method: 'GET',
        headers: { 'xi-api-key': apiKey },
    });

    if (!response.ok) throw new Error(`Failed to list models: ${response.statusText}`);
    return response.json();
};

// ========================================
// AUDIO PLAYBACK UTILITIES
// ========================================

export const playAudioFile = async (filePath: string): Promise<HTMLAudioElement> => {
    const audio = new Audio(filePath);
    audio.play();
    return audio;
};

export const stopAudio = (audio: HTMLAudioElement): void => {
    audio.pause();
    audio.currentTime = 0;
};

export const pauseAudio = (audio: HTMLAudioElement): void => {
    audio.pause();
};

export const resumeAudio = (audio: HTMLAudioElement): void => {
    audio.play();
};
