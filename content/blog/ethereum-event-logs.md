---
title: "How to Read Ethereum Event Logs Programmatically"
description: "Learn how to read and parse Ethereum smart contract event logs using ethers.js and web3.py. Covers log filtering, topic encoding, historical queries, and real-time subscriptions."
date: "2026-03-30"
author: team
category: tutorial
tags: ["ethereum", "events", "logs", "ethers", "developer", "solidity"]
image: "/images/blog/ethereum-event-logs.jpg"
imageAlt: "Ethereum event log decoder showing Transfer events parsed from transaction receipts"
---

Smart contract events are the primary way Ethereum contracts communicate what happened during execution. Every ERC-20 transfer, every DEX swap, every NFT mint emits events. Reading these events programmatically is how block explorers, portfolio trackers, DeFi analytics dashboards, and alerting systems work. This guide covers everything you need to query and parse Ethereum event logs.

## How Events Work in Solidity

When a Solidity contract emits an event, the data is included in the transaction receipt as a log entry:

```solidity
// Solidity contract
event Transfer(
    address indexed from,
    address indexed to,
    uint256 value
);

// When this executes:
emit Transfer(msg.sender, recipient, amount);
```

Each log entry contains:
- `address`: The contract that emitted the event
- `topics[0]`: The event signature hash (keccak256 of "Transfer(address,address,uint256)")
- `topics[1..3]`: Indexed parameters (up to 3, each padded to 32 bytes)
- `data`: Non-indexed parameters, ABI-encoded

## Understanding Topics

The first topic is always the event signature hash:

```javascript
import { ethers } from 'ethers';

// Event signature hashes
const TRANSFER_TOPIC = ethers.id('Transfer(address,address,uint256)');
const APPROVAL_TOPIC = ethers.id('Approval(address,address,uint256)');
const SWAP_TOPIC = ethers.id('Swap(address,uint256,uint256,uint256,uint256,address)');

console.log('Transfer topic:', TRANSFER_TOPIC);
// 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
```

Indexed address parameters are padded to 32 bytes:

```javascript
function padAddress(address) {
  return '0x' + '0'.repeat(24) + address.slice(2).toLowerCase();
}

// Filter for transfers TO a specific address
const toAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
const topic2 = padAddress(toAddress);
```

## Querying Historical Logs with ethers.js

```javascript
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');

// Get all USDC transfers in a block range
async function getUSDCTransfers(fromBlock, toBlock) {
  const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
  const TRANSFER_TOPIC = ethers.id('Transfer(address,address,uint256)');

  const logs = await provider.getLogs({
    address: USDC,
    topics: [TRANSFER_TOPIC],
    fromBlock,
    toBlock,
  });

  const iface = new ethers.Interface([
    'event Transfer(address indexed from, address indexed to, uint256 value)',
  ]);

  return logs.map(log => {
    const parsed = iface.parseLog({ topics: log.topics, data: log.data });
    return {
      txHash: log.transactionHash,
      blockNumber: log.blockNumber,
      logIndex: log.logIndex,
      from: parsed.args.from,
      to: parsed.args.to,
      amount: (Number(parsed.args.value) / 1e6).toFixed(2), // USDC has 6 decimals
    };
  });
}

const transfers = await getUSDCTransfers(-1000, 'latest'); // Last 1000 blocks
console.log(`Found ${transfers.length} USDC transfers`);

// Show largest transfers
const sorted = transfers.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
sorted.slice(0, 5).forEach(t => {
  console.log(`$${t.amount} USDC: ${t.from.slice(0, 10)}... -> ${t.to.slice(0, 10)}...`);
});
```

## Filtering by Indexed Parameters

```javascript
// Only get transfers FROM a specific address
async function getTransfersFrom(tokenAddress, fromAddress, fromBlock = -10000) {
  const TRANSFER_TOPIC = ethers.id('Transfer(address,address,uint256)');
  const paddedFrom = ethers.zeroPadValue(fromAddress, 32);

  return provider.getLogs({
    address: tokenAddress,
    topics: [
      TRANSFER_TOPIC,
      paddedFrom,   // topic[1] = from address
      null,          // topic[2] = to address (any)
    ],
    fromBlock,
  });
}

// Get transfers TO a specific address
async function getTransfersTo(tokenAddress, toAddress, fromBlock = -10000) {
  const TRANSFER_TOPIC = ethers.id('Transfer(address,address,uint256)');
  const paddedTo = ethers.zeroPadValue(toAddress, 32);

  return provider.getLogs({
    address: tokenAddress,
    topics: [
      TRANSFER_TOPIC,
      null,      // topic[1] = from address (any)
      paddedTo,  // topic[2] = to address
    ],
    fromBlock,
  });
}
```

## Real-Time Log Subscription

WebSocket providers support real-time log subscriptions:

```javascript
const wsProvider = new ethers.WebSocketProvider(
  `wss://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`
);

