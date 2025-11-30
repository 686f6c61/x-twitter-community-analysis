import { useState, useEffect, useRef } from 'react'
import { Network, GitBranch, RotateCw, Waves, Layers, CircleDot, Target, Users2, GitMerge, Palette, Ruler, Search, ChevronDown, LayoutGrid, Info, X, Cable, Filter } from 'lucide-react'
import type { LayoutType, ColorMode, NodeSizeMetric, EdgeWidthMode } from '../types'

// Componente helper para renderizar modal informativo
function InfoModal({ content, onClose }: { content: any, onClose: () => void }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '600px',
          maxHeight: '80vh',
          overflow: 'auto',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          <X size={20} />
        </button>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
          {content.title}
        </h3>
        <p style={{ marginBottom: '16px', color: '#666', lineHeight: '1.6' }}>
          {content.description}
        </p>
        {content.options && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {content.options.map((option: any, index: number) => (
              <div key={index} style={{ borderLeft: '3px solid #3b82f6', paddingLeft: '12px' }}>
                <h4 style={{ fontWeight: '600', marginBottom: '4px' }}>{option.name}</h4>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px', lineHeight: '1.5' }}>
                  {option.description}
                </p>
                <p style={{ fontSize: '13px', color: '#3b82f6', fontStyle: 'italic' }}>
                  <strong>Caso de uso:</strong> {option.useCase}
                </p>
              </div>
            ))}
          </div>
        )}
        {content.useCase && !content.options && (
          <p style={{ fontSize: '13px', color: '#3b82f6', fontStyle: 'italic' }}>
            <strong>Caso de uso:</strong> {content.useCase}
          </p>
        )}
      </div>
    </div>
  )
}

const layoutIcons: Record<LayoutType, any> = {
  forceDirected: Waves,
  hierarchical: Layers,
  circular: CircleDot,
  radial: Target,
  community: Users2,
  bipartite: GitMerge,
}

const layoutLabels: Record<LayoutType, string> = {
  forceDirected: 'Fuerza Dirigida',
  hierarchical: 'Jerárquico',
  circular: 'Circular',
  radial: 'Radial (Centralidad)',
  community: 'Por Comunidades',
  bipartite: 'Bipartito',
}

