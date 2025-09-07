import { useState, useRef } from 'react';
import { Upload, FileAudio, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FileUploadProps {
  onTranscriptionComplete: (transcript: string, duration: number) => void;
  isProcessing: boolean;
}

export const FileUpload = ({ onTranscriptionComplete, isProcessing }: FileUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3'];
    const maxSize = 25 * 1024 * 1024; // 25MB limit for OpenAI Whisper

    if (!validTypes.includes(file.type) && !file.name.toLowerCase().match(/\.(mp3|wav)$/)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an MP3 or WAV file.",
        variant: "destructive",
      });
      return false;
    }

    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 25MB.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = (file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
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

  const processFile = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      toast({
        title: "Processing Audio",
        description: "Converting speech to text...",
      });

      const base64Audio = await convertFileToBase64(selectedFile);
      
      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: {
          audio: base64Audio,
          filename: selectedFile.name
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Transcription Complete",
        description: "Starting compliance analysis...",
      });

      onTranscriptionComplete(data.text, Math.round(data.duration));
      setSelectedFile(null);
      
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Failed to process audio file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

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
            
            <div className="mt-4 flex gap-2">
              <Button
                onClick={processFile}
                disabled={isUploading || isProcessing}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
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