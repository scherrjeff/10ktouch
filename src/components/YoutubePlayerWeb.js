import React, { useState } from 'react';

export default function YoutubePlayerWeb({ videoId, startTime, endTime, height = 210 }) {
  const [seed, setSeed] = useState(0);

  const params = [
    `start=${startTime ?? 0}`,
    'rel=0',
    'playsinline=1',
  ].join('&');

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <iframe
        key={`${startTime}-${seed}`}
        src={`https://www.youtube.com/embed/${videoId}?${params}`}
        width="100%"
        height={height}
        style={{ border: 'none', display: 'block' }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
      {endTime && (
        <button
          onClick={() => setSeed(s => s + 1)}
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
