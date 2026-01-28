'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadFile } from '@/actions/upload';
import { StickerPicker } from './StickerPicker';

interface MessageInputProps {
  onSendMessage: (content: string, type?: 'text' | 'emoji') => void;
  onSendMedia: (mediaUrl: string, type: 'image' | 'video' | 'voice' | 'youtube' | 'spotify') => void;
  onSendSticker: (emoji: string) => void;
  onTyping: () => void;
}

const QUICK_EMOJIS = ['❤️', '😘', '🥰', '😍', '💕', '💋', '🤗', '😊'];

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /youtube\.com\/shorts\/([^&\s?]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractSpotifyId(url: string): string | null {
  const patterns = [
    /open\.spotify\.com\/track\/([a-zA-Z0-9]+)/,
    /spotify:track:([a-zA-Z0-9]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function MessageInput({ onSendMessage, onSendMedia, onSendSticker, onTyping }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [showYouTubeInput, setShowYouTubeInput] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [showSpotifyInput, setShowSpotifyInput] = useState(false);
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Check if it's just a single emoji
    const trimmed = message.trim();
    const isEmoji = trimmed.length <= 2 && /[\u{1F300}-\u{1FAD6}]/u.test(trimmed);
    onSendMessage(message.trim(), isEmoji ? 'emoji' : 'text');
    setMessage('');
    setShowEmojis(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);

    // Debounced typing indicator
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    onTyping();
    typingTimeoutRef.current = setTimeout(() => {}, 1000);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await uploadFile(formData);
      onSendMedia(result.url, result.type as 'image' | 'video' | 'voice');
    } catch (error) {
      console.error('Upload failed:', error);
      alert(error instanceof Error ? error.message : 'Upload mislukt');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleEmojiClick = (emoji: string) => {
    onSendMessage(emoji, 'emoji');
    setShowEmojis(false);
  };

  const handleStickerSelect = (emoji: string) => {
    onSendSticker(emoji);
    setShowStickers(false);
  };

  const handleYouTubeSubmit = () => {
    const videoId = extractYouTubeId(youtubeUrl);
    if (videoId) {
      onSendMedia(videoId, 'youtube');
      setYoutubeUrl('');
      setShowYouTubeInput(false);
    } else {
      alert('Ongeldige YouTube URL');
    }
  };

  const handleSpotifySubmit = () => {
    const trackId = extractSpotifyId(spotifyUrl);
    if (trackId) {
      onSendMedia(trackId, 'spotify');
      setSpotifyUrl('');
      setShowSpotifyInput(false);
    } else {
      alert('Ongeldige Spotify URL');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());

        setIsUploading(true);
        try {
          const formData = new FormData();
          formData.append('file', audioBlob, 'voice-message.webm');
          const result = await uploadFile(formData);
          onSendMedia(result.url, 'voice');
        } catch (error) {
          console.error('Upload failed:', error);
          alert('Upload mislukt');
        } finally {
          setIsUploading(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
    } catch (error) {
      console.error('Could not start recording:', error);
      alert('Kon microfoon niet gebruiken');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setRecordingTime(0);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="border-t border-gray-100 bg-white/80 backdrop-blur-lg p-4">
      {/* Emoji picker */}
      <AnimatePresence>
        {showEmojis && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-3 flex gap-2 justify-center flex-wrap"
          >
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleEmojiClick(emoji)}
                className="text-2xl hover:scale-125 transition-transform p-1"
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticker picker */}
      <AnimatePresence>
        {showStickers && (
          <div className="mb-3 flex justify-center">
            <StickerPicker
              onSelectSticker={handleStickerSelect}
              onClose={() => setShowStickers(false)}
            />
          </div>
        )}
      </AnimatePresence>

      {/* YouTube input */}
      <AnimatePresence>
        {showYouTubeInput && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-3 flex gap-2"
          >
            <input
              type="text"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="Plak YouTube URL..."
              className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500/50"
            />
            <button
              type="button"
              onClick={handleYouTubeSubmit}
              disabled={!youtubeUrl}
              className="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              Verstuur
            </button>
            <button
              type="button"
              onClick={() => { setShowYouTubeInput(false); setYoutubeUrl(''); }}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spotify input */}
      <AnimatePresence>
        {showSpotifyInput && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-3 flex gap-2"
          >
            <input
              type="text"
              value={spotifyUrl}
              onChange={(e) => setSpotifyUrl(e.target.value)}
              placeholder="Plak Spotify URL..."
              className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-[#1DB954]/50"
            />
            <button
              type="button"
              onClick={handleSpotifySubmit}
              disabled={!spotifyUrl}
              className="px-4 py-2 bg-[#1DB954] text-white rounded-full hover:bg-[#1ed760] transition-colors disabled:opacity-50"
            >
              Verstuur
            </button>
            <button
              type="button"
              onClick={() => { setShowSpotifyInput(false); setSpotifyUrl(''); }}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recording UI */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-3 flex items-center justify-center gap-4 py-3 bg-red-50 rounded-2xl"
          >
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-600 font-medium">{formatTime(recordingTime)}</span>
            </div>
            <button
              type="button"
              onClick={cancelRecording}
              className="px-3 py-1 text-gray-600 hover:text-gray-800"
            >
              Annuleer
            </button>
            <button
              type="button"
              onClick={stopRecording}
              className="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              Stop & Verstuur
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* File upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="p-2 text-gray-500 hover:text-primary-500 hover:bg-primary-50 rounded-full transition-colors disabled:opacity-50"
        >
          {isUploading ? (
            <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        </button>

        {/* Emoji toggle */}
        <button
          type="button"
          onClick={() => {
            setShowEmojis(!showEmojis);
            setShowStickers(false);
          }}
          className="p-2 text-gray-500 hover:text-primary-500 hover:bg-primary-50 rounded-full transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* Sticker toggle */}
        <button
          type="button"
          onClick={() => {
            setShowStickers(!showStickers);
            setShowEmojis(false);
          }}
          className="p-2 text-gray-500 hover:text-primary-500 hover:bg-primary-50 rounded-full transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </button>

        {/* YouTube toggle */}
        <button
          type="button"
          onClick={() => {
            setShowYouTubeInput(!showYouTubeInput);
            setShowSpotifyInput(false);
            setShowEmojis(false);
            setShowStickers(false);
          }}
          className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        </button>

        {/* Spotify toggle */}
        <button
          type="button"
          onClick={() => {
            setShowSpotifyInput(!showSpotifyInput);
            setShowYouTubeInput(false);
            setShowEmojis(false);
            setShowStickers(false);
          }}
          className="p-2 text-gray-500 hover:text-[#1DB954] hover:bg-[#1DB954]/10 rounded-full transition-colors"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
        </button>

        {/* Voice recording toggle */}
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isUploading}
          className={`p-2 rounded-full transition-colors ${
            isRecording
              ? 'text-red-500 bg-red-50 hover:bg-red-100'
              : 'text-gray-500 hover:text-primary-500 hover:bg-primary-50'
          } disabled:opacity-50`}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>

        {/* Input */}
        <input
          type="text"
          value={message}
          onChange={handleChange}
          placeholder="Typ een bericht..."
          className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500/50"
        />

        {/* Send button */}
        <button
          type="submit"
          disabled={!message.trim()}
          className="p-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
}