const INFO_CONTENT = {
  colorMode: {
    title: 'Modo de Color',
    description: `El modo de color determina cómo se colorean los nodos del grafo, permitiendo visualizar diferentes aspectos de la red.`,
    options: [
      {
        name: 'Por Comunidad',
        description: 'Agrupa nodos por comunidades detectadas mediante el algoritmo de Louvain. Nodos del mismo color pertenecen a la misma comunidad (grupo de usuarios que interactúan frecuentemente entre sí).',
        useCase: 'Útil para identificar burbujas de información, grupos polarizados o subcomunidades dentro de la red.',
      },
      {
        name: 'Por Centralidad',
        description: 'Gradiente de azul (baja) a rojo (alta) según la centralidad del nodo. Usa Eigenvector Centrality o Degree Centrality. Nodos más rojos son más influyentes en la red.',
        useCase: 'Ideal para identificar rápidamente a los usuarios más influyentes o con mayor importancia estructural.',
      },
      {
        name: 'Por Engagement',
        description: 'Gradiente de verde (bajo) a amarillo (alto) según el engagement total. El engagement se calcula como: likes + retweets + replies.',
        useCase: 'Permite identificar usuarios cuyo contenido genera mayor interacción, independientemente de su posición en la red.',
      },
    ],
  },
  nodeSizeMetric: {
    title: 'Tamaño de Nodos',
    description: `El tamaño de cada nodo puede representar diferentes métricas, facilitando la identificación visual de patrones.`,
    options: [
      {
        name: 'Por Engagement',
        description: 'Tamaño proporcional al engagement total (likes + retweets + replies). Usuarios con más interacción aparecen más grandes.',
        useCase: 'Para identificar contenido viral o usuarios con alto impacto en términos de interacción.',
      },
      {
        name: 'Por Tweets',
        description: 'Tamaño proporcional al número de tweets/menciones. Usuarios más activos aparecen más grandes.',
        useCase: 'Para detectar usuarios hiperartivos o bots que generan gran volumen de contenido.',
      },
      {
        name: 'Por Grado',
        description: 'Tamaño proporcional a Degree Centrality (número de conexiones directas). Usuarios más conectados aparecen más grandes.',
        useCase: 'Para identificar hubs o nodos con muchas conexiones directas en la red.',
      },
    ],
  },
  searchNode: {
    title: 'Buscar y Filtrar Nodos',
    description: `Permite filtrar la visualización para mostrar solo los nodos cuyo nombre coincida con el texto buscado. La búsqueda es incremental: al escribir "outl" se muestran todos los usuarios que contengan esas letras (outlier, outliers_es, etc.). Al borrar el texto, se restaura la visualización completa.`,
    useCase: 'Útil para enfocarse en un subconjunto específico de usuarios, analizar sus conexiones mutuas, o explorar redes de usuarios con nombres similares. La búsqueda es case-insensitive (no distingue mayúsculas/minúsculas).',
  },
  graphType: {
    title: 'Tipo de Grafo',
    description: `Determina qué tipo de relaciones se visualizan en la red.`,
    options: [
      {
        name: 'Menciones',
        description: 'Grafo dirigido donde las aristas representan menciones entre usuarios (A menciona a B). Permite analizar flujos de atención e influencia.',
        useCase: 'Identificar quién menciona a quién, detectar campañas coordinadas o analizar patrones de amplificación.',
      },
      {
        name: 'Co-Hashtags',
        description: 'Grafo no dirigido donde las aristas conectan hashtags que aparecen juntos en tweets. El peso indica frecuencia de co-ocurrencia.',
        useCase: 'Descubrir temas relacionados, identificar narrativas emergentes o detectar campañas coordinadas por uso de hashtags.',
      },
    ],
  },
  layout: {
    title: 'Diseño de Grafo',
    description: `El algoritmo de layout determina cómo se posicionan los nodos en el espacio visual, revelando diferentes aspectos estructurales de la red.`,
    options: [
      {
        name: 'Fuerza Dirigida (Force-Directed)',
        description: 'Algoritmo físico que simula fuerzas de atracción (aristas) y repulsión (nodos). Nodos conectados se atraen, nodos sin conexión se repelen.',
        useCase: 'Layout general que revela clustering natural. Ideal para exploración inicial y detección de comunidades.',
      },
      {
        name: 'Jerárquico (Hierarchical)',
        description: 'Organiza nodos en niveles verticales según su posición en la jerarquía de influencia o información.',
        useCase: 'Visualizar jerarquías de influencia, cadenas de amplificación o estructuras de difusión top-down.',
      },
      {
        name: 'Circular',
        description: 'Distribuye todos los nodos uniformemente en un círculo. Las aristas cruzan el interior.',
        useCase: 'Comparar densidad de conexiones entre diferentes partes de la red o visualizar redes pequeñas.',
      },
      {
        name: 'Radial (por Centralidad)',
        description: 'Nodos más centrales (mayor Eigenvector Centrality) en el centro, periféricos en el exterior formando círculos concéntricos.',
        useCase: 'Identificar el core vs. periferia de la red. Útil para análisis de influencia centralizada.',
      },
      {
        name: 'Por Comunidades',
        description: 'Agrupa nodos de la misma comunidad en clusters espaciales separados, distribuidos en círculo.',
        useCase: 'Visualizar polarización, identificar subcomunidades aisladas o analizar puentes entre grupos.',
      },
      {
        name: 'Bipartito (solo Co-Hashtags)',
        description: 'Separa hashtags en dos niveles: principales (más conectados) arriba, secundarios abajo.',
        useCase: 'Identificar hashtags core vs. periféricos, detectar narrativas principales vs. emergentes.',
      },
    ],
  },
  edgeWidth: {
    title: 'Grosor de Aristas',
    description: `Determina cómo se visualiza el grosor de las aristas (conexiones) en el grafo. El peso de una arista representa la intensidad de la relación entre dos nodos.`,
    options: [
      {
        name: 'Uniforme',
        description: 'Todas las aristas tienen el mismo grosor visual (2px), independientemente de su peso. Facilita ver todas las conexiones por igual.',
        useCase: 'Útil cuando se quiere analizar la estructura de la red sin sesgar la atención hacia conexiones más fuertes. Ideal para redes muy densas donde las aristas gruesas podrían solaparse.',
      },
      {
        name: 'Por Peso',
        description: 'El grosor de cada arista es proporcional a su peso. En grafos de menciones, el peso indica el número de menciones (A menciona N veces a B). En co-hashtags, el peso representa cuántas veces aparecen juntos dos hashtags. Rango visual: 1-8px.',
        useCase: 'Permite identificar rápidamente las relaciones más fuertes o frecuentes. Útil para detectar patrones de amplificación masiva, campañas coordinadas o hashtags fuertemente asociados.',
      },
    ],
  },
  labels: {
    title: 'Etiquetas de Nodos',
    description: `Controla la visibilidad de las etiquetas de texto en los nodos del grafo. Las etiquetas muestran el nombre de usuario (en menciones) o el hashtag (en co-hashtags).`,
    useCase: 'Desactivar etiquetas es útil para visualizar la estructura general de la red sin distracciones visuales, especialmente en grafos muy densos con muchos nodos. Activar etiquetas permite identificar nodos específicos por su nombre.',
  },
  edges: {
    title: 'Visibilidad de Aristas',
    description: `Controla la visibilidad de las aristas (conexiones) entre nodos. Las aristas representan relaciones: menciones entre usuarios o co-ocurrencia de hashtags.`,
    useCase: 'Desactivar aristas permite enfocarse únicamente en la distribución espacial de los nodos según el layout seleccionado, sin el ruido visual de las conexiones. Útil para analizar clustering de comunidades o centralidad de nodos de forma visual.',
  },
  physics: {
    title: 'Simulación Física',
    description: `Controla la simulación física en tiempo real del grafo. Cuando está activa, los nodos se mueven dinámicamente según fuerzas de atracción (aristas) y repulsión (entre nodos). Utiliza el algoritmo Barnes-Hut para eficiencia.`,
    useCase: 'Activar física permite reorganizar el grafo interactivamente: mover un nodo afecta a sus vecinos, revelando conexiones ocultas. Desactivar física fija las posiciones de los nodos, facilitando análisis estático y comparaciones. La física se desactiva automáticamente tras la estabilización inicial en layouts como Force-Directed.',
  },
  communityFilter: {
    title: 'Filtrar por Comunidades',
    description: `Permite seleccionar qué comunidades visualizar en el grafo. Las comunidades son grupos de nodos detectados algorítmicamente (Louvain) que interactúan frecuentemente entre sí. Puedes ver todas las comunidades o enfocarte en un subconjunto específico.`,
    useCase: 'Útil para analizar comunidades específicas en detalle, comparar pocas comunidades entre sí, o reducir la densidad visual cuando hay muchas comunidades. Especialmente útil en el layout "Por Comunidades" donde comunidades grandes pueden formar anillos densos.',
  },
}

