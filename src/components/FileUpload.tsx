import { useState, useRef } from 'react';
import { Upload, FileAudio, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { processUpload, validateUploadFile, type UploadHandlerResponse } from '@/lib/uploadHandler';
import { CircularRiskMeter } from './CircularRiskMeter';

interface FileUploadProps {
  onAnalysisComplete: (result: UploadHandlerResponse) => void;
  onIssueDetected: (issue: any) => void;
  onRiskScoreUpdate: (score: number) => void;
  isProcessing: boolean;
}

export const FileUpload = ({ 
  onAnalysisComplete, 
  onIssueDetected, 
  onRiskScoreUpdate, 
  isProcessing 
}: FileUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [detectedIssues, setDetectedIssues] = useState<any[]>([]);
  const [currentRiskScore, setCurrentRiskScore] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileValidation = (file: File): boolean => {
    const validation = validateUploadFile(file);
    
    if (!validation.valid) {
      toast({
        title: "Invalid File",
        description: validation.error,
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const handleFileSelect = (file: File) => {
    if (handleFileValidation(file)) {
      setSelectedFile(file);
    }
  };
  
  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    setCurrentStage('');
    setDetectedIssues([]);
    setCurrentRiskScore(0);
    
    try {
      const result = await processUpload({
        file: selectedFile,
        onProgress: (stage, progress) => {
          setCurrentStage(stage);
          setUploadProgress(progress);
        },
        onIssueDetected: (issue) => {
          setDetectedIssues(prev => [...prev, issue]);
          onIssueDetected(issue);
        },
        onRiskScoreUpdate: (score) => {
          setCurrentRiskScore(score);
          onRiskScoreUpdate(score);
        }
      });
      
      if (result.success) {
        toast({
          title: "Analysis Complete",
          description: `Found ${result.issues?.length || 0} compliance issues with ${result.riskLevel} risk level.`,
        });
        onAnalysisComplete(result);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setCurrentStage('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  // Remove old processFile function - replaced by handleUpload

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="p-6 bg-card/50 border-cyan-500/20 backdrop-blur-sm">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-cyan-400">
          <Upload className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Upload Recording</h3>
        </div>

        {!selectedFile ? (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? 'border-cyan-400 bg-cyan-400/10'
                : 'border-cyan-500/30 hover:border-cyan-400/50'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
          >
            <FileAudio className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
            <p className="text-foreground mb-2">
              Drag and drop your audio file here, or click to select
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Supports MP3 and WAV files (max 25MB)
            </p>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-400/10"
            >
              Choose File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.wav,audio/mpeg,audio/wav"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
        ) : (
          <div className="bg-card border border-cyan-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileAudio className="w-8 h-8 text-cyan-400" />
                <div>
                  <p className="font-medium text-foreground">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  className="text-muted-foreground hover:text-red-400"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {isUploading && (
              <div className="mt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{currentStage}</span>
                  <span className="text-sm font-medium">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
                
                {detectedIssues.length > 0 && (
                  <div className="flex justify-center">
                    <CircularRiskMeter 
                      riskScore={currentRiskScore}
                      isActive={true}
                      issues={detectedIssues}
                      streamingMode={true}
                    />
                  </div>
                )}
              </div>
            )}
            
            <div className="mt-4 flex gap-2">
              <Button
                onClick={handleUpload}
                disabled={isUploading || isProcessing}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {currentStage || 'Processing...'}
                  </>
                ) : (
                  'Analyze Recording'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};