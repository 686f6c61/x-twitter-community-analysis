import { GitBranch } from 'lucide-react'

export function GraphsAnalyticsHeader() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
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
        <GitBranch size={28} />
        GRAPHS Analytics
      </h2>
      <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
        Análisis de comunidades, estructuras de red y patrones de interacción
      </p>
    </div>
  )
}
