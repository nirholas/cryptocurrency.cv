---
title: "Running a Bitcoin Node for Development"
description: "A developer's guide to setting up and running a Bitcoin full node for development. Covers Bitcoin Core, signet, regtest, JSON-RPC access, and common development workflows."
date: "2026-03-30"
author: team
category: tutorial
tags: ["bitcoin", "node", "developer", "rpc", "setup", "blockchain"]
image: "/images/blog/bitcoin-node-setup.jpg"
imageAlt: "Bitcoin Core full node running on a server with RPC access displayed in terminal"
---

Running your own Bitcoin node gives you a level of independence and capability that no third-party service can match. You can query any transaction, inspect any block, broadcast directly to the network, and run a local development environment without rate limits. This guide walks through setting up Bitcoin Core for development purposes.

## Why Run Your Own Node?

- **No rate limits**: Query as aggressively as you need
- **No API keys**: Direct access with no authentication overhead
- **Privacy**: Your queries don't log to a third-party provider
- **Regtest/Signet**: Local test environments with instant block generation
- **Full data**: Access to all historical data, mempool, and UTXO set
- **Learning**: Understanding the actual protocol, not an abstraction

## Hardware Requirements

| Node Type | Storage | RAM | Notes |
|-----------|---------|-----|-------|
| Full node (pruned) | 10-20 GB | 2 GB | Can't answer all historical queries |
| Full node (full) | 650+ GB | 4+ GB | Complete transaction history |
| Signet node | ~5 GB | 1 GB | Test network, no real money |
| Regtest | < 1 GB | 1 GB | Local only, no sync needed |

For development, **signet** (test network with controlled block production) is ideal.

## Installing Bitcoin Core

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install bitcoin-core

