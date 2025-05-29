'use client';

import { useState, useRef } from 'react';
import { 
  MagnifyingGlassMinusIcon, 
  MagnifyingGlassPlusIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline';

interface MediaViewerProps {
  url: string;
  title: string;
  type?: 'image' | 'video' | 'audio';
}

export default function MediaViewer({ url, title, type = 'image' }: MediaViewerProps) {
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  function zoomIn() {
    setScale(prevScale => Math.min(prevScale + 0.1, 3.0));
  }

  function zoomOut() {
    setScale(prevScale => Math.max(prevScale - 0.1, 0.5));
  }

  function resetZoom() {
    setScale(1.0);
  }

  function togglePlay() {
    if (!videoRef.current) return;
    
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }

  function toggleMute() {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(!isMuted);
  }

  // Renders the appropriate controls based on media type
  const renderControls = () => {
    if (type === 'image') {
      return (
        <div className="flex items-center space-x-1">
          <button
            onClick={zoomOut}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Zoom out"
          >
            <MagnifyingGlassMinusIcon className="w-4 h-4" />
          </button>
          <button
            onClick={resetZoom}
            className="px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            onClick={zoomIn}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Zoom in"
          >
            <MagnifyingGlassPlusIcon className="w-4 h-4" />
          </button>
        </div>
      );
    } else if (type === 'video' || type === 'audio') {
      return (
        <div className="flex items-center space-x-2">
          <button
            onClick={togglePlay}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <PauseIcon className="w-4 h-4" />
            ) : (
              <PlayIcon className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={toggleMute}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <SpeakerXMarkIcon className="w-4 h-4" />
            ) : (
              <SpeakerWaveIcon className="w-4 h-4" />
            )}
          </button>
        </div>
      );
    }
    return null;
  };

  // Renders the appropriate media content based on type
  const renderMedia = () => {
    if (type === 'image') {
      return (
        <div className="relative overflow-hidden max-h-full">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700 bg-opacity-80 dark:bg-opacity-80">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
            </div>
          )}
          <img
            src={url}
            alt={title}
            className={`transition-transform object-contain ${error ? 'hidden' : ''}`}
            style={{ transform: `scale(${scale})` }}
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
          />
          {error && (
            <div className="flex flex-col items-center justify-center text-red-500 p-4 text-center">
              <p>Failed to load image</p>
            </div>
          )}
        </div>
      );
    } else if (type === 'video') {
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700 bg-opacity-80 dark:bg-opacity-80 z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
            </div>
          )}
          <video
            ref={videoRef}
            src={url}
            className="max-w-full max-h-full"
            controls
            controlsList="nodownload"
            onLoadedData={() => setLoading(false)}
            onError={(e) => {
              console.error("Video error:", e);
              setLoading(false);
              setError(true);
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
          {error && (
            <div className="flex flex-col items-center justify-center text-center p-6 max-w-md">
              <div className="text-red-500 mb-4">
                <p className="font-medium text-lg">This video format may not be supported by your browser</p>
                <p className="text-sm mt-2">The video format might not be supported in your browser's built-in player.</p>
              </div>
              <div className="flex flex-col space-y-3 mt-3">
                <a 
                  href={url} 
                  download
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-center"
                >
                  Download Video
                </a>
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-center"
                >
                  Open in New Tab
                </a>
              </div>
            </div>
          )}
        </div>
      );
    } else if (type === 'audio') {
      return (
        <div className="w-full h-full flex items-center justify-center">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700 bg-opacity-80 dark:bg-opacity-80 z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
            </div>
          )}
          <audio
            ref={videoRef as any}
            src={url}
            className="w-full"
            controls
            controlsList="nodownload"
            onLoadedData={() => setLoading(false)}
            onError={(e) => {
              console.error("Audio error:", e);
              setLoading(false);
              setError(true);
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
          {error && (
            <div className="flex flex-col items-center justify-center text-center p-6 max-w-md">
              <div className="text-red-500 mb-4">
                <p className="font-medium text-lg">This audio format may not be supported by your browser</p>
                <p className="text-sm mt-2">The audio format might not be supported in your browser's built-in player.</p>
              </div>
              <div className="flex flex-col space-y-3 mt-3">
                <a 
                  href={url} 
                  download
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-center"
                >
                  Download Audio
                </a>
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-center"
                >
                  Open in New Tab
                </a>
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Controls */}
      <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex-1">
          <div className="truncate text-xs text-gray-600 dark:text-gray-300" title={title}>
            {title}
          </div>
        </div>
        {renderControls()}
      </div>

      {/* Media Content */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-gray-100 dark:bg-gray-800">
        {renderMedia()}
      </div>
    </div>
  );
} 