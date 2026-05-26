import React, { useRef, useEffect, useState } from 'react';

const AFTER_BUFFER_MS = 3000;

export default function YoutubePlayerWeb({ videoId, startTime, endTime, height = 210 }) {
  const iframeRef  = useRef(null);
  const timerRef   = useRef(null);
  const startRef   = useRef(startTime);
  const endRef     = useRef(endTime);
  const loopingRef = useRef(true);
  const [looping, setLooping] = useState(true);

  useEffect(() => { startRef.current = startTime; }, [startTime]);
  useEffect(() => { endRef.current   = endTime;   }, [endTime]);

  const buildSrc = (autoplay = false, start) => {
    const s = start ?? startRef.current ?? 0;
    const params = [
      `start=${s}`,
      `autoplay=${autoplay ? 1 : 0}`,
      'rel=0',
      'playsinline=1',
    ].join('&');
    return `https://www.youtube.com/embed/${videoId}?${params}`;
  };

  const scheduleLoop = () => {
    clearTimeout(timerRef.current);
    if (!endRef.current || !loopingRef.current) return;
    const ms = (endRef.current - (startRef.current ?? 0)) * 1000 + AFTER_BUFFER_MS;
    timerRef.current = setTimeout(() => {
      if (iframeRef.current && loopingRef.current) {
        iframeRef.current.src = buildSrc(true, startRef.current);
      }
      scheduleLoop();
    }, ms);
  };

  const startLoop = () => {
    if (iframeRef.current) {
      iframeRef.current.src = buildSrc(true, startRef.current);
    }
    scheduleLoop();
  };

  // Auto-start loop on mount
  useEffect(() => {
    startLoop();
    return () => clearTimeout(timerRef.current);
  }, []);

  // Reset when drill changes
  useEffect(() => {
    clearTimeout(timerRef.current);
    loopingRef.current = true;
    setLooping(true);
    startLoop();
    return () => clearTimeout(timerRef.current);
  }, [startTime]);

  const handleToggle = () => {
    const next = !looping;
    setLooping(next);
    loopingRef.current = next;
    if (next) {
      startLoop();
    } else {
      clearTimeout(timerRef.current);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <iframe
        ref={iframeRef}
        src={buildSrc(false, startTime)}
        width="100%"
        height={height}
        style={{ border: 'none', display: 'block' }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
      {endTime && (
        <button
          onClick={handleToggle}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: looping ? '#22C55E' : '#1F2937',
            border: looping ? 'none' : '1px solid #374151',
            borderRadius: 8,
            color: looping ? '#0D1117' : '#9CA3AF',
            fontWeight: 800,
            fontSize: 13,
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
