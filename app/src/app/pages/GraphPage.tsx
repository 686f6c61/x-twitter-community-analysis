import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { FileUploader } from "@/features/file-loader/components/FileUploader"
import { NetworkGraph } from "@/features/graph-visualization/components/NetworkGraph"
import { GraphControls } from "@/features/graph-visualization/components/GraphControls"
import { CentralityMetrics } from "@/features/graph-visualization/components/CentralityMetrics"
import { DatasetMetadataCard } from "@/shared/components/DatasetMetadataCard"
import { DataQualityWarnings } from "@/shared/components/DataQualityWarnings"
import { GraphAnomaliesAlert } from "@/shared/components/GraphAnomaliesAlert"
import { GraphStructuralAnalysis } from "@/shared/components/GraphStructuralAnalysis"
import { DegreeDistributionAnalysis } from "@/shared/components/DegreeDistributionAnalysis"
import { InfluenceMetrics } from "@/shared/components/InfluenceMetrics"
import { useGraphData } from "@/shared/hooks/useGraphData"
import { useNetworkGraph } from "@/features/graph-visualization/hooks/useNetworkGraph"
import { useGraphStore } from "@/lib/store/graphStore"
import { Loader2 } from "lucide-react"
import type { ColorMode, NodeSizeMetric, EdgeWidthMode } from "@/features/graph-visualization/types"

