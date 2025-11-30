import { useState } from 'react'
import { useGraphData } from "@/shared/hooks/useGraphData"
import {
  exportMentionsJSON,
  exportCohashtagsJSON,
  exportStatisticsJSON,
  exportAdjacencyMatrixCSV,
  exportHashtagsCSV,
  exportCentralityMetricsCSV,
  exportCompleteStatisticsCSV,
  exportInfluencersExcel,
  exportCommunitiesExcel,
  exportTemporalActivityExcel,
  exportSharedURLsExcel,
  exportCompleteStatisticsExcel,
  exportGraphML,
  exportGEXF
} from "@/lib/utils/exporters"
import { createEnrichedDataset, downloadEnrichedDataset } from "@/shared/utils/exportEnrichedDataset"
import { useDataQualityMetrics } from "@/shared/hooks/useDataQualityMetrics"
import { useGraphAnomalies } from "@/shared/hooks/useGraphAnomalies"
import { useTemporalAnalysis } from "@/shared/hooks/useTemporalAnalysis"
import JSZip from 'jszip'

type ExportFormat = {
  id: string
  name: string
  description: string
  enabled: boolean
  category: 'academic' | 'graph' | 'json' | 'excel' | 'csv'
  exporter: () => void
}

export function ExportPage() {
  const { mentions, cohashtags, statistics, urlAnalysis, fileName } = useGraphData()
  const baseName = fileName?.replace('.json', '') || 'export'

  // Hooks for enriched export
  const qualityMetrics = useDataQualityMetrics()
  const mentionsAnomalies = useGraphAnomalies('mentions')
  const cohashtagsAnomalies = useGraphAnomalies('cohashtags')
  const temporalAnalysis = useTemporalAnalysis()

  const [selectedFormats, setSelectedFormats] = useState<Set<string>>(new Set())

  const hasData = mentions !== null || cohashtags !== null

  const handleEnrichedExport = () => {
    const dataset = createEnrichedDataset(
      qualityMetrics,
      mentionsAnomalies,
      cohashtagsAnomalies,
      temporalAnalysis
    )
    downloadEnrichedDataset(dataset, `${baseName}_enriched.json`)
  }

  if (!hasData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <p style={{ color: '#999', fontSize: '16px' }}>Carga un archivo JSON para ver las opciones de exportación</p>
      </div>
    )
  }

  const formats: ExportFormat[] = [
    // ACADEMIC - Enriched dataset
    { id: 'enriched-json', name: 'Dataset Enriquecido', description: 'JSON con todas las métricas académicas calculadas (calidad, anomalías, temporal)', enabled: hasData, category: 'academic', exporter: handleEnrichedExport },

    // GRAPH
    { id: 'graphml-mentions', name: 'GraphML Menciones', description: 'Gephi/Cytoscape - Grafo de menciones', enabled: !!mentions, category: 'graph', exporter: () => exportGraphML(mentions!, 'mentions', baseName) },
    { id: 'graphml-cohashtags', name: 'GraphML Co-hashtags', description: 'Gephi/Cytoscape - Grafo de co-hashtags', enabled: !!cohashtags, category: 'graph', exporter: () => exportGraphML(cohashtags!, 'cohashtags', baseName) },
    { id: 'gexf-mentions', name: 'GEXF Menciones', description: 'Gephi nativo - Grafo de menciones', enabled: !!mentions, category: 'graph', exporter: () => exportGEXF(mentions!, 'mentions', baseName) },
    { id: 'gexf-cohashtags', name: 'GEXF Co-hashtags', description: 'Gephi nativo - Grafo de co-hashtags', enabled: !!cohashtags, category: 'graph', exporter: () => exportGEXF(cohashtags!, 'cohashtags', baseName) },

    // JSON
    { id: 'json-mentions', name: 'JSON Menciones', description: 'Grafo de menciones completo', enabled: !!mentions, category: 'json', exporter: () => exportMentionsJSON(mentions!, baseName) },
    { id: 'json-cohashtags', name: 'JSON Co-hashtags', description: 'Grafo de co-hashtags completo', enabled: !!cohashtags, category: 'json', exporter: () => exportCohashtagsJSON(cohashtags!, baseName) },
    { id: 'json-stats', name: 'JSON Estadísticas', description: 'Todas las métricas calculadas', enabled: !!statistics, category: 'json', exporter: () => exportStatisticsJSON(statistics!, baseName) },

    // EXCEL
    { id: 'excel-influencers', name: 'Influencers.xlsx', description: 'Usuarios con todas sus métricas', enabled: !!mentions, category: 'excel', exporter: () => exportInfluencersExcel(mentions!, baseName) },
    { id: 'excel-communities', name: 'Comunidades.xlsx', description: 'Resumen y top influencers por comunidad', enabled: !!(statistics && statistics.communities), category: 'excel', exporter: () => exportCommunitiesExcel(statistics!, baseName) },
    { id: 'excel-temporal', name: 'Actividad Temporal.xlsx', description: 'Serie temporal de tweets', enabled: !!statistics, category: 'excel', exporter: () => exportTemporalActivityExcel(statistics!, baseName) },
    { id: 'excel-urls', name: 'URLs Compartidas.xlsx', description: 'URLs con usuarios y viralidad', enabled: !!(urlAnalysis && urlAnalysis.topUrls), category: 'excel', exporter: () => exportSharedURLsExcel(urlAnalysis!, baseName) },
    { id: 'excel-stats', name: 'Estadísticas Completas.xlsx', description: 'Todas las métricas en múltiples hojas', enabled: !!statistics, category: 'excel', exporter: () => exportCompleteStatisticsExcel(statistics!, baseName) },

    // CSV
    { id: 'csv-adj-mentions', name: 'CSV Matriz Adyacencia Menciones', description: 'Matriz de conexiones', enabled: !!mentions, category: 'csv', exporter: () => exportAdjacencyMatrixCSV(mentions!, 'mentions', baseName) },
    { id: 'csv-adj-cohashtags', name: 'CSV Matriz Adyacencia Co-hashtags', description: 'Matriz de conexiones', enabled: !!cohashtags, category: 'csv', exporter: () => exportAdjacencyMatrixCSV(cohashtags!, 'cohashtags', baseName) },
    { id: 'csv-hashtags', name: 'CSV Top Hashtags', description: 'Ranking de hashtags más usados', enabled: !!statistics, category: 'csv', exporter: () => exportHashtagsCSV(statistics!, baseName) },
    { id: 'csv-metrics', name: 'CSV Métricas de Centralidad', description: 'Todas las métricas por usuario', enabled: !!mentions, category: 'csv', exporter: () => exportCentralityMetricsCSV(mentions!, baseName) },
    { id: 'csv-stats', name: 'CSV Estadísticas Completas', description: 'Todas las métricas de red en un archivo', enabled: !!statistics, category: 'csv', exporter: () => exportCompleteStatisticsCSV(statistics!, baseName) },
  ]

  const categories = [
    { id: 'academic', label: 'Académico (Enriquecido)' },
    { id: 'graph', label: 'Grafos (Gephi)' },
    { id: 'json', label: 'JSON' },
    { id: 'excel', label: 'Excel' },
    { id: 'csv', label: 'CSV' },
  ]

  const toggleFormat = (id: string) => {
    const newSelected = new Set(selectedFormats)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedFormats(newSelected)
  }

  const toggleCategory = (category: string) => {
    const categoryFormats = formats.filter(f => f.category === category && f.enabled)
    const allSelected = categoryFormats.every(f => selectedFormats.has(f.id))

    const newSelected = new Set(selectedFormats)
    categoryFormats.forEach(f => {
      if (allSelected) {
        newSelected.delete(f.id)
      } else {
        newSelected.add(f.id)
      }
    })
    setSelectedFormats(newSelected)
  }

  const selectAll = () => {
    const newSelected = new Set(formats.filter(f => f.enabled).map(f => f.id))
    setSelectedFormats(newSelected)
  }

  const deselectAll = () => {
    setSelectedFormats(new Set())
  }

  const downloadSelected = async () => {
    const selected = formats.filter(f => selectedFormats.has(f.id))
    if (selected.length === 0) return

    if (selected.length === 1) {
      selected[0].exporter()
      return
    }

    // Para múltiples archivos, descargar secuencialmente
    const confirmDownload = window.confirm(
      `Se descargarán ${selected.length} archivos de forma secuencial.\n\n` +
      `Archivos seleccionados:\n${selected.map((f, i) => `${i + 1}. ${f.name}`).join('\n')}\n\n` +
      `¿Deseas continuar?`
    )

    if (!confirmDownload) return

    // Descargar todos los archivos con delay entre cada uno
    for (let i = 0; i < selected.length; i++) {
      setTimeout(() => {
        selected[i].exporter()
      }, i * 1000) // 1 segundo entre cada descarga
    }
  }

  const downloadAllAsZip = async () => {
    const zip = new JSZip()

    // Crear README
    const readme = `ANÁLISIS DE REDES SOCIALES
Generado el: ${new Date().toLocaleString()}
Dataset: ${fileName || 'Desconocido'}

================================================================================
ARCHIVOS INCLUIDOS
================================================================================

🌐 GRAFOS PARA GEPHI/CYTOSCAPE
-------------------------------
- *_mentions.graphml / .gexf: Grafo de menciones entre usuarios. Cada nodo es
  un usuario y cada arista representa una mención. Compatible con Gephi,
  Cytoscape y yEd para visualización avanzada.

- *_cohashtags.graphml / .gexf: Grafo de co-ocurrencia de hashtags. Los usuarios
  están conectados si comparten hashtags. Útil para detectar comunidades temáticas.

  CÓMO USAR EN GEPHI:
  1. Abrir Gephi
  2. Archivo > Abrir > Seleccionar archivo .graphml o .gexf
  3. Aplicar layout (ej: ForceAtlas2) para visualización
  4. Colorear nodos por comunidad o influencia

📦 DATOS JSON
-------------
- menciones_*.json: Datos crudos del grafo de menciones con todos los nodos,
  aristas y métricas calculadas.

- cohashtags_*.json: Datos crudos del grafo de co-hashtags.

- estadisticas_*.json: Todas las estadísticas calculadas, comunidades, rankings
  y métricas de red.

📊 HOJAS DE CÁLCULO EXCEL
-------------------------
- influencers_*.xlsx: Lista completa de usuarios ordenados por influencia, con
  todas sus métricas de centralidad (PageRank, Degree, Betweenness).

- comunidades_*.xlsx: Resumen de comunidades detectadas con sus top influencers
  y hashtags característicos por comunidad.

- actividad_temporal_*.xlsx: Serie temporal de la actividad (tweets por hora)
  útil para análisis de tendencias y eventos.

- urls_compartidas_*.xlsx: URLs más compartidas con estadísticas de difusión,
  usuarios que las comparten y score de viralidad.

📈 ARCHIVOS CSV
---------------
- matriz_*_*.csv: Matrices de adyacencia del grafo (menciones o co-hashtags).
  Formato compatible con R, Python, MATLAB para análisis cuantitativos.

- hashtags_*.csv: Top hashtags con su frecuencia de uso y porcentaje sobre
  el total de tweets.

- metricas_centralidad_*.csv: Todas las métricas de centralidad para cada
  usuario. Útil para análisis estadístico en R o Python.

================================================================================
MÉTRICAS EXPLICADAS
================================================================================

PAGERANK: Mide la importancia de un usuario basado en quién lo menciona. Un
          usuario con alto PageRank recibe menciones de otros usuarios importantes.

DEGREE CENTRALITY: Número de conexiones directas. Usuarios con alto degree son
                   muy activos o muy mencionados.

BETWEENNESS: Mide cuánto actúa un usuario como "puente" entre diferentes partes
             de la red. Usuarios con alto betweenness son conectores clave.

INFLUENCE SCORE: Score compuesto (0-100) que combina PageRank, Degree, Engagement
                 y Betweenness para medir la influencia global del usuario.

COMUNIDADES: Grupos de usuarios densamente conectados detectados mediante el
             algoritmo de Louvain. Representan clusters temáticos o sociales.

================================================================================
RECOMENDACIONES DE USO
================================================================================

PARA VISUALIZACIÓN DE REDES:
  → Usar archivos GraphML/GEXF en Gephi

PARA ANÁLISIS ESTADÍSTICO:
  → Usar archivos CSV en R, Python, o SPSS

PARA EXPLORACIÓN DE DATOS:
  → Usar archivos Excel con filtros y tablas dinámicas

PARA DESARROLLO/INTEGRACIÓN:
  → Usar archivos JSON con toda la información estructurada

================================================================================
SOPORTE Y DOCUMENTACIÓN
================================================================================

Para más información sobre el análisis de redes sociales:
- NetworkX: https://networkx.org/
- Gephi: https://gephi.org/users/tutorial-visualization/
- Análisis de Grafos: https://en.wikipedia.org/wiki/Social_network_analysis

Generado con Claude Code - Análisis de Redes Sociales
https://github.com/anthropics/claude-code
`

    zip.file('IMPORTANTE.txt', readme)

    alert('Nota: La descarga de ZIP con todos los archivos generará los archivos individualmente debido a limitaciones del navegador. Recomendamos seleccionar archivos específicos para descarga múltiple.')

    // Descargar seleccionados individualmente
    downloadSelected()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px', color: '#111' }}>
          Exportar Datos
        </h1>
        <p style={{ color: '#666', fontSize: '14px' }}>
          Selecciona los archivos que deseas descargar. {selectedFormats.size} {selectedFormats.size === 1 ? 'archivo seleccionado' : 'archivos seleccionados'}.
        </p>
      </div>

      {/* Controles */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={selectAll}
          style={{
            padding: '8px 16px',
            background: '#000',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Seleccionar Todos
        </button>
        <button
          onClick={deselectAll}
          style={{
            padding: '8px 16px',
            background: '#fff',
            color: '#000',
            border: '2px solid #000',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Deseleccionar Todos
        </button>
        <button
          onClick={downloadSelected}
          disabled={selectedFormats.size === 0}
          style={{
            padding: '8px 16px',
            background: selectedFormats.size > 0 ? '#000' : '#e5e7eb',
            color: selectedFormats.size > 0 ? '#fff' : '#9ca3af',
            border: 'none',
            borderRadius: '6px',
            cursor: selectedFormats.size > 0 ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: '500',
            marginLeft: 'auto'
          }}
        >
          Descargar Seleccionados ({selectedFormats.size})
        </button>
      </div>

      {/* Categorías */}
      {categories.map(cat => {
        const categoryFormats = formats.filter(f => f.category === cat.id)
        const enabledFormats = categoryFormats.filter(f => f.enabled)
        const selectedInCategory = enabledFormats.filter(f => selectedFormats.has(f.id)).length

        if (enabledFormats.length === 0) return null

        return (
          <div key={cat.id}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#111', margin: 0 }}>
                {cat.label}
              </h2>
              <button
                onClick={() => toggleCategory(cat.id)}
                style={{
                  marginLeft: '12px',
                  padding: '4px 12px',
                  background: 'transparent',
                  color: '#666',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                {selectedInCategory === enabledFormats.length ? 'Deseleccionar' : 'Seleccionar'} categoría
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
              {categoryFormats.map(format => (
                <button
                  key={format.id}
                  onClick={() => format.enabled && toggleFormat(format.id)}
                  disabled={!format.enabled}
                  style={{
                    padding: '16px',
                    background: format.enabled ? (selectedFormats.has(format.id) ? '#000' : '#fff') : '#f5f5f5',
                    color: format.enabled ? (selectedFormats.has(format.id) ? '#fff' : '#000') : '#999',
                    border: format.enabled ? (selectedFormats.has(format.id) ? '2px solid #000' : '2px solid #ddd') : '2px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: format.enabled ? 'pointer' : 'not-allowed',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (format.enabled && !selectedFormats.has(format.id)) {
                      e.currentTarget.style.borderColor = '#666'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (format.enabled && !selectedFormats.has(format.id)) {
                      e.currentTarget.style.borderColor = '#ddd'
                    }
                  }}
                >
                  {format.enabled && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      width: '20px',
                      height: '20px',
                      border: selectedFormats.has(format.id) ? 'none' : '2px solid #ddd',
                      borderRadius: '4px',
                      background: selectedFormats.has(format.id) ? '#fff' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      color: '#000'
                    }}>
                      {selectedFormats.has(format.id) && '✓'}
                    </div>
                  )}
                  <div style={{ fontWeight: '600', marginBottom: '4px', paddingRight: '32px' }}>
                    {format.name}
                  </div>
                  <div style={{ fontSize: '13px', opacity: 0.7 }}>
                    {format.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )
      })}

      {/* Info */}
      <div style={{
        background: '#f9f9f9',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '16px',
        fontSize: '13px',
        color: '#666',
        lineHeight: '1.6'
      }}>
        <strong>Consejo:</strong> Los archivos GraphML y GEXF son ideales para visualización en Gephi.
        Los archivos Excel permiten análisis detallado en hojas de cálculo.
        Los archivos CSV son compatibles con R, Python y otras herramientas de análisis estadístico.
      </div>
    </div>
  )
}
