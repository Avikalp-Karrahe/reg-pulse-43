export interface AudioDevice {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

export interface AudioLevels {
  rms: number;
  peak: number;
}

export class AudioManager {
  private static instance: AudioManager;
  private currentStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  async getAudioDevices(): Promise<AudioDevice[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${device.deviceId.slice(0, 8)}`,
          kind: device.kind,
        }));
    } catch (error) {
      console.error('Error enumerating audio devices:', error);
      return [];
    }
  }

  async getPermissionState(): Promise<PermissionState> {
    try {
      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return permission.state;
    } catch (error) {
      console.error('Error checking microphone permission:', error);
      return 'prompt';
    }
  }

  async requestMicrophoneAccess(deviceId?: string): Promise<MediaStream> {
    const constraints: MediaStreamConstraints = {
      audio: deviceId 
        ? { deviceId: { exact: deviceId } }
        : true
    };

    try {
      this.stopCurrentStream();
      this.currentStream = await navigator.mediaDevices.getUserMedia(constraints);
      return this.currentStream;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  }

  setupAudioAnalyser(stream: MediaStream): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      
      const source = this.audioContext.createMediaStreamSource(stream);
      source.connect(this.analyser);
      
      this.analyser.fftSize = 256;
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
    } catch (error) {
      console.error('Error setting up audio analyser:', error);
    }
  }

  getAudioLevels(): AudioLevels {
    if (!this.analyser || !this.dataArray) {
      return { rms: 0, peak: 0 };
    }

    this.analyser.getByteFrequencyData(this.dataArray);
    
    let sum = 0;
    let peak = 0;
    
    for (let i = 0; i < this.dataArray.length; i++) {
      const value = this.dataArray[i] / 255;
      sum += value * value;
      peak = Math.max(peak, value);
    }
    
    const rms = Math.sqrt(sum / this.dataArray.length);
    
    return { rms, peak };
  }

  stopCurrentStream(): void {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => track.stop());
      this.currentStream = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.analyser = null;
    this.dataArray = null;
  }

  getSelectedDeviceId(): string | null {
    return localStorage.getItem('selectedInputDeviceId');
  }

  setSelectedDeviceId(deviceId: string): void {
    localStorage.setItem('selectedInputDeviceId', deviceId);
  }

  clearSelectedDevice(): void {
    localStorage.removeItem('selectedInputDeviceId');
  }

  isWebSpeechSupported(): boolean {
    return !!(window.SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  getCurrentStream(): MediaStream | null {
    return this.currentStream;
  }
}

export const audioManager = AudioManager.getInstance();

export const getPermissionErrorMessage = (error: DOMException): string => {
  switch (error.name) {
    case 'NotAllowedError':
      return 'Microphone access denied. Click the site padlock → Site settings → Microphone to allow access.';
    case 'NotFoundError':
      return 'No microphone device found. Please connect a microphone and try again.';
    case 'NotReadableError':
      return 'Microphone is already in use by another application. Please close other applications using the microphone.';
    case 'OverconstrainedError':
      return 'Selected microphone device is not available. Please choose a different device.';
    case 'SecurityError':
      return 'Microphone access is not allowed on insecure connections. Please use HTTPS.';
    default:
      return `Microphone error: ${error.message}`;
  }
};

export const openChromeMicSettings = (): void => {
  try {
    window.open('chrome://settings/content/microphone', '_blank');
  } catch (error) {
    console.warn('Could not open Chrome settings. User may need to navigate manually.');
  }
};