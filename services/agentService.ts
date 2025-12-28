import { DEFAULT_CONFIG, MODELS } from '../constants';
import { AppConfig, Message } from '../types';
import { streamResponse, callGoogleWithGrounding } from './llmService';

// Types for Agent Reasoning
export interface AgentStep {
    id: string;
    thought: string;
    action: 'search' | 'answer';
    query?: string;
    result?: string;
    status: 'pending' | 'executing' | 'completed' | 'failed';
}

export interface AgentPlan {
    goal: string;
    steps: AgentStep[];
}

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
    - "search": Web search for current info using Google Search.
    - "answer": Synthesize final answer (always the last step).

    CRITICAL: Output ONLY valid JSON in this format:
    {
      "goal": "${goal}",
      "steps": [
        { "id": "1", "action": "search", "query": "search query here", "thought": "reasoning" },
        { "id": "2", "action": "answer", "thought": "synthesizing all findings" }
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

/**
 * Execute a single step in the research plan.
 * Search steps now use Gemini's native Google Search grounding for better results and citations.
 */
export const executeStep = async (step: AgentStep): Promise<string> => {
    switch (step.action) {
        case 'search':
            // Use Gemini with Google Search grounding
            let result = '';
            await callGoogleWithGrounding(
                step.query || '',
                (chunk) => { result += chunk; }
            );
            return result;
        case 'answer':
            return "Ready to synthesize.";
        default:
            return "Unknown action.";
    }
};
