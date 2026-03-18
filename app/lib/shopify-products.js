/**
 * Fetches live product data from Shopify Storefront API
 * and returns a formatted context string to inject into the agent.
 *
 * Requires env vars:
 *   SHOPIFY_STORE_DOMAIN   — e.g. "sigridlife.myshopify.com"
 *   SHOPIFY_STOREFRONT_TOKEN — a public Storefront API access token
 */

const STOREFRONT_QUERY = `{
  products(first: 10) {
    edges {
      node {
        title
        handle
        description
        variants(first: 5) {
          edges {
            node {
              title
              price {
                amount
                currencyCode
              }
              availableForSale
            }
          }
        }
      }
    }
  }
}`;

let cachedProductContext = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function getProductContext() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN?.trim();
  const token = process.env.SHOPIFY_STOREFRONT_TOKEN?.trim();

  if (!domain || !token) return null; // silently skip if not configured

  // Return cached version if still fresh
  if (cachedProductContext && Date.now() < cacheExpiry) {
    return cachedProductContext;
  }

  try {
    const res = await fetch(
      `https://${domain}/api/2024-01/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": token,
        },
        body: JSON.stringify({ query: STOREFRONT_QUERY }),
      }
    );

    if (!res.ok) return null;

    const { data } = await res.json();
    const products = data?.products?.edges || [];

    if (!products.length) return null;

    // Build a concise text summary for the agent
    const lines = ["LIVE PRODUCT DATA FROM SIGRID STORE (use this for pricing questions):"];

    for (const { node } of products) {
      lines.push(`\nProduct: ${node.title}`);
      if (node.description) {
        lines.push(`Description: ${node.description.substring(0, 200)}`);
      }
      for (const { node: variant } of node.variants.edges) {
        const label = variant.title !== "Default Title" ? ` (${variant.title})` : "";
        const avail = variant.availableForSale ? "In stock" : "Out of stock";
        const price = `${parseFloat(variant.price.amount).toFixed(0)} ${variant.price.currencyCode}`;
        lines.push(`  • ${node.title}${label}: ${price} — ${avail}`);
      }
    }

    cachedProductContext = lines.join("\n");
    cacheExpiry = Date.now() + CACHE_TTL_MS;
    return cachedProductContext;
  } catch {
    return null; // never break the agent over a product fetch failure
  }
}
