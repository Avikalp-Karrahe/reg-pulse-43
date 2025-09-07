import { supabase } from '@/integrations/supabase/client';

interface TranscribeRequest {
  audioFile?: File;
  audioBlob?: Blob;
  text?: string; // For Web Speech API fallback
  callId?: string;
}

interface TranscribeResponse {
  success: boolean;
  transcript?: string;
  segments?: TranscriptSegment[];
  error?: string;
  callId?: string;
}

interface TranscriptSegment {
  text: string;
  start: number; // milliseconds
  end: number; // milliseconds
  confidence?: number;
}

// Mock Whisper API for development - replace with actual Whisper integration
const mockWhisperTranscribe = async (audioData: Blob): Promise<TranscriptSegment[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock transcript with timestamps
  const mockSegments: TranscriptSegment[] = [
    {
      text: "Hello, thank you for calling our investment advisory service.",
      start: 0,
      end: 3000,
      confidence: 0.95
    },
    {
      text: "I'd like to discuss some investment opportunities that could guarantee you significant returns.",
      start: 3000,
      end: 8000,
      confidence: 0.92
    },
    {
      text: "Our portfolio has consistently outperformed the market with no downside risk.",
      start: 8000,
      end: 13000,
      confidence: 0.88
    },
    {
      text: "You should put all your money into this opportunity - it's a sure thing.",
      start: 13000,
      end: 18000,
      confidence: 0.91
    },
    {
      text: "This is a limited time offer, so you need to decide today.",
      start: 18000,
      end: 22000,
      confidence: 0.94
    }
  ];
  
  return mockSegments;
};

// Web Speech API fallback for development
const processWebSpeechText = (text: string): TranscriptSegment[] => {
  // Split text into sentences and assign mock timestamps
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const segments: TranscriptSegment[] = [];
  let currentTime = 0;
  
  sentences.forEach((sentence, index) => {
    const duration = Math.max(2000, sentence.length * 100); // Rough estimate
    segments.push({
      text: sentence.trim() + (index < sentences.length - 1 ? '.' : ''),
      start: currentTime,
      end: currentTime + duration,
      confidence: 0.85
    });
    currentTime += duration + 500; // Add pause between sentences
  });
  
  return segments;
};

export const transcribeAudio = async (request: TranscribeRequest): Promise<TranscribeResponse> => {
  try {
    let segments: TranscriptSegment[] = [];
    let transcript = '';
    
    if (request.text) {
      // Web Speech API fallback
      segments = processWebSpeechText(request.text);
      transcript = request.text;
    } else if (request.audioFile || request.audioBlob) {
      // Use Whisper API (mocked for now)
      const audioData = request.audioFile || request.audioBlob!;
      segments = await mockWhisperTranscribe(audioData);
      transcript = segments.map(s => s.text).join(' ');
    } else {
      throw new Error('No audio data or text provided');
    }
    
    // Generate call ID if not provided
    const callId = request.callId || `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      success: true,
      transcript,
      segments,
      callId
    };
  } catch (error) {
    console.error('Transcription error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown transcription error'
    };
  }
};

// Real Whisper API integration (commented out for development)
/*
const whisperTranscribe = async (audioData: Blob): Promise<TranscriptSegment[]> => {
  const formData = new FormData();
  formData.append('file', audioData, 'audio.wav');
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'verbose_json');
  formData.append('timestamp_granularities[]', 'segment');
  
  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: formData
  });
  
  if (!response.ok) {
    throw new Error(`Whisper API error: ${response.statusText}`);
  }
  
  const result = await response.json();
  
  return result.segments.map((segment: any) => ({
    text: segment.text,
    start: Math.round(segment.start * 1000), // Convert to milliseconds
    end: Math.round(segment.end * 1000),
    confidence: segment.avg_logprob ? Math.exp(segment.avg_logprob) : undefined
  }));
};
*/

// Export for use in components
export type { TranscribeRequest, TranscribeResponse, TranscriptSegment };