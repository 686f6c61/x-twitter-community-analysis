import { useState } from 'react'
import { AlertTriangle, CheckCircle, Info, ChevronDown, ChevronUp } from 'lucide-react'
import { useDataQualityMetrics } from '@/shared/hooks/useDataQualityMetrics'
import { InfoModal } from './InfoModal'

export function DataQualityWarnings() {
  const metrics = useDataQualityMetrics()
  const [isExpanded, setIsExpanded] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  if (!metrics) return null

  // Define thresholds for warnings
  const THRESHOLDS = {
    noEngagement: 30, // More than 30% tweets without engagement
    lowEngagement: 50, // More than 50% tweets with low engagement
    isolated: 40, // More than 40% users without mentions
    singleTweet: 60, // More than 60% users with single tweet
  }

  const warnings: Array<{
    severity: 'high' | 'medium' | 'low'
    title: string
    message: string
  }> = []

  // Check engagement warnings
  if (metrics.tweetsWithoutEngagementPercentage > THRESHOLDS.noEngagement) {
    warnings.push({
      severity: 'high',
      title: 'Bajo engagement detectado',
      message: `${metrics.tweetsWithoutEngagementPercentage.toFixed(1)}% de los usuarios no tienen ninguna interacción (likes, retweets, replies). Esto puede indicar bots, spam, o contenido de baja calidad.`
    })
  }

  if (metrics.tweetsWithLowEngagementPercentage > THRESHOLDS.lowEngagement) {
    warnings.push({
      severity: 'medium',
      title: 'Engagement limitado',
      message: `${metrics.tweetsWithLowEngagementPercentage.toFixed(1)}% de los usuarios tienen menos de 5 interacciones totales. El dataset puede contener muchos usuarios con poca actividad.`
    })
  }

  // Check isolation warnings
  if (metrics.usersWithoutMentionsPercentage > THRESHOLDS.isolated) {
    warnings.push({
      severity: 'high',
      title: 'Alta proporción de usuarios aislados',
      message: `${metrics.usersWithoutMentionsPercentage.toFixed(1)}% de los usuarios no mencionan a nadie. Esto puede fragmentar el grafo y limitar el análisis de comunidades.`
    })
  }

  // Check activity warnings
  if (metrics.usersWithSingleTweetPercentage > THRESHOLDS.singleTweet) {
    warnings.push({
      severity: 'medium',
      title: 'Baja actividad de usuarios',
      message: `${metrics.usersWithSingleTweetPercentage.toFixed(1)}% de los usuarios solo tienen 1 tweet en el dataset. Esto puede indicar una muestra temporal limitada o usuarios ocasionales.`
    })
  }

  // Add quality summary
  const qualityMessage = {
    excellent: 'El dataset presenta excelente calidad para análisis académico. Las métricas de engagement y conectividad son sólidas.',
    good: 'El dataset tiene buena calidad general. Algunas limitaciones menores pueden afectar ciertos análisis.',
    fair: 'El dataset presenta calidad aceptable pero tiene limitaciones significativas. Interpretar resultados con precaución.',
    poor: 'El dataset tiene calidad limitada. Los resultados deben interpretarse con extrema precaución debido a múltiples problemas de calidad.'
  }

  warnings.unshift({
    severity: metrics.qualityLevel === 'excellent' || metrics.qualityLevel === 'good' ? 'low' :
             metrics.qualityLevel === 'fair' ? 'medium' : 'high',
    title: `Calidad del dataset: ${metrics.qualityScore}/100 (${metrics.qualityLevel === 'excellent' ? 'Excelente' : metrics.qualityLevel === 'good' ? 'Buena' : metrics.qualityLevel === 'fair' ? 'Aceptable' : 'Limitada'})`,
    message: qualityMessage[metrics.qualityLevel]
  })

  // If no warnings, don't show the component
  if (warnings.length === 1 && metrics.qualityLevel === 'excellent') {
    return null
  }

  return (
    <>
      <InfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} title="Métricas de Calidad del Dataset">
        <div style={{ fontSize: '14px', lineHeight: '1.7', color: '#333' }}>
          <h4 style={{ fontSize: '15px', fontWeight: '600', marginTop: '0', marginBottom: '12px' }}>Puntuación de Calidad</h4>
          <p>El sistema calcula una puntuación de 0 a 100 basada en cuatro factores clave:</p>

          <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '6px', marginBottom: '16px', border: '1px solid #ddd' }}>
            <strong>Score = 100 - (P₁×0.3 + P₂×0.2 + P₃×0.25 + P₄×0.25)</strong>
            <ul style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px', fontSize: '13px' }}>
              <li><strong>P₁:</strong> % tweets sin ninguna interacción (peso 30%)</li>
              <li><strong>P₂:</strong> % tweets con menos de 5 interacciones (peso 20%)</li>
              <li><strong>P₃:</strong> % usuarios sin menciones (peso 25%)</li>
              <li><strong>P₄:</strong> % usuarios con un solo tweet (peso 25%)</li>
            </ul>
          </div>

          <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px' }}>Tasa de Engagement</h4>
          <p>Mide la proporción de interacciones respecto a las visualizaciones:</p>

          <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '6px', marginBottom: '16px', border: '1px solid #ddd' }}>
            <strong>Engagement Rate = (Likes + Retweets + Replies) / Views</strong>
            <p style={{ fontSize: '13px', margin: '8px 0 0 0' }}>
              Se calcula tanto la media como la mediana para detectar outliers y distribuciones asimétricas.
            </p>
          </div>

          <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px' }}>Umbrales de Advertencia</h4>
          <ul style={{ marginTop: 0, paddingLeft: '20px', fontSize: '13px' }}>
            <li><strong>Sin engagement:</strong> &gt;30% tweets sin interacciones</li>
            <li><strong>Bajo engagement:</strong> &gt;50% tweets con &lt;5 interacciones</li>
            <li><strong>Usuarios aislados:</strong> &gt;40% usuarios sin menciones</li>
            <li><strong>Baja actividad:</strong> &gt;60% usuarios con 1 solo tweet</li>
          </ul>

          <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px', marginTop: '16px' }}>Niveles de Calidad</h4>
          <ul style={{ marginTop: 0, paddingLeft: '20px', fontSize: '13px' }}>
            <li><strong>Excelente (≥80):</strong> Dataset óptimo para análisis académico</li>
            <li><strong>Buena (60-79):</strong> Calidad general aceptable con limitaciones menores</li>
            <li><strong>Aceptable (40-59):</strong> Calidad limitada, interpretar con precaución</li>
            <li><strong>Limitada (&lt;40):</strong> Múltiples problemas de calidad significativos</li>
          </ul>

          <div style={{ marginTop: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '6px', fontSize: '13px', border: '1px solid #999' }}>
            <strong>Nota académica:</strong> Estas métricas están basadas en estándares de calidad de datos de redes sociales.
            Las advertencias son indicativas y deben interpretarse en el contexto del fenómeno estudiado.
          </div>
        </div>
      </InfoModal>

      <div className="chart-card" style={{ marginBottom: '24px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            userSelect: 'none'
          }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={20} />
            <h3 className="chart-title" style={{ margin: 0 }}>Calidad y Validación del Dataset</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowInfo(true)
              }}
              style={{
                background: 'none',
                border: '1px solid #999',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#333',
                padding: 0
              }}
              title="Ver información sobre las métricas"
            >
              <Info size={14} />
            </button>
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>

      {isExpanded && (
        <div style={{ marginTop: '16px' }}>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {warnings.map((warning, index) => {
          const bgColor = warning.severity === 'high' ? '#e0e0e0' :
                         warning.severity === 'low' ? '#f5f5f5' : '#ebebeb'
          const borderColor = warning.severity === 'high' ? '#666' :
                             warning.severity === 'low' ? '#ccc' : '#999'
          const textColor = '#333'

          const Icon = warning.severity === 'high' ? AlertTriangle :
                      warning.severity === 'low' ? CheckCircle : Info

          return (
            <div
              key={index}
              style={{
                padding: '12px',
                background: bgColor,
                border: `1px solid ${borderColor}`,
                borderRadius: '6px',
                display: 'flex',
                gap: '12px',
                alignItems: 'start'
              }}
            >
              <Icon size={18} style={{ color: '#333', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '14px', color: textColor, marginBottom: '4px' }}>
                  {warning.title}
                </div>
                <div style={{ fontSize: '13px', color: textColor, lineHeight: '1.5' }}>
                  {warning.message}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Metrics summary */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: '#f5f5f5',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#333',
        border: '1px solid #ddd'
      }}>
        <strong>Resumen estadístico:</strong>
        <ul style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px' }}>
          <li>Tasa promedio de engagement: {(metrics.avgEngagementRate * 100).toFixed(3)}%</li>
          <li>Tasa mediana de engagement: {(metrics.medianEngagementRate * 100).toFixed(3)}%</li>
          <li>Total de usuarios analizados: {metrics.totalUsers}</li>
          <li>Total de tweets en dataset: {metrics.totalTweets}</li>
        </ul>
      </div>
        </div>
      )}
      </div>
    </>
  )
}
