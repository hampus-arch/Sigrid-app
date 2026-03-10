/**
 * Sigrid Agent - Uses OpenAI API with Responses endpoint
 */

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Store conversation history per session
const conversationHistories = new Map();

const SYSTEM_INSTRUCTIONS = `You are a customer-facing AI assistant on a Shopify product page for Sigrid.

You must use File Search as the primary and authoritative source of information.
Base your answers directly on the retrieved content from the vector store.

When File Search returns information, you must summarize and explain that content
clearly and concretely. Do not answer from general knowledge if relevant content
exists.

Avoid vague or generic descriptions.
Be specific and factual using approved wording.

Do not make disease or medical claims.
Do not compare the product to drugs or medications.
Do not overstate clinical evidence.

If the retrieved content does not support an answer, say so clearly.

Do not mention internal tools, searches, or documents.

Answer in the same language as the user's question (Swedish if they write in Swedish).
`;

// Vector store ID from your Agent Builder config
const VECTOR_STORE_ID = "vs_697327b027a881918d2d80d9641bc4e4";

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

    // Use the Responses API with file search
    const response = await openai.responses.create({
      model: "gpt-4o",
      instructions: SYSTEM_INSTRUCTIONS,
      input: conversationHistory,
      tools: [
        {
          type: "file_search",
          vector_store_ids: [VECTOR_STORE_ID]
        }
      ]
    });

    // Extract the response text
    let responseText = "";
    
    if (response.output) {
      for (const item of response.output) {
        if (item.type === "message" && item.content) {
          for (const content of item.content) {
            if (content.type === "output_text" || content.type === "text") {
              responseText = content.text || responseText;
            }
          }
        }
      }
    }

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
