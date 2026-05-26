import React, { useEffect, useRef, useState } from 'react';

export default function YoutubePlayerWeb({ videoId, startTime, endTime, height = 210 }) {
  const iframeRef = useRef(null);
  const timerRef  = useRef(null);
  const [started, setStarted] = useState(false);

  const send = (func, args = []) => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args }),
      '*'
    );
  };

  const scheduleLoop = (start, end) => {
    clearTimeout(timerRef.current);
    if (!end) return;
    timerRef.current = setTimeout(() => {
      // Only seekTo — no playVideo. iOS allows repositioning a playing video
      // without a new user gesture; it keeps playing from the new position.
      send('seekTo', [start ?? 0, true]);
      scheduleLoop(start, end);
    }, (end - (start ?? 0)) * 1000);
  };

  // User taps our Play button — this IS a user gesture, so playVideo is allowed
  const handlePlay = () => {
    send('seekTo', [startTime ?? 0, true]);
    send('playVideo');
    setStarted(true);
    scheduleLoop(startTime, endTime);
  };

  // Drill changed — reset
  useEffect(() => {
    clearTimeout(timerRef.current);
    setStarted(false);
    return () => clearTimeout(timerRef.current);
  }, [startTime]);

  const params = [
    `start=${startTime ?? 0}`,
    'enablejsapi=1',
    'autoplay=0',
    'rel=0',
    'playsinline=1',
  ].join('&');

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <iframe
        ref={iframeRef}
        src={`https://www.youtube.com/embed/${videoId}?${params}`}
        width="100%"
        height={height}
        style={{ border: 'none', display: 'block' }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
      {!started && (
        <div
          onClick={handlePlay}
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            background: 'rgba(0,0,0,0.25)',
          }}
        >
          <div style={{
            width: 68, height: 68, borderRadius: 34,
            background: '#22C55E',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 24px rgba(34,197,94,0.5)',
          }}>
            <div style={{
              width: 0, height: 0,
              borderTop: '13px solid transparent',
              borderBottom: '13px solid transparent',
              borderLeft: '22px solid #0D1117',
              marginLeft: 5,
            }} />
          </div>
        </div>
      )}
    </div>
  );
}
