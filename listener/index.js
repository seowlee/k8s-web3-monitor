const { ethers } = require("ethers");
const Redis = require("ioredis");

// ✅ 환경 변수
const RPC_URL = process.env.RPC_URL || "https://ethereum-rpc.publicnode.com";
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const TRANSFER_EVENT_SIG =
  "event Transfer(address indexed from, address indexed to, uint256 value)";
const TRANSFER_TOPIC = ethers.id("Transfer(address,address,uint256)");

const provider = new ethers.JsonRpcProvider(RPC_URL);
const redis = new Redis(REDIS_URL);
const iface = new ethers.Interface([TRANSFER_EVENT_SIG]);

// ✅ 반복 범위 단위 설정
const BLOCK_INTERVAL = 12;
let lastProcessedBlock = 0;

async function getLastBlock() {
  return await provider.getBlockNumber();
}

async function processLogs(fromBlock, toBlock) {
  console.log(`🔍 Checking logs from ${fromBlock} to ${toBlock}`);
  const logs = await provider.getLogs({
    address: USDT_ADDRESS,
    fromBlock,
    toBlock,
    topics: [TRANSFER_TOPIC],
  });

  for (const log of logs) {
    const parsed = iface.parseLog(log);
    const tx = {
      from: parsed.args.from,
      to: parsed.args.to,
      value: parsed.args.value.toString(),
      blockNumber: log.blockNumber,
      txHash: log.transactionHash,
    };

    // Redis에 Push (리스트 저장 방식)
    await redis.rpush("usdt-tx-list", JSON.stringify(tx));
    console.log("📦 Pushed to Redis:", tx);
  }
}

async function startListener() {
  const latestBlock = await getLastBlock();

  // 최초 실행 시 기준 블록 설정
  if (lastProcessedBlock === 0) {
    lastProcessedBlock = latestBlock - BLOCK_INTERVAL;
  }

  while (true) {
    const newBlock = await getLastBlock();
    if (newBlock - lastProcessedBlock >= BLOCK_INTERVAL) {
      const fromBlock = lastProcessedBlock + 1;
      const toBlock = fromBlock + BLOCK_INTERVAL - 1;
      await processLogs(fromBlock, toBlock);
      lastProcessedBlock = toBlock;
    }

    await new Promise((resolve) => setTimeout(resolve, 5000)); // 5초마다 확인
  }
}

// 기존 startListener() 이후 추가
startListener().catch(console.error);

// ✅ 아래는 브라우저 확인용 Express 서버 추가
const express = require("express");
const app = express();
const port = 3000;

app.get("/", (req, res) => {
  res.send("✅ USDT Listener is Running!");
});

app.listen(port, () => {
  console.log(`🚀 Express server listening on port ${port}`);
});
