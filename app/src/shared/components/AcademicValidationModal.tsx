import { useState } from 'react'
import { BookOpen, X, CheckCircle, ExternalLink } from 'lucide-react'

interface AcademicReference {
  metric: string
  algorithm: string
  reference: string
  citation: string
  url?: string
}

const ACADEMIC_REFERENCES: AcademicReference[] = [
  {
    metric: 'Betweenness Centrality',
    algorithm: 'Algoritmo de Brandes (2001)',
    reference: 'Brandes, U. (2001). A faster algorithm for betweenness centrality. Journal of Mathematical Sociology, 25(2), 163-177.',
    citation: 'Brandes, 2001',
    url: 'https://doi.org/10.1080/0022250X.2001.9990249'
  },
  {
    metric: 'Closeness Centrality',
    algorithm: 'Basado en distancias geodésicas',
    reference: 'Freeman, L. C. (1978). Centrality in social networks conceptual clarification. Social Networks, 1(3), 215-239.',
    citation: 'Freeman, 1978',
    url: 'https://doi.org/10.1016/0378-8733(78)90021-7'
  },
  {
    metric: 'Degree Centrality',
    algorithm: 'Conteo de conexiones directas',
    reference: 'Freeman, L. C. (1978). Centrality in social networks conceptual clarification. Social Networks, 1(3), 215-239.',
    citation: 'Freeman, 1978',
    url: 'https://doi.org/10.1016/0378-8733(78)90021-7'
  },
  {
    metric: 'Eigenvector Centrality',
    algorithm: 'Centralidad basada en autovectores',
    reference: 'Bonacich, P. (1987). Power and centrality: A family of measures. American Journal of Sociology, 92(5), 1170-1182.',
    citation: 'Bonacich, 1987',
    url: 'https://doi.org/10.1086/228631'
  },
  {
    metric: 'Community Detection',
    algorithm: 'Algoritmo de Louvain',
    reference: 'Blondel, V. D., Guillaume, J. L., Lambiotte, R., & Lefebvre, E. (2008). Fast unfolding of communities in large networks. Journal of Statistical Mechanics: Theory and Experiment, 2008(10), P10008.',
    citation: 'Blondel et al., 2008',
    url: 'https://doi.org/10.1088/1742-5468/2008/10/P10008'
  },
  {
    metric: 'Graph Density',
    algorithm: 'Proporción de aristas existentes vs. posibles',
    reference: 'Newman, M. E. J. (2010). Networks: An Introduction. Oxford University Press.',
    citation: 'Newman, 2010'
  },
  {
    metric: 'Force-Directed Layout',
    algorithm: 'Algoritmo de Fruchterman-Reingold',
    reference: 'Fruchterman, T. M., & Reingold, E. M. (1991). Graph drawing by force-directed placement. Software: Practice and Experience, 21(11), 1129-1164.',
    citation: 'Fruchterman & Reingold, 1991',
    url: 'https://doi.org/10.1002/spe.4380211102'
  },
  {
    metric: 'Clustering Coefficient',
    algorithm: 'Proporción de triángulos cerrados',
    reference: 'Watts, D. J., & Strogatz, S. H. (1998). Collective dynamics of "small-world" networks. Nature, 393(6684), 440-442.',
    citation: 'Watts & Strogatz, 1998',
    url: 'https://doi.org/10.1038/30918'
  }
]

interface AcademicValidationModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AcademicValidationModal({ isOpen, onClose }: AcademicValidationModalProps) {
  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '2px solid #333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#333',
          borderRadius: '12px 12px 0 0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BookOpen size={28} color="white" />
            <div>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: 'white' }}>
                Validación Académica
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'rgba(255,255,255,0.9)' }}>
                Referencias bibliográficas de las métricas implementadas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '6px',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          >
            <X size={24} color="white" />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Introduction */}
          <div style={{
            padding: '16px',
            background: '#f5f5f5',
            border: '1px solid #999',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
              <CheckCircle size={20} style={{ color: '#333', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: '600', fontSize: '14px', color: '#333', marginBottom: '6px' }}>
                  Rigor Académico
                </div>
                <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
                  Todas las métricas de centralidad, detección de comunidades y análisis de grafos implementadas
                  en GRAPHS están basadas en algoritmos validados académicamente y ampliamente citados en la literatura
                  científica de análisis de redes sociales.
                </div>
              </div>
            </div>
          </div>

          {/* References */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {ACADEMIC_REFERENCES.map((ref, index) => (
              <div
                key={index}
                style={{
                  padding: '16px',
                  background: '#fafafa',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#ebebeb'
                  e.currentTarget.style.borderColor = '#666'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#fafafa'
                  e.currentTarget.style.borderColor = '#e0e0e0'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <div style={{ fontWeight: '700', fontSize: '16px', color: '#333' }}>
                    {ref.metric}
                  </div>
                  <div style={{
                    padding: '4px 12px',
                    background: '#333',
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {ref.citation}
                  </div>
                </div>

                <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                  <strong>Algoritmo:</strong> {ref.algorithm}
                </div>

                <div style={{
                  fontSize: '13px',
                  color: '#333',
                  lineHeight: '1.6',
                  fontStyle: 'italic',
                  padding: '8px 0'
                }}>
                  {ref.reference}
                </div>

                {ref.url && (
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      color: '#333',
                      textDecoration: 'none',
                      marginTop: '8px',
                      fontWeight: '600'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                  >
                    Ver publicación <ExternalLink size={14} />
                  </a>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{
            marginTop: '24px',
            padding: '16px',
            background: '#fffbf0',
            border: '1px solid #ffd700',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#666',
            lineHeight: '1.6'
          }}>
            <strong>Nota sobre reproducibilidad:</strong> Las implementaciones de estos algoritmos en GRAPHS
            utilizan bibliotecas estándar (NetworkX, python-louvain) que siguen las especificaciones originales
            de los papers citados. Los resultados son determinísticos (excepto Louvain, que puede variar ligeramente
            entre ejecuciones debido a su naturaleza heurística) y reproducibles para el mismo dataset.
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Hook component para usar en GraphPage
 */
export function useAcademicValidationModal() {
  const [isOpen, setIsOpen] = useState(false)

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    Modal: () => <AcademicValidationModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
  }
}
