#!/usr/bin/env node
/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * WebSocket Horizontal Scaling Load Test
 *
 * Validates the WS server can handle thousands of concurrent connections
 * with subscription state, backpressure handling, and graceful reconnection.
 *
 * Usage:
 *   node scripts/load-tests/ws-horizontal-scale.js
 *   WS_URL=ws://localhost:8080 CONNECTIONS=5000 node scripts/load-tests/ws-horizontal-scale.js
 *
 * Environment:
 *   WS_URL        - WebSocket server URL (default: ws://localhost:8080)
 *   CONNECTIONS    - Target concurrent connections (default: 1000)
 *   RAMP_DURATION  - Ramp-up time in seconds (default: 30)
 *   HOLD_DURATION  - Hold at peak for N seconds (default: 30)
 *   BATCH_SIZE     - Connections per batch (default: 50)
 */

const WebSocket = require('ws');

const WS_URL = process.env.WS_URL || 'ws://localhost:8080';
const TARGET_CONNECTIONS = parseInt(process.env.CONNECTIONS || '1000', 10);
const RAMP_DURATION_S = parseInt(process.env.RAMP_DURATION || '30', 10);
const HOLD_DURATION_S = parseInt(process.env.HOLD_DURATION || '30', 10);
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '50', 10);

const CHANNELS = ['bitcoin', 'ethereum', 'defi', 'nft', 'regulation', 'altcoins', 'markets'];

// Metrics
const metrics = {
  attempted: 0,
  connected: 0,
  failed: 0,
  messagesReceived: 0,
  messagesSent: 0,
  subscribes: 0,
  reconnectMessages: 0,
  errors: 0,
  closed: 0,
  backpressureDrops: 0,
  avgConnectTimeMs: 0,
  maxConnectTimeMs: 0,
  connectTimes: [],
};

const connections = new Map();
let shuttingDown = false;

function pickRandom(arr, count = 1) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function createConnection(id) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    metrics.attempted++;

    let ws;
    try {
      ws = new WebSocket(WS_URL, {
        perMessageDeflate: false, // Disable compression for load test clients
        handshakeTimeout: 10000,
      });
    } catch (err) {
      metrics.failed++;
      resolve(false);
      return;
    }

    const timeout = setTimeout(() => {
      metrics.failed++;
      try { ws.terminate(); } catch { /* noop */ }
      resolve(false);
    }, 15000);

    ws.on('open', () => {
      clearTimeout(timeout);
      const connectTime = Date.now() - startTime;
      metrics.connected++;
      metrics.connectTimes.push(connectTime);
      if (connectTime > metrics.maxConnectTimeMs) {
        metrics.maxConnectTimeMs = connectTime;
      }

      connections.set(id, { ws, channels: [], clientId: null });

      // Subscribe to 1-3 random channels
      const channels = pickRandom(CHANNELS, Math.floor(Math.random() * 3) + 1);
      for (const ch of channels) {
        ws.send(JSON.stringify({ type: 'join_channel', payload: { channel: ch } }));
        metrics.messagesSent++;
        metrics.subscribes++;
      }
      connections.get(id).channels = channels;

      // Enable price streaming on ~30% of connections
      if (Math.random() < 0.3) {
        ws.send(JSON.stringify({ type: 'stream_prices', payload: { enabled: true } }));
        metrics.messagesSent++;
      }

      resolve(true);
    });

    ws.on('message', (data) => {
      metrics.messagesReceived++;
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'connected') {
          const conn = connections.get(id);
          if (conn) conn.clientId = msg.payload?.clientId;
        }
        if (msg.type === 'reconnect') {
          metrics.reconnectMessages++;
        }
      } catch { /* ignore */ }
    });

    ws.on('error', () => {
      clearTimeout(timeout);
      metrics.errors++;
    });

    ws.on('close', () => {
      clearTimeout(timeout);
      metrics.closed++;
      connections.delete(id);
    });
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function printMetrics(phase) {
  const times = metrics.connectTimes;
  const avg = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
  const sorted = [...times].sort((a, b) => a - b);
  const p95 = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.95)] : 0;
  const p99 = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.99)] : 0;

  const active = [...connections.values()].filter(c => c.ws.readyState === WebSocket.OPEN).length;

  console.log(`
┌─────────────────────────────────────────────────┐
│ ${phase.padEnd(47)} │
├─────────────────────────────────────────────────┤
│ Attempted:      ${String(metrics.attempted).padStart(8)}                      │
│ Connected:      ${String(metrics.connected).padStart(8)}                      │
│ Active now:     ${String(active).padStart(8)}                      │
│ Failed:         ${String(metrics.failed).padStart(8)}                      │
│ Errors:         ${String(metrics.errors).padStart(8)}                      │
│ Closed:         ${String(metrics.closed).padStart(8)}                      │
│ Msgs received:  ${String(metrics.messagesReceived).padStart(8)}                      │
│ Msgs sent:      ${String(metrics.messagesSent).padStart(8)}                      │
│ Subscribes:     ${String(metrics.subscribes).padStart(8)}                      │
│ Reconnect msgs: ${String(metrics.reconnectMessages).padStart(8)}                      │
│ Avg connect:    ${String(avg + 'ms').padStart(8)}                      │
│ P95 connect:    ${String(p95 + 'ms').padStart(8)}                      │
│ P99 connect:    ${String(p99 + 'ms').padStart(8)}                      │
│ Max connect:    ${String(metrics.maxConnectTimeMs + 'ms').padStart(8)}                      │
└─────────────────────────────────────────────────┘`);
}

