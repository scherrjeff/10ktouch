import React, { useRef, useEffect, useState, useCallback } from 'react';

const AFTER_MS = 3000;

export default function YoutubePlayerWeb({ videoId, startTime, endTime, height = 210 }) {
  const timerRef   = useRef(null);
  const startRef   = useRef(startTime);
  const endRef     = useRef(endTime);
  const loopingRef = useRef(false);

  const [started, setStarted]     = useState(false);
  const [looping, setLooping]     = useState(false);
  const [iframeSrc, setIframeSrc] = useState('');

  useEffect(() => { startRef.current = startTime; }, [startTime]);
  useEffect(() => { endRef.current   = endTime;   }, [endTime]);

  const makeSrc = useCallback((autoplay, bust = false) => {
    const params = [
      `start=${startRef.current ?? 0}`,
      `autoplay=${autoplay ? 1 : 0}`,
      'rel=0',
      'playsinline=1',
      bust ? `_t=${Date.now()}` : '',
    ].filter(Boolean).join('&');
    return `https://www.youtube.com/embed/${videoId}?${params}`;
  }, [videoId]);

  const scheduleLoop = useCallback(() => {
    clearTimeout(timerRef.current);
    if (!endRef.current || !loopingRef.current) return;
    const ms = (endRef.current - (startRef.current ?? 0)) * 1000 + AFTER_MS;
    timerRef.current = setTimeout(() => {
      if (loopingRef.current) {
        // bust cache so iframe actually reloads even if src would otherwise be the same
        setIframeSrc(makeSrc(true, true));
      }
      scheduleLoop();
    }, ms);
  }, [makeSrc]);

  // Overlay play button — fires as direct user gesture so iOS allows autoplay
  const handleStart = () => {
    loopingRef.current = true;
    setStarted(true);
    setLooping(true);
    setIframeSrc(makeSrc(true));
    scheduleLoop();
  };

  const handleToggle = () => {
    const next = !looping;
    setLooping(next);
    loopingRef.current = next;
    if (next) {
      setIframeSrc(makeSrc(true));
      scheduleLoop();
    } else {
      clearTimeout(timerRef.current);
    }
  };

  // Reset when drill changes
  useEffect(() => {
    clearTimeout(timerRef.current);
    loopingRef.current = false;
    setStarted(false);
    setLooping(false);
    setIframeSrc(makeSrc(false));
    return () => clearTimeout(timerRef.current);
  }, [startTime, makeSrc]);

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <iframe
        src={iframeSrc || makeSrc(false)}
        width="100%"
        height={height}
        style={{ border: 'none', display: 'block' }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />

      {/* Overlay play button — shown until user taps to start the loop */}
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

      {/* Toggle button — shown after first tap */}
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
