import { useState } from 'react'
import { Link, ExternalLink, Eye, Download } from 'lucide-react'
import type { URLAnalysis, URLData } from '@/types/graph'
import { InfoModal } from '@/shared/components/InfoModal'
import { InfoButton } from '@/shared/components/InfoButton'
import { URLDetailsModal } from './URLDetailsModal'
import { ImagePreviewModal } from './ImagePreviewModal'
import { HashtagsModal } from './HashtagsModal'

interface URLsTableProps {
  urlAnalysis: URLAnalysis
}

export function URLsTable({ urlAnalysis }: URLsTableProps) {
  const [showInfo, setShowInfo] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [selectedUrl, setSelectedUrl] = useState<URLData | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [hashtagsModal, setHashtagsModal] = useState<{ hashtags: string[]; url: string } | null>(null)

  // Función para descargar todas las URLs como CSV
  const handleDownloadAllUrls = () => {
    if (sortedUrls.length === 0) {
      alert('No hay URLs disponibles para descargar')
      return
    }

    const csvRows = []
    csvRows.push(['posicion', 'url', 'veces_compartido', 'usuarios_unicos', 'usuarios_que_comparten', 'tiene_hashtags', 'hashtags'].join(','))

    sortedUrls.forEach((item, idx) => {
      const usuarios = item.users?.map(u => typeof u === 'string' ? u : u.username).join(';') || ''
      const hashtags = item.hashtags?.join(';') || ''
      csvRows.push([
        idx + 1,
        `"${item.url}"`,
        item.count,
        item.uniqueUsers || 0,
        `"${usuarios}"`,
        item.hasHashtags ? 'si' : 'no',
        `"${hashtags}"`
      ].join(','))
    })

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `urls_compartidas_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // Función para detectar si una URL es una imagen
  const isImageUrl = (url: string): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
    const lowerUrl = url.toLowerCase()
    return imageExtensions.some(ext => lowerUrl.includes(ext)) ||
           lowerUrl.includes('pbs.twimg.com') ||
           lowerUrl.includes('/img/') ||
           lowerUrl.includes('/image/')
  }

  const sortedUrls = (urlAnalysis.topUrls || [])
    .sort((a, b) => b.count - a.count)

  const displayUrls = showAll ? sortedUrls : sortedUrls.slice(0, 5)

  // Calcular KPIs
  const totalUrls = sortedUrls.length
  const totalShares = sortedUrls.reduce((sum, item) => sum + item.count, 0)
  const avgSharesPerUrl = totalUrls > 0 ? totalShares / totalUrls : 0

  if (sortedUrls.length === 0) {
    return (
      <div className="chart-card">
        <h3 className="chart-title">
          <Link style={{ display: 'inline', width: 20, height: 20, marginRight: 8 }} />
          URLs Más Compartidas
        </h3>
        <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
          No hay URLs compartidas disponibles
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="chart-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="chart-title" style={{ margin: 0 }}>
            <Link style={{ display: 'inline', width: 20, height: 20, marginRight: 8 }} />
            URLs Más Compartidas
            <InfoButton onClick={() => setShowInfo(true)} />
          </h3>
          <button
            onClick={handleDownloadAllUrls}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              background: '#333',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#1f2937'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#333'}
          >
            <Download size={16} />
            Descargar Todas (CSV)
          </button>
        </div>

        {/* KPIs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            padding: '16px',
            background: '#f8f9fa',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
              URLs únicas
            </div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333' }}>
              {totalUrls.toLocaleString()}
            </div>
          </div>

          <div style={{
            padding: '16px',
            background: '#f8f9fa',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
              Comparticiones totales
            </div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333' }}>
              {totalShares.toLocaleString()}
            </div>
          </div>

          <div style={{
            padding: '16px',
            background: '#f8f9fa',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
              Promedio por URL
            </div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333' }}>
              {avgSharesPerUrl.toFixed(1)}
            </div>
          </div>
        </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px'
        }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #000' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>#</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>URL</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>Veces</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>Usuarios</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>Hashtags</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}></th>
            </tr>
          </thead>
          <tbody>
            {displayUrls.map((item, idx) => {
              return (
                <tr key={idx} style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#666' }}>
                    {idx + 1}
                  </td>
                  <td
                    style={{
                      padding: '12px',
                      maxWidth: '400px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: '#0066cc',
                        textDecoration: 'none'
                      }}
                      title={item.url}
                    >
                      {item.url}
                    </a>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>
                    {item.count.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {item.users && item.users.length > 0 ? (
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '4px',
                        maxWidth: '300px',
                        justifyContent: 'center'
                      }}>
                        {item.users.slice(0, 5).map((user, userIdx) => {
                          const username = typeof user === 'string' ? user : (user?.username || 'unknown')
                          if (!username) return null
                          return (
                            <a
                              key={userIdx}
                              href={`https://twitter.com/${username}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-block',
                                padding: '4px 8px',
                                background: '#e3f2fd',
                                color: '#1976d2',
                                borderRadius: '4px',
                                fontSize: '11px',
                                textDecoration: 'none',
                                fontWeight: 500,
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#1976d2'
                                e.currentTarget.style.color = '#fff'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#e3f2fd'
                                e.currentTarget.style.color = '#1976d2'
                              }}
                            >
                              @{username}
                            </a>
                          )
                        }).filter(Boolean)}
                        {item.users.length > 5 && (
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 8px',
                            background: '#f5f5f5',
                            color: '#666',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 500
                          }}>
                            +{item.users.length - 5}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: '#999', fontSize: '12px' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {item.hasHashtags ? (
                      <button
                        onClick={() => setHashtagsModal({ hashtags: item.hashtags || [], url: item.url })}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#0066cc',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: 500,
                          textDecoration: 'underline',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f0f9ff'
                          e.currentTarget.style.color = '#0047b3'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = '#0066cc'
                        }}
                        title="Ver hashtags"
                      >
                        ✓ {item.hashtags?.length || 0}
                      </button>
                    ) : (
                      <span style={{ color: '#999' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      justifyContent: 'center',
                      minWidth: '120px' // Ancho fijo para mantener alineación
                    }}>
                      {/* Botón de vista previa de imagen - ocupa espacio fijo */}
                      <div style={{ width: '32px', flexShrink: 0 }}>
                        {isImageUrl(item.url) && (
                          <button
                            onClick={() => setPreviewImage(item.url)}
                            style={{
                              width: '32px',
                              height: '32px',
                              padding: '0',
                              background: '#000',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'background 0.2s'
                            }}
                            title="Ver imagen"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#333'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#000'
                            }}
                          >
                            <Eye size={16} />
                          </button>
                        )}
                      </div>

                      {/* Botón Ver más - siempre visible */}
                      <button
                        onClick={() => setSelectedUrl(item)}
                        style={{
                          padding: '6px 12px',
                          background: '#000',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#333'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#000'
                        }}
                      >
                        Ver más
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {!showAll && sortedUrls.length > 5 && (
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button
            onClick={() => setShowAll(true)}
            style={{
              padding: '10px 20px',
              background: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#eee'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f5f5f5'
            }}
          >
            Ver más ({sortedUrls.length - 5} URLs adicionales)
          </button>
        </div>
      )}
    </div>

    {selectedUrl && (
      <URLDetailsModal
        urlData={selectedUrl}
        onClose={() => setSelectedUrl(null)}
      />
    )}

    {previewImage && (
      <ImagePreviewModal
        imageUrl={previewImage}
        onClose={() => setPreviewImage(null)}
      />
    )}

    {hashtagsModal && (
      <HashtagsModal
        hashtags={hashtagsModal.hashtags}
        urlPreview={hashtagsModal.url}
        onClose={() => setHashtagsModal(null)}
      />
    )}

    <InfoModal
      isOpen={showInfo}
      onClose={() => setShowInfo(false)}
      title="URLs Más Compartidas"
    >
      <h4 style={{ marginTop: 0, marginBottom: '12px' }}>¿Qué mide esta métrica?</h4>
      <p>Esta métrica identifica las <strong>URLs más compartidas</strong> en la conversación analizada, ordenadas por frecuencia de compartición. Permite identificar qué contenido externo (artículos, videos, documentos, imágenes) está siendo difundido en la red y qué fuentes de información son más influyentes.</p>
      <p>El análisis de URLs compartidas es fundamental para comprender el <strong>ecosistema informativo</strong> de una conversación y detectar fuentes de noticias, desinformación o propaganda.</p>

      <h4 style={{ marginBottom: '12px' }}>Extracción y procesamiento</h4>
      <p>El sistema analiza cada tweet para extraer y normalizar las URLs:</p>
      <ol style={{ marginLeft: '20px', lineHeight: 1.8 }}>
        <li><strong>Detección de URLs:</strong> Se buscan patrones que comiencen con http://, https://, o dominios sin protocolo</li>
        <li><strong>Expansión de URLs acortadas:</strong> Servicios como bit.ly, t.co, goo.gl se expanden a su URL original cuando es posible</li>
        <li><strong>Normalización:</strong> Se eliminan parámetros de tracking (utm_source, fbclid, etc.) para agrupar URLs equivalentes</li>
        <li><strong>Agregación:</strong> Se cuenta cuántas veces aparece cada URL única en el corpus</li>
        <li><strong>Clasificación por dominio:</strong> Se extrae el nombre de dominio para identificar las fuentes</li>
      </ol>

      <h4 style={{ marginBottom: '12px' }}>¿Por qué es importante?</h4>
      <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
        <li><strong>Identificación de fuentes:</strong> Revela qué medios de comunicación, blogs o sitios web son más citados en la conversación</li>
        <li><strong>Detección de desinformación:</strong> URLs de sitios poco confiables o conocidos por difundir fake news pueden ser identificadas</li>
        <li><strong>Análisis de campañas:</strong> URLs compartidas masivamente pueden indicar campañas coordinadas de difusión</li>
        <li><strong>Validación de narrativas:</strong> Permite verificar qué evidencia documental se usa para sustentar afirmaciones</li>
        <li><strong>Mapeo del ecosistema mediático:</strong> Muestra qué medios tienen mayor influencia en diferentes comunidades</li>
      </ul>

      <h4 style={{ marginBottom: '12px' }}>Algoritmo de conteo</h4>
      <p>Para cada tweet del dataset:</p>
      <p style={{ background: '#f5f5f5', padding: '16px', borderRadius: '6px', margin: '16px 0' }}>
        Comparticiones<sub>URL</sub> = Σ apariciones en todos los tweets
      </p>
      <p style={{ fontSize: '13px' }}>
        Las URLs se almacenan en una estructura de datos tipo diccionario (hash map) donde la clave es la URL normalizada y el valor es el contador de apariciones. Finalmente se ordenan en orden descendente.
      </p>

      <h4 style={{ marginBottom: '12px' }}>Interpretación por tipo de fuente</h4>
      <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
        <li><strong>Medios mainstream:</strong> URLs de periódicos tradicionales (elpais.com, nytimes.com) indican conversaciones informadas por medios establecidos</li>
        <li><strong>Medios alternativos:</strong> Blogs, sitios independientes pueden indicar narrativas contra-hegemónicas</li>
        <li><strong>Redes sociales:</strong> Enlaces a Facebook, Instagram, TikTok muestran contenido viral multiplataforma</li>
        <li><strong>YouTube:</strong> Alta presencia de videos sugiere conversación visual y posiblemente emocional</li>
        <li><strong>Documentos oficiales:</strong> PDFs gubernamentales, papers académicos indican conversación técnica o de advocacy</li>
        <li><strong>Sitios sospechosos:</strong> Dominios poco conocidos o con historial de desinformación requieren verificación</li>
      </ul>

      <h4 style={{ marginBottom: '12px' }}>Limitaciones metodológicas</h4>
      <p style={{ fontSize: '13px', color: '#666', background: '#fffbf0', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #f59e0b' }}>
        <strong>Consideraciones:</strong>
      </p>
      <ul style={{ marginLeft: '20px', fontSize: '13px', color: '#666', lineHeight: 1.8 }}>
        <li>URLs acortadas no siempre pueden expandirse si el servicio no proporciona API pública</li>
        <li>Una misma noticia puede estar publicada en múltiples URLs (versiones móviles, AMP, etc.)</li>
        <li>El alto volumen de compartición <strong>no valida</strong> la veracidad del contenido</li>
        <li>Requiere análisis manual del contenido de las URLs más compartidas para contextualización completa</li>
      </ul>

      <h4 style={{ marginBottom: '12px' }}>Visualización</h4>
      <p>La tabla muestra inicialmente las <strong>5 URLs más compartidas</strong>. Se incluye el dominio extraído, la cantidad de veces compartida, y un botón para abrir la URL en una nueva pestaña. Si hay más URLs disponibles, se muestra un botón "Ver más" para expandir la lista completa.</p>
    </InfoModal>
    </>
  )
}
