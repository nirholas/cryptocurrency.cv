---
title: "How to Query Bitcoin Ordinals Data via API"
description: "Learn how to query Bitcoin Ordinals inscription data using the ord API. Fetch inscriptions, address holdings, collections and sat rarity, and parse BRC-20 operations."
date: "2026-03-30"
author: team
category: tutorial
tags: ["ordinals", "bitcoin", "api", "brc20", "nft", "developer"]
image: "/images/blog/ordinals-api-guide.jpg"
imageAlt: "Bitcoin Ordinals inscription viewer showing on-chain digital artifacts"
---

Bitcoin Ordinals introduced the concept of inscriptions — arbitrary data permanently attached to individual satoshis on the Bitcoin blockchain. From digital art to BRC-20 tokens to on-chain games, Ordinals have created a new ecosystem built entirely on Bitcoin's security. This guide covers the APIs available for querying inscription data.

## The Ordinals Protocol

Ordinals work by assigning serial numbers to individual satoshis (the smallest unit of Bitcoin, 0.00000001 BTC) based on the order they were mined. "Inscriptions" attach arbitrary data — images, text, JSON — to specific satoshis using Bitcoin's `OP_RETURN` and witness data fields.

This data is:
- Stored entirely on-chain (not IPFS or any external server)
- Permanent (as long as Bitcoin exists)
- Accessible through Bitcoin nodes with the ord indexer

## Running the ord Indexer

The `ord` tool by Casey Rodarmor is the reference implementation:

```bash
# Install
cargo install ord

# Sync Bitcoin full node first, then:
ord --bitcoin-data-dir=/path/to/bitcoin/data index

# Run the HTTP server
ord server --http
```

This exposes a local API at `http://localhost:80`.

## ord HTTP API

```javascript
const ORD_BASE = process.env.ORD_BASE || 'https://ordinals.com';

// Fetch inscription by ID (hash:index)
async function getInscription(inscriptionId) {
  const response = await fetch(`${ORD_BASE}/inscription/${inscriptionId}`, {
    headers: { 'Accept': 'application/json' },
  });
  return response.json();
}

// Get inscription content (actual image/text)
async function getInscriptionContent(inscriptionId) {
  const response = await fetch(`${ORD_BASE}/content/${inscriptionId}`);
  const contentType = response.headers.get('content-type');
  const blob = await response.blob();
  return { contentType, blob };
}

// Get all inscriptions on a specific satoshi
async function getSatInscriptions(satNumber) {
  const response = await fetch(`${ORD_BASE}/sat/${satNumber}`, {
    headers: { 'Accept': 'application/json' },
  });
  return response.json();
}

// Get inscriptions in a range
async function getInscriptionsByBlock(blockHeight) {
  const response = await fetch(`${ORD_BASE}/inscriptions/block/${blockHeight}`, {
    headers: { 'Accept': 'application/json' },
  });
  return response.json();
}
```

## Listing and Filtering with ord

