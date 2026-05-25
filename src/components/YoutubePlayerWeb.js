import React, { useEffect, useRef } from 'react';

export default function YoutubePlayerWeb({ videoId, startTime, endTime, height = 210 }) {
  const iframeRef = useRef(null);
  const startRef  = useRef(startTime);
  const endRef    = useRef(endTime);
  const timerRef  = useRef(null);

  useEffect(() => { startRef.current = startTime; }, [startTime]);
  useEffect(() => { endRef.current   = endTime;   }, [endTime]);

  const send = (func, args = []) => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args }),
      '*'
    );
  };

  // Seek to new drill start when drill changes
  useEffect(() => {
    clearTimeout(timerRef.current);
    send('seekTo', [startTime ?? 0, true]);
    return () => clearTimeout(timerRef.current);
  }, [startTime]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (!String(event.origin).includes('youtube.com')) return;
      try {
        const data = JSON.parse(event.data);
        if (data.event !== 'onStateChange') return;

        if (data.info === 1) {
          // Playing — schedule the loop for exactly the clip duration
          clearTimeout(timerRef.current);
          if (!endRef.current) return;
          const ms = (endRef.current - (startRef.current ?? 0)) * 1000;
          timerRef.current = setTimeout(() => {
            send('seekTo', [startRef.current ?? 0, true]);
            send('playVideo');
            // state=1 will fire again on resume, rescheduling the next loop
          }, ms);
        } else if (data.info === 2 || data.info === 0) {
          // User paused or video ended — clear pending loop
          clearTimeout(timerRef.current);
        }
      } catch {}
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timerRef.current);
    };
  }, []);

  const params = [
    `start=${startTime ?? 0}`,
    'enablejsapi=1',
    'autoplay=0',
    'rel=0',
    'playsinline=1',
  ].join('&');

  return (
    <div style={{ width: '100%', height }}>
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
