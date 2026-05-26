import React, { useRef } from 'react';

export default function YoutubePlayerWeb({ videoId, startTime, endTime, height = 210 }) {
  const iframeRef = useRef(null);

  const buildSrc = (autoplay = false) => {
    const params = [
      `start=${startTime ?? 0}`,
      `autoplay=${autoplay ? 1 : 0}`,
      'rel=0',
      'playsinline=1',
    ].join('&');
    return `https://www.youtube.com/embed/${videoId}?${params}`;
  };

  // Set src synchronously inside the click handler so iOS keeps the user-gesture context
  const handleRestart = () => {
    if (iframeRef.current) {
      iframeRef.current.src = buildSrc(true);
    }
  };

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
