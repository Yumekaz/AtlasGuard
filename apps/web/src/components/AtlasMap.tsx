'use client';

import dynamic from 'next/dynamic';
import type { AtlasMapInnerProps } from './AtlasMapInner';

const AtlasMapInner = dynamic(() => import('./AtlasMapInner'), {
  ssr: false,
  loading: () => (
    <div
      className="glass shimmer"
      style={{
        height: '420px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-secondary)',
      }}
    >
      Loading map...
    </div>
  ),
});

export type { AtlasMapInnerProps as AtlasMapProps, MapLayers, TouristLocation } from './AtlasMapInner';

export default function AtlasMap(props: AtlasMapInnerProps) {
  return <AtlasMapInner {...props} />;
}