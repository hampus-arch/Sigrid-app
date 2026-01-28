/**
 * Sigrid Agent - Uses OpenAI Agents SDK to connect to Agent Builder workflow
 */

import { fileSearchTool, hostedMcpTool, Agent, Runner, withTrace } from "@openai/agents";
import { z } from "zod";

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
  requireApproval: {
    always: {
      tool_names: [
        "search_shop_catalog",
        "get_cart",
        "update_cart",
        "search_shop_policies_and_faqs",
        "get_product_details"
      ]
    },
    never: {
      tool_names: []
    }
  },
  serverUrl: "https://sigridstabiliser.se/api/mcp"
});

const ShopifyAgentSchema = z.object({});

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
  model: "gpt-5.2-pro",
  tools: [
    fileSearch,
    mcp
  ],
  outputType: ShopifyAgentSchema,
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

    // Extract text response
    let responseText = "";
    
    if (result.finalOutput) {
      responseText = JSON.stringify(result.finalOutput);
    }
    
    // Try to get the actual text from the last message
    for (const item of result.newItems) {
      if (item.rawItem && item.rawItem.content) {
        for (const content of item.rawItem.content) {
          if (content.type === "output_text" || content.type === "text") {
            responseText = content.text || content.value || responseText;
          }
        }
      }
    }

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
