import { transcribeAudio, type TranscribeRequest, type TranscribeResponse } from '@/api/transcribe';
import { analyzeTranscript, type AnalyzeRequest, type AnalyzeResponse } from '@/api/analyze';

interface UploadHandlerRequest {
  file?: File;
  text?: string;
  onProgress?: (stage: string, progress: number) => void;
  onIssueDetected?: (issue: any) => void;
  onRiskScoreUpdate?: (score: number) => void;
}

interface UploadHandlerResponse {
  success: boolean;
  callId?: string;
  transcript?: string;
  riskScore?: number;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  issues?: any[];
  analysisMethod?: string;
  error?: string;
}

/**
 * Complete upload-to-analysis pipeline
 * Handles file upload, transcription, and compliance analysis
 */
export const processUpload = async (request: UploadHandlerRequest): Promise<UploadHandlerResponse> => {
  const { file, text, onProgress, onIssueDetected, onRiskScoreUpdate } = request;
  
  try {
    // Stage 1: Transcription
    onProgress?.('Transcribing audio...', 10);
    
    const transcribeRequest: TranscribeRequest = {
      audioFile: file,
      text: text
    };
    
    const transcribeResponse: TranscribeResponse = await transcribeAudio(transcribeRequest);
    
    if (!transcribeResponse.success) {
      throw new Error(transcribeResponse.error || 'Transcription failed');
    }
    
    onProgress?.('Transcription complete', 40);
    
    // Stage 2: Compliance Analysis
    onProgress?.('Analyzing for compliance violations...', 50);
    
    const analyzeRequest: AnalyzeRequest = {
      transcript: transcribeResponse.transcript!,
      segments: transcribeResponse.segments,
      callId: transcribeResponse.callId!,
      duration: file ? estimateAudioDuration(file) : undefined
    };
    
    const analyzeResponse: AnalyzeResponse = await analyzeTranscript(analyzeRequest);
    
    if (!analyzeResponse.success) {
      throw new Error(analyzeResponse.error || 'Analysis failed');
    }
    
    onProgress?.('Analysis complete', 80);
    
    // Stage 3: Stream results to UI
    if (analyzeResponse.issues && analyzeResponse.issues.length > 0) {
      // Simulate streaming issues for better UX
      for (let i = 0; i < analyzeResponse.issues.length; i++) {
        setTimeout(() => {
          onIssueDetected?.(analyzeResponse.issues![i]);
          
          // Update risk score progressively
          const progressiveScore = calculateProgressiveRiskScore(
            analyzeResponse.issues!.slice(0, i + 1)
          );
          onRiskScoreUpdate?.(progressiveScore);
        }, i * 500); // 500ms delay between issues
      }
    } else {
      onRiskScoreUpdate?.(0);
    }
    
    onProgress?.('Upload and analysis complete', 100);
    
    return {
      success: true,
      callId: analyzeResponse.callId,
      transcript: transcribeResponse.transcript,
      riskScore: analyzeResponse.riskScore,
      riskLevel: analyzeResponse.riskLevel,
      issues: analyzeResponse.issues,
      analysisMethod: analyzeResponse.analysisMethod
    };
    
  } catch (error) {
    console.error('Upload processing error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload processing error'
    };
  }
};

/**
 * Estimate audio duration from file (rough approximation)
 */
const estimateAudioDuration = (file: File): number => {
  // Rough estimation: assume average bitrate of 128kbps for audio files
  const avgBitrate = 128 * 1000; // bits per second
  const fileSizeInBits = file.size * 8;
  const estimatedDuration = fileSizeInBits / avgBitrate;
  
  return Math.max(10, Math.min(3600, estimatedDuration)); // Clamp between 10s and 1 hour
};

/**
 * Calculate progressive risk score as issues are detected
 */
const calculateProgressiveRiskScore = (issues: any[]): number => {
  if (issues.length === 0) return 0;
  
  const severityWeights = {
    critical: 3,
    high: 2,
    medium: 1,
    low: 0.5
  };
  
  const totalWeight = issues.reduce((sum, issue) => {
    return sum + (severityWeights[issue.severity as keyof typeof severityWeights] || 1);
  }, 0);
  
  // Progressive scaling
  const maxWeight = issues.length * severityWeights.critical;
  const baseScore = (totalWeight / maxWeight) * 100;
  
  // Apply multiplier for multiple issues
  const issueMultiplier = Math.min(1.5, 1 + (issues.length - 1) * 0.1);
  const finalScore = Math.min(100, baseScore * issueMultiplier);
  
  return Math.round(finalScore);
};

/**
 * Validate file before processing
 */
export const validateUploadFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 50 * 1024 * 1024; // 50MB
  const allowedTypes = [
    'audio/wav',
    'audio/mp3', 
    'audio/mpeg',
    'audio/mp4',
    'audio/m4a',
    'audio/webm',
    'audio/ogg'
  ];
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size must be less than 50MB'
    };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'File must be an audio file (WAV, MP3, MP4, M4A, WebM, OGG)'
    };
  }
  
  return { valid: true };
};

// Export types
export type { UploadHandlerRequest, UploadHandlerResponse };