import React, { useEffect, useRef, useCallback } from 'react';

export default function YoutubePlayerWeb({ videoId, startTime, endTime, height = 210 }) {
  const containerRef = useRef(null);
  const playerRef    = useRef(null);
  const loopRef      = useRef(null);

  const startLoop = useCallback((start, end) => {
    clearInterval(loopRef.current);
    if (!end) return;
    loopRef.current = setInterval(() => {
      const t = playerRef.current?.getCurrentTime?.();
      if (t != null && t >= end) {
        playerRef.current.seekTo(start ?? 0, true);
      }
    }, 500);
  }, []);

  useEffect(() => {
    const initPlayer = () => {
      if (!containerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        height,
        width: '100%',
        playerVars: {
          start: startTime ?? 0,
          autoplay: 0,
          rel: 0,
          playsinline: 1,
        },
        events: {
          onReady: () => startLoop(startTime, endTime),
        },
      });
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      if (!window.__ytQueue) window.__ytQueue = [];
      window.__ytQueue.push(initPlayer);
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        window.onYouTubeIframeAPIReady = () => {
          (window.__ytQueue || []).forEach(fn => fn());
          window.__ytQueue = [];
        };
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(script);
      }
    }

    return () => {
      clearInterval(loopRef.current);
      playerRef.current?.destroy?.();
    };
  }, []);

  // When drill changes, seek to new position and restart loop
  useEffect(() => {
    if (!playerRef.current?.seekTo) return;
    playerRef.current.seekTo(startTime ?? 0, true);
    startLoop(startTime, endTime);
  }, [startTime, endTime, startLoop]);

  return <div ref={containerRef} style={{ width: '100%', height }} />;
}
