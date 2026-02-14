import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'linear-gradient(135deg, #064E3B 0%, #065F46 25%, #059669 50%, #10B981 75%, #34D399 100%)',
          position: 'relative',
        }}
      >
        {/* Nodos decorativos de red (fondo) */}
        <div style={{ position: 'absolute', top: 50, left: 100, width: 20, height: 20, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex' }} />
        <div style={{ position: 'absolute', top: 140, left: 220, width: 12, height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.1)', display: 'flex' }} />
        <div style={{ position: 'absolute', top: 90, right: 170, width: 16, height: 16, borderRadius: 8, background: 'rgba(255,255,255,0.12)', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: 120, left: 140, width: 14, height: 14, borderRadius: 7, background: 'rgba(255,255,255,0.1)', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: 90, right: 120, width: 18, height: 18, borderRadius: 9, background: 'rgba(255,255,255,0.12)', display: 'flex' }} />
        <div style={{ position: 'absolute', top: 220, left: 70, width: 10, height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.08)', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: 220, right: 70, width: 10, height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.08)', display: 'flex' }} />
        <div style={{ position: 'absolute', top: 300, right: 250, width: 8, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: 300, left: 250, width: 8, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', display: 'flex' }} />

        {/* Logo: círculos concéntricos con $ */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 130,
            height: 130,
            borderRadius: 65,
            background: 'rgba(255, 255, 255, 0.15)',
            marginBottom: 28,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 90,
              height: 90,
              borderRadius: 45,
              background: 'rgba(255, 255, 255, 0.25)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 54,
                height: 54,
                borderRadius: 27,
                background: 'white',
                color: '#059669',
                fontSize: 32,
                fontWeight: 700,
              }}
            >
              $
            </div>
          </div>
        </div>

        {/* Título */}
        <div
          style={{
            display: 'flex',
            fontSize: 72,
            fontWeight: 700,
            letterSpacing: '-1px',
            marginBottom: 16,
          }}
        >
          <span style={{ color: 'white' }}>Credi</span>
          <span style={{ color: '#A7F3D0' }}>Red</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            display: 'flex',
            fontSize: 28,
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: 12,
            fontWeight: 500,
          }}
        >
          Gestión de Ventas, Créditos y Cobros
        </div>

        {/* Subtexto */}
        <div
          style={{
            display: 'flex',
            fontSize: 21,
            color: 'rgba(255, 255, 255, 0.65)',
          }}
        >
          Controla quién te debe, cuánto y cuándo vence
        </div>

        {/* URL */}
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            bottom: 30,
            fontSize: 16,
            color: 'rgba(255, 255, 255, 0.4)',
            letterSpacing: '1px',
          }}
        >
          credi-red.vercel.app
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
