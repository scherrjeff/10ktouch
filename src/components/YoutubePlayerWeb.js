import React, { useRef, useEffect, useState, useCallback } from 'react';

const AFTER_MS = 3000;

export default function YoutubePlayerWeb({ videoId, startTime, endTime, height = 210 }) {
  const iframeRef     = useRef(null);
  const timerRef      = useRef(null);
  const startRef      = useRef(startTime);
  const endRef        = useRef(endTime);
  const loopingRef    = useRef(false);
  const playingRef    = useRef(false);
  const hasStartedRef = useRef(false);

  const [looping, setLooping]       = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => { startRef.current = startTime; }, [startTime]);
  useEffect(() => { endRef.current   = endTime;   }, [endTime]);

  const postCmd = useCallback((func, args = []) => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args }),
      '*'
    );
  }, []);

  const scheduleLoop = useCallback(() => {
    clearTimeout(timerRef.current);
    if (!endRef.current || !loopingRef.current) return;
    const ms = (endRef.current - (startRef.current ?? 0)) * 1000 + AFTER_MS;
    timerRef.current = setTimeout(() => {
      if (loopingRef.current && playingRef.current) {
        // seekTo on an already-playing video works on iOS without a user gesture
        postCmd('seekTo', [startRef.current ?? 0, true]);
      }
      scheduleLoop();
    }, ms);
  }, [postCmd]);

  // Listen for YouTube state-change messages
  useEffect(() => {
    const handleMessage = (e) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data?.event !== 'onStateChange') return;
        const state = data.info;
        if (state === 1) {
          playingRef.current = true;
          if (!hasStartedRef.current) {
            hasStartedRef.current = true;
            setHasStarted(true);
            loopingRef.current = true;
            setLooping(true);
            scheduleLoop();
          }
        } else if (state === 2 || state === 0) {
          playingRef.current = false;
        }
      } catch (_) {}
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [scheduleLoop]);

  const handleIframeLoad = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'listening' }),
      '*'
    );
  }, []);

  const handleToggle = () => {
    const next = !looping;
    setLooping(next);
    loopingRef.current = next;
    if (next) {
      postCmd('seekTo', [startRef.current ?? 0, true]);
      postCmd('playVideo');
      scheduleLoop();
    } else {
      clearTimeout(timerRef.current);
      postCmd('pauseVideo');
    }
  };

  // Reset when drill changes
  useEffect(() => {
    clearTimeout(timerRef.current);
    loopingRef.current    = false;
    playingRef.current    = false;
    hasStartedRef.current = false;
    setHasStarted(false);
    setLooping(false);
    return () => clearTimeout(timerRef.current);
  }, [startTime]);

  const iframeSrc = `https://www.youtube.com/embed/${videoId}?start=${startTime ?? 0}&rel=0&playsinline=1&enablejsapi=1`;

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <iframe
        ref={iframeRef}
        src={iframeSrc}
        width="100%"
        height={height}
        style={{ border: 'none', display: 'block' }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        onLoad={handleIframeLoad}
      />

      {hasStarted && endTime && (
        <button
          onClick={handleToggle}
          style={{
            position: 'absolute', top: 8, right: 8,
            background: looping ? '#22C55E' : '#1F2937',
            border: looping ? 'none' : '1px solid #374151',
            borderRadius: 8,
            color: looping ? '#0D1117' : '#9CA3AF',
            fontWeight: 800, fontSize: 13,
            padding: '6px 12px',
            cursor: 'pointer',
          }}
        >
          {looping ? '⏸ Pause Loop' : '▶ Start Loop'}
        </button>
      )}
    </div>
  );
}
