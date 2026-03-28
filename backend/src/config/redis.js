import Redis from "ioredis";

// Create a Redis instance using Upstash URL
const redis = process.env.UPSTASH_REDIS_URL
  ? new Redis(process.env.UPSTASH_REDIS_URL)
  : null;

if (redis) {
  redis.on("error", (error) => {
    console.error("Redis Connection Error:", error);
  });

  redis.on("connect", () => {
    console.log("Connected to Upstash Redis successfully");
  });
} else {
  console.warn("UPSTASH_REDIS_URL not provided. Redis caching is disabled.");
}

export default redis;
