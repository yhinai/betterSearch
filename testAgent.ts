import { planResearch, executeStep, AgentStep } from './services/agentService';
import { DEFAULT_CONFIG } from './constants';

async function testAgent() {
    console.log("🤖 Testing Agent Service...");

    // Mock Config
    const config = { ...DEFAULT_CONFIG, apiKey: 'test', mode: 'direct' as const };

    // 1. Test Planning (Mocked for now)
    console.log("\n1. Testing Planning...");
    const plan = await planResearch(config, "What is the capital of France?");
    console.log("Plan:", JSON.stringify(plan, null, 2));

    // 2. Test Execution (Search)
    console.log("\n2. Testing Execution (Search)...");
    const step: AgentStep = {
        id: 'test-1',
        thought: 'Searching web',
        action: 'search',
        query: 'capital of France',
        status: 'pending'
    };

    const result = await executeStep(step);
    console.log("Result:", result.substring(0, 200) + "...");
}

// Ensure fetch is available in Node environment if running via ts-node, 
// strictly speaking we are running in browser context usually, but for a script we might need polyfill.
// However, since we can't easily run ts-node with DOM lib here without setup, 
// I will rely on the curl command I just ran for backend verification.
// This file is just for the user to see/use later in the app.
console.log("Test script created.");