interface GraphControlsProps {
  currentLayout: LayoutType
  showLabels: boolean
  showEdges: boolean
  physicsEnabled: boolean
  colorMode?: ColorMode
  nodeSizeMetric?: NodeSizeMetric
  edgeWidthMode?: EdgeWidthMode
  selectedCommunities?: number[]
  availableCommunities?: number[]
  onLayoutChange: (layout: LayoutType) => void
  onToggleLabels: () => void
  onToggleEdges: () => void
  onTogglePhysics: () => void
  onColorModeChange?: (mode: ColorMode) => void
  onNodeSizeMetricChange?: (metric: NodeSizeMetric) => void
  onEdgeWidthModeChange?: (mode: EdgeWidthMode) => void
  onCommunityFilterChange?: (communities: number[]) => void
  onSearchNode?: (query: string) => void
  onReset: () => void
  graphType: 'mentions' | 'cohashtags'
  onGraphTypeChange: (type: 'mentions' | 'cohashtags') => void
}

export function GraphControls({
  currentLayout,
  showLabels,
  showEdges,
  physicsEnabled,
  colorMode = 'community',
  nodeSizeMetric = 'engagement',
  edgeWidthMode = 'uniform',
  selectedCommunities = [],
  availableCommunities = [],
  onLayoutChange,
  onToggleLabels,
  onToggleEdges,
  onTogglePhysics,
  onColorModeChange,
  onNodeSizeMetricChange,
  onEdgeWidthModeChange,
  onCommunityFilterChange,
  onSearchNode,
  onReset,
  graphType,
  onGraphTypeChange,
}: GraphControlsProps) {
  const [layoutDropdownOpen, setLayoutDropdownOpen] = useState(false)
  const layoutDropdownRef = useRef<HTMLDivElement>(null)
  const [activeInfoModal, setActiveInfoModal] = useState<string | null>(null)

  const availableLayouts: LayoutType[] = graphType === 'cohashtags'
    ? ['forceDirected', 'hierarchical', 'circular', 'radial', 'community', 'bipartite']
    : ['forceDirected', 'hierarchical', 'circular', 'radial', 'community']

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (layoutDropdownRef.current && !layoutDropdownRef.current.contains(event.target as Node)) {
        setLayoutDropdownOpen(false)
      }
    }

    if (layoutDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [layoutDropdownOpen])

  return (
    <div className="controls-panel">
      <h3 className="controls-title">Controles de Visualización</h3>

      <div className="control-group">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <label className="control-label" style={{ marginBottom: 0 }}>
            <Network />
            Tipo de Grafo
          </label>
          <button
            onClick={() => setActiveInfoModal('graphType')}
            className="info-button"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#666' }}
          >
            <Info size={16} />
          </button>
        </div>
        <select
          value={graphType}
          onChange={(e) => onGraphTypeChange(e.target.value as 'mentions' | 'cohashtags')}
          className="control-select"
        >
          <option value="mentions">Menciones</option>
          <option value="cohashtags">Co-Hashtags</option>
        </select>
      </div>

      <div className="control-group">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <label className="control-label" style={{ marginBottom: 0 }}>
            <LayoutGrid />
            Diseño
          </label>
          <button
            onClick={() => setActiveInfoModal('layout')}
            className="info-button"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#666' }}
          >
            <Info size={16} />
          </button>
        </div>
        <div className="custom-select" ref={layoutDropdownRef}>
          <button
            className="custom-select-trigger"
            onClick={() => setLayoutDropdownOpen(!layoutDropdownOpen)}
          >
            <span className="custom-select-value">
              {(() => {
                const Icon = layoutIcons[currentLayout]
                return <Icon size={16} />
              })()}
              <span>{layoutLabels[currentLayout]}</span>
            </span>
            <ChevronDown size={16} />
          </button>
          {layoutDropdownOpen && (
            <div className="custom-select-dropdown">
              {availableLayouts.map((layout) => {
                const Icon = layoutIcons[layout]
                return (
                  <button
                    key={layout}
                    className={`custom-select-option ${currentLayout === layout ? 'active' : ''}`}
                    onClick={() => {
                      onLayoutChange(layout)
                      setLayoutDropdownOpen(false)
                    }}
                  >
                    <Icon size={16} />
                    <span>{layoutLabels[layout]}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {onColorModeChange && (
        <div className="control-group">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label className="control-label" style={{ marginBottom: 0 }}>
              <Palette />
              Modo de Color
            </label>
            <button
              onClick={() => setActiveInfoModal('colorMode')}
              className="info-button"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#666' }}
            >
              <Info size={16} />
            </button>
          </div>
          <select
            value={colorMode}
            onChange={(e) => onColorModeChange(e.target.value as ColorMode)}
            className="control-select"
          >
            <option value="community">Grupos (Comunidad)</option>
            <option value="centrality">Influencia (Centralidad)</option>
            <option value="engagement">Interacción (Engagement)</option>
          </select>
        </div>
      )}

      {onNodeSizeMetricChange && (
        <div className="control-group">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label className="control-label" style={{ marginBottom: 0 }}>
              <Ruler />
              Tamaño de Nodos
            </label>
            <button
              onClick={() => setActiveInfoModal('nodeSizeMetric')}
              className="info-button"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#666' }}
            >
              <Info size={16} />
            </button>
          </div>
          <select
            value={nodeSizeMetric}
            onChange={(e) => onNodeSizeMetricChange(e.target.value as NodeSizeMetric)}
            className="control-select"
          >
            <option value="engagement">Por Engagement</option>
            <option value="tweets">Por Tweets</option>
            <option value="degree">Por Grado</option>
          </select>
        </div>
      )}

      {onSearchNode && (
        <div className="control-group">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label className="control-label" style={{ marginBottom: 0 }}>
              <Search />
              Buscar Nodo
            </label>
            <button
              onClick={() => setActiveInfoModal('searchNode')}
              className="info-button"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#666' }}
            >
              <Info size={16} />
            </button>
          </div>
          <input
            type="text"
            placeholder="Filtrar por nombre..."
            onChange={(e) => onSearchNode(e.target.value)}
            className="control-select"
            style={{ fontFamily: 'inherit' }}
          />
        </div>
      )}

      {onEdgeWidthModeChange && (
        <div className="control-group">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label className="control-label" style={{ marginBottom: 0 }}>
              <Cable />
              Grosor de Aristas
            </label>
            <button
              onClick={() => setActiveInfoModal('edgeWidth')}
              className="info-button"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#666' }}
            >
              <Info size={16} />
            </button>
          </div>
          <select
            value={edgeWidthMode}
            onChange={(e) => onEdgeWidthModeChange(e.target.value as EdgeWidthMode)}
            className="control-select"
          >
            <option value="uniform">Uniforme</option>
            <option value="weighted">Por Peso</option>
          </select>
        </div>
      )}

      {onCommunityFilterChange && availableCommunities.length > 0 && (
        <div className="control-group">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label className="control-label" style={{ marginBottom: 0 }}>
              <Filter />
              Filtrar Comunidades
            </label>
            <button
              onClick={() => setActiveInfoModal('communityFilter')}
              className="info-button"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#666' }}
            >
              <Info size={16} />
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <button
              onClick={() => onCommunityFilterChange(availableCommunities)}
              style={{
                flex: 1,
                padding: '6px',
                fontSize: '12px',
                background: selectedCommunities.length === availableCommunities.length ? 'var(--primary)' : '#f0f0f0',
                color: selectedCommunities.length === availableCommunities.length ? 'white' : '#666',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Todas
            </button>
            <button
              onClick={() => onCommunityFilterChange([])}
              style={{
                flex: 1,
                padding: '6px',
                fontSize: '12px',
                background: selectedCommunities.length === 0 ? 'var(--primary)' : '#f0f0f0',
                color: selectedCommunities.length === 0 ? 'white' : '#666',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Ninguna
            </button>
          </div>
          <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px', padding: '8px' }}>
            {availableCommunities.map((communityId) => (
              <label
                key={communityId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedCommunities.includes(communityId)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onCommunityFilterChange([...selectedCommunities, communityId])
                    } else {
                      onCommunityFilterChange(selectedCommunities.filter(id => id !== communityId))
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                />
                <span>Comunidad {communityId}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="control-divider">
        <div className="toggle-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="toggle-label">Etiquetas</span>
            <button
              onClick={() => setActiveInfoModal('labels')}
              className="info-button"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#666' }}
            >
              <Info size={14} />
            </button>
          </div>
          <button
            onClick={onToggleLabels}
            className={`toggle-switch ${showLabels ? 'active' : ''}`}
          >
            <span className="toggle-thumb" />
          </button>
        </div>

        <div className="toggle-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="toggle-label">Aristas</span>
            <button
              onClick={() => setActiveInfoModal('edges')}
              className="info-button"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#666' }}
            >
              <Info size={14} />
            </button>
          </div>
          <button
            onClick={onToggleEdges}
            className={`toggle-switch ${showEdges ? 'active' : ''}`}
          >
            <span className="toggle-thumb" />
          </button>
        </div>

        <div className="toggle-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="toggle-label">Física</span>
            <button
              onClick={() => setActiveInfoModal('physics')}
              className="info-button"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#666' }}
            >
              <Info size={14} />
            </button>
          </div>
          <button
            onClick={onTogglePhysics}
            className={`toggle-switch ${physicsEnabled ? 'active' : ''}`}
          >
            <span className="toggle-thumb" />
          </button>
        </div>
      </div>

      <button onClick={onReset} className="reset-button">
        <RotateCw />
        Restablecer Vista
      </button>

      {activeInfoModal && (
        <InfoModal
          content={INFO_CONTENT[activeInfoModal as keyof typeof INFO_CONTENT]}
          onClose={() => setActiveInfoModal(null)}
        />
      )}
    </div>
  )
}
