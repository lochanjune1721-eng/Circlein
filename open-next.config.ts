import { defineCloudflareConfig } from '@opennextjs/cloudflare'

/**
 * OpenNext adapter config for Cloudflare Workers.
 *
 * Deliberately minimal: no cache override, so deploying needs nothing beyond a
 * Workers account — no R2 bucket, no KV namespace to provision first.
 *
 * The cost of that is incremental static regeneration. The directory pages
 * declare `revalidate = 300`, and without a shared incremental cache each
 * isolate re-renders them rather than serving a cached copy. That is fine at
 * low traffic and wasteful at high traffic. To fix it, create an R2 bucket,
 * bind it as NEXT_INC_CACHE_R2_BUCKET in wrangler.jsonc, and uncomment below:
 *
 *   import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache'
 *   export default defineCloudflareConfig({ incrementalCache: r2IncrementalCache })
 */
export default defineCloudflareConfig()
