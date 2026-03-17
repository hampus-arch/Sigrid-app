/**
 * Klaviyo event logging for Sigrid AI chat
 * Fires fire-and-forget — never blocks the chat response
 */

const KLAVIYO_API_URL = "https://a.klaviyo.com/api/events";
const KLAVIYO_REVISION = "2024-02-15";

/**
 * Send a Klaviyo event (fire-and-forget)
 * @param {string} eventName - e.g. "Sigrid Chat Message Sent"
 * @param {object} properties - event properties
 * @param {string|null} email - customer email if known
 */
export async function trackKlaviyoEvent(eventName, properties = {}, email = null) {
  const apiKey = process.env.KLAVIYO_API_KEY;
  if (!apiKey) return; // silently skip if not configured

  const payload = {
    data: {
      type: "event",
      attributes: {
        metric: {
          data: {
            type: "metric",
            attributes: { name: eventName },
          },
        },
        properties: {
          source: "sigrid_ai_chat",
          ...properties,
        },
        time: new Date().toISOString(),
        ...(email
          ? {
              profile: {
                data: {
                  type: "profile",
                  attributes: { email },
                },
              },
            }
          : {}),
      },
    },
  };

  try {
    // Fire and forget — don't await, don't block
    fetch(KLAVIYO_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Klaviyo-API-Key ${apiKey}`,
        "Content-Type": "application/json",
        revision: KLAVIYO_REVISION,
      },
      body: JSON.stringify(payload),
    }).catch(() => {}); // swallow errors silently
  } catch {
    // Never throw — Klaviyo logging must never break the chat
  }
}
