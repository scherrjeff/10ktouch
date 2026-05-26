import React, { useRef, useEffect, useState, useCallback } from 'react';

const POLL_MS = 250;

function buildSrc(videoId, startTime, autoplay) {
  return (
    `https://www.youtube.com/embed/${videoId}` +
    `?start=${startTime ?? 0}&autoplay=${autoplay ? 1 : 0}` +
    `&rel=0&playsinline=1&enablejsapi=1`
  );
}

export default function YoutubePlayerWeb({ videoId, startTime, endTime, height = 210 }) {
  const iframeRef  = useRef(null);
  const intervalRef = useRef(null);
  const startRef   = useRef(startTime);
  const endRef     = useRef(endTime);
  const loopingRef = useRef(false);
  const playStartRef = useRef(null); // wall-clock time when video started at startTime

  const [started, setStarted] = useState(false);
  const [looping, setLooping] = useState(false);
  const [iframeSrc, setIframeSrc] = useState(() => buildSrc(videoId, startTime, false));

  useEffect(() => { startRef.current = startTime; }, [startTime]);
  useEffect(() => { endRef.current   = endTime;   }, [endTime]);

  const postCmd = useCallback((func, args = []) => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args }),
      '*'
    );
  }, []);

  const stopPolling = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    if (!endRef.current) return;
    playStartRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      if (!loopingRef.current) { stopPolling(); return; }
      const elapsed = (Date.now() - playStartRef.current) / 1000;
      const estimated = (startRef.current ?? 0) + elapsed;
      if (estimated >= endRef.current) {
        postCmd('seekTo', [startRef.current ?? 0, true]);
        playStartRef.current = Date.now();
      }
    }, POLL_MS);
  }, [postCmd, stopPolling]);

  const handleStart = () => {
    const newSrc = buildSrc(videoId, startRef.current, true);
    if (iframeRef.current) iframeRef.current.src = newSrc;
    loopingRef.current = true;
    setStarted(true);
    setLooping(true);
    startPolling();
  };

  const handleToggle = () => {
    const next = !looping;
    setLooping(next);
    loopingRef.current = next;
    if (next) {
      postCmd('seekTo', [startRef.current ?? 0, true]);
      postCmd('playVideo');
      startPolling();
    } else {
      stopPolling();
      postCmd('pauseVideo');
    }
  };

  // Reset when drill changes
  useEffect(() => {
    stopPolling();
    loopingRef.current = false;
    setStarted(false);
    setLooping(false);
    setIframeSrc(buildSrc(videoId, startTime, false));
    return () => stopPolling();
  }, [videoId, startTime, stopPolling]);

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
      />

      {!started && (
        <div
          onClick={handleStart}
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            background: 'rgba(0,0,0,0.35)',
          }}
        >
          <div style={{
            width: 72, height: 72, borderRadius: 36,
            background: '#22C55E',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 28px rgba(34,197,94,0.55)',
          }}>
            <div style={{
              width: 0, height: 0,
              borderTop: '14px solid transparent',
              borderBottom: '14px solid transparent',
              borderLeft: '24px solid #0D1117',
              marginLeft: 6,
            }} />
          </div>
        </div>
      )}

      {started && endTime && (
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
