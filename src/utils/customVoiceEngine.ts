import { CustomVoiceProfile } from '../types';

const STORAGE_KEY = 'kin_custom_voice_profile';

export const DEFAULT_VOICE_PRESETS: CustomVoiceProfile[] = [
  {
    id: 'natural_human',
    name: 'Natural Human (Non-Mechanical)',
    pitch: 1.0,
    rate: 1.0,
    isClonedFromMic: false,
    toneStyle: 'natural',
    warmthBoost: true,
  },
  {
    id: 'sunita_voice',
    name: "Sunita's Voice (Warm & Gentle)",
    pitch: 1.15,
    rate: 0.98,
    isClonedFromMic: false,
    toneStyle: 'warm',
    warmthBoost: true,
    recordedPitchHz: 215,
  },
  {
    id: 'krish_voice',
    name: "Krish's Voice (Deep & Confident)",
    pitch: 0.88,
    rate: 1.0,
    isClonedFromMic: false,
    toneStyle: 'clear',
    warmthBoost: true,
    recordedPitchHz: 120,
  },
  {
    id: 'kabir_voice',
    name: "Kabir's Voice (Bright & Lively)",
    pitch: 1.25,
    rate: 1.08,
    isClonedFromMic: false,
    toneStyle: 'energetic',
    warmthBoost: true,
    recordedPitchHz: 260,
  },
  {
    id: 'grandma_voice',
    name: "Grandma's Storyteller",
    pitch: 0.95,
    rate: 0.88,
    isClonedFromMic: false,
    toneStyle: 'storyteller',
    warmthBoost: true,
    recordedPitchHz: 180,
  },
];

export function getSavedVoiceProfile(): CustomVoiceProfile {
  if (typeof window === 'undefined') return DEFAULT_VOICE_PRESETS[0];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to load custom voice profile', e);
  }
  return DEFAULT_VOICE_PRESETS[0];
}

export function saveVoiceProfile(profile: CustomVoiceProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.warn('Failed to save voice profile', e);
  }
}

/**
 * Returns available system voices, sorting natural/neural/human voices to the top.
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  const voices = window.speechSynthesis.getVoices();
  
  // Sort high-quality / natural / neural voices first
  return [...voices].sort((a, b) => {
    const aScore = rateVoiceQuality(a);
    const bScore = rateVoiceQuality(b);
    return bScore - aScore;
  });
}

function rateVoiceQuality(v: SpeechSynthesisVoice): number {
  let score = 0;
  const name = v.name.toLowerCase();
  if (name.includes('natural') || name.includes('neural')) score += 10;
  if (name.includes('google') || name.includes('premium') || name.includes('enhanced')) score += 8;
  if (name.includes('online')) score += 5;
  if (name.includes('samantha') || name.includes('daniel') || name.includes('karen') || name.includes('aria')) score += 6;
  if (v.lang.startsWith('en')) score += 4;
  if (name.includes('desktop') || name.includes('robotic')) score -= 5;
  return score;
}

/**
 * Analyzes recorded audio buffer to compute the user's vocal pitch (F0 in Hz)
 */
