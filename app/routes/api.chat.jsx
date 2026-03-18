import { json } from "@remix-run/node";
import { runSigridAgent, clearHistory } from "../lib/sigrid-agent.js";
import { trackKlaviyoEvent } from "../lib/klaviyo.js";

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
    const { message, sessionId, action: chatAction, email, productInfo } = body;
    const sid = sessionId || "default";

    // Handle clear history action
    if (chatAction === "clear") {
      clearHistory(sid);
      return json({ success: true }, { headers: corsHeaders });
    }

    // Handle quiz submitted action (from Typeform embed onSubmit)
    if (chatAction === "quiz_submitted") {
      const { typeformResponseId } = body;
      trackKlaviyoEvent(
        "Sigrid AI Quiz Submitted",
        {
          session_id: sid,
          typeform_response_id: typeformResponseId || null,
        },
        email || null
      );
      return json({ ok: true }, { headers: corsHeaders });
    }

    if (!message) {
      return json({ error: "Message is required" }, { status: 400, headers: corsHeaders });
    }

    // Log message sent event to Klaviyo (fire-and-forget)
    trackKlaviyoEvent(
      "Sigrid AI Chat Message",
      {
        session_id: sid,
        message_preview: message.substring(0, 100),
        message_length: message.length,
      },
      email || null
    );

    // Run the Sigrid agent (pass optional product info from Theme Editor)
    const response = await runSigridAgent(sid, message, productInfo || null);

    // Detect if agent suggested the quiz via [SUGGEST_QUIZ] tag, then strip it
    const suggestedQuiz = response.includes("[SUGGEST_QUIZ]");
    const cleanResponse = response.replace(/\[SUGGEST_QUIZ\]/g, "").trimEnd();

    if (suggestedQuiz) {
      trackKlaviyoEvent(
        "Sigrid AI Quiz Suggested",
        { session_id: sid, trigger_message: message.substring(0, 100) },
        email || null
      );
    }

    return json(
      {
        response: cleanResponse,
        sessionId: sid,
        suggestedQuiz,
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
