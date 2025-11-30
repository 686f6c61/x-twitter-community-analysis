import { useState } from 'react'
import { Database, Calendar, Hash, FileText, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { useGraphStore } from '@/lib/store/graphStore'
import { InfoModal } from './InfoModal'

export function DatasetMetadataCard() {
  const datasetMetadata = useGraphStore((state) => state.datasetMetadata)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  if (!datasetMetadata) return null

  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateShort = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const searchTypeLabels: Record<string, string> = {
    'Latest': 'Más recientes',
    'Top': 'Top tweets',
    'People': 'Perfiles',
    'Photos': 'Con fotos',
    'Videos': 'Con videos'
  }

  return (
    <>
      <InfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} title="Información del Dataset">
        <div style={{ fontSize: '14px', lineHeight: '1.7', color: '#333' }}>
          <h4 style={{ fontSize: '15px', fontWeight: '600', marginTop: '0', marginBottom: '12px' }}>Contexto del Análisis</h4>
          <p>Esta sección proporciona información esencial sobre el origen y características del dataset analizado.</p>

          <h4 style={{ fontSize: '14px', fontWeight: '600', marginTop: '16px', marginBottom: '8px' }}>Query de Búsqueda</h4>
          <p style={{ fontSize: '13px' }}>
            La query utilizada para descargar los datos de Twitter/X. Incluye el tipo de búsqueda aplicado
            (Latest, Top, People, Photos, Videos) que determina el algoritmo de selección de tweets.
          </p>

          <h4 style={{ fontSize: '14px', fontWeight: '600', marginTop: '16px', marginBottom: '8px' }}>Fecha de Descarga</h4>
          <p style={{ fontSize: '13px' }}>
            Momento exacto en que se recolectaron los datos. Importante para contextualizar los resultados
            temporalmente y entender limitaciones de acceso histórico a la plataforma.
          </p>

          <h4 style={{ fontSize: '14px', fontWeight: '600', marginTop: '16px', marginBottom: '8px' }}>Volumen de Datos</h4>
          <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '6px', marginBottom: '12px', border: '1px solid #ddd' }}>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
              <li><strong>Main Tweets:</strong> Tweets originales que coinciden con la query de búsqueda</li>
              <li><strong>Replies:</strong> Respuestas a esos tweets principales (si se recolectaron)</li>
              <li><strong>Items totales:</strong> Suma de tweets principales + respuestas</li>
            </ul>
          </div>

          <h4 style={{ fontSize: '14px', fontWeight: '600', marginTop: '16px', marginBottom: '8px' }}>Periodo Temporal</h4>
          <p style={{ fontSize: '13px' }}>
            Rango de fechas cubierto por los tweets del dataset. Este periodo determina:
          </p>
          <ul style={{ marginTop: '8px', paddingLeft: '20px', fontSize: '13px' }}>
            <li>Ventana temporal de análisis</li>
            <li>Posibles eventos o tendencias capturadas</li>
            <li>Limitaciones de representatividad temporal</li>
          </ul>

          <div style={{ marginTop: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '6px', fontSize: '13px', border: '1px solid #999' }}>
            <strong>Importante:</strong> Este análisis se basa en una muestra limitada de datos.
            Los resultados son orientativos y deben interpretarse considerando el periodo temporal y la query de búsqueda utilizados.
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
            <Database size={20} />
            <h3 className="chart-title" style={{ margin: 0 }}>Información del Dataset</h3>
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
              title="Ver información sobre el dataset"
            >
              <Info size={14} />
            </button>
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>

      {isExpanded && (
        <div style={{ marginTop: '16px' }}>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
        {/* Query de búsqueda */}
        <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
          <div style={{
            background: '#f0f0f0',
            padding: '8px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FileText size={18} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Query de búsqueda</div>
            <div style={{ fontSize: '16px', fontWeight: '600' }}>"{datasetMetadata.query}"</div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
              {searchTypeLabels[datasetMetadata.searchType] || datasetMetadata.searchType}
            </div>
          </div>
        </div>

        {/* Fecha de descarga */}
        <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
          <div style={{
            background: '#f0f0f0',
            padding: '8px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Calendar size={18} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Descargado</div>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>
              {formatDate(datasetMetadata.downloadedAt)}
            </div>
          </div>
        </div>

        {/* Volumen de datos */}
        <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
          <div style={{
            background: '#f0f0f0',
            padding: '8px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Hash size={18} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Volumen</div>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>
              {datasetMetadata.totalMainTweets} tweets + {datasetMetadata.totalReplies} respuestas
            </div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
              {datasetMetadata.totalItems} items totales
            </div>
          </div>
        </div>

        {/* Periodo temporal */}
        {datasetMetadata.dateRange && (
          <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
            <div style={{
              background: '#f0f0f0',
              padding: '8px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Calendar size={18} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Periodo temporal</div>
              <div style={{ fontSize: '14px', fontWeight: '600' }}>
                {formatDateShort(datasetMetadata.dateRange.start)}
              </div>
              <div style={{ fontSize: '12px', color: '#999' }}>
                hasta {formatDateShort(datasetMetadata.dateRange.end)}
              </div>
              <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                {(() => {
                  const start = new Date(datasetMetadata.dateRange.start)
                  const end = new Date(datasetMetadata.dateRange.end)
                  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
                  return `${days} día${days !== 1 ? 's' : ''} de datos`
                })()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Nota contextual */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: '#f5f5f5',
        border: '1px solid #999',
        borderRadius: '6px',
        fontSize: '13px',
        color: '#333',
        lineHeight: '1.6'
      }}>
        <strong>Contexto del análisis:</strong> Este análisis se basa en una muestra limitada de datos.
        Los resultados son orientativos y deben interpretarse considerando el periodo temporal y la query de búsqueda utilizados.
      </div>
        </div>
      )}
      </div>
    </>
  )
}
