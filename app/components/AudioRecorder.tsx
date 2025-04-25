import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
}

export function AudioRecorder({ onTranscriptionComplete }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const updateAudioLevel = () => {
    if (analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate average audio level
      const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
      const normalizedLevel = Math.min(average / 128, 1); // Normalize to 0-1
      setAudioLevel(normalizedLevel);
      
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Set up audio analysis
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await handleTranscription(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        setAudioLevel(0);
      };

      mediaRecorder.start();
      setIsRecording(true);
      updateAudioLevel();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Error accessing microphone. Please ensure you have granted microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const handleTranscription = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      onTranscriptionComplete(data.text);
    } catch (error) {
      console.error('Transcription error:', error);
      alert('Failed to transcribe audio. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="p-3 rounded-lg bg-gray-600 hover:bg-gray-700 transition-colors"
            disabled={isProcessing}
            title="Start recording"
          >
            <Mic className={`h-6 w-6 ${isProcessing ? 'text-gray-300' : 'text-white'}`} />
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="p-3 rounded-lg bg-red-600 hover:bg-red-700 transition-colors relative"
            title="Stop recording"
          >
            <Square className="h-6 w-6 text-white" />
            <div 
              className="absolute inset-0 rounded-lg bg-red-500 animate-ping opacity-75"
              style={{ 
                transform: `scale(${1 + audioLevel * 0.5})`,
                transition: 'transform 0.1s ease-out'
              }}
            />
            <div 
              className="absolute -inset-1 rounded-lg border-2 border-red-400"
              style={{ 
                transform: `scale(${1 + audioLevel * 0.3})`,
                transition: 'transform 0.1s ease-out'
              }}
            />
          </button>
        )}
      </div>
      {isProcessing && (
        <Loader2 className="h-6 w-6 animate-spin text-gray-600" />
      )}
      {isRecording && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-red-600 animate-pulse">Recording</span>
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-red-600"
                style={{
                  height: `${8 + audioLevel * 16}px`,
                  transition: 'height 0.1s ease-out',
                  animationDelay: `${i * 0.15}s`
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 