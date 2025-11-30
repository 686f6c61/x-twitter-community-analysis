import { Network } from 'lucide-react'

export function CommunityMetrics() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      padding: '24px',
      borderRadius: '12px',
      color: 'white'
    }}>
      <h2 style={{
        margin: 0,
        fontSize: '24px',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <Network size={28} />
        Métricas ARS
      </h2>
      <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
        Análisis de Redes Sociales - Métricas de grafos de menciones y co-hashtags
      </p>
    </div>
  )
}
