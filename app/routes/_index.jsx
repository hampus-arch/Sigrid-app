import { json } from "@remix-run/node";

export const loader = async () => {
  return json({
    app: "Sigrid Chat Widget",
    status: "running",
    version: "2.0",
  });
};

export default function Index() {
  return (
    <div
      style={{
        fontFamily:
          '-apple-system, system-ui, BlinkMacSystemFont, "SF Pro Text", sans-serif',
        minHeight: "100vh",
        margin: 0,
        backgroundColor: "#f5f5f5",
      }}
    >
      {/* Floating popup preview of the Sigrid chat widget */}
      <div
        style={{
          position: "fixed",
          right: "24px",
          bottom: "24px",
          width: "414px",
          height: "562px",
          borderRadius: "32px",
          overflow: "hidden",
          boxShadow:
            "0 18px 45px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0,0,0,0.03)",
          backgroundColor: "transparent",
          zIndex: 20,
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(246, 245, 237, 1)", // #F6F5ED
            borderRadius: "32px",
            overflow: "hidden",
          }}
        >
          {/* Soft gradient / glow shapes */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: "280px",
                height: "280px",
                borderRadius: "999px",
                backgroundColor: "rgba(6, 76, 68, 0.8)",
                filter: "blur(160px)",
                bottom: "-80px",
                right: "10px",
              }}
            />
            <div
              style={{
                position: "absolute",
                width: "414px",
                height: "414px",
                borderRadius: "999px",
                backgroundColor: "rgba(178, 210, 193, 0.9)",
                filter: "blur(220px)",
                bottom: "-160px",
                left: "-60px",
              }}
            />
          </div>

          {/* Content */}
          <div
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              height: "100%",
              padding: "24px 20px 20px",
            }}
          >
            {/* Header with logo + AI label */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "40px",
              }}
            >
              <div
                style={{
                  height: "18px",
                  display: "flex",
                  alignItems: "center",
                  fontSize: "18px",
                  letterSpacing: "0.12em",
                  fontWeight: 500,
                  color: "#064C44",
                }}
              >
                SIGRID
              </div>
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: 500,
                  color: "#064C44",
                }}
              >
                AI
              </span>
            </div>

            {/* Title */}
            <div
              style={{
                fontSize: "26px",
                lineHeight: 1.25,
                fontWeight: 500,
                color: "#160112",
                marginBottom: "56px",
              }}
            >
              Ask our AI anything
            </div>

            {/* Chat area */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                marginBottom: "32px",
              }}
            >
              {/* User message */}
              <div
                style={{
                  alignSelf: "flex-end",
                  width: "182px",
                  fontSize: "11px",
                  color: "rgba(0,0,0,0.6)",
                }}
              >
                <div style={{ marginBottom: "4px" }}>you</div>
                <div
                  style={{
                    backgroundColor: "rgba(255,255,255,0.5)",
                    border: "1px solid rgba(255,255,255,1)",
                    borderRadius: "8px",
                    padding: "10px",
                    fontSize: "13px",
                    lineHeight: 1.4,
                    color: "#160112",
                  }}
                >
                  What can I ask you to do?
                </div>
              </div>

              {/* AI label */}
              <div
                style={{
                  width: "100%",
                  maxWidth: "269px",
                  fontSize: "11px",
                  color: "rgba(0,0,0,0.6)",
                }}
              >
                <div style={{ marginBottom: "4px" }}>sigrid AI</div>
                <div
                  style={{
                    backgroundColor: "rgba(255,255,255,0.5)",
                    border: "1px solid rgba(255,255,255,1)",
                    borderRadius: "8px",
                    padding: "10px",
                    fontSize: "13px",
                    lineHeight: 1.4,
                    color: "#160112",
                  }}
                >
                  Great question! You can ask for my help with the following:
                  Anything to do with your reports in our software e.g. What is
                  the last report we exported?
                </div>
              </div>
            </div>

            {/* Input bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 4px",
              }}
            >
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "rgba(246,245,237,1)",
                  borderRadius: "24px",
                  border: "1px solid rgba(22,1,18,0.3)",
                  padding: "12px 14px",
                  gap: "10px",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    color: "#56637E",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Talk to our expert!
                </span>
                <button
                  type="button"
                  aria-label="Send message"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "32px",
                    height: "32px",
                    borderRadius: "999px",
                    border: "none",
                    backgroundColor: "transparent",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4.5 19.5L19.5 12L4.5 4.5L4.5 10.5L13.5 12L4.5 13.5L4.5 19.5Z"
                      fill="#064C44"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
