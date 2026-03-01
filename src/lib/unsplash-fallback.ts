/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * Unsplash fallback images for articles without thumbnails.
 *
 * Uses a curated pool of crypto / finance / tech photos.
 * Photo IDs are stable — Unsplash guarantees permanent URLs with format:
 *   https://images.unsplash.com/photo-{id}?auto=format&fit=crop&w=800&q=70
 *
 * Attribution: photos sourced from Unsplash (https://unsplash.com)
 */

const CRYPTO_PHOTOS = [
  '1518546305927-5a555bb7020d', // Bitcoin coins on a surface
  '1639762681485-074b7f938ba0', // Crypto chart glow
  '1611974789855-9c2a0a7236a3', // Trading monitors
  '1516245834210-c4c142787335', // Circuit board / tech
  '1559526324-4b87b5e36e44', // Network data streams
  '1488590528505-98d2b5aba04b', // Laptop / developer
  '1526374965328-7f61d4dc18c5', // Matrix green code
  '1451187580459-43490279c0fa', // Globe with data lines
  '1504711434969-e33886168f5c', // City skyline / finance
  '1543699565-003b8adda5fc', // Abstract circuit board
  '1563013544-824ae1b704d3',     // Data network flow
  '1639322537228-f710d846310a', // Crypto coin stack
  '1605792657660-596af9009e82', // Ethereum concept
  '1642790106117-e829e14a795f', // Crypto trading signals
  '1580048915913-4f8f5cb481c4', // Gold / wealth / finance
  '1551288049-bebda4e38f71', // Data dashboard / charts
  '1614028674026-a65e31bfd27c', // Bitcoin close-up
  '1601597111158-2fceff292cdc', // Digital currency concept
  '1550751827-4bd374c3f58b',     // Digital finance abstract
  '1634704784915-aacf363b021f', // Bitcoin physical coin
];

/**
 * Curated pool of top nature / landscape photos from Unsplash.
 * Used as a visually appealing fallback when an article has no image.
 *
 * Attribution: photos sourced from Unsplash (https://unsplash.com)
 */
const NATURE_PHOTOS = [
  '1426604966848-d7adac402bff', // Misty mountain range
  '1505118380757-91f5f5632de0', // Tropical waterfall
  '1441974231531-c6227db76b6e', // Sunlit forest path
  '1500534314209-a25ddb2bd429', // Ocean waves at sunset
  '1469474968028-56623f02e42e', // Rolling green hills
  '1447752875215-b2761acb3c5d', // Autumn forest
  '1518020382113-a7e8fc38eac9', // Snow-capped peaks
  '1507003211169-0a1dd7228f2d', // Desert sand dunes
  '1470071459604-3b5ec3a7fe05', // Foggy mountain lake
  '1465146344425-f00d5f5c8f07', // Wildflower meadow
  '1501854140801-50d01698950b', // Northern lights aurora
  '1540390769625-2fc3f8b1d50c', // Tropical beach paradise
  '1475924156734-496f6cac6ec1', // Mountain lake reflection
  '1506905925346-21bda4d32df4', // Golden lake sunset
  '1519681393784-d120267933ba', // Starry mountain night
  '1502472584811-0a2f2feb8968', // Coastal sea cliffs
  '1508739773434-c26b3d09e071', // Rolling lavender fields
  '1511497584788-876760111969', // Dense bamboo forest
  '1504701954957-2010ec3bcec1', // Iceberg glaciers
  '1532274402911-5a369e4c4bb5', // Sunset over field
];

/**
 * Returns a deterministic Unsplash fallback URL for a given seed string
 * (typically article source name or title fragment).
 */
export function getUnsplashFallback(seed: string, width = 800, height = 450): string {
  // Simple djb2-style hash for a stable but varied pick
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 33) ^ seed.charCodeAt(i);
    hash = hash >>> 0; // keep unsigned 32-bit
  }
  const id = CRYPTO_PHOTOS[hash % CRYPTO_PHOTOS.length];
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&h=${height}&q=70`;
}

/**
 * Returns a deterministic top-nature Unsplash image URL for a given seed string.
 * Used as the primary Unsplash fallback when an article has no image of its own.
 */
export function getNatureUnsplashFallback(seed: string, width = 800, height = 450): string {
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 33) ^ seed.charCodeAt(i);
    hash = hash >>> 0;
  }
  const id = NATURE_PHOTOS[hash % NATURE_PHOTOS.length];
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&h=${height}&q=70`;
}