export async function analyzeMicrophonePitch(audioBlob: Blob): Promise<{ pitchHz: number; suggestedPitchFactor: number; suggestedRate: number }> {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    // Auto-correlation to find pitch (F0)
    let bestCorrelation = 0;
    let bestPeriod = 0;
    const minPeriod = Math.floor(sampleRate / 350); // Max pitch ~350Hz
    const maxPeriod = Math.floor(sampleRate / 75);  // Min pitch ~75Hz

    const frameSize = Math.min(channelData.length, 4096);
    const startOffset = Math.floor(channelData.length / 2) - Math.floor(frameSize / 2);

    for (let period = minPeriod; period < maxPeriod; period++) {
      let correlation = 0;
      for (let i = 0; i < frameSize - period; i++) {
        correlation += channelData[startOffset + i] * channelData[startOffset + i + period];
      }
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestPeriod = period;
      }
    }

    let pitchHz = 160; // fallback human speaking frequency
    if (bestPeriod > 0) {
      pitchHz = Math.round(sampleRate / bestPeriod);
      // Clamp to reasonable human voice range (80Hz to 320Hz)
      if (pitchHz < 80) pitchHz = 85;
      if (pitchHz > 320) pitchHz = 280;
    }

    await audioContext.close();

    // Map Hz to speech pitch factor (default 1.0 centered around 160Hz)
    // 90Hz -> 0.85, 160Hz -> 1.0, 240Hz -> 1.25
    let suggestedPitch = 1.0;
    if (pitchHz <= 130) {
      suggestedPitch = Math.max(0.75, +(0.75 + ((pitchHz - 80) / 50) * 0.15).toFixed(2));
    } else if (pitchHz >= 180) {
      suggestedPitch = Math.min(1.4, +(1.05 + ((pitchHz - 180) / 100) * 0.3).toFixed(2));
    } else {
      suggestedPitch = +(0.95 + ((pitchHz - 130) / 50) * 0.1).toFixed(2);
    }

    return {
      pitchHz,
      suggestedPitchFactor: suggestedPitch,
      suggestedRate: 1.0,
    };
  } catch (e) {
    console.warn('Microphone pitch analysis error, using warm human baseline:', e);
    return {
      pitchHz: 165,
      suggestedPitchFactor: 1.0,
      suggestedRate: 1.0,
    };
  }
}

/**
 * Speaks text using the user's customized non-mechanical voice profile.
 */
export function speakWithCustomVoice(
  text: string,
  profile: CustomVoiceProfile,
  onEnd?: () => void,
  onError?: (err: any) => void
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }

  // Cancel any previous speech immediately
  window.speechSynthesis.cancel();

  // Strip Markdown, links, asterisks, hashtags, code backticks
  const clean = text
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/[*#`_~]/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .trim();

  if (!clean) {
    if (onEnd) onEnd();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.pitch = Math.max(0.5, Math.min(1.8, profile.pitch || 1.0));
  utterance.rate = Math.max(0.7, Math.min(1.5, profile.rate || 1.0));

  // Find appropriate human natural voice
  const allVoices = window.speechSynthesis.getVoices();
  if (allVoices.length > 0) {
    let chosenVoice: SpeechSynthesisVoice | undefined;

    if (profile.systemVoiceURI) {
      chosenVoice = allVoices.find((v) => v.voiceURI === profile.systemVoiceURI);
    }

    if (!chosenVoice) {
      // Find best natural voice based on pitch and tone style
      const prefersFemale = (profile.pitch || 1.0) > 1.05;
      const naturalVoices = allVoices.filter((v) => {
        const n = v.name.toLowerCase();
        return n.includes('natural') || n.includes('neural') || n.includes('google') || n.includes('enhanced');
      });

      const candidates = naturalVoices.length > 0 ? naturalVoices : allVoices;

      if (prefersFemale) {
        chosenVoice = candidates.find((v) => {
          const n = v.name.toLowerCase();
          return (n.includes('female') || n.includes('zira') || n.includes('samantha') || n.includes('karen') || n.includes('aria') || n.includes('jenny')) && v.lang.startsWith('en');
        });
      } else {
        chosenVoice = candidates.find((v) => {
          const n = v.name.toLowerCase();
          return (n.includes('male') || n.includes('david') || n.includes('guy') || n.includes('daniel') || n.includes('george')) && v.lang.startsWith('en');
        });
      }

      if (!chosenVoice) {
        chosenVoice = candidates.find((v) => v.lang.startsWith('en')) || candidates[0];
      }
    }

    if (chosenVoice) {
      utterance.voice = chosenVoice;
    }
  }

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = (err) => {
    console.warn('Speech synthesis utterance error:', err);
    if (onError) onError(err);
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
