/**
 * Sigrid Agent - Uses OpenAI Chat Completions API
 */

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Store conversation history per session
const conversationHistories = new Map();

const SYSTEM_MESSAGE = `You are a customer-facing AI assistant on a Shopify product page for Sigrid.

Be helpful, friendly, and concise in your responses.

Avoid vague or generic descriptions.
Be specific and factual using approved wording.

Do not make disease or medical claims.
Do not compare the product to drugs or medications.
Do not overstate clinical evidence.

If you don't have information about something, say so clearly.

Answer in the same language as the user's question (Swedish if they write in Swedish).
`;

/**
 * Run the Sigrid agent with the given message
 * @param {string} sessionId - Unique session identifier
 * @param {string} userMessage - The user's message
 * @returns {Promise<string>} - The agent's response
 */
export async function runSigridAgent(sessionId, userMessage) {
  try {
    // Get or create conversation history for this session
    let conversationHistory = conversationHistories.get(sessionId) || [];
    
    // Add user message to history
    conversationHistory.push({
      role: "user",
      content: userMessage
    });

    // Build messages array with system prompt
    const messages = [
      { role: "system", content: SYSTEM_MESSAGE },
      ...conversationHistory
    ];

    // Use Chat Completions API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    // Extract the response text
    const responseText = response.choices[0]?.message?.content || "";

    // Add assistant response to history
    if (responseText) {
      conversationHistory.push({
        role: "assistant",
        content: responseText
      });
    }
    
    // Store updated history (limit to last 20 messages to prevent memory issues)
    if (conversationHistory.length > 20) {
      conversationHistory = conversationHistory.slice(-20);
    }
    conversationHistories.set(sessionId, conversationHistory);

    return responseText || "Jag kunde inte bearbeta det. Försök igen.";
  } catch (error) {
    console.error("Agent error:", error);
    throw error;
  }
}

/**
 * Clear conversation history for a session
 * @param {string} sessionId 
 */
export function clearHistory(sessionId) {
  conversationHistories.delete(sessionId);
}
