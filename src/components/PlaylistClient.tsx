'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import type { User, Message } from '@/db/schema';

interface TrackWithSender extends Message {
  sender: Pick<User, 'id' | 'name'>;
}

interface PlaylistClientProps {
  tracks: TrackWithSender[];
  currentUser: User;
}

export function PlaylistClient({ tracks, currentUser }: PlaylistClientProps) {
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <header className="glass border-b border-white/20 px-4 py-3 flex items-center gap-3">
        <Link
          href="/chat"
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎵</span>
          <div>
            <h1 className="font-semibold text-gray-800">Onze Playlist</h1>
            <p className="text-xs text-gray-500">{tracks.length} {tracks.length === 1 ? 'nummer' : 'nummers'}</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {tracks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full gap-4 text-center"
          >
            <span className="text-6xl">🎶</span>
            <p className="text-gray-500 text-lg font-medium">Nog geen nummers gedeeld</p>
            <p className="text-gray-400 text-sm">
              Deel een Spotify-nummer via de chat en het verschijnt hier automatisch.
            </p>
            <Link
              href="/chat"
              className="btn-primary px-6 py-2 rounded-full text-sm"
            >
              Naar de chat
            </Link>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-4 max-w-lg mx-auto">
            {tracks.map((track, i) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm overflow-hidden"
              >
                <iframe
                  src={`https://open.spotify.com/embed/track/${track.mediaUrl}?utm_source=generator&theme=0`}
                  width="100%"
                  height="152"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  title="Spotify track"
                />
                <div className="px-4 py-2 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Gedeeld door <span className="font-medium text-gray-700">{track.sender.name}</span>
                  </span>
                  <span className="text-xs text-gray-400">
                    {format(new Date(track.createdAt), 'd MMM yyyy', { locale: nl })}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