export function GraphPage() {
  const { mentions, cohashtags, hasData } = useGraphData()
  const isLoading = useGraphStore((state) => state.isLoading)
  const [graphType, setGraphType] = useState<'mentions' | 'cohashtags'>('mentions')
  const [colorMode, setColorMode] = useState<ColorMode>('community')
  const [nodeSizeMetric, setNodeSizeMetric] = useState<NodeSizeMetric>('engagement')
  const [edgeWidthMode, setEdgeWidthMode] = useState<EdgeWidthMode>('uniform')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCommunities, setSelectedCommunities] = useState<number[]>([])
  const { config, setLayoutType, toggleLabels, toggleEdges, togglePhysics, resetConfig } = useNetworkGraph()

  const currentGraph = graphType === 'mentions' ? mentions : cohashtags

  // Calcular comunidades disponibles y filtrar nodos
  const availableCommunities = currentGraph?.nodes
    ? [...new Set(currentGraph.nodes.map(n => n.community))].sort((a, b) => a - b)
    : []

  // Inicializar selectedCommunities con todas las comunidades cuando cambie el grafo
  React.useEffect(() => {
    if (availableCommunities.length > 0) {
      setSelectedCommunities(availableCommunities)
    }
  }, [graphType, hasData])

  // Filtrar grafo por comunidades seleccionadas
  const filteredGraph = currentGraph && selectedCommunities.length > 0 && selectedCommunities.length < availableCommunities.length
    ? {
        nodes: currentGraph.nodes.filter(n => selectedCommunities.includes(n.community)),
        edges: currentGraph.edges.filter((e: any) => {
          const sourceNode = currentGraph.nodes.find((n: any) => n.id === (e.from || e.source))
          const targetNode = currentGraph.nodes.find((n: any) => n.id === (e.to || e.target))
          return sourceNode && targetNode &&
                 selectedCommunities.includes(sourceNode.community) &&
                 selectedCommunities.includes(targetNode.community)
        })
      }
    : currentGraph

  console.log('[GraphPage] State:', {
    hasData,
    graphType,
    currentGraph: currentGraph ? `${currentGraph.nodes?.length} nodes, ${currentGraph.edges?.length} edges` : 'null',
    mentions: mentions ? `${mentions.nodes?.length} nodes` : 'null',
    cohashtags: cohashtags ? `${cohashtags.nodes?.length} nodes` : 'null'
  })

  const handleNodeClick = (nodeId: string) => {
    console.log('Node clicked:', nodeId)
    // TODO: Abrir modal de perfil en Fase 6
  }

  const handleNodeDoubleClick = (nodeId: string) => {
    console.log('Node double-clicked:', nodeId)
    // TODO: Centrar/resaltar nodo
  }

  return (
    <>
      {/* Fila 1: Información del Dataset (2 columnas) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '20px' }}>
        <DatasetMetadataCard />
        <DataQualityWarnings />
      </div>

      <div style={{ minHeight: '600px' }}>
        {isLoading ? (
          <div className="h-full flex items-center justify-center" style={{ minHeight: '400px' }}>
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-500" />
              <div>
                <p className="text-lg font-medium">Procesando datos...</p>
                <p className="text-sm text-[var(--text-secondary)]">Esto puede tardar unos segundos para archivos grandes</p>
              </div>
            </div>
          </div>
        ) : !hasData ? (
          <div className="h-full flex items-center justify-center" style={{ minHeight: '400px' }}>
            <div className="text-center space-y-2">
              <p className="text-[var(--text-secondary)]">Cargar un archivo JSON para visualizar el grafo</p>
            </div>
          </div>
        ) : (
          <div className="graph-layout">
            {/* Sidebar de controles */}
            <div className="graph-sidebar-left">
              <GraphControls
                currentLayout={config.layoutType}
                showLabels={config.showLabels}
                showEdges={config.showEdges}
                physicsEnabled={config.physicsEnabled}
                colorMode={colorMode}
                nodeSizeMetric={nodeSizeMetric}
                edgeWidthMode={edgeWidthMode}
                selectedCommunities={selectedCommunities}
                availableCommunities={availableCommunities}
                onLayoutChange={setLayoutType}
                onToggleLabels={toggleLabels}
                onToggleEdges={toggleEdges}
                onTogglePhysics={togglePhysics}
                onColorModeChange={setColorMode}
                onNodeSizeMetricChange={setNodeSizeMetric}
                onEdgeWidthModeChange={setEdgeWidthMode}
                onCommunityFilterChange={setSelectedCommunities}
                onSearchNode={setSearchQuery}
                onReset={resetConfig}
                graphType={graphType}
                onGraphTypeChange={setGraphType}
              />
            </div>

            {/* Visualización del grafo */}
            <div className="graph-main">
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {graphType === 'mentions' ? 'Grafo de Menciones' : 'Grafo de Co-Hashtags'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 h-[calc(100%-4rem)]">
                  {filteredGraph ? (
                    <NetworkGraph
                      data={filteredGraph}
                      type={graphType}
                      layout={config.layoutType}
                      colorMode={colorMode}
                      nodeSizeMetric={nodeSizeMetric}
                      edgeWidthMode={edgeWidthMode}
                      searchQuery={searchQuery}
                      onNodeClick={handleNodeClick}
                      onNodeDoubleClick={handleNodeDoubleClick}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-[var(--text-secondary)]">
                        No hay datos de {graphType === 'mentions' ? 'menciones' : 'co-hashtags'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Panel de métricas de centralidad */}
            <div className="graph-sidebar-right">
              {filteredGraph && filteredGraph.nodes && (
                <CentralityMetrics nodes={filteredGraph.nodes} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Análisis del Grafo (debajo del visualizador) - Grid 2x2 */}
      {hasData && filteredGraph && filteredGraph.nodes && filteredGraph.edges && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginTop: '20px' }}>
          {/* Fila 1 */}
          <GraphAnomaliesAlert graphType={graphType} />
          <GraphStructuralAnalysis
            nodes={filteredGraph.nodes}
            edges={filteredGraph.edges}
            graphType={graphType}
          />

          {/* Fila 2 */}
          <DegreeDistributionAnalysis
            nodes={filteredGraph.nodes}
            edges={filteredGraph.edges}
            graphType={graphType}
          />

          <InfluenceMetrics
            nodes={filteredGraph.nodes}
            edges={filteredGraph.edges}
            graphType={graphType}
          />
        </div>
      )}
    </>
  )
}
