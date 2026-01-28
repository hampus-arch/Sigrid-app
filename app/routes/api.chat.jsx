import { json } from "@remix-run/node";
import { runSigridAgent, clearHistory } from "../lib/sigrid-agent.js";

/**
 * API endpoint for chat messages
 * Connects to the Sigrid Agent Builder workflow
 */
export const action = async ({ request }) => {
  // Only allow POST requests
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  // Add CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    const body = await request.json();
    const { message, sessionId, action: chatAction } = body;

    // Handle clear history action
    if (chatAction === "clear") {
      clearHistory(sessionId || "default");
      return json({ success: true }, { headers: corsHeaders });
    }

    if (!message) {
      return json({ error: "Message is required" }, { status: 400, headers: corsHeaders });
    }

    // Run the Sigrid agent
    const response = await runSigridAgent(sessionId || "default", message);

    return json(
      { 
        response,
        sessionId: sessionId || "default"
      }, 
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Chat API Error:", error);
    return json(
      { error: "Failed to process message", details: error.message }, 
      { status: 500, headers: corsHeaders }
    );
  }
};

// Handle OPTIONS for CORS preflight
export const loader = async ({ request }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }
  return json({ status: "Sigrid Chat API ready", version: "2.0" });
};
