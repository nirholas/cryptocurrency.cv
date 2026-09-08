import type { Hex } from 'viem';

export function isHex(value: unknown): value is Hex {
  return typeof value === 'string' && /^0x[0-9a-fA-F]*$/.test(value);
}

export function isBytes32(value: unknown): value is Hex {
  return isHex(value) && value.length === 66;
}

/** Split a 65-byte secp256k1 signature into its r, s, v components. */
export function decomposeSignature(signature: Hex): { r: Hex; s: Hex; v: number } {
  if (!isHex(signature) || signature.length !== 132) {
    throw new Error(`Signature must be 65 bytes (130 hex chars), got ${signature.length - 2}`);
  }
  const body = signature.slice(2);
  const r = `0x${body.slice(0, 64)}` as Hex;
  const s = `0x${body.slice(64, 128)}` as Hex;
  let v = parseInt(body.slice(128, 130), 16);
  // Some signers emit v as 0/1 rather than 27/28.
  if (v < 27) v += 27;
  return { r, s, v };
}

export function toBigInt(value: string | number | bigint): bigint {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(value);
  const trimmed = value.trim();
  if (trimmed.startsWith('0x') || trimmed.startsWith('0X')) return BigInt(trimmed);
  if (!/^\d+$/.test(trimmed)) throw new Error(`Not a valid integer string: ${value}`);
  return BigInt(trimmed);
}
