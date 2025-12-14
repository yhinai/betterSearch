import { DEFAULT_CONFIG, MODELS } from '../constants';
import { AppConfig, Message } from '../types';
import { streamResponse } from './llmService';

// Types for Agent Reasoning
export interface AgentStep {
    id: string;
    thought: string;
    action: 'search' | 'graphon' | 'answer';
    query?: string;
    result?: string;
    status: 'pending' | 'executing' | 'completed' | 'failed';
}

export interface AgentPlan {
    goal: string;
    steps: AgentStep[];
}

export interface WebSearchResult {
    title: string;
    link: string;
    snippet: string;
}

// Tool Implementation
const searchWeb = async (query: string): Promise<string> => {
    try {
        const formData = new FormData();
        formData.append('query', query);
        formData.append('max_results', '5');

        const res = await fetch('http://localhost:8001/search', {
            method: 'POST',
            body: formData
        });

        if (!res.ok) throw new Error('Search failed');

        const data = await res.json();
        const results: WebSearchResult[] = data.results;

        if (results.length === 0) return "No relevant results found.";

        return results.map(r => `[${r.title}](${r.link}): ${r.snippet}`).join('\n\n');
    } catch (e) {
        return `Search Error: ${(e as Error).message}`;
    }
};

// --- Agent Logic ---

/**
 * Generates a research plan using the LLM.
 * We use a "Function Calling" style prompt to get strictly structured JSON.
 */
export const planResearch = async (
    config: AppConfig,
    goal: string
): Promise<AgentPlan> => {

    const prompt = `
    You are a Strategic Research Agent.
    Goal: "${goal}"

    Create a step-by-step plan to answer this goal rigorously.
    Available Tools:
    - "search": Web search for current info.
    - "graphon": Query local knowledge base (documents/videos).
    - "answer": Synthesize final answer (always the last step).

    CRITICAL: Output ONLY valid JSON in this format:
    {
      "goal": "${goal}",
      "steps": [
        { "id": "1", "action": "search", "query": "search query here", "thought": "reasoning" },
        { "id": "2", "action": "graphon", "query": "concept to look up", "thought": "checking local docs" },
        { "id": "3", "action": "answer", "thought": "synthesizing all findings" }
      ]
    }
  `;

    let jsonStr = "";
    // We use a temporary config with JSON mode if possible, or just raw text
    // For now, we'll try to extract JSON from the text stream
    await streamResponse(
        { ...config, model: MODELS.FAST }, // Use fast model for planning
        [],
        prompt,
        (chunk) => { jsonStr += chunk; }
    );

    try {
        // Clean markdown code blocks if present
        const cleanJson = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (e) {
        console.error("Failed to parse agent plan", e);
        // Fallback plan
        return {
            goal,
            steps: [
                { id: '1', thought: 'Fallback: searching web', action: 'search', query: goal, status: 'pending' },
                { id: '2', thought: 'Synthesizing', action: 'answer', status: 'pending' }
            ]
        };
    }
};

export const executeStep = async (step: AgentStep): Promise<string> => {
    switch (step.action) {
        case 'search':
            return await searchWeb(step.query || '');
        case 'graphon':
            // TODO: Call Graphon Bridge - for now mock or simple fetch if bridge is ready
            // We can use the fetch directly to localhost:8001/query
            try {
                const formData = new FormData();
                formData.append('query', step.query || '');
                const res = await fetch('http://localhost:8001/query', { method: 'POST', body: formData });
                const data = await res.json();
                return `Graphon Answer: ${data.answer}\nSources: ${JSON.stringify(data.sources)}`;
            } catch (e) {
                return "Graphon query failed.";
            }
        case 'answer':
            return "Ready to synthesize.";
        default:
            return "Unknown action.";
    }
};