# Or download binary
wget https://bitcoin.org/bin/bitcoin-core-27.0/bitcoin-27.0-x86_64-linux-gnu.tar.gz
tar -xzf bitcoin-27.0-x86_64-linux-gnu.tar.gz
sudo install -m 0755 -o root -g root -t /usr/local/bin bitcoin-27.0/bin/*

# macOS with Homebrew
brew install bitcoin
```

## Configuration

Create `~/.bitcoin/bitcoin.conf`:

```ini
# For development with signet (recommended)
signet=1

# Or for local testing with regtest
# regtest=1

# Enable JSON-RPC server
server=1
rpcuser=bitcoinrpc
rpcpassword=your_secure_password_here

# Accept connections from localhost only
rpcbind=127.0.0.1
rpcallowip=127.0.0.1

# Wallet
disablewallet=0

# Limit storage (optional)
prune=10000  # Keep only 10GB of blocks

# For better performance
dbcache=1024  # 1GB for block index cache

# Allow indexing (needed for tx lookup by TXID)
txindex=1
```

## Starting the Node

```bash
# Start in background
bitcoind -daemon

# Check sync status
bitcoin-cli getblockchaininfo

# Wait for sync (can take hours/days for mainnet, minutes for signet)
bitcoin-cli getblockchaininfo | grep '"headers"\|"blocks"\|"verificationprogress"'
```

## The JSON-RPC Interface

Bitcoin Core exposes everything through JSON-RPC:

```bash
# Using bitcoin-cli (built-in)
bitcoin-cli getblockcount
bitcoin-cli getbestblockhash
bitcoin-cli getbalance

# Or directly with curl
curl -u bitcoinrpc:your_secure_password_here \
  --data-binary '{"jsonrpc":"1.0","id":"1","method":"getblockcount","params":[]}' \
  -H 'content-type: text/plain;' \
  http://127.0.0.1:8332/
```

## JavaScript RPC Client

```javascript
class BitcoinRPC {
  #host;
  #port;
  #user;
  #password;

  constructor({ host = '127.0.0.1', port = 8332, user, password, network = 'mainnet' }) {
    this.#host = host;
    this.#port = port === 8332 && network === 'signet' ? 38332 : port;
    this.#user = user;
    this.#password = password;
  }

  async call(method, params = []) {
    const credentials = Buffer.from(`${this.#user}:${this.#password}`).toString('base64');

    const response = await fetch(`http://${this.#host}:${this.#port}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`,
      },
      body: JSON.stringify({
        jsonrpc: '1.0',
        id: Date.now(),
        method,
        params,
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.result;
  }

  // Convenience methods
  getBlockCount() { return this.call('getblockcount'); }
  getBestBlockHash() { return this.call('getbestblockhash'); }
  getBlock(hash, verbosity = 1) { return this.call('getblock', [hash, verbosity]); }
  getTransaction(txid) { return this.call('gettransaction', [txid]); }
  getRawTransaction(txid, verbose = true) { return this.call('getrawtransaction', [txid, verbose]); }
  getBlockchainInfo() { return this.call('getblockchaininfo'); }
  getMempoolInfo() { return this.call('getmempoolinfo'); }
  getRawMempool(verbose = false) { return this.call('getrawmempool', [verbose]); }
  estimateSmartFee(confirmationTarget) { return this.call('estimatesmartfee', [confirmationTarget]); }
}

// Usage
const rpc = new BitcoinRPC({
  user: process.env.BTC_RPC_USER,
  password: process.env.BTC_RPC_PASS,
  network: 'signet',
});

const info = await rpc.getBlockchainInfo();
console.log(`Block height: ${info.blocks}`);
console.log(`Chain: ${info.chain}`);
console.log(`Sync: ${(info.verificationprogress * 100).toFixed(2)}%`);
```

## Regtest: Instant Blocks for Testing

Regtest lets you mine blocks instantly, perfect for testing:

```bash
# Start in regtest mode
bitcoind -regtest -daemon

# Create a wallet
bitcoin-cli -regtest createwallet "test"

# Get a receive address
ADDR=$(bitcoin-cli -regtest getnewaddress)

# Mine 101 blocks (need 100+ for coins to be spendable)
bitcoin-cli -regtest generatetoaddress 101 $ADDR

# Check balance
bitcoin-cli -regtest getbalance
# Should show 50 BTC (101 * 50 block reward, first 100 used for maturity)
```

## Signet: Realistic Test Environment

Signet is a public test network with controlled block production (every 10 minutes by a trusted signer):

```bash
# Start signet node
bitcoind -signet -daemon

# Get signet coins from a faucet
# https://signet.bc-2.jp/ or https://faucet.signet.bitcoin.sipa.be/

# Check balance
bitcoin-cli -signet getbalance
```

## Watching for New Blocks

```javascript
async function watchNewBlocks(rpc, callback, pollIntervalMs = 10000) {
  let lastKnownHash = await rpc.getBestBlockHash();

  setInterval(async () => {
    const currentHash = await rpc.getBestBlockHash();

    if (currentHash !== lastKnownHash) {
      const block = await rpc.getBlock(currentHash);
      callback(block);
      lastKnownHash = currentHash;
    }
  }, pollIntervalMs);
}

await watchNewBlocks(rpc, async (block) => {
  console.log(`New block: #${block.height} | ${block.tx.length} txns | ${new Date(block.time * 1000).toISOString()}`);

  // Process transactions
  for (const txid of block.tx.slice(0, 5)) {
    const tx = await rpc.getRawTransaction(txid);
    console.log(`  TX: ${txid} | ${tx.vin.length} inputs, ${tx.vout.length} outputs`);
  }
});
```

## Useful RPC Commands Reference

```bash
# Blockchain
bitcoin-cli getblockchaininfo
bitcoin-cli getblockcount
bitcoin-cli getbestblockhash
bitcoin-cli getblock <blockhash> [verbosity]
bitcoin-cli getblockhash <height>

# Transactions
bitcoin-cli getrawtransaction <txid> true
bitcoin-cli sendrawtransaction <hex>
bitcoin-cli testmempoolaccept <["rawtx"]>

# Mempool
bitcoin-cli getrawmempool
bitcoin-cli getmempoolinfo
bitcoin-cli getmempoolentry <txid>

# Network
bitcoin-cli getnetworkinfo
bitcoin-cli getpeerinfo
bitcoin-cli getconnectioncount

# Wallet
bitcoin-cli getwalletinfo
bitcoin-cli getnewaddress
bitcoin-cli getbalance
bitcoin-cli sendtoaddress <address> <amount>
bitcoin-cli listtransactions

# Fee estimation
bitcoin-cli estimatesmartfee 1   # Fee for next block
bitcoin-cli estimatesmartfee 6   # Fee for 6 blocks (~1 hour)
```

## Python RPC Client

```python
from bitcoinrpc.authproxy import AuthServiceProxy

rpc_user = "bitcoinrpc"
rpc_password = "your_password"
rpc_host = "127.0.0.1"
rpc_port = 38332  # signet

rpc = AuthServiceProxy(f"http://{rpc_user}:{rpc_password}@{rpc_host}:{rpc_port}")

# Get blockchain info
info = rpc.getblockchaininfo()
print(f"Blocks: {info['blocks']}")
print(f"Chain: {info['chain']}")

# Get latest block
best_hash = rpc.getbestblockhash()
block = rpc.getblock(best_hash, 2)  # verbosity 2 = include full tx data
print(f"Block {block['height']}: {len(block['tx'])} transactions")
```

## Conclusion

Running a Bitcoin node transforms you from a consumer of blockchain data to a first-class participant in the network. For development, signet gives you a realistic environment without risking real money; regtest gives you instant blocks for rapid iteration. With the JSON-RPC interface fully exposed, you have direct access to every piece of data the Bitcoin protocol exposes — mempool, UTXOs, blocks, transactions — with no rate limits and no intermediaries.
