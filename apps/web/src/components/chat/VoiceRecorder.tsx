import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import * as api from '../../lib/api';
import { LIMITS } from '@pureliefde/shared';

interface VoiceRecorderProps {
  onComplete: (audioUrl: string) => void;
  onCancel: () => void;
}

export function VoiceRecorder({ onComplete, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout>();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          if (prev >= LIMITS.VOICE_MAX_DURATION) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Kon microfoon niet starten. Geef toestemming in je browser.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const handleSend = async () => {
    if (!audioBlob) return;

    setIsUploading(true);
    try {
      // Get upload URL
      const { uploadUrl, publicUrl } = await api.getUploadUrl(
        `voice-${Date.now()}.webm`,
        'audio/webm'
      );

      // Upload the audio
      await api.uploadMedia(uploadUrl, new File([audioBlob], 'voice.webm', { type: 'audio/webm' }));

      onComplete(publicUrl);
    } catch (error) {
      console.error('Failed to upload voice message:', error);
      alert('Uploaden mislukt. Probeer opnieuw.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    if (isRecording) {
      stopRecording();
    }
    onCancel();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4">
      <div className="flex items-center gap-4">
        {/* Recording indicator */}
        <div className="flex items-center gap-3 flex-1">
          {isRecording && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="w-4 h-4 bg-red-500 rounded-full"
            />
          )}

          <div className="text-lg font-mono">{formatDuration(duration)}</div>

          {duration >= LIMITS.VOICE_MAX_DURATION - 10 && (
            <span className="text-xs text-orange-500">
              Max {LIMITS.VOICE_MAX_DURATION}s
            </span>
          )}
        </div>

        {/* Preview player */}
        {audioBlob && !isRecording && (
          <audio
            ref={audioRef}
            src={URL.createObjectURL(audioBlob)}
            controls
            className="h-10"
          />
        )}

        {/* Controls */}
        <div className="flex gap-2">
          {!isRecording && !audioBlob && (
            <button
              onClick={startRecording}
              className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="6" />
              </svg>
            </button>
          )}

          {isRecording && (
            <button
              onClick={stopRecording}
              className="p-3 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
            </button>
          )}

          {audioBlob && !isRecording && (
            <>
              <button
                onClick={() => setAudioBlob(null)}
                className="p-3 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button
                onClick={handleSend}
                disabled={isUploading}
                className={clsx(
                  'p-3 rounded-full transition-colors',
                  isUploading
                    ? 'bg-gray-200 text-gray-400'
                    : 'bg-primary-500 text-white hover:bg-primary-600'
                )}
              >
                {isUploading ? (
                  <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                )}
              </button>
            </>
          )}

          <button
            onClick={handleCancel}
            className="p-3 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