const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const ERC20_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
];

const contract = new ethers.Contract(USDC, ERC20_ABI, wsProvider);

// Listen for all USDC transfers
contract.on('Transfer', (from, to, value, event) => {
  const amount = Number(value) / 1e6;
  if (amount >= 100000) { // Only log transfers > $100K
    console.log(`USDC Transfer: $${amount.toLocaleString()}`);
    console.log(`  From: ${from}`);
    console.log(`  To: ${to}`);
    console.log(`  TX: ${event.log.transactionHash}`);
  }
});

// Clean up
process.on('SIGINT', () => {
  contract.removeAllListeners('Transfer');
  wsProvider.destroy();
});
```

## Parsing Complex Events

DEX swap events have more parameters:

```javascript
// Uniswap V3 Swap event
const POOL_ABI = [
  `event Swap(
    address indexed sender,
    address indexed recipient,
    int256 amount0,
    int256 amount1,
    uint160 sqrtPriceX96,
    uint128 liquidity,
    int24 tick
  )`,
];

async function getUniswapSwaps(poolAddress, fromBlock = -500) {
  const iface = new ethers.Interface(POOL_ABI);
  const SWAP_TOPIC = ethers.id('Swap(address,address,int256,int256,uint160,uint128,int24)');

  const logs = await provider.getLogs({
    address: poolAddress,
    topics: [SWAP_TOPIC],
    fromBlock,
  });

  return logs.map(log => {
    const parsed = iface.parseLog({ topics: log.topics, data: log.data });
    return {
      txHash: log.transactionHash,
      blockNumber: log.blockNumber,
      sender: parsed.args.sender,
      recipient: parsed.args.recipient,
      amount0: parsed.args.amount0.toString(),
      amount1: parsed.args.amount1.toString(),
      tick: parsed.args.tick,
    };
  });
}
```

## Paginating Large Log Queries

Fetching logs across many blocks in one call can time out. Paginate in chunks:

```javascript
async function getLogsInChunks({
  address,
  topics,
  fromBlock,
  toBlock,
  chunkSize = 2000,
}) {
  const allLogs = [];
  let currentBlock = fromBlock;

  while (currentBlock <= toBlock) {
    const endBlock = Math.min(currentBlock + chunkSize - 1, toBlock);

    try {
      const logs = await provider.getLogs({
        address,
        topics,
        fromBlock: currentBlock,
        toBlock: endBlock,
      });
      allLogs.push(...logs);
      console.log(`Fetched blocks ${currentBlock}-${endBlock}: ${logs.length} logs`);
    } catch (error) {
      if (chunkSize > 100) {
        // Reduce chunk size and retry
        return getLogsInChunks({
          address, topics, fromBlock: currentBlock, toBlock,
          chunkSize: Math.floor(chunkSize / 2),
        });
      }
      throw error;
    }

    currentBlock = endBlock + 1;
    await new Promise(r => setTimeout(r, 100)); // Rate limiting
  }

  return allLogs;
}
```

## Building an Event Monitor

```javascript
class EventMonitor {
  #subscriptions = new Map();
  #provider;

  constructor(wsProviderUrl) {
    this.#provider = new ethers.WebSocketProvider(wsProviderUrl);
  }

  watch({ name, address, abi, eventName, filter, callback }) {
    const contract = new ethers.Contract(address, abi, this.#provider);

    const handler = (...args) => {
      const event = args[args.length - 1]; // Last arg is always the event object
      callback({ args: args.slice(0, -1), event, name });
    };

    if (filter) {
      contract.on(contract.filters[eventName](...filter), handler);
    } else {
      contract.on(eventName, handler);
    }

    this.#subscriptions.set(name, { contract, eventName, handler });
    return this;
  }

  unwatch(name) {
    const sub = this.#subscriptions.get(name);
    if (sub) {
      sub.contract.off(sub.eventName, sub.handler);
      this.#subscriptions.delete(name);
    }
    return this;
  }

  destroy() {
    for (const sub of this.#subscriptions.values()) {
      sub.contract.removeAllListeners(sub.eventName);
    }
    this.#provider.destroy();
  }
}

// Usage
const monitor = new EventMonitor(`wss://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`);

monitor.watch({
  name: 'usdc-transfers',
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  abi: ['event Transfer(address indexed from, address indexed to, uint256 value)'],
  eventName: 'Transfer',
  callback: ({ args: [from, to, value] }) => {
    const amount = Number(value) / 1e6;
    if (amount >= 1_000_000) {
      console.log(`$${amount.toLocaleString()} USDC moved`);
    }
  },
});
```

## Conclusion

Ethereum event logs are the most information-rich data source for on-chain applications. The combination of topic-based filtering, indexed parameters, and ABI decoding makes it possible to extract exactly the events you care about from millions of blocks of chain history. Whether you are building real-time monitors, historical analytics, or DeFi dashboards, mastering event log queries is a foundational blockchain development skill.
