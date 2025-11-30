import { X, Download } from 'lucide-react'
import type { Community, Node } from '@/types/graph'
import { CommunityAdvancedAnalysis } from './CommunityAdvancedAnalysis'

interface CommunityDetailsModalProps {
  community: Community
  onClose: () => void
  allNodes?: Node[]  // Para obtener métricas completas de todos los miembros
}

export function CommunityDetailsModal({ community, onClose, allNodes }: CommunityDetailsModalProps) {
  const handleDownloadCSV = () => {
    const csvRows = []

    // Buscar nodos completos de los miembros de la comunidad
    const communityMembers = allNodes
      ? allNodes.filter(node => community.nodes.includes(node.id))
      : []

    // Si tenemos acceso a los nodos completos, exportar TODO
    if (communityMembers.length > 0) {
      // Header completo con todas las métricas
      csvRows.push([
        'community_id',
        'username',
        'label',
        'tweets',
        'engagement',
        'degree',
        'betweenness',
        'closeness',
        'degree_centrality',
        'betweenness_centrality',
        'closeness_centrality',
        'eigenvector_centrality',
        'kcore',
        'core_number',
        'influencer_score',
        'influencer_category',
        'bot_score',
        'bot_category'
      ].join(','))

      // Exportar TODOS los miembros con todas sus métricas
      communityMembers.forEach((node) => {
        csvRows.push([
          community.id,
          node.id,
          `"${node.label.replace(/"/g, '""')}"`,  // Escape comillas dobles
          node.tweets || 0,
          node.engagement || 0,
          node.degree || 0,
          (node.betweenness || 0).toFixed(6),
          (node.closeness || 0).toFixed(6),
          (node.degree_centrality || 0).toFixed(6),
          (node.betweenness_centrality || 0).toFixed(6),
          (node.closeness_centrality || 0).toFixed(6),
          (node.eigenvector_centrality || 0).toFixed(6),
          node.kcore || 0,
          node.core_number || 0,
          (node.influencer_score || 0).toFixed(2),
          node.influencer_category || 'N/A',
          (node.bot_score || 0).toFixed(2),
          node.bot_category || 'N/A'
        ].join(','))
      })
    } else {
      // Fallback: Exportar solo top influencers si no hay nodos disponibles
      csvRows.push(['community_id', 'username', 'name', 'tweets', 'influence_score'].join(','))

      if (community.top_influencers) {
        community.top_influencers.forEach((influencer) => {
          csvRows.push([
            community.id,
            influencer.username,
            `"${influencer.name.replace(/"/g, '""')}"`,
            influencer.tweets,
            influencer.score.toFixed(2)
          ].join(','))
        })
      }
    }

    // Create blob and download
    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    const filename = communityMembers.length > 0
      ? `comunidad_${community.id}_miembros_completo.csv`
      : `comunidad_${community.id}_top_influencers.csv`

    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const generateDescription = () => {
    const densityPercent = ((community.density || 0) * 100).toFixed(1)
    const avgScore = community.avg_score || 0

    let densityDesc = ''
    if ((community.density || 0) > 0.3) {
      densityDesc = 'una comunidad muy cohesiva'
    } else if ((community.density || 0) > 0.1) {
      densityDesc = 'una comunidad moderadamente conectada'
    } else {
      densityDesc = 'una comunidad con conexiones dispersas'
    }

    let influenceDesc = ''
    if (avgScore > 60) {
      influenceDesc = 'alta influencia general'
    } else if (avgScore > 40) {
      influenceDesc = 'influencia moderada'
    } else {
      influenceDesc = 'baja influencia general'
    }

    return `Esta comunidad agrupa ${community.size} usuarios que interactúan frecuentemente entre sí.
    La densidad interna de ${densityPercent}% indica ${densityDesc}.
    El score promedio de influencia es ${avgScore.toFixed(1)}, lo que sugiere ${influenceDesc}.`
  }

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
        zIndex: 9999,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(90deg, #f8f9fa 0%, #ffffff 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '8px',
              background: community.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              color: 'white',
              fontWeight: 'bold'
            }}>
              {community.id}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>
                Comunidad {community.id}
              </h2>
              <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '14px' }}>
                {community.size} miembros
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px'
        }}>
          {/* Estadísticas Generales */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>
              Estadísticas Generales
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px'
            }}>
              <div style={{
                background: '#f8f9fa',
                padding: '16px',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                  Tweets Totales
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
                  {(community.total_tweets || 0).toLocaleString()}
                </div>
              </div>

              <div style={{
                background: '#f8f9fa',
                padding: '16px',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                  Engagement Total
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
                  {(community.total_engagement || 0).toLocaleString()}
                </div>
              </div>

              <div style={{
                background: '#f8f9fa',
                padding: '16px',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                  Score Promedio
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
                  {(community.avg_score || 0).toFixed(1)}
                </div>
              </div>

              <div style={{
                background: '#f8f9fa',
                padding: '16px',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                  Densidad Interna
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
                  {((community.density || 0) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Top 10 Influencers */}
          {community.top_influencers && community.top_influencers.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>
                Top 10 Influencers
              </h3>
              <div style={{
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <table style={{ width: '100%', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>#</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Usuario</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>Score</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>Tweets</th>
                    </tr>
                  </thead>
                  <tbody>
                    {community.top_influencers.map((influencer, idx) => (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: idx < community.top_influencers!.length - 1 ? '1px solid #f0f0f0' : 'none'
                        }}
                      >
                        <td style={{ padding: '12px', color: '#999' }}>{idx + 1}</td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 600 }}>@{influencer.username}</div>
                          {influencer.name !== influencer.username && (
                            <div style={{ fontSize: '12px', color: '#666' }}>{influencer.name}</div>
                          )}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 500 }}>
                          {influencer.score.toFixed(1)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#666' }}>
                          {influencer.tweets}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Top 10 Hashtags */}
          {community.top_hashtags && community.top_hashtags.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>
                Top 10 Hashtags
              </h3>
              <div style={{
                display: 'grid',
                gap: '8px'
              }}>
                {community.top_hashtags.map((ht, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      background: '#f8f9fa',
                      borderRadius: '6px'
                    }}
                  >
                    <span style={{ color: '#1DA1F2', fontWeight: 500, fontSize: '14px' }}>
                      #{ht.hashtag}
                    </span>
                    <span style={{ color: '#666', fontSize: '14px' }}>
                      {ht.count} usos
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Descripción */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>
              Descripción
            </h3>
            <p style={{ lineHeight: 1.8, color: '#555', fontSize: '14px', margin: 0 }}>
              {generateDescription()}
            </p>
          </div>

          {/* Análisis Avanzado (Sprint 3A) */}
          <CommunityAdvancedAnalysis community={community} />

          {/* Botón de descarga */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={handleDownloadCSV}
              style={{
                background: '#333',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#000'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#333'}
            >
              <Download size={16} />
              Descargar CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