Hiro retired its managed Ordinals, Runes and BRC-20 APIs on March 9, 2026 (`api.hiro.so/ordinals/v1` now returns `410 Gone`, see the [deprecation announcement](https://www.hiro.so/blog/upcoming-deprecation-of-ordinals-runes-and-brc-20-apis)). Everything below uses the `ord` JSON API instead, so you can point `ORD_BASE` at your own indexer and avoid depending on a hosted service.

```javascript
// List the latest inscriptions (ord returns ids plus paging flags)
async function listInscriptions(page = 0) {
  const response = await fetch(`${ORD_BASE}/inscriptions/${page}`, {
    headers: { 'Accept': 'application/json' },
  });
  if (!response.ok) throw new Error(`ord error: ${response.status}`);
  return response.json(); // { ids, more, page_index }
}

// Get inscriptions held by an address
async function getAddressInscriptions(address) {
  const response = await fetch(`${ORD_BASE}/address/${address}`, {
    headers: { 'Accept': 'application/json' },
  });
  if (!response.ok) throw new Error(`ord error: ${response.status}`);
  return response.json(); // { outputs, inscriptions, sat_balance, runes_balances }
}

// Get the children of a parent inscription (how collections are modelled)
async function getChildren(parentId, page = 0) {
  const response = await fetch(`${ORD_BASE}/r/children/${parentId}/${page}`, {
    headers: { 'Accept': 'application/json' },
  });
  if (!response.ok) throw new Error(`ord error: ${response.status}`);
  return response.json(); // { ids, more, page }
}
```

## Working with BRC-20 Tokens

BRC-20 is an experimental token standard built on Ordinals using JSON inscriptions. `ord` does not index BRC-20 balances, so balance queries need a BRC-20 indexer that you run yourself; the snippet below shows how to recognise the operations in inscription content:

```javascript
// BRC-20 operations are JSON-encoded inscriptions
// Deploy
const deployOp = {
  "p": "brc-20",
  "op": "deploy",
  "tick": "ORDI",
  "max": "21000000",
  "lim": "1000"
};

// Mint
const mintOp = {
  "p": "brc-20",
  "op": "mint",
  "tick": "ORDI",
  "amt": "1000"
};

// Transfer
const transferOp = {
  "p": "brc-20",
  "op": "transfer",
  "tick": "ORDI",
  "amt": "500"
};

// Parse BRC-20 inscription content
function parseBRC20Inscription(content) {
  try {
    const data = JSON.parse(content);
    if (data.p === 'brc-20') {
      return {
        protocol: data.p,
        operation: data.op,
        ticker: data.tick,
        amount: data.amt,
        maxSupply: data.max,
        mintLimit: data.lim,
      };
    }
  } catch {
    return null;
  }
}
```

## Building an Ordinals Collection Viewer

```javascript
async function getCollectionInscriptions(parentInscriptionId) {
  // Collections are parent inscriptions; their members are the parent's children
  const { ids } = await getChildren(parentInscriptionId);
  return Promise.all(ids.map(getInscription));
}

// Display inscription with its content
async function displayInscription(inscription) {
  console.log(`ID: ${inscription.id}`);
  console.log(`Number: #${inscription.number}`);
  console.log(`Content type: ${inscription.content_type}`);
  console.log(`Genesis block: ${inscription.genesis_height}`);
  console.log(`Sat ordinal: ${inscription.sat}`);
  console.log(`Sat rarity: ${inscription.sat_rarity}`);
  console.log(`Value: ${inscription.value} sats`);
  console.log(`Preview URL: https://ordinals.com/preview/${inscription.id}`);
  console.log(`Content URL: https://ordinals.com/content/${inscription.id}`);
}

// Fetch and display latest inscriptions
const latest = await listInscriptions();
for (const id of latest.ids.slice(0, 10)) {
  await displayInscription(await getInscription(id));
  console.log('---');
}
```

## Sat Rarity

Ordinals uses a rarity system based on Bitcoin's mining calendar:

```javascript
function getSatRarityInfo(rarity) {
  const rarities = {
    common: 'A sat with no special significance',
    uncommon: 'The first sat of each block',
    rare: 'The first sat of each difficulty adjustment period',
    epic: 'The first sat of each halving epoch',
    legendary: 'The first sat of each cycle',
    mythic: 'The first sat of the genesis block',
  };

  return rarities[rarity] || 'Unknown rarity';
}

// Look up a sat and its inscriptions (ord reports the rarity itself)
async function getSat(satNumber) {
  const response = await fetch(`${ORD_BASE}/sat/${satNumber}`, {
    headers: { 'Accept': 'application/json' },
  });
  if (!response.ok) throw new Error(`ord error: ${response.status}`);
  const sat = await response.json(); // { number, rarity, inscriptions, ... }
  return { ...sat, description: getSatRarityInfo(sat.rarity) };
}
```

## Tracking Ordinals News

Stay up to date with Ordinals protocol developments using the [free-crypto-news API](https://free-crypto-news.com):

```javascript
async function getOrdinalsNews() {
  const response = await fetch(
    'https://free-crypto-news.com/api/news?symbols=BTC&category=ordinals&limit=10'
  );
  return response.json();
}
```

## Conclusion

Bitcoin Ordinals created an entirely new category of on-chain digital artifacts. The `ord` daemon API provides comprehensive access to inscription data, BRC-20 token states, and satoshi rarity information. As the ecosystem matures with new standards and tooling, developers who understand these APIs will be well-positioned to build the next generation of Bitcoin-native applications.
