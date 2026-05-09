'use client';

import dynamic from 'next/dynamic';

// `ssr: false` is only allowed inside a Client Component.
// All tool code uses browser-only APIs (window, DOMMatrix, canvas, etc.)
// at module evaluation time, so we must prevent it from ever running on
// the server during Next.js static prerendering.
const App = dynamic(() => import('../../client'), { ssr: false });

interface ToolClientProps {
  initialTool: string;
}

export default function ToolClient({ initialTool }: ToolClientProps) {
  return <App initialTool={initialTool} />;
}
