'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const App = dynamic(() => import('../App'), { ssr: false });

export default function ClientOnly({ initialTool }: { initialTool?: string }) {
  return <App initialTool={initialTool} />;
}
