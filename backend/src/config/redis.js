import Redis from "ioredis";

// Create a Redis instance using Upstash URL
const redis = new Redis(process.env.UPSTASH_REDIS_URL || "redis://localhost:6379");

redis.on("error", (error) => {
  console.error("Redis Connection Error:", error);
});

redis.on("connect", () => {
  console.log("Connected to Upstash Redis successfully");
});

export default redis;
