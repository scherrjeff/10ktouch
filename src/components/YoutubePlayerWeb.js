import React, { useRef, useEffect } from 'react';

export default function YoutubePlayerWeb({ videoId, startTime, endTime, height = 210 }) {
  const iframeRef = useRef(null);
  const timerRef  = useRef(null);
  const startRef  = useRef(startTime);
  const endRef    = useRef(endTime);
  const videoRef  = useRef(videoId);

  useEffect(() => { startRef.current = startTime; }, [startTime]);
  useEffect(() => { endRef.current   = endTime;   }, [endTime]);
  useEffect(() => { videoRef.current = videoId;   }, [videoId]);

  const BEFORE = 1; // seconds to start before the drill timestamp
  const AFTER  = 2; // extra seconds to wait after endTime before restarting

  const buildSrc = (autoplay = false, start = startTime) => {
    const params = [
      `start=${Math.max(0, (start ?? 0) - BEFORE)}`,
      `autoplay=${autoplay ? 1 : 0}`,
      'rel=0',
      'playsinline=1',
    ].join('&');
    return `https://www.youtube.com/embed/${videoId}?${params}`;
  };

  const scheduleLoop = () => {
    clearTimeout(timerRef.current);
    if (!endRef.current) return;
    const ms = (endRef.current - (startRef.current ?? 0) + BEFORE + AFTER) * 1000;
    timerRef.current = setTimeout(() => {
      if (iframeRef.current) {
        iframeRef.current.src = buildSrc(true, startRef.current);
      }
      scheduleLoop();
    }, ms);
  };

  const handleRestart = () => {
    if (iframeRef.current) {
      iframeRef.current.src = buildSrc(true);
    }
    scheduleLoop();
  };

  // Reset on drill change
  useEffect(() => {
    clearTimeout(timerRef.current);
    if (iframeRef.current) {
      iframeRef.current.src = buildSrc(false);
    }
    return () => clearTimeout(timerRef.current);
  }, [startTime]);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <iframe
        ref={iframeRef}
        src={buildSrc(false)}
        width="100%"
        height={height}
        style={{ border: 'none', display: 'block' }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
      {endTime && (
        <button
          onClick={handleRestart}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: '#22C55E',
            border: 'none',
            borderRadius: 8,
            color: '#0D1117',
            fontWeight: 800,
            fontSize: 13,
            padding: '6px 12px',
            cursor: 'pointer',
          }}
        >
          ↺ Restart Clip
        </button>
      )}
    </div>
  );
}
