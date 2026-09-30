import { LocalModelConfig } from '../types/yuna';

export interface RecognitionCallbacks {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onAudioLevel?: (level: number) => void;
  onFrequencyData?: (data: Uint8Array) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

class SpeechRecognitionService {
  private recognition: any = null;
  private isListening: boolean = false;
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  constructor() {
    this.initBrowserRecognition();
  }

  private initBrowserRecognition() {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'ko-KR'; // Korean recognition default
      this.recognition.maxAlternatives = 1;
    }
  }

  public isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      Boolean(
        (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition ||
          navigator.mediaDevices
      )
    );
  }

  public async startListening(
    config: LocalModelConfig,
    callbacks: RecognitionCallbacks,
    targetLanguage: 'ko-KR' | 'en-US' = 'ko-KR'
  ): Promise<void> {
    if (this.isListening) {
      this.stopListening();
    }

    this.isListening = true;
    callbacks.onStart?.();

    // Start audio visualizer analyser if supported
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      this.startAudioMeter(this.mediaStream, callbacks);
    } catch (err) {
      console.warn('Microphone stream access error:', err);
    }

    // Determine recognition pathway
    if (config.mode === 'local_endpoint' && config.endpointUrl) {
      this.startLocalEndpointRecording(config, callbacks, targetLanguage);
    } else if (config.mode === 'cloud') {
      this.startCloudRecording(callbacks, targetLanguage);
    } else {
      this.startBrowserRecognition(callbacks, targetLanguage);
    }
  }

  private startBrowserRecognition(
    callbacks: RecognitionCallbacks,
    targetLanguage: 'ko-KR' | 'en-US' = 'ko-KR'
  ) {
    if (!this.recognition) {
      this.initBrowserRecognition();
    }

    if (!this.recognition) {
      callbacks.onError('Web Speech Recognition is not supported on this browser.');
      this.stopListening();
      return;
    }

    this.recognition.lang = targetLanguage;

    let finalTranscript = '';

    this.recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      const current = finalTranscript || interim;
      callbacks.onResult(current, Boolean(finalTranscript));
    };

    this.recognition.onerror = (event: any) => {
      console.warn('Speech recognition error event:', event.error);
      if (event.error !== 'no-speech') {
        callbacks.onError(event.error);
      }
      this.stopListening();
      callbacks.onEnd?.();
    };

    this.recognition.onend = () => {
      this.stopListening();
      callbacks.onEnd?.();
    };

    try {
      this.recognition.start();
    } catch (err: any) {
      console.warn('Recognition start exception:', err);
      // Already running or permission issue
    }
  }

  private startLocalEndpointRecording(
    config: LocalModelConfig,
    callbacks: RecognitionCallbacks,
    targetLanguage: 'ko-KR' | 'en-US' = 'ko-KR'
  ) {
    if (!this.mediaStream) {
      callbacks.onError('Microphone stream unavailable');
      this.stopListening();
      return;
    }

    this.audioChunks = [];
    try {
      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType: 'audio/webm;codecs=opus',
      });
    } catch {
      this.mediaRecorder = new MediaRecorder(this.mediaStream);
    }

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      this.audioChunks = [];

      try {
        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.webm');
        formData.append('model', config.modelName || 'whisper-1');
        formData.append('language', targetLanguage === 'en-US' ? 'en' : 'ko');

        const headers: Record<string, string> = {};
        if (config.apiKey) {
          headers['Authorization'] = `Bearer ${config.apiKey}`;
        }

        const res = await fetch(config.endpointUrl, {
          method: 'POST',
          headers,
          body: formData,
        });

        if (!res.ok) {
          throw new Error(`Local model endpoint returned status ${res.status}`);
        }

        const data = await res.json();
        const text = data.text || data.transcript || data.response || '';
        callbacks.onResult(text.trim(), true);
      } catch (err: any) {
        console.error('Local endpoint transcription failed:', err);
        callbacks.onError(`Local STT model error: ${err.message}`);
      } finally {
        this.stopListening();
        callbacks.onEnd?.();
      }
    };

    this.mediaRecorder.start();
  }

  private startCloudRecording(
    callbacks: RecognitionCallbacks,
    targetLanguage: 'ko-KR' | 'en-US' = 'ko-KR'
  ) {
    if (!this.mediaStream) {
      callbacks.onError('Microphone stream unavailable');
      this.stopListening();
      return;
    }

    this.audioChunks = [];
    try {
      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType: 'audio/webm;codecs=opus',
      });
    } catch {
      this.mediaRecorder = new MediaRecorder(this.mediaStream);
    }

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      this.audioChunks = [];

      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          const res = await fetch('/api/yuna/stt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioBase64: base64,
              mimeType: 'audio/webm',
              language: targetLanguage === 'en-US' ? 'en' : 'ko',
            }),
          });

          if (!res.ok) {
            throw new Error('Cloud transcription request failed');
          }

          const data = await res.json();
          callbacks.onResult(data.transcript || '', true);
          this.stopListening();
          callbacks.onEnd?.();
        };
        reader.readAsDataURL(audioBlob);
      } catch (err: any) {
        callbacks.onError(err.message);
        this.stopListening();
        callbacks.onEnd?.();
      }
    };

    this.mediaRecorder.start();
  }

  private startAudioMeter(
    stream: MediaStream,
    callbacks: RecognitionCallbacks
  ) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.6;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkLevel = () => {
        if (!this.analyser || !this.isListening) return;
        this.analyser.getByteFrequencyData(dataArray);

        if (callbacks.onFrequencyData) {
          callbacks.onFrequencyData(dataArray);
        }

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalized = Math.min(1, average / 110); // 0 to 1 with good sensitivity
        if (callbacks.onAudioLevel) {
          callbacks.onAudioLevel(normalized);
        }

        this.animFrameId = requestAnimationFrame(checkLevel);
      };

      checkLevel();
    } catch (e) {
      console.warn('Audio level visualizer init error:', e);
    }
  }

  public stopListening() {
    this.isListening = false;

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch {}
    }

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}

export const speechRecognition = new SpeechRecognitionService();
