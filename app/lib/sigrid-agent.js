/**
 * Sigrid Agent - Uses OpenAI Chat Completions API via fetch
 */

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
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

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

    // Use fetch directly for better compatibility
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${errorData}`);
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || "";

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
    console.error("Agent error:", error.message);
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
