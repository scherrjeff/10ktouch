import React, { useRef, useEffect, useState, useCallback } from 'react';

const AFTER_MS = 3000;

function buildSrc(videoId, startTime, autoplay) {
  return (
    `https://www.youtube.com/embed/${videoId}` +
    `?start=${startTime ?? 0}&autoplay=${autoplay ? 1 : 0}` +
    `&rel=0&playsinline=1&enablejsapi=1`
  );
}

export default function YoutubePlayerWeb({ videoId, startTime, endTime, height = 210 }) {
  const iframeRef  = useRef(null);
  const timerRef   = useRef(null);
  const startRef   = useRef(startTime);
  const endRef     = useRef(endTime);
  const loopingRef = useRef(false);

  const [started, setStarted] = useState(false);
  const [looping, setLooping] = useState(false);
  // iframeSrc drives the React-controlled src — we deliberately keep it at the
  // non-autoplay URL after the user taps, so React never overwrites our direct mutation
  const [iframeSrc, setIframeSrc] = useState(() => buildSrc(videoId, startTime, false));

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
      if (loopingRef.current) {
        // seekTo on an already-playing video works on iOS without a user gesture
        postCmd('seekTo', [startRef.current ?? 0, true]);
      }
      scheduleLoop();
    }, ms);
  }, [postCmd]);

  // Overlay play button — mutates iframe.src directly and synchronously so iOS
  // sees it as a user gesture (async setState would lose that context)
  const handleStart = () => {
    const newSrc = buildSrc(videoId, startRef.current, true);
    // Direct DOM mutation keeps us in the user-gesture call stack — iOS allows autoplay
    if (iframeRef.current) iframeRef.current.src = newSrc;
    // We intentionally do NOT call setIframeSrc(newSrc) so React's virtual DOM
    // still shows the old non-autoplay URL — on re-render React sees no src change
    // and never overwrites our mutation above
    loopingRef.current = true;
    setStarted(true);
    setLooping(true);
    scheduleLoop();
  };

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

  // Reset when drill changes — here we DO update iframeSrc so React reloads the iframe
  useEffect(() => {
    clearTimeout(timerRef.current);
    loopingRef.current = false;
    setStarted(false);
    setLooping(false);
    setIframeSrc(buildSrc(videoId, startTime, false));
    return () => clearTimeout(timerRef.current);
  }, [videoId, startTime]);

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

      {/* Overlay — shown until user taps; direct DOM mutation keeps iOS user-gesture context */}
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
