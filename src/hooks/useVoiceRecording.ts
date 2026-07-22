import { useState, useRef, useCallback, useEffect } from 'react';
import { backendUrl, authHeaders } from '@/integrations/backend/client';
import { toast } from 'sonner';

export type RecordingState = 'idle' | 'recording' | 'processing' | 'ready';

interface UseVoiceRecordingOptions {
  onTranscriptReady?: (transcript: string) => void;
  maxDuration?: number; // in seconds
}

export function useVoiceRecording(options: UseVoiceRecordingOptions = {}) {
  const { onTranscriptReady, maxDuration = 60 } = options;
  
  const [state, setState] = useState<RecordingState>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    setState('processing');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      // Sent as multipart form data, so this posts directly rather than through
      // the client's JSON helper.
      const response = await fetch(backendUrl('/functions/v1/transcribe'), {
        method: 'POST',
        headers: authHeaders(),
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Transcription failed');
      }

      const data = await response.json();
      
      if (!data.transcript || data.transcript.trim() === '') {
        throw new Error("Couldn't hear anything—try again.");
      }

      setTranscript(data.transcript);
      setState('ready');
      onTranscriptReady?.(data.transcript);
    } catch (err) {
      console.error('Transcription error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Transcription failed. Try again or type your request.';
      setError(errorMessage);
      toast.error(errorMessage);
      setState('idle');
    }
  }, [onTranscriptReady]);

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscript('');
    setRecordingTime(0);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorder.mimeType 
        });
        cleanup();
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start(1000); // Collect data every second
      setState('recording');

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);

    } catch (err) {
      console.error('Failed to start recording:', err);
      cleanup();
      
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('Mic access is required to record. Enable it in browser settings.');
        toast.error('Mic access is required to record. Enable it in browser settings.');
      } else {
        setError('Failed to start recording. Please try again.');
        toast.error('Failed to start recording. Please try again.');
      }
      setState('idle');
    }
  }, [cleanup, maxDuration, transcribeAudio]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const cancelRecording = useCallback(() => {
    cleanup();
    setState('idle');
    setTranscript('');
    setRecordingTime(0);
    setError(null);
  }, [cleanup]);

  const confirmTranscript = useCallback(() => {
    setState('idle');
    return transcript;
  }, [transcript]);

  const editTranscript = useCallback((newTranscript: string) => {
    setTranscript(newTranscript);
  }, []);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    state,
    transcript,
    recordingTime,
    formattedTime: formatTime(recordingTime),
    error,
    startRecording,
    stopRecording,
    cancelRecording,
    confirmTranscript,
    editTranscript,
  };
}
