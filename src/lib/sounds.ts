/**
 * @fileoverview Sound Effects Utility
 * 
 * Optional sound effects for notifications and interactions.
 * Sounds are disabled by default and can be enabled in settings.
 * 
 * @module lib/sounds
 */

// Sound effect URLs (using Web Audio API friendly sounds)
const SOUNDS = {
  notification: '/sounds/notification.mp3',
  success: '/sounds/success.mp3',
  click: '/sounds/click.mp3',
  error: '/sounds/error.mp3',
};

type SoundType = keyof typeof SOUNDS;

// Audio context for web audio
let audioContext: AudioContext | null = null;

// Cache for loaded audio buffers
const audioBuffers: Map<string, AudioBuffer> = new Map();

// Settings
let soundEnabled = false;
let soundVolume = 0.5;

/**
 * Initialize audio context (must be called after user interaction)
 */
export function initAudio(): void {
  if (typeof window === 'undefined') return;
  
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  
  // Load settings from localStorage
  try {
    const settings = localStorage.getItem('sound-settings');
    if (settings) {
      const parsed = JSON.parse(settings);
      soundEnabled = parsed.enabled ?? false;
      soundVolume = parsed.volume ?? 0.5;
    }
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Load a sound file into memory
 */
async function loadSound(url: string): Promise<AudioBuffer | null> {
  if (!audioContext) return null;
  
  if (audioBuffers.has(url)) {
    return audioBuffers.get(url)!;
  }
  
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    audioBuffers.set(url, audioBuffer);
    return audioBuffer;
  } catch {
    console.warn(`Failed to load sound: ${url}`);
    return null;
  }
}

/**
 * Play a sound effect
 */
export async function playSound(type: SoundType): Promise<void> {
  if (!soundEnabled || !audioContext) return;
  
  const url = SOUNDS[type];
  const buffer = await loadSound(url);
  
  if (!buffer) return;
  
  const source = audioContext.createBufferSource();
  const gainNode = audioContext.createGain();
  
  source.buffer = buffer;
  source.connect(gainNode);
  gainNode.connect(audioContext.destination);
  gainNode.gain.value = soundVolume;
  
  source.start(0);
}

/**
 * Enable or disable sound effects
 */
export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
  saveSettings();
}

/**
 * Set sound volume (0-1)
 */
export function setSoundVolume(volume: number): void {
  soundVolume = Math.max(0, Math.min(1, volume));
  saveSettings();
}

/**
 * Get current sound settings
 */
export function getSoundSettings(): { enabled: boolean; volume: number } {
  return { enabled: soundEnabled, volume: soundVolume };
}

/**
 * Save settings to localStorage
 */
function saveSettings(): void {
  try {
    localStorage.setItem('sound-settings', JSON.stringify({
      enabled: soundEnabled,
      volume: soundVolume,
    }));
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Play notification sound
 */
export function playNotification(): Promise<void> {
  return playSound('notification');
}

/**
 * Play success sound
 */
export function playSuccess(): Promise<void> {
  return playSound('success');
}

/**
 * Play click sound
 */
export function playClick(): Promise<void> {
  return playSound('click');
}

/**
 * Play error sound
 */
export function playError(): Promise<void> {
  return playSound('error');
}
