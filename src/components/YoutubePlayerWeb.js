import React from 'react';

export default function YoutubePlayerWeb({ videoId, startTime, endTime, height = 210 }) {
  const params = [
    `start=${startTime ?? 0}`,
    'autoplay=0',
    'rel=0',
    'playsinline=1',
    ...(endTime ? [`end=${endTime}`, 'loop=1', `playlist=${videoId}`] : []),
  ].join('&');

  return (
    <iframe
      src={`https://www.youtube.com/embed/${videoId}?${params}`}
      width="100%"
      height={height}
      style={{ border: 'none', display: 'block' }}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
}
