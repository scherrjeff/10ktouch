import React, { useEffect, useRef } from 'react';

export default function YoutubePlayerWeb({ videoId, startTime, endTime, height = 210 }) {
  const iframeRef     = useRef(null);
  const startRef      = useRef(startTime);
  const endRef        = useRef(endTime);
  const userActedRef  = useRef(false); // true briefly after a user tap (manual pause)

  useEffect(() => { startRef.current = startTime; }, [startTime]);
  useEffect(() => { endRef.current   = endTime;   }, [endTime]);

  const send = (func, args = []) => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args }),
      '*'
    );
  };

  // Seek to new drill start when drill changes (no iframe reload = no new ad)
  useEffect(() => {
    send('seekTo', [startTime ?? 0, true]);
  }, [startTime]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (!String(event.origin).includes('youtube.com')) return;
      try {
        const data = JSON.parse(event.data);
        // state 2 = paused (fires when video hits 'end' param)
        // state 0 = ended (fallback)
        if (data.event === 'onStateChange' && (data.info === 0 || data.info === 2)) {
          if (userActedRef.current) return; // user manually paused — don't loop
          if (!endRef.current) return;
          send('seekTo', [startRef.current ?? 0, true]);
          send('playVideo');
        }
      } catch {}
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Mark user-initiated taps so we don't override manual pauses
  const handlePointerDown = () => {
    userActedRef.current = true;
    setTimeout(() => { userActedRef.current = false; }, 800);
  };

  const params = [
    `start=${startTime ?? 0}`,
    'enablejsapi=1',
    'autoplay=0',
    'rel=0',
    'playsinline=1',
    ...(endTime ? [`end=${endTime}`] : []),
  ].join('&');

  return (
    <div onPointerDown={handlePointerDown} style={{ width: '100%', height }}>
      <iframe
        ref={iframeRef}
        src={`https://www.youtube.com/embed/${videoId}?${params}`}
        width="100%"
        height={height}
        style={{ border: 'none', display: 'block' }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
