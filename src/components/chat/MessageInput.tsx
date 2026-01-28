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
  const [showAttachments, setShowAttachments] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState<'youtube' | 'spotify' | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout>();

  const closeAllMenus = () => {
    setShowAttachments(false);
    setShowEmojis(false);
    setShowStickers(false);
    setShowLinkInput(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const trimmed = message.trim();
    const isEmoji = trimmed.length <= 2 && /[\u{1F300}-\u{1FAD6}]/u.test(trimmed);
    onSendMessage(trimmed, isEmoji ? 'emoji' : 'text');
    setMessage('');
    closeAllMenus();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    onTyping();
    typingTimeoutRef.current = setTimeout(() => {}, 1000);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    closeAllMenus();
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
    closeAllMenus();
  };

  const handleStickerSelect = (emoji: string) => {
    onSendSticker(emoji);
    closeAllMenus();
  };

  const handleLinkSubmit = () => {
    if (showLinkInput === 'youtube') {
      const videoId = extractYouTubeId(linkUrl);
      if (videoId) {
        onSendMedia(videoId, 'youtube');
        setLinkUrl('');
        setShowLinkInput(null);
      } else {
        alert('Ongeldige YouTube URL');
      }
    } else if (showLinkInput === 'spotify') {
      const trackId = extractSpotifyId(linkUrl);
      if (trackId) {
        onSendMedia(trackId, 'spotify');
        setLinkUrl('');
        setShowLinkInput(null);
      } else {
        alert('Ongeldige Spotify URL');
      }
    }
  };

  const startRecording = async () => {
    closeAllMenus();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
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
      recordingIntervalRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch (error) {
      console.error('Could not start recording:', error);
      alert('Kon microfoon niet gebruiken');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setRecordingTime(0);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Recording UI
  if (isRecording) {
    return (
      <div className="safe-area-bottom bg-white border-t border-gray-100">
        <div className="flex items-center gap-3 p-4">
          <button
            onClick={cancelRecording}
            className="w-12 h-12 flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex-1 flex items-center justify-center gap-3 py-3 bg-red-50 rounded-2xl">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-600 font-semibold text-lg">{formatTime(recordingTime)}</span>
          </div>

          <button
            onClick={stopRecording}
            className="w-12 h-12 flex items-center justify-center bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-full shadow-lg"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="safe-area-bottom bg-white border-t border-gray-100">
      {/* Attachment menu */}
      <AnimatePresence>
        {showAttachments && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="p-4 border-b border-gray-100"
          >
            <div className="grid grid-cols-4 gap-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 flex items-center justify-center bg-purple-100 rounded-full">
                  <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-xs text-gray-600">Foto</span>
              </button>

              <button
                onClick={() => { setShowLinkInput('youtube'); setShowAttachments(false); }}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 flex items-center justify-center bg-red-100 rounded-full">
                  <svg className="w-6 h-6 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
                <span className="text-xs text-gray-600">YouTube</span>
              </button>

              <button
                onClick={() => { setShowLinkInput('spotify'); setShowAttachments(false); }}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 flex items-center justify-center bg-green-100 rounded-full">
                  <svg className="w-6 h-6 text-[#1DB954]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                </div>
                <span className="text-xs text-gray-600">Spotify</span>
              </button>

              <button
                onClick={() => { setShowStickers(true); setShowAttachments(false); }}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 flex items-center justify-center bg-yellow-100 rounded-full">
                  <span className="text-2xl">⭐</span>
                </div>
                <span className="text-xs text-gray-600">Stickers</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Link input */}
      <AnimatePresence>
        {showLinkInput && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-4 border-b border-gray-100"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder={showLinkInput === 'youtube' ? 'Plak YouTube link...' : 'Plak Spotify link...'}
                className="flex-1 px-4 py-3 bg-gray-100 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                autoFocus
              />
              <button
                onClick={handleLinkSubmit}
                disabled={!linkUrl}
                className={`px-5 py-3 rounded-xl text-white font-medium transition-colors disabled:opacity-50 ${
                  showLinkInput === 'youtube' ? 'bg-red-500' : 'bg-[#1DB954]'
                }`}
              >
                Verstuur
              </button>
              <button
                onClick={() => { setShowLinkInput(null); setLinkUrl(''); }}
                className="px-3 py-3 text-gray-500"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emoji picker */}
      <AnimatePresence>
        {showEmojis && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-4 border-b border-gray-100"
          >
            <div className="flex gap-3 justify-center flex-wrap">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiClick(emoji)}
                  className="text-3xl hover:scale-125 active:scale-95 transition-transform p-2"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticker picker */}
      <AnimatePresence>
        {showStickers && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-4 border-b border-gray-100"
          >
            <StickerPicker
              onSelectSticker={handleStickerSelect}
              onClose={() => setShowStickers(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Main input row */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2 p-3">
        {/* Attachment button */}
        <button
          type="button"
          onClick={() => {
            setShowAttachments(!showAttachments);
            setShowEmojis(false);
            setShowStickers(false);
            setShowLinkInput(null);
          }}
          disabled={isUploading}
          className="w-11 h-11 flex-shrink-0 flex items-center justify-center text-gray-500 hover:text-primary-500 hover:bg-primary-50 rounded-full transition-colors disabled:opacity-50"
        >
          {isUploading ? (
            <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          )}
        </button>

        {/* Text input container */}
        <div className="flex-1 flex items-end bg-gray-100 rounded-3xl overflow-hidden">
          <button
            type="button"
            onClick={() => {
              setShowEmojis(!showEmojis);
              setShowAttachments(false);
              setShowStickers(false);
              setShowLinkInput(null);
            }}
            className="w-11 h-11 flex-shrink-0 flex items-center justify-center text-gray-500 hover:text-primary-500 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={handleChange}
            placeholder="Bericht..."
            className="flex-1 py-3 pr-3 bg-transparent text-base focus:outline-none"
          />
        </div>

        {/* Send or Voice button */}
        {message.trim() ? (
          <button
            type="submit"
            className="w-11 h-11 flex-shrink-0 flex items-center justify-center bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            onClick={startRecording}
            disabled={isUploading}
            className="w-11 h-11 flex-shrink-0 flex items-center justify-center text-gray-500 hover:text-primary-500 hover:bg-primary-50 rounded-full transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
        )}
      </form>
    </div>
  );
}