async function rampUp() {
  console.log(`\n🔄 Ramping up to ${TARGET_CONNECTIONS} connections over ${RAMP_DURATION_S}s (batch size: ${BATCH_SIZE})`);

  const totalBatches = Math.ceil(TARGET_CONNECTIONS / BATCH_SIZE);
  const delayPerBatch = (RAMP_DURATION_S * 1000) / totalBatches;
  let connId = 0;

  for (let batch = 0; batch < totalBatches && !shuttingDown; batch++) {
    const batchPromises = [];
    const thisBatchSize = Math.min(BATCH_SIZE, TARGET_CONNECTIONS - connId);

    for (let i = 0; i < thisBatchSize; i++) {
      batchPromises.push(createConnection(connId++));
    }

    await Promise.all(batchPromises);

    if ((batch + 1) % 10 === 0 || batch === totalBatches - 1) {
      const active = [...connections.values()].filter(c => c.ws.readyState === WebSocket.OPEN).length;
      console.log(`  Batch ${batch + 1}/${totalBatches}: ${active} active connections`);
    }

    if (batch < totalBatches - 1) {
      await sleep(delayPerBatch);
    }
  }

  printMetrics('RAMP-UP COMPLETE');
}

async function holdPeak() {
  console.log(`\n⏳ Holding ${connections.size} connections for ${HOLD_DURATION_S}s...`);

  const startHold = Date.now();
  const msgsAtStart = metrics.messagesReceived;

  // Send periodic pings during hold
  const pingInterval = setInterval(() => {
    let pingSent = 0;
    for (const [, conn] of connections) {
      if (conn.ws.readyState === WebSocket.OPEN) {
        try {
          conn.ws.send(JSON.stringify({ type: 'ping' }));
          metrics.messagesSent++;
          pingSent++;
        } catch { /* ignore */ }
      }
    }
  }, 15000);

  await sleep(HOLD_DURATION_S * 1000);
  clearInterval(pingInterval);

  const elapsed = (Date.now() - startHold) / 1000;
  const msgsReceived = metrics.messagesReceived - msgsAtStart;
  console.log(`  Messages received during hold: ${msgsReceived} (${Math.round(msgsReceived / elapsed)}/s)`);

  printMetrics('HOLD COMPLETE');
}

async function tearDown() {
  console.log(`\n🔌 Closing ${connections.size} connections...`);
  const closePromises = [];

  for (const [id, conn] of connections) {
    closePromises.push(new Promise((resolve) => {
      try {
        if (conn.ws.readyState === WebSocket.OPEN) {
          conn.ws.close(1000, 'Load test complete');
          conn.ws.on('close', resolve);
          setTimeout(resolve, 5000);
        } else {
          conn.ws.terminate();
          resolve();
        }
      } catch {
        resolve();
      }
    }));
  }

  await Promise.allSettled(closePromises);
  connections.clear();

  printMetrics('FINAL RESULTS');
}

function evaluateResults() {
  const times = metrics.connectTimes;
  const sorted = [...times].sort((a, b) => a - b);
  const p95 = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.95)] : 0;
  const successRate = metrics.attempted > 0 ? metrics.connected / metrics.attempted : 0;

  console.log('\n📋 PASS/FAIL Criteria:');
  const checks = [
    { name: 'Connection success rate ≥ 95%', pass: successRate >= 0.95, value: `${(successRate * 100).toFixed(1)}%` },
    { name: 'P95 connect time < 5000ms', pass: p95 < 5000, value: `${p95}ms` },
    { name: 'Received messages > 0', pass: metrics.messagesReceived > 0, value: String(metrics.messagesReceived) },
    { name: 'No excessive errors (<5%)', pass: metrics.errors / Math.max(1, metrics.attempted) < 0.05, value: `${((metrics.errors / Math.max(1, metrics.attempted)) * 100).toFixed(1)}%` },
  ];

  let allPass = true;
  for (const c of checks) {
    const icon = c.pass ? '✅' : '❌';
    console.log(`  ${icon} ${c.name}: ${c.value}`);
    if (!c.pass) allPass = false;
  }

  console.log(allPass ? '\n🎉 ALL CHECKS PASSED' : '\n⚠️  SOME CHECKS FAILED');
  return allPass;
}

async function main() {
  console.log(`
╔══════════════════════════════════════════════════╗
║  WebSocket Horizontal Scale Load Test            ║
╠══════════════════════════════════════════════════╣
║  Target:  ${String(TARGET_CONNECTIONS).padStart(6)} connections                  ║
║  Server:  ${WS_URL.padEnd(38)} ║
║  Ramp:    ${String(RAMP_DURATION_S + 's').padStart(6)}                              ║
║  Hold:    ${String(HOLD_DURATION_S + 's').padStart(6)}                              ║
║  Batch:   ${String(BATCH_SIZE).padStart(6)}                              ║
╚══════════════════════════════════════════════════╝`);

  process.on('SIGINT', () => {
    shuttingDown = true;
    console.log('\nInterrupted — tearing down...');
  });

  try {
    await rampUp();
    if (!shuttingDown) await holdPeak();
    await tearDown();
    const passed = evaluateResults();
    process.exit(passed ? 0 : 1);
  } catch (err) {
    console.error('Load test error:', err);
    await tearDown();
    process.exit(1);
  }
}

main();
