/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProtocolNode {
  name: string;
  position: THREE.Vector3;
  mesh: THREE.Mesh;
  label: HTMLDivElement | null;
  color: THREE.Color;
  particleOffset: number;
  particleCount: number;
}

interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  timestamp: number;
  protocol: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROTOCOLS = [
  { name: 'Coinbase', color: '#0052FF' },
  { name: 'Base', color: '#0052FF' },
  { name: 'USDC', color: '#2775CA' },
  { name: 'Stripe x402', color: '#635BFF' },
  { name: 'Aave', color: '#B6509E' },
  { name: 'Uniswap', color: '#FF007A' },
  { name: 'Morpho', color: '#00D395' },
  { name: 'Compound', color: '#00D395' },
];

const PARTICLES_PER_PROTOCOL = 200;
const TOTAL_PARTICLES = PROTOCOLS.length * PARTICLES_PER_PROTOCOL;
const MOUSE_REPULSION_RADIUS = 2.5;
const MOUSE_REPULSION_FORCE = 8;
const SPRING_STIFFNESS = 0.02;
const DRAG = 0.92;
const CONNECTION_DISTANCE = 1.2;
const MAX_CONNECTIONS = 600;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function X402Visualizer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number>(0);
  const mouseRef = useRef(new THREE.Vector2(9999, 9999));
  const mouse3DRef = useRef(new THREE.Vector3(9999, 9999, 0));
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({ total: 0, volume: 0, tps: 0 });
  const [isPaused, setIsPaused] = useState(false);
  const [bgColor, setBgColor] = useState('#0a0a0f');

  // Generate simulated x402 transactions
  const generateTransaction = useCallback((): Transaction => {
    const fromProtocol = PROTOCOLS[Math.floor(Math.random() * PROTOCOLS.length)];
    let toProtocol = PROTOCOLS[Math.floor(Math.random() * PROTOCOLS.length)];
    while (toProtocol.name === fromProtocol.name) {
      toProtocol = PROTOCOLS[Math.floor(Math.random() * PROTOCOLS.length)];
    }
    return {
      id: `0x${Math.random().toString(16).slice(2, 10)}`,
      from: fromProtocol.name,
      to: toProtocol.name,
      amount: Math.random() * 10000,
      timestamp: Date.now(),
      protocol: fromProtocol.name,
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current || !labelsRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    const labelsContainer = labelsRef.current;

    // -----------------------------------------------------------------------
    // Scene setup
    // -----------------------------------------------------------------------
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(bgColor);

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 18);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    // -----------------------------------------------------------------------
    // Raycaster for mouse interaction
    // -----------------------------------------------------------------------
    const raycaster = new THREE.Raycaster();
    const intersectPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

    // -----------------------------------------------------------------------
    // Protocol nodes (primary hubs)
    // -----------------------------------------------------------------------
    const protocolNodes: ProtocolNode[] = [];
    const nodeGeometry = new THREE.SphereGeometry(0.35, 32, 32);

    PROTOCOLS.forEach((proto, i) => {
      const angle = (i / PROTOCOLS.length) * Math.PI * 2;
      const radius = 5 + Math.random() * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = (Math.random() - 0.5) * 4;

      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(proto.color),
      });
      const mesh = new THREE.Mesh(nodeGeometry, material);
      mesh.position.set(x, y, z);
      scene.add(mesh);

      // Glow ring
      const ringGeo = new THREE.RingGeometry(0.45, 0.55, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(proto.color),
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(mesh.position);
      scene.add(ring);

      // HTML label
      const label = document.createElement('div');
      label.className = 'x402-label';
      label.textContent = proto.name;
      label.style.cssText = `
        position: absolute;
        color: white;
        font-size: 11px;
        font-family: 'JetBrains Mono', monospace;
        background: rgba(0,0,0,0.7);
        padding: 3px 8px;
        border-radius: 4px;
        pointer-events: none;
        white-space: nowrap;
        border: 1px solid ${proto.color}40;
        text-transform: uppercase;
        letter-spacing: 1px;
      `;
      labelsContainer.appendChild(label);

      protocolNodes.push({
        name: proto.name,
        position: mesh.position.clone(),
        mesh,
        label,
        color: new THREE.Color(proto.color),
        particleOffset: i * PARTICLES_PER_PROTOCOL,
        particleCount: PARTICLES_PER_PROTOCOL,
      });
    });

    // -----------------------------------------------------------------------
    // Central hub
    // -----------------------------------------------------------------------
    const hubGeo = new THREE.SphereGeometry(0.5, 32, 32);
    const hubMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const hubMesh = new THREE.Mesh(hubGeo, hubMat);
    scene.add(hubMesh);

    // Hub connection lines to protocol nodes
    const hubLinePositions = new Float32Array(PROTOCOLS.length * 6);
    const hubLineColors = new Float32Array(PROTOCOLS.length * 6);
    protocolNodes.forEach((node, i) => {
      hubLinePositions[i * 6] = 0;
      hubLinePositions[i * 6 + 1] = 0;
      hubLinePositions[i * 6 + 2] = 0;
      hubLinePositions[i * 6 + 3] = node.position.x;
      hubLinePositions[i * 6 + 4] = node.position.y;
      hubLinePositions[i * 6 + 5] = node.position.z;
      hubLineColors[i * 6] = node.color.r;
      hubLineColors[i * 6 + 1] = node.color.g;
      hubLineColors[i * 6 + 2] = node.color.b;
      hubLineColors[i * 6 + 3] = node.color.r;
      hubLineColors[i * 6 + 4] = node.color.g;
      hubLineColors[i * 6 + 5] = node.color.b;
    });
    const hubLineGeo = new THREE.BufferGeometry();
    hubLineGeo.setAttribute('position', new THREE.BufferAttribute(hubLinePositions, 3));
    hubLineGeo.setAttribute('color', new THREE.BufferAttribute(hubLineColors, 3));
    const hubLineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.15,
    });
    const hubLines = new THREE.LineSegments(hubLineGeo, hubLineMat);
    scene.add(hubLines);

    // -----------------------------------------------------------------------
    // Secondary particles (x402 transaction data points)
    // -----------------------------------------------------------------------
    const particlePositions = new Float32Array(TOTAL_PARTICLES * 3);
    const particleColors = new Float32Array(TOTAL_PARTICLES * 3);
    const particleSizes = new Float32Array(TOTAL_PARTICLES);
    const velocities = new Float32Array(TOTAL_PARTICLES * 3);
    const homePositions = new Float32Array(TOTAL_PARTICLES * 3);

    protocolNodes.forEach((node) => {
      for (let i = 0; i < node.particleCount; i++) {
        const idx = (node.particleOffset + i) * 3;
        const sIdx = node.particleOffset + i;

        // Distribute in a sphere around the protocol node
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 0.5 + Math.random() * 2;

        const x = node.position.x + r * Math.sin(phi) * Math.cos(theta);
        const y = node.position.y + r * Math.sin(phi) * Math.sin(theta);
        const z = node.position.z + r * Math.cos(phi);

        particlePositions[idx] = x;
        particlePositions[idx + 1] = y;
        particlePositions[idx + 2] = z;

        homePositions[idx] = x;
        homePositions[idx + 1] = y;
        homePositions[idx + 2] = z;

        // Color with slight variation
        particleColors[idx] = node.color.r + (Math.random() - 0.5) * 0.1;
        particleColors[idx + 1] = node.color.g + (Math.random() - 0.5) * 0.1;
        particleColors[idx + 2] = node.color.b + (Math.random() - 0.5) * 0.1;

        particleSizes[sIdx] = 2 + Math.random() * 4;

        velocities[idx] = 0;
        velocities[idx + 1] = 0;
        velocities[idx + 2] = 0;
      }
    });

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    particleGeo.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));

    const particleMat = new THREE.PointsMaterial({
      size: 3,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(particleGeo, particleMat);
    scene.add(points);

    // -----------------------------------------------------------------------
    // Connection lines (proximity web)
    // -----------------------------------------------------------------------
    const linePositions = new Float32Array(MAX_CONNECTIONS * 6);
    const lineColors = new Float32Array(MAX_CONNECTIONS * 6);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeo.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));
    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
    });
    const lineSegments = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lineSegments);

    // -----------------------------------------------------------------------
    // Transaction pulse particles (travel between nodes)
    // -----------------------------------------------------------------------
    const PULSE_COUNT = 30;
    const pulsePositions = new Float32Array(PULSE_COUNT * 3);
    const pulseSizes = new Float32Array(PULSE_COUNT);
    const pulseGeo = new THREE.BufferGeometry();
    pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulsePositions, 3));
    pulseGeo.setAttribute('size', new THREE.BufferAttribute(pulseSizes, 1));
    const pulseMat = new THREE.PointsMaterial({
      size: 8,
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const pulsePoints = new THREE.Points(pulseGeo, pulseMat);
    scene.add(pulsePoints);

    // Pulse state
    const pulses = Array.from({ length: PULSE_COUNT }, () => ({
      active: false,
      progress: 0,
      speed: 0,
      fromIdx: 0,
      toIdx: 0,
    }));

    // -----------------------------------------------------------------------
    // Mouse events
    // -----------------------------------------------------------------------
    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouseRef.current, camera);
      const target = new THREE.Vector3();
      raycaster.ray.intersectPlane(intersectPlane, target);
      if (target) mouse3DRef.current.copy(target);
    };

    container.addEventListener('mousemove', onMouseMove);

    // -----------------------------------------------------------------------
    // Simulation state
    // -----------------------------------------------------------------------
    let txCount = 0;
    let txVolume = 0;
    let lastTxTime = Date.now();
    const recentTxTimes: number[] = [];

    // Transaction generation interval
    const txInterval = setInterval(() => {
      if (isPaused) return;

      const tx = generateTransaction();
      txCount++;
      txVolume += tx.amount;
      const now = Date.now();
      recentTxTimes.push(now);
      // Keep only last 10 seconds
      while (recentTxTimes.length > 0 && recentTxTimes[0] < now - 10000) {
        recentTxTimes.shift();
      }

      setTransactions((prev) => [tx, ...prev].slice(0, 50));
      setStats({
        total: txCount,
        volume: txVolume,
        tps: recentTxTimes.length / 10,
      });

      // Launch a pulse
      const fromNode = protocolNodes.find((n) => n.name === tx.from);
      const toNode = protocolNodes.find((n) => n.name === tx.to);
      if (fromNode && toNode) {
        const freePulse = pulses.find((p) => !p.active);
        if (freePulse) {
          freePulse.active = true;
          freePulse.progress = 0;
          freePulse.speed = 0.008 + Math.random() * 0.015;
          freePulse.fromIdx = protocolNodes.indexOf(fromNode);
          freePulse.toIdx = protocolNodes.indexOf(toNode);
        }
      }

      lastTxTime = now;
    }, 200 + Math.random() * 400);

    // -----------------------------------------------------------------------
    // Animation loop
    // -----------------------------------------------------------------------
    const clock = new THREE.Clock();

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      if (isPaused) return;

      const time = clock.getElapsedTime();
      const mouse3D = mouse3DRef.current;

      // Slow camera orbit
      camera.position.x = Math.sin(time * 0.05) * 1.5;
      camera.position.y = Math.cos(time * 0.07) * 1;
      camera.lookAt(0, 0, 0);

      // Animate protocol nodes (gentle drift)
      protocolNodes.forEach((node, i) => {
        const baseAngle = (i / PROTOCOLS.length) * Math.PI * 2;
        node.mesh.position.x =
          node.position.x + Math.sin(time * 0.3 + baseAngle) * 0.3;
        node.mesh.position.y =
          node.position.y + Math.cos(time * 0.25 + baseAngle) * 0.2;

        // Update hub lines
        hubLinePositions[i * 6 + 3] = node.mesh.position.x;
        hubLinePositions[i * 6 + 4] = node.mesh.position.y;
        hubLinePositions[i * 6 + 5] = node.mesh.position.z;
      });
      hubLineGeo.attributes.position.needsUpdate = true;

      // Update particles with spring physics & mouse repulsion
      const posAttr = particleGeo.attributes.position;
      const posArray = posAttr.array as Float32Array;

      for (let i = 0; i < TOTAL_PARTICLES; i++) {
        const idx = i * 3;

        // Find parent node
        const nodeIdx = Math.floor(i / PARTICLES_PER_PROTOCOL);
        const node = protocolNodes[nodeIdx];
        if (!node) continue;

        // Orbital motion
        const angle = time * 0.4 + (i * 0.1);
        const orbitRadius = 0.15;
        const orbitX = Math.cos(angle) * orbitRadius;
        const orbitY = Math.sin(angle) * orbitRadius;

        // Spring force toward home (relative to node current position)
        const homeX = homePositions[idx] - node.position.x + node.mesh.position.x;
        const homeY = homePositions[idx + 1] - node.position.y + node.mesh.position.y;
        const homeZ = homePositions[idx + 2];

        const dx = homeX + orbitX - posArray[idx];
        const dy = homeY + orbitY - posArray[idx + 1];
        const dz = homeZ - posArray[idx + 2];

        velocities[idx] += dx * SPRING_STIFFNESS;
        velocities[idx + 1] += dy * SPRING_STIFFNESS;
        velocities[idx + 2] += dz * SPRING_STIFFNESS;

        // Mouse repulsion
        const mx = posArray[idx] - mouse3D.x;
        const my = posArray[idx + 1] - mouse3D.y;
        const mz = posArray[idx + 2] - mouse3D.z;
        const mDist = Math.sqrt(mx * mx + my * my + mz * mz);

        if (mDist < MOUSE_REPULSION_RADIUS && mDist > 0.01) {
          const force = (MOUSE_REPULSION_FORCE * (MOUSE_REPULSION_RADIUS - mDist)) / mDist;
          velocities[idx] += mx * force * 0.01;
          velocities[idx + 1] += my * force * 0.01;
          velocities[idx + 2] += mz * force * 0.01;
        }

        // Apply velocity with drag
        velocities[idx] *= DRAG;
        velocities[idx + 1] *= DRAG;
        velocities[idx + 2] *= DRAG;

        posArray[idx] += velocities[idx];
        posArray[idx + 1] += velocities[idx + 1];
        posArray[idx + 2] += velocities[idx + 2];
      }
      posAttr.needsUpdate = true;

      // Proximity connection lines
      let lineIdx = 0;
      const linePos = lineGeo.attributes.position.array as Float32Array;
      const lineCol = lineGeo.attributes.color.array as Float32Array;

      for (let i = 0; i < TOTAL_PARTICLES && lineIdx < MAX_CONNECTIONS; i += 3) {
        for (let j = i + 3; j < Math.min(i + 30, TOTAL_PARTICLES) && lineIdx < MAX_CONNECTIONS; j += 3) {
          const dx = posArray[i * 3] - posArray[j * 3];
          const dy = posArray[i * 3 + 1] - posArray[j * 3 + 1];
          const dz = posArray[i * 3 + 2] - posArray[j * 3 + 2];
          const dist = dx * dx + dy * dy + dz * dz;

          if (dist < CONNECTION_DISTANCE * CONNECTION_DISTANCE) {
            const li = lineIdx * 6;
            linePos[li] = posArray[i * 3];
            linePos[li + 1] = posArray[i * 3 + 1];
            linePos[li + 2] = posArray[i * 3 + 2];
            linePos[li + 3] = posArray[j * 3];
            linePos[li + 4] = posArray[j * 3 + 1];
            linePos[li + 5] = posArray[j * 3 + 2];

            const alpha = 1 - Math.sqrt(dist) / CONNECTION_DISTANCE;
            const nodeI = Math.floor(i / PARTICLES_PER_PROTOCOL);
            const color = protocolNodes[nodeI]?.color || new THREE.Color(1, 1, 1);
            lineCol[li] = color.r * alpha;
            lineCol[li + 1] = color.g * alpha;
            lineCol[li + 2] = color.b * alpha;
            lineCol[li + 3] = color.r * alpha;
            lineCol[li + 4] = color.g * alpha;
            lineCol[li + 5] = color.b * alpha;
            lineIdx++;
          }
        }
      }

      // Zero out unused lines
      for (let i = lineIdx; i < MAX_CONNECTIONS; i++) {
        const li = i * 6;
        linePos[li] = linePos[li + 1] = linePos[li + 2] = 0;
        linePos[li + 3] = linePos[li + 4] = linePos[li + 5] = 0;
      }
      lineGeo.attributes.position.needsUpdate = true;
      lineGeo.attributes.color.needsUpdate = true;
      lineGeo.setDrawRange(0, lineIdx * 2);

      // Animate pulses
      const pulsePos = pulseGeo.attributes.position.array as Float32Array;
      const pulseSz = pulseGeo.attributes.size.array as Float32Array;
      pulses.forEach((p, i) => {
        if (!p.active) {
          pulsePos[i * 3] = 9999;
          pulsePos[i * 3 + 1] = 9999;
          pulsePos[i * 3 + 2] = 9999;
          pulseSz[i] = 0;
          return;
        }
        p.progress += p.speed;
        if (p.progress >= 1) {
          p.active = false;
          return;
        }
        const from = protocolNodes[p.fromIdx].mesh.position;
        const to = protocolNodes[p.toIdx].mesh.position;
        pulsePos[i * 3] = from.x + (to.x - from.x) * p.progress;
        pulsePos[i * 3 + 1] = from.y + (to.y - from.y) * p.progress;
        pulsePos[i * 3 + 2] = from.z + (to.z - from.z) * p.progress;
        // Pulse size peaks in middle
        pulseSz[i] = 6 * Math.sin(p.progress * Math.PI);
      });
      pulseGeo.attributes.position.needsUpdate = true;
      pulseGeo.attributes.size.needsUpdate = true;

      // Update HTML labels (CSS2D-style)
      protocolNodes.forEach((node) => {
        if (!node.label) return;
        const pos = node.mesh.position.clone();
        pos.project(camera);
        const x = (pos.x * 0.5 + 0.5) * container.clientWidth;
        const y = (-pos.y * 0.5 + 0.5) * container.clientHeight;
        node.label.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
        node.label.style.opacity = pos.z < 1 ? '1' : '0';
      });

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameRef.current);
      clearInterval(txInterval);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('mousemove', onMouseMove);
      renderer.dispose();
      scene.clear();
      // Clean up labels
      protocolNodes.forEach((node) => {
        if (node.label && labelsContainer.contains(node.label)) {
          labelsContainer.removeChild(node.label);
        }
      });
    };
  }, [bgColor, isPaused, generateTransaction]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0a0a0f]">
      {/* 3D Canvas */}
      <div ref={containerRef} className="absolute inset-0">
        <canvas ref={canvasRef} className="w-full h-full" />
        <div ref={labelsRef} className="absolute inset-0 pointer-events-none" />
      </div>

      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <h1 className="text-white text-lg font-mono font-bold tracking-wider">
            x402 NETWORK
          </h1>
          <span className="text-xs text-gray-500 font-mono">LIVE</span>
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="text-gray-400 hover:text-white transition-colors font-mono text-sm border border-gray-700 px-3 py-1 rounded"
          >
            {isPaused ? '▶ PLAY' : '⏸ PAUSE'}
          </button>
          <select
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            className="bg-transparent text-gray-400 border border-gray-700 rounded px-2 py-1 text-xs font-mono"
          >
            <option value="#0a0a0f">Dark</option>
            <option value="#1a1a2e">Navy</option>
            <option value="#0d1117">GitHub Dark</option>
            <option value="#2d1b69">Purple</option>
            <option value="#1b2d1b">Forest</option>
          </select>
        </div>
      </div>

      {/* Bottom telemetry bar */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4 bg-gradient-to-t from-black/60 to-transparent">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xs font-mono">TRANSACTIONS</span>
            <span className="text-white font-mono font-bold text-sm">
              {stats.total.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xs font-mono">VOLUME</span>
            <span className="text-white font-mono font-bold text-sm">
              ${stats.volume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xs font-mono">TPS</span>
            <span className="text-white font-mono font-bold text-sm">
              {stats.tps.toFixed(1)}
            </span>
          </div>
        </div>
        <div className="text-gray-500 text-xs font-mono">
          x402 Payment Protocol Visualizer
        </div>
      </div>

      {/* Right sidebar - Live transactions */}
      <div className="absolute top-16 right-4 bottom-16 w-72 z-10 overflow-hidden">
        <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-gray-800 h-full flex flex-col">
          <div className="px-4 py-3 border-b border-gray-800">
            <h3 className="text-white text-xs font-mono font-bold tracking-wider">
              LIVE TRANSACTIONS
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-gray-700">
            {transactions.map((tx) => (
              <div
                key={tx.id + tx.timestamp}
                className="bg-white/5 rounded px-3 py-2 text-xs font-mono animate-fade-in"
              >
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">{tx.id}</span>
                  <span className="text-green-400">
                    ${tx.amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-gray-500">
                    {tx.from} → {tx.to}
                  </span>
                  <span className="text-gray-600">
                    {new Date(tx.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Left sidebar - Protocol legend */}
      <div className="absolute top-16 left-4 z-10">
        <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-gray-800 p-3">
          <h3 className="text-white text-xs font-mono font-bold tracking-wider mb-3">
            PROTOCOLS
          </h3>
          <div className="space-y-2">
            {PROTOCOLS.map((proto) => (
              <div key={proto.name} className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: proto.color }}
                />
                <span className="text-gray-300 text-xs font-mono">
                  {proto.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CSS for fade-in animation */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
