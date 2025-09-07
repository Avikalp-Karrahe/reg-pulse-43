// ElevenLabs Text-to-Speech Service
interface TextToSpeechOptions {
  text: string;
  voiceId?: string;
  model?: string;
  stability?: number;
  similarityBoost?: number;
}

export class TextToSpeechService {
  private static instance: TextToSpeechService;
  private readonly apiKey: string = 'sk_af7ac6c5e27adf225bfdd14baaf56102749ae269c9408f53';
  private readonly baseUrl: string = 'https://api.elevenlabs.io/v1';
  private audioContext: AudioContext | null = null;

  private constructor() {
    this.audioContext = new AudioContext();
  }

  static getInstance(): TextToSpeechService {
    if (!TextToSpeechService.instance) {
      TextToSpeechService.instance = new TextToSpeechService();
    }
    return TextToSpeechService.instance;
  }

  async speakText(options: TextToSpeechOptions): Promise<void> {
    const {
      text,
      voiceId = '9BWtsMINqrJLrRacOk9x', // Aria voice
      model = 'eleven_turbo_v2_5',
      stability = 0.5,
      similarityBoost = 0.8
    } = options;

    try {
      console.log('🔊 Converting text to speech:', text.substring(0, 50) + '...');

      const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey
        },
        body: JSON.stringify({
          text,
          model_id: model,
          voice_settings: {
            stability,
            similarity_boost: similarityBoost
          }
        })
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      await this.playAudio(audioBuffer);

    } catch (error) {
      console.error('❌ Text-to-speech error:', error);
      throw error;
    }
  }

  private async playAudio(audioBuffer: ArrayBuffer): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    try {
      const decodedAudio = await this.audioContext.decodeAudioData(audioBuffer);
      const source = this.audioContext.createBufferSource();
      source.buffer = decodedAudio;
      source.connect(this.audioContext.destination);
      source.start();

      return new Promise((resolve) => {
        source.onended = () => resolve();
      });
    } catch (error) {
      console.error('❌ Audio playback error:', error);
      throw error;
    }
  }

  async speakWelcomeMessage(): Promise<void> {
    const welcomeText = `Hello! I'm your AI Compliance Assistant. I'm now actively monitoring this conversation for any potential regulatory violations. You can speak naturally, and I'll provide real-time guidance to help ensure compliance with financial regulations. How can I assist you today?`;
    
    await this.speakText({
      text: welcomeText,
      voiceId: '9BWtsMINqrJLrRacOk9x', // Aria - professional female voice
      stability: 0.6,
      similarityBoost: 0.9
    });
  }

  async speakComplianceIssue(issue: string): Promise<void> {
    const alertText = `Compliance alert: ${issue}. Please review your statement and consider rephrasing to ensure regulatory compliance.`;
    
    await this.speakText({
      text: alertText,
      voiceId: 'CwhRBWXzGAHq8TQ4Fs17', // Roger - authoritative male voice for alerts
      stability: 0.7,
      similarityBoost: 0.8
    });
  }

  async speakGuidance(guidance: string): Promise<void> {
    await this.speakText({
      text: guidance,
      voiceId: '9BWtsMINqrJLrRacOk9x', // Aria - professional female voice
      stability: 0.5,
      similarityBoost: 0.8
    });
  }

  cleanup(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export const ttsService = TextToSpeechService.getInstance();