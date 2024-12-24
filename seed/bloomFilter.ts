import { initializeRedisClient } from "../utils/client.js";
import { bloomKey } from "../utils/keys.js";

async function createBloomFilter() {
  const client = await initializeRedisClient();
  await Promise.all([
    client.del(bloomKey),
    client.bf.reserve(bloomKey, 0.0001, 1_000_000),
  ]);
}

await createBloomFilter();
process.exit();
