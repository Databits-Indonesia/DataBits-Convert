import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const alt = 'DataBits Convert - PDF conversion and manipulation tools';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

// Image generation
export default function Image() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          background: 'linear-gradient(to bottom right, #0f172a, #334155)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          padding: 80,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '20px 40px',
            borderRadius: 20,
            marginBottom: 40,
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <span style={{ fontSize: 60, fontWeight: 700 }}>DataBits</span>
          <span style={{ fontSize: 60, fontWeight: 300, marginLeft: 16 }}>Convert</span>
        </div>
        <p style={{ fontSize: 36, color: '#94a3b8', textAlign: 'center', maxWidth: '80%' }}>
          PDF conversion and manipulation tools
        </p>
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  );
}
