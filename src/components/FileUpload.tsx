import { useState, useRef } from 'react';
import { Upload, FileAudio, X, Loader2, Search, AlertTriangle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { processUpload, validateUploadFile, type UploadHandlerResponse } from '@/lib/uploadHandler';
import { CircularRiskMeter } from './CircularRiskMeter';
import { motion, AnimatePresence } from 'framer-motion';

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
    <Card className="p-6 bg-card/50 border-cyan-500/20 backdrop-blur-sm relative overflow-hidden">
      {/* Background scanning effect when processing */}
      {isUploading && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent"
          animate={{ x: [-100, 400] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
      )}
      
      <div className="space-y-4 relative z-10">
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
              <motion.div 
                className="mt-4 space-y-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Search className="w-4 h-4 text-cyan-400" />
                    </motion.div>
                    <span className="text-sm text-muted-foreground">{currentStage}</span>
                  </div>
                  <span className="text-sm font-medium">{uploadProgress}%</span>
                </div>
                
                <div className="relative">
                  <Progress value={uploadProgress} className="w-full" />
                  <motion.div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"
                    style={{ width: "40px" }}
                    animate={{ x: [-40, 300] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                </div>
                
                {/* Scanning Animation */}
                <motion.div 
                  className="bg-card/30 border border-cyan-500/20 rounded-lg p-3"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <Shield className="w-4 h-4 text-cyan-400" />
                    </motion.div>
                    <span className="text-xs font-medium text-cyan-400">Compliance Scanner Active</span>
                  </div>
                  
                  <div className="space-y-1">
                    <motion.div 
                      className="h-1 bg-gradient-to-r from-cyan-500/20 via-cyan-500/60 to-cyan-500/20 rounded"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <motion.div 
                      className="h-1 bg-gradient-to-r from-yellow-500/20 via-yellow-500/60 to-yellow-500/20 rounded"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                    />
                    <motion.div 
                      className="h-1 bg-gradient-to-r from-red-500/20 via-red-500/60 to-red-500/20 rounded"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                    />
                  </div>
                </motion.div>
                
                {/* Issues Detection */}
                <AnimatePresence>
                  {detectedIssues.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="bg-red-500/10 border border-red-500/20 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        >
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                        </motion.div>
                        <span className="text-xs font-medium text-red-400">
                          {detectedIssues.length} Violation{detectedIssues.length !== 1 ? 's' : ''} Detected
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        {detectedIssues.slice(-3).map((issue, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="text-xs text-red-300 truncate"
                          >
                            • {issue.category}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {detectedIssues.length > 0 && (
                  <motion.div 
                    className="flex justify-center"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  >
                    <CircularRiskMeter 
                      riskScore={currentRiskScore}
                      isActive={true}
                      issues={detectedIssues}
                      streamingMode={true}
                    />
                  </motion.div>
                )}
              </motion.div>
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