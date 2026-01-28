import { useState } from 'react';
import { motion } from 'framer-motion';

interface YouTubeEmbedProps {
  videoId: string;
  url: string;
}

export function YouTubeEmbed({ videoId, url }: YouTubeEmbedProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  if (isPlaying) {
    return (
      <div className="relative w-full max-w-sm aspect-video rounded-lg overflow-hidden shadow-lg">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          title="YouTube video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => setIsPlaying(true)}
      className="relative w-full max-w-sm aspect-video rounded-lg overflow-hidden shadow-lg cursor-pointer group"
    >
      {/* Thumbnail */}
      <img
        src={thumbnailUrl}
        alt="YouTube video thumbnail"
        className="w-full h-full object-cover"
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />

      {/* Play button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
          <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>

      {/* YouTube branding */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/70 px-2 py-1 rounded">
        <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
        <span className="text-white text-xs font-medium">YouTube</span>
      </div>

      {/* Open in new tab */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="absolute top-2 right-2 p-1.5 bg-black/70 rounded-full text-white/80 hover:text-white hover:bg-black/90 transition-colors"
        title="Open in YouTube"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </motion.div>
  );
}

// Utility function to extract YouTube video ID from various URL formats
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    // Standard watch URL: https://www.youtube.com/watch?v=VIDEO_ID
    /(?:youtube\.com\/watch\?v=|youtube\.com\/watch\?.+&v=)([a-zA-Z0-9_-]{11})/,
    // Short URL: https://youtu.be/VIDEO_ID
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    // Embed URL: https://www.youtube.com/embed/VIDEO_ID
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    // Shorts URL: https://www.youtube.com/shorts/VIDEO_ID
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

// Check if text contains a YouTube URL
export function findYouTubeUrl(text: string): { url: string; videoId: string } | null {
  const urlPattern = /(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?[^\s]*v=|embed\/|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]+[^\s]*)/gi;
  const match = text.match(urlPattern);

  if (match && match[0]) {
    const videoId = extractYouTubeVideoId(match[0]);
    if (videoId) {
      return { url: match[0], videoId };
    }
  }

  return null;
}
