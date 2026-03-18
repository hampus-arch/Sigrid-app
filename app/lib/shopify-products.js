/**
 * Fetches live product data from the public Shopify product JSON endpoint.
 * No API token required — this endpoint is publicly available on all Shopify stores.
 */

const PRODUCT_URL = "https://sigridlife.com/products/glucosestabiliser.json";

let cachedContext = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function getProductContext() {
  // Return cached version if still fresh
  if (cachedContext && Date.now() < cacheExpiry) {
    return cachedContext;
  }

  try {
    const res = await fetch(PRODUCT_URL);
    if (!res.ok) return null;

    const { product } = await res.json();
    if (!product) return null;

    const lines = [
      `LIVE PRODUCT & PRICING DATA (always use this when answering pricing questions):`,
      `Product: ${product.title}`,
      `URL: https://sigridlife.com/products/glucosestabiliser`,
    ];

    for (const variant of product.variants || []) {
      const price = parseFloat(variant.price).toFixed(2);
      const currency = "USD";
      const compare = variant.compare_at_price
        ? ` (regular price: $${parseFloat(variant.compare_at_price).toFixed(2)})`
        : "";
      const avail = variant.available ? "In stock" : "Currently out of stock";
      lines.push(`  • ${variant.title}: $${price} ${currency}${compare} — ${avail}`);
    }

    cachedContext = lines.join("\n");
    cacheExpiry = Date.now() + CACHE_TTL_MS;
    return cachedContext;
  } catch {
    return null; // never break the agent over a fetch failure
  }
}
