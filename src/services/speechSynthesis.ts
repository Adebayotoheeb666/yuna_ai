/**
 * Dual-engine Korean Speech Synthesis (TTS) Service
 * Primary: Gemini 3.8 Flash TTS for lifelike warm Korean pronunciation
 * Secondary/Offline: Browser Web Speech API (ko-KR voice) with granular rate control
 */

export interface SpeechOptions {
  rate?: number; // 0.6 - 1.2
  pitch?: number; // 0.8 - 1.2
  voice?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

class KoreanSpeechService {
  private currentAudio: HTMLAudioElement | null = null;
  private isSpeaking: boolean = false;
  private webSpeechVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initWebSpeechVoice();
      window.speechSynthesis.onvoiceschanged = () => {
        this.initWebSpeechVoice();
      };
    }
  }

  private initWebSpeechVoice() {
    if (!('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    // Look for Korean voices: Yuna, Sun-Hi, Heami, Google 한국어, etc.
    const koVoice =
      voices.find((v) => v.lang === 'ko-KR' || v.lang.startsWith('ko')) ||
      voices.find((v) => v.name.toLowerCase().includes('korean'));
    if (koVoice) {
      this.webSpeechVoice = koVoice;
    }
  }

  public stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  /**
   * Speak Korean text using Gemini TTS first, with graceful fallback to browser Web Speech API.
   */
  public async speakKorean(
    text: string,
    options: SpeechOptions = {},
    isOfflineMode: boolean = false
  ): Promise<void> {
    this.stop();
    this.isSpeaking = true;
    options.onStart?.();

    if (!isOfflineMode && navigator.onLine) {
      try {
        const response = await fetch('/api/yuna/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voice: options.voice || 'Kore' }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.audioBase64) {
            await this.playAudioBase64(data.audioBase64, options);
            return;
          }
        }
      } catch (err) {
        console.warn('Gemini TTS failed or offline, falling back to Web Speech API:', err);
      }
    }

    // Offline / Fallback path: Web Speech API
    this.speakWithWebSpeech(text, options);
  }

  /**
   * Play base64 WAV audio stream with playback rate adjustments
   */
  private playAudioBase64(base64: string, options: SpeechOptions): Promise<void> {
    return new Promise((resolve) => {
      const audioUrl = `data:audio/wav;base64,${base64}`;
      const audio = new Audio(audioUrl);
      this.currentAudio = audio;

      if (options.rate) {
        audio.playbackRate = options.rate;
      }

      audio.onended = () => {
        this.isSpeaking = false;
        this.currentAudio = null;
        options.onEnd?.();
        resolve();
      };

      audio.onerror = (err) => {
        console.warn('Audio playback error, falling back to browser TTS', err);
        this.speakWithWebSpeech(base64, options);
        resolve();
      };

      audio.play().catch((err) => {
        console.warn('Audio play blocked/failed:', err);
        this.isSpeaking = false;
        options.onEnd?.();
        resolve();
      });
    });
  }

  /**
   * Browser-native SpeechSynthesis for offline & instant pronunciation
   */
  public speakWithWebSpeech(text: string, options: SpeechOptions = {}) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.isSpeaking = false;
      options.onEnd?.();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';

    if (this.webSpeechVoice) {
      utterance.voice = this.webSpeechVoice;
    }

    utterance.rate = options.rate ?? 0.85; // Default slightly slower for learners
    utterance.pitch = options.pitch ?? 1.05; // Slightly warmer pitch

    utterance.onstart = () => {
      this.isSpeaking = true;
      options.onStart?.();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      options.onEnd?.();
    };

    utterance.onerror = (err) => {
      this.isSpeaking = false;
      options.onError?.(err);
      options.onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Speak an isolated syllable with an intentional slower pace and distinct phonetic clarity
   */
  public speakIsolatedSyllable(syllable: string, rate: number = 0.7) {
    this.stop();
    this.speakWithWebSpeech(syllable, { rate, pitch: 1.0 });
  }
}

export const koreanSpeech = new KoreanSpeechService();
