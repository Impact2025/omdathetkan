import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import * as api from '../../lib/api';
import { LIMITS } from '@pureliefde/shared';

interface MediaUploaderProps {
  onUpload: (mediaUrl: string, type: 'image' | 'video') => void;
  onCancel: () => void;
}

const MAX_PREVIEW_DIM = 1280;

async function compressImage(file: File): Promise<File> {
  if (file.size < 500 * 1024) return file; // skip if already small

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let w = img.width;
      let h = img.height;

      if (w <= MAX_PREVIEW_DIM && h <= MAX_PREVIEW_DIM) {
        // Only quality compress, no resize
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (!blob) { resolve(file); return; }
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
          },
          'image/jpeg',
          0.85
        );
        return;
      }

      // Resize + compress
      const scale = Math.min(MAX_PREVIEW_DIM / w, MAX_PREVIEW_DIM / h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
        },
        'image/jpeg',
        0.85
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaUploader({ onUpload, onCancel }: MediaUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    setError(null);

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      setError('Alleen afbeeldingen en videos zijn toegestaan');
      return;
    }

    if (isImage && file.size > LIMITS.IMAGE_MAX_SIZE) {
      setError(`Afbeelding te groot (max ${formatSize(LIMITS.IMAGE_MAX_SIZE)})`);
      return;
    }

    if (isVideo && file.size > LIMITS.VIDEO_MAX_SIZE) {
      setError(`Video te groot (max ${formatSize(LIMITS.VIDEO_MAX_SIZE)})`);
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  }, []);

  // Listen for pasted images from MessageInput
  useEffect(() => {
    const handlePasteImage = (e: CustomEvent<File>) => {
      processFile(e.detail);
    };

    window.addEventListener('paste-image', handlePasteImage as EventListener);
    return () => window.removeEventListener('paste-image', handlePasteImage as EventListener);
  }, [processFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Compress images before upload
      const fileToUpload = selectedFile.type.startsWith('image/')
        ? await compressImage(selectedFile)
        : selectedFile;

      const { uploadUrl, publicUrl } = await api.getUploadUrl(
        fileToUpload.name,
        fileToUpload.type
      );

      await api.uploadMedia(uploadUrl, fileToUpload, setUploadProgress);

      const type = fileToUpload.type.startsWith('image/') ? 'image' : 'video';
      onUpload(publicUrl, type);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Onbekend fout';
      setError(`Uploaden mislukt: ${message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    if (preview) URL.revokeObjectURL(preview);
    onCancel();
  };

  return (
    <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 p-4">
      {/* Close button */}
      <button
        onClick={handleCancel}
        disabled={isUploading}
        className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <AnimatePresence mode="wait">
        {!selectedFile ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={clsx(
              'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
              isDragging
                ? 'border-primary-500 bg-primary-50 scale-[1.02]'
                : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50/30'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-2">
              <motion.div
                className="p-3 bg-primary-100 rounded-full"
                animate={isDragging ? { scale: 1.15 } : { scale: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <svg className="w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </motion.div>
              <p className="text-gray-600 font-medium">
                {isDragging ? 'Los hier neer' : 'Klik of sleep een foto hier'}
              </p>
              <p className="text-xs text-gray-400">
                Max {formatSize(LIMITS.IMAGE_MAX_SIZE)} voor foto's, {formatSize(LIMITS.VIDEO_MAX_SIZE)} voor video's
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {/* Preview */}
            <div className="relative bg-gray-100 rounded-xl overflow-hidden" style={{ maxHeight: '240px' }}>
              {selectedFile.type.startsWith('image/') ? (
                <img
                  src={preview!}
                  alt="Preview"
                  className="w-full object-contain"
                  style={{ maxHeight: '240px' }}
                />
              ) : (
                <video
                  src={preview!}
                  controls
                  className="w-full object-contain"
                  style={{ maxHeight: '240px' }}
                />
              )}
            </div>

            {/* File info */}
            <div className="flex items-center gap-2 text-xs text-gray-500 px-1">
              <span className="truncate">{selectedFile.name}</span>
              <span className="ml-auto whitespace-nowrap">{formatSize(selectedFile.size)}</span>
            </div>

            {/* Upload progress */}
            <AnimatePresence>
              {isUploading && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1.5 overflow-hidden"
                >
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-center">{uploadProgress}% geüpload</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-red-500 text-center"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => {
                  if (preview) URL.revokeObjectURL(preview);
                  setSelectedFile(null);
                  setPreview(null);
                  setError(null);
                }}
                disabled={isUploading}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Andere kiezen
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className={clsx(
                  'px-4 py-1.5 text-sm rounded-lg font-medium transition-all',
                  isUploading
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:shadow-md active:scale-95'
                )}
              >
                {isUploading ? 'Uploaden...' : 'Versturen'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
