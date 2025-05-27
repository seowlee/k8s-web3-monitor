const Redis = require("ioredis");
const { MongoClient } = require("mongodb");

// ✅ 환경 변수
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017";
const MONGO_DB = process.env.MONGO_DB || "web3monitor";
const COLLECTION = process.env.MONGO_COLLECTION || "usdtTransfers";

const redis = new Redis(REDIS_URL);
const mongoClient = new MongoClient(MONGO_URL);

async function startWorker() {
  try {
    await mongoClient.connect();
    const db = mongoClient.db(MONGO_DB);
    const collection = db.collection(COLLECTION);
    console.log("✅ Connected to MongoDB");

    while (true) {
      const result = await redis.blpop("usdt-tx-list", 0); // [key, value]
      const eventData = JSON.parse(result[1]);
      console.log("📥 Popped from Redis:", eventData);

      // MongoDB에 저장
      await collection.insertOne(eventData);
      console.log("💾 Saved to MongoDB");
    }
  } catch (err) {
    console.error("❌ Worker error:", err);
  }
}

startWorker();
