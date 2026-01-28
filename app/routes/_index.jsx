import { json } from "@remix-run/node";

export const loader = async () => {
  return json({ 
    app: "Sigrid Chat Widget",
    status: "running",
    version: "2.0"
  });
};

export default function Index() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
      <h1>Sigrid Chat Widget API</h1>
      <p>This app provides the backend for the Sigrid AI chat widget.</p>
      <p>API endpoint: <code>/api/chat</code></p>
    </div>
  );
}
