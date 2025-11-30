import { useState } from 'react'
import { Download, Check, CheckCircle, X } from 'lucide-react'
import { useGraphData } from "@/shared/hooks/useGraphData"
import { useGraphStore } from '@/lib/store/graphStore'
import JSZip from 'jszip'
import { generateGraphMLContent, generateGEXFContent } from "@/lib/utils/exporters/graphExporters"
import { generateReadme } from "@/lib/utils/exporters/readmeGenerator"

type TemplateType = 'complete' | 'graphs' | 'statistics' | 'academic'

interface ExportTemplate {
  id: TemplateType
  name: string
  description: string
  files: string[]
}

export function ExportPage() {
  // Acceder directamente al store en lugar de usar el hook
  const mentions = useGraphStore((state) => state.mentions)
  const cohashtags = useGraphStore((state) => state.cohashtags)
  const statistics = useGraphStore((state) => state.statistics)
  const urlAnalysis = useGraphStore((state) => state.urlAnalysis)
  const datasetMetadata = useGraphStore((state) => state.datasetMetadata)
  const rawData = useGraphStore((state) => state.rawData)
  const query = datasetMetadata?.query || 'dataset'

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('complete')
  const [isExporting, setIsExporting] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [exportedFileCount, setExportedFileCount] = useState(0)

  const hasData = mentions !== null || cohashtags !== null

  const templates: ExportTemplate[] = [
    {
      id: 'complete',
      name: 'Exportación Completa',
      description: 'Todos los grafos, estadísticas y métricas en todos los formatos disponibles',
      files: [
        'Grafo unificado (GraphML + GEXF)',
        'Grafos individuales (menciones + co-hashtags)',
        'Estadísticas completas (JSON)',
        'Excel maestro con 13 hojas',
        'CSV con todas las métricas',
        'README.txt con documentación'
      ]
    },
    {
      id: 'graphs',
      name: 'Solo Grafos (Gephi)',
      description: 'Archivos optimizados para visualización en Gephi/Cytoscape',
      files: [
        'Grafo unificado (GraphML)',
        'Grafo unificado (GEXF)',
        'Menciones (GraphML + GEXF)',
        'Co-hashtags (GraphML + GEXF)',
        'README.txt con guía de uso'
      ]
    },
    {
      id: 'statistics',
      name: 'Estadísticas y Métricas',
      description: 'Métricas de red y estadísticas en formatos procesables',
      files: [
        'Métricas de centralidad (CSV)',
        'Comunidades (Excel)',
        'Distribución de grados (CSV)',
        'Análisis temporal (Excel)',
        'Estadísticas completas (JSON)',
        'README.txt'
      ]
    },
    {
      id: 'academic',
      name: 'Dataset Académico',
      description: 'Exportación para investigación y publicaciones académicas',
      files: [
        'JSON completo raw (dataset original)',
        'Dataset procesado con métricas (JSON)',
        'Grafo unificado (GraphML)',
        'Metadata y metodología (TXT)',
        'README.txt con documentación'
      ]
    }
  ]

  const handleTemplateExport = async () => {
    if (!hasData || isExporting) return

    setIsExporting(true)

    try {
      const zip = new JSZip()
      const fileList: string[] = []
      const safeName = query.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)

      // Helper para añadir archivos al ZIP
      const addToZip = (filename: string, content: string) => {
        zip.file(filename, content)
        fileList.push(filename)
      }

      switch (selectedTemplate) {
        case 'complete':
        case 'graphs':
          // Grafos individuales
          if (mentions) {
            const graphmlContent = generateGraphMLContent(mentions, 'mentions')
            addToZip(`${safeName}_graphs_mentions.graphml`, graphmlContent)

            const gexfContent = generateGEXFContent(mentions, 'mentions')
            addToZip(`${safeName}_graphs_mentions.gexf`, gexfContent)
          }

          if (cohashtags) {
            const graphmlContent = generateGraphMLContent(cohashtags, 'cohashtags')
            addToZip(`${safeName}_graphs_cohashtags.graphml`, graphmlContent)

            const gexfContent = generateGEXFContent(cohashtags, 'cohashtags')
            addToZip(`${safeName}_graphs_cohashtags.gexf`, gexfContent)
          }

          // JSON solo para 'complete'
          if (selectedTemplate === 'complete') {
            if (mentions) {
              addToZip(`${safeName}_graphs_mentions_data.json`, JSON.stringify(mentions, null, 2))
            }
            if (cohashtags) {
              addToZip(`${safeName}_graphs_cohashtags_data.json`, JSON.stringify(cohashtags, null, 2))
            }
            if (statistics) {
              addToZip(`${safeName}_graphs_statistics.json`, JSON.stringify(statistics, null, 2))
            }
          }

          break

        case 'statistics':
          if (statistics) {
            addToZip(`${safeName}_graphs_statistics.json`, JSON.stringify(statistics, null, 2))
          }
          // TODO: Añadir CSV y Excel de estadísticas
          break

        case 'academic':
          // 1. JSON completo raw (dataset original sin procesar)
          if (rawData) {
            addToZip(`${safeName}_dataset_raw.json`, JSON.stringify(rawData, null, 2))
          }

          // 2. Dataset procesado con métricas
          const processedDataset = {
            metadata: datasetMetadata,
            mentions_graph: mentions,
            cohashtags_graph: cohashtags,
            statistics: statistics,
            url_analysis: urlAnalysis
          }
          addToZip(`${safeName}_dataset_processed.json`, JSON.stringify(processedDataset, null, 2))

          // 3. Grafo unificado (GraphML)
          console.log('[ExportPage] mentions object:', mentions)
          console.log('[ExportPage] mentions.nodes:', mentions?.nodes?.length)
          console.log('[ExportPage] mentions.edges:', mentions?.edges?.length)
          console.log('[ExportPage] First 3 edges:', mentions?.edges?.slice(0, 3))

          if (mentions) {
            const graphmlContent = generateGraphMLContent(mentions, 'mentions')
            addToZip(`${safeName}_graph_unified.graphml`, graphmlContent)
          }

          // 4. Metadata y metodología
          const methodologyContent = `DATASET ACADÉMICO - METADATA Y METODOLOGÍA
============================================

INFORMACIÓN DEL DATASET
-----------------------
Query: ${query}
Fecha de descarga: ${datasetMetadata?.downloadedAt || 'N/A'}
Tipo de búsqueda: ${datasetMetadata?.searchType || 'N/A'}
Modo: ${datasetMetadata?.mode || 'N/A'}

ESTRUCTURA DE ARCHIVOS
----------------------
1. ${safeName}_dataset_raw.json
   - JSON completo original sin procesar
   - Contiene todos los tweets tal como fueron descargados
   - Incluye replies, metadata de usuarios, y datos enriquecidos

2. ${safeName}_dataset_processed.json
   - Dataset procesado con todas las métricas calculadas
   - Incluye grafos de menciones y co-hashtags
   - Estadísticas completas y análisis de URLs

3. ${safeName}_graph_unified.graphml
   - Grafo unificado en formato GraphML
   - Compatible con Gephi, Cytoscape, NetworkX
   - Incluye todas las métricas de centralidad

MÉTRICAS INCLUIDAS
------------------
${mentions ? `- Nodos: ${mentions.nodes.length}
- Aristas: ${mentions.edges.length}
- Comunidades: ${statistics?.communities?.length || 'N/A'}
- Modularidad: ${statistics?.modularity?.toFixed(4) || 'N/A'}` : 'N/A'}

METODOLOGÍA
-----------
1. Recolección de datos: Twitter API / RapidAPI
2. Normalización: Formato unificado de tweets y usuarios
3. Enriquecimiento: Metadata adicional de usuarios
4. Construcción de grafos: Redes de menciones y co-hashtags
5. Análisis de comunidades: Algoritmo de Louvain
6. Métricas de centralidad: Betweenness, PageRank, Core Number
7. Detección de eventos: Análisis temporal de picos

CÓMO CITAR
----------
Si utilizas este dataset en una publicación académica, por favor cita:

[Tu nombre/institución]. (${new Date().getFullYear()}). ${query} Twitter Dataset.
Recuperado de GRAPHS Analytics Platform.
Fecha de descarga: ${datasetMetadata?.downloadedAt || 'N/A'}

CONTACTO Y LICENCIA
-------------------
Generado con GRAPHS Analytics Platform
Versión: 0.9.0
Licencia: [Tu licencia]
`
          addToZip(`${safeName}_methodology.txt`, methodologyContent)
          break
      }

      // Generar README
      const readmeContent = generateReadme({
        query,
        files: fileList,
        includeGraphs: selectedTemplate === 'complete' || selectedTemplate === 'graphs' || selectedTemplate === 'academic',
        includeStatistics: selectedTemplate === 'complete' || selectedTemplate === 'statistics' || selectedTemplate === 'academic',
        includeExcel: selectedTemplate === 'complete',
        includeCSV: selectedTemplate === 'complete' || selectedTemplate === 'statistics'
      })

      addToZip(`${safeName}_graphs_IMPORTANTE.txt`, readmeContent)

      // Generar y descargar ZIP
      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${safeName}_graphs_export.zip`
      link.click()
      URL.revokeObjectURL(url)

      setExportedFileCount(fileList.length)
      setShowSuccessPopup(true)
      setTimeout(() => setShowSuccessPopup(false), 4000)

    } catch (error) {
      console.error('Error durante la exportación:', error)
      alert('Error durante la exportación. Por favor, revisa la consola.')
    } finally {
      setIsExporting(false)
    }
  }

  if (!hasData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <p style={{ color: '#999', fontSize: '16px' }}>Carga un archivo JSON para ver las opciones de exportación</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px', color: '#111' }}>
          Exportar Datos
        </h1>
        <p style={{ color: '#666', fontSize: '14px' }}>
          Exporta tus datos en múltiples formatos. Query: "<strong>{query}</strong>"
        </p>
      </div>

      {/* Template Mode */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {templates.map(template => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                style={{
                  padding: '20px',
                  background: selectedTemplate === template.id ? '#000' : '#fff',
                  color: selectedTemplate === template.id ? '#fff' : '#000',
                  border: selectedTemplate === template.id ? '2px solid #000' : '2px solid #ddd',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (selectedTemplate !== template.id) {
                    e.currentTarget.style.borderColor = '#666'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedTemplate !== template.id) {
                    e.currentTarget.style.borderColor = '#ddd'
                  }
                }}
              >
                {selectedTemplate === template.id && (
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Check size={16} color="#000" />
                  </div>
                )}

                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  paddingRight: '32px'
                }}>
                  {template.name}
                </h3>

                <p style={{
                  fontSize: '13px',
                  opacity: 0.8,
                  lineHeight: '1.5',
                  marginBottom: '12px'
                }}>
                  {template.description}
                </p>

                <div style={{
                  fontSize: '12px',
                  opacity: 0.7,
                  borderTop: selectedTemplate === template.id ? '1px solid rgba(255,255,255,0.2)' : '1px solid #e5e7eb',
                  paddingTop: '12px',
                  marginTop: '8px'
                }}>
                  <strong>Incluye:</strong>
                  <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px', listStyle: 'disc' }}>
                    {template.files.map((file, idx) => (
                      <li key={idx} style={{ marginBottom: '2px' }}>{file}</li>
                    ))}
                  </ul>
                </div>
              </button>
            ))}
          </div>

          {/* Export Button */}
          <div style={{
            padding: '20px',
            background: '#f9f9f9',
            border: '1px solid #e5e7eb',
            borderRadius: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>
                  {templates.find(t => t.id === selectedTemplate)?.name}
                </h4>
                <p style={{ fontSize: '13px', color: '#666' }}>
                  {templates.find(t => t.id === selectedTemplate)?.files.length} archivos
                </p>
              </div>

              <button
                onClick={handleTemplateExport}
                disabled={isExporting}
                style={{
                  padding: '12px 24px',
                  background: isExporting ? '#ccc' : '#000',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isExporting ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Download size={16} />
                {isExporting ? 'Exportando...' : 'Exportar Plantilla'}
              </button>
            </div>
          </div>
        </div>

      {/* Success Popup */}
      {showSuccessPopup && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#fff',
          border: '2px solid #10b981',
          borderRadius: '8px',
          padding: '16px 20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 9999,
          minWidth: '300px',
          animation: 'slideIn 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
            <CheckCircle size={24} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111', marginBottom: '4px' }}>
                Exportación completada
              </h4>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                Se ha descargado 1 archivo ZIP con {exportedFileCount} archivos.
              </p>
            </div>
            <button
              onClick={() => setShowSuccessPopup(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: '#999',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
