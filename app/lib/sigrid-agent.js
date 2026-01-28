/**
 * Sigrid Agent - Uses OpenAI Agents SDK to connect to Agent Builder workflow
 */

import { fileSearchTool, hostedMcpTool, Agent, Runner, withTrace } from "@openai/agents";

// Tool definitions matching your Agent Builder configuration
const fileSearch = fileSearchTool([
  "vs_697327b027a881918d2d80d9641bc4e4"
]);

const mcp = hostedMcpTool({
  serverLabel: "sigridstabiliser",
  allowedTools: [
    "search_shop_catalog",
    "get_cart",
    "update_cart",
    "search_shop_policies_and_faqs",
    "get_product_details"
  ],
  requireApproval: "never", // Auto-approve for API usage
  serverUrl: "https://sigridstabiliser.se/api/mcp"
});

const shopifyAgent = new Agent({
  name: "Shopify agent",
  instructions: `You are a customer-facing AI assistant on a Shopify product page for Sigrid.

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
`,
  model: "gpt-4o",
  tools: [
    fileSearch,
    mcp
  ],
  modelSettings: {
    store: true
  }
});

// Store conversation history per session
const conversationHistories = new Map();

/**
 * Run the Sigrid agent with the given message
 * @param {string} sessionId - Unique session identifier
 * @param {string} userMessage - The user's message
 * @returns {Promise<string>} - The agent's response
 */
export async function runSigridAgent(sessionId, userMessage) {
  return await withTrace("Sigrid Shopify agent", async () => {
    // Get or create conversation history for this session
    let conversationHistory = conversationHistories.get(sessionId) || [];
    
    // Add user message to history
    conversationHistory.push({
      role: "user",
      content: [{ type: "input_text", text: userMessage }]
    });

    const runner = new Runner({
      traceMetadata: {
        __trace_source__: "agent-builder",
        workflow_id: "wf_69713d3cd9b081909ef043c8f694feaa072ce62a0e48798f"
      }
    });

    const result = await runner.run(shopifyAgent, conversationHistory);
    
    // Add agent response to history
    conversationHistory.push(...result.newItems.map((item) => item.rawItem));
    
    // Store updated history
    conversationHistories.set(sessionId, conversationHistory);

    // Extract text response from the agent's output
    let responseText = "";
    
    // Method 1: Check finalOutput for text
    if (result.finalOutput) {
      if (typeof result.finalOutput === "string") {
        responseText = result.finalOutput;
      } else if (result.finalOutput.output_text) {
        responseText = result.finalOutput.output_text;
      } else if (result.finalOutput.text) {
        responseText = result.finalOutput.text;
      }
    }
    
    // Method 2: Look through newItems for text content
    if (!responseText) {
      for (const item of result.newItems) {
        const rawItem = item.rawItem || item;
        
        // Check for direct text output
        if (rawItem.type === "message" && rawItem.content) {
          for (const content of rawItem.content) {
            if (content.type === "output_text" && content.text) {
              responseText = content.text;
            } else if (content.type === "text" && (content.text || content.value)) {
              responseText = content.text || content.value;
            }
          }
        }
        
        // Check for assistant message format
        if (rawItem.role === "assistant" && rawItem.content) {
          if (typeof rawItem.content === "string") {
            responseText = rawItem.content;
          } else if (Array.isArray(rawItem.content)) {
            for (const c of rawItem.content) {
              if (c.type === "output_text" || c.type === "text") {
                responseText = c.text || c.value || responseText;
              }
            }
          }
        }
      }
    }
    
    // Method 3: Try to get from toInputList
    if (!responseText && result.toInputList) {
      const inputList = result.toInputList();
      const lastItem = inputList[inputList.length - 1];
      if (lastItem && lastItem.content) {
        if (typeof lastItem.content === "string") {
          responseText = lastItem.content;
        } else if (Array.isArray(lastItem.content)) {
          for (const c of lastItem.content) {
            if (c.text) responseText = c.text;
          }
        }
      }
    }

    console.log("Agent result:", JSON.stringify(result, null, 2).slice(0, 1000));
    
    return responseText || "Jag kunde inte bearbeta det. Försök igen.";
  });
}

/**
 * Clear conversation history for a session
 * @param {string} sessionId 
 */
export function clearHistory(sessionId) {
  conversationHistories.delete(sessionId);
}
