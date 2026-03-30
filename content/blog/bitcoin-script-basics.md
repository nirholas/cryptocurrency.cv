---
title: "Bitcoin Script for Application Developers"
description: "Learn Bitcoin Script fundamentals for application developers. Covers P2PKH, P2SH, P2WPKH, multisig, timelocks, and how to construct custom locking scripts."
date: "2026-03-30"
author: team
category: guide
tags: ["bitcoin", "script", "developer", "transactions", "multisig", "taproot"]
image: "/images/blog/bitcoin-script-basics.jpg"
imageAlt: "Bitcoin Script stack-based execution diagram showing locking and unlocking scripts"
---

Bitcoin Script is the stack-based programming language that governs how Bitcoin is spent. Every Bitcoin transaction includes a locking script (output) that defines the conditions under which funds can be spent, and an unlocking script (input) that satisfies those conditions. Understanding Bitcoin Script is essential for building advanced payment schemes, multisig wallets, time locks, and Taproot constructions.

## How Bitcoin Script Works

Bitcoin Script is a stack-based language, meaning operations push and pop data from a stack. A transaction output is "locked" with a locking script (`scriptPubKey`). To spend it, you provide an unlocking script (`scriptSig`) that, when executed before the locking script, leaves `TRUE` on the stack.

The two scripts are concatenated and executed:

```
<unlocking script> <locking script>
```

If execution ends with a non-empty, non-zero top stack element, the transaction is valid.

## Standard Script Types

### P2PKH: Pay to Public Key Hash

The most common script type. Locks funds to the hash of a public key:

**Locking script** (`scriptPubKey`):
```
OP_DUP OP_HASH160 <pubKeyHash> OP_EQUALVERIFY OP_CHECKSIG
```

**Unlocking script** (`scriptSig`):
```
<signature> <publicKey>
```

**Execution**:
1. Push `<signature>` and `<publicKey>` onto stack
2. `OP_DUP`: Duplicate `<publicKey>`
3. `OP_HASH160`: Hash the duplicate
4. Push `<pubKeyHash>` from the script
5. `OP_EQUALVERIFY`: Assert hash equals stored hash
6. `OP_CHECKSIG`: Verify signature against public key

### P2SH: Pay to Script Hash

P2SH allows complex scripts (multisig, timelocks) while keeping the locking script short:

**Locking script**:
```
OP_HASH160 <scriptHash> OP_EQUAL
```

The spender provides the redeem script plus data to satisfy it:
**Unlocking script**:
```
OP_0 <sig1> <sig2> <redeemScript>
```

### P2WPKH: Native SegWit

Segregated Witness moved signatures outside the transaction to solve malleability and reduce fees:

**Locking script** (`scriptPubKey`):
```
OP_0 <20-byte-pubKeyHash>
```

The witness data contains: `[<signature>, <publicKey>]`

### P2TR: Taproot (P2TR)

The latest and most flexible standard:

**Locking script**:
```
OP_1 <32-byte-tweaked-public-key>
```

Taproot allows spending either via a key path (single signature) or a script path (arbitrary script tree).

## Creating Addresses with bitcoinjs-lib

```bash
npm install bitcoinjs-lib tiny-secp256k1 ecpair
```

```javascript
import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { ECPairFactory } from 'ecpair';

bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);

const network = bitcoin.networks.mainnet;

// Generate P2PKH address
function generateP2PKH() {
  const keyPair = ECPair.makeRandom({ network });
  const p2pkh = bitcoin.payments.p2pkh({
    pubkey: Buffer.from(keyPair.publicKey),
    network,
  });
  return {
    address: p2pkh.address,
    privateKey: keyPair.toWIF(),
    publicKey: Buffer.from(keyPair.publicKey).toString('hex'),
  };
}

// Generate P2WPKH (native SegWit) address
function generateP2WPKH() {
  const keyPair = ECPair.makeRandom({ network });
  const p2wpkh = bitcoin.payments.p2wpkh({
    pubkey: Buffer.from(keyPair.publicKey),
    network,
  });
  return {
    address: p2wpkh.address, // Starts with 'bc1q'
    privateKey: keyPair.toWIF(),
  };
}

// Generate P2TR (Taproot) address
function generateP2TR() {
  const keyPair = ECPair.makeRandom({ network });
  const xOnlyPubkey = keyPair.publicKey.slice(1); // Remove prefix byte
  const p2tr = bitcoin.payments.p2tr({
    internalPubkey: Buffer.from(xOnlyPubkey),
    network,
  });
  return {
    address: p2tr.address, // Starts with 'bc1p'
    privateKey: keyPair.toWIF(),
  };
}
```

## Multisig with P2SH

A 2-of-3 multisig requires 2 of 3 designated keys to sign:

```javascript
function create2of3Multisig(pubkeys) {
  // pubkeys: array of 3 hex-encoded public keys
  const pubKeyBuffers = pubkeys.map(pk => Buffer.from(pk, 'hex'));

  const p2ms = bitcoin.payments.p2ms({
    m: 2, // require 2 signatures
    pubkeys: pubKeyBuffers,
    network,
  });

  const p2sh = bitcoin.payments.p2sh({
    redeem: p2ms,
    network,
  });

  return {
    address: p2sh.address,         // Funding address
    redeemScript: p2ms.output?.toString('hex'), // Keep this!
    p2sh,
    p2ms,
  };
}

// Decode and verify a P2SH redeem script
function decodeRedeemScript(redeemScriptHex) {
  const script = Buffer.from(redeemScriptHex, 'hex');
  const decompiled = bitcoin.script.decompile(script);
  const asm = bitcoin.script.toASM(script);

  return {
    asm,
    chunks: decompiled,
  };
}
```

## Timelocked Scripts

CLTV (CheckLockTimeVerify) locks funds until a specific time or block height:

```javascript
function createTimelockScript(lockTime, pubKeyHex) {
  const pubKey = Buffer.from(pubKeyHex, 'hex');

  // Script: <locktime> OP_CLTV OP_DROP OP_DUP OP_HASH160 <pubKeyHash> OP_EQUALVERIFY OP_CHECKSIG
  const script = bitcoin.script.compile([
    bitcoin.script.number.encode(lockTime),
    bitcoin.opcodes.OP_CHECKLOCKTIMEVERIFY,
    bitcoin.opcodes.OP_DROP,
    bitcoin.opcodes.OP_DUP,
    bitcoin.opcodes.OP_HASH160,
    bitcoin.crypto.hash160(pubKey),
    bitcoin.opcodes.OP_EQUALVERIFY,
    bitcoin.opcodes.OP_CHECKSIG,
  ]);

  const p2sh = bitcoin.payments.p2sh({
    redeem: { output: script, network },
    network,
  });

  return {
    address: p2sh.address,
    redeemScript: script.toString('hex'),
    lockTime,
  };
}

// Lock until block 900000 (~2026)
const timelocked = createTimelockScript(900000, pubKeyHex);
console.log('Timelock address:', timelocked.address);
```

## Building a Transaction

```javascript
import axios from 'axios';

async function buildTransaction({
  fromWIF,
  toAddress,
  amountSats,
  feeSats = 1000,
}) {
  const keyPair = ECPair.fromWIF(fromWIF, network);
  const fromAddress = bitcoin.payments.p2wpkh({
    pubkey: Buffer.from(keyPair.publicKey),
    network,
  }).address;

  // Fetch UTXOs from mempool.space
  const utxoResponse = await fetch(`https://mempool.space/api/address/${fromAddress}/utxo`);
  const utxos = await utxoResponse.json();

  const psbt = new bitcoin.Psbt({ network });
  let inputTotal = 0;

  // Add inputs
  for (const utxo of utxos) {
    if (inputTotal >= amountSats + feeSats) break;

    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        script: bitcoin.payments.p2wpkh({
          pubkey: Buffer.from(keyPair.publicKey),
          network,
        }).output!,
        value: utxo.value,
      },
    });

    inputTotal += utxo.value;
  }

  // Add output (recipient)
  psbt.addOutput({ address: toAddress, value: amountSats });

  // Change output
  const change = inputTotal - amountSats - feeSats;
  if (change > 546) { // Dust threshold
    psbt.addOutput({ address: fromAddress, value: change });
  }

  // Sign
  psbt.signAllInputs(keyPair);
  psbt.finalizeAllInputs();

  return psbt.extractTransaction().toHex();
}
```

## Taproot Script Trees

Taproot's key innovation is the ability to commit to an entire tree of script branches:

```javascript
function createTaprootWithFallback(ownerPubKey, fallbackScript, network) {
  const xOnlyOwner = Buffer.from(ownerPubKey, 'hex').slice(1);

  // Script tree with a fallback spending condition
  const scriptTree = {
    output: fallbackScript,
  };

  const p2tr = bitcoin.payments.p2tr({
    internalPubkey: xOnlyOwner,
    scriptTree,
    network,
  });

  return {
    address: p2tr.address,
    // Key path: spend with single signature (private key)
    // Script path: spend with fallback script
  };
}
```

## Conclusion

Bitcoin Script is more powerful than most developers realize. Between multisig, timelocks, hash locks (HTLCs), and Taproot's script trees, you can construct sophisticated financial instruments that settle on the most secure public blockchain ever created. The bitcoinjs-lib library makes these constructions accessible from JavaScript without needing to implement cryptographic primitives yourself.
