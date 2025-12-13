/**
 * Graphon.ai Bridge Service
 * Handles communication with the Python Neural Bridge server
 */

const BRIDGE_URL = 'http://localhost:8000';

// Types
export interface GraphonSource {
    node_type: 'video' | 'document' | 'image';
    video_name?: string;
    start_time?: number;
    end_time?: number;
    pdf_name?: string;
    page_num?: number;
    text?: string;
}

export interface GraphonQueryResponse {
    answer: string;
    sources: GraphonSource[];
}

export interface GraphonIngestResponse {
    status: 'success' | 'error';
    group_id?: string;
    message: string;
    files_processed: number;
}

export interface GraphonHealthResponse {
    status: string;
    graphon_connected: boolean;
    active_group: string | null;
}

/**
 * Check if the Neural Bridge server is running
 */
export const checkBridgeHealth = async (): Promise<GraphonHealthResponse> => {
    try {
        const res = await fetch(`${BRIDGE_URL}/health`);
        return await res.json();
    } catch (e) {
        return {
            status: 'offline',
            graphon_connected: false,
            active_group: null
        };
    }
};

/**
 * Upload files to Graphon Knowledge Graph
 * @param files - Array of files to upload
 * @returns Group ID of the created knowledge graph
 */
export const uploadToGraphon = async (files: File[]): Promise<GraphonIngestResponse> => {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));

    const res = await fetch(`${BRIDGE_URL}/ingest`, {
        method: 'POST',
        body: formData
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Upload failed');
    }

    return await res.json();
};

/**
 * Query the Graphon Knowledge Graph
 * @param query - Natural language question
 * @param groupId - Optional specific group ID to query
 * @returns Answer with source citations
 */
export const queryGraphon = async (
    query: string,
    groupId?: string
): Promise<GraphonQueryResponse> => {
    const formData = new FormData();
    formData.append('query', query);
    if (groupId) formData.append('group_id', groupId);

    const res = await fetch(`${BRIDGE_URL}/query`, {
        method: 'POST',
        body: formData
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Query failed');
    }

    return await res.json();
};

/**
 * Get the currently active knowledge graph group
 */
export const getCurrentGroup = async (): Promise<{ group_id: string | null }> => {
    try {
        const res = await fetch(`${BRIDGE_URL}/group`);
        return await res.json();
    } catch (e) {
        return { group_id: null };
    }
};

/**
 * Clear the active knowledge graph
 */
export const clearGraphonGroup = async (): Promise<void> => {
    await fetch(`${BRIDGE_URL}/group`, { method: 'DELETE' });
};

/**
 * Format Graphon sources for display
 */
export const formatGraphonSources = (sources: GraphonSource[]): string => {
    if (!sources || sources.length === 0) return '';

    const formatted = sources.map(src => {
        if (src.node_type === 'video' && src.video_name) {
            const start = src.start_time ? `${Math.floor(src.start_time)}s` : '';
            const end = src.end_time ? ` - ${Math.floor(src.end_time)}s` : '';
            return `🎥 **${src.video_name}** ${start}${end}`;
        } else if (src.node_type === 'document' && src.pdf_name) {
            const page = src.page_num ? ` (Page ${src.page_num})` : '';
            return `📄 **${src.pdf_name}**${page}`;
        } else if (src.node_type === 'image') {
            return `🖼️ Image source`;
        }
        return null;
    }).filter(Boolean);

    return formatted.length > 0 ? `\n\n**Sources:**\n${formatted.join('\n')}` : '';
};
