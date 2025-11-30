import { useState } from 'react'
import { Users, Award, Bot, MapPin, Calendar, TrendingUp, BarChart2, Download, Info, ExternalLink } from 'lucide-react'
import type { UserStatistics as UserStats } from '@/types/graph'
import type { DatasetMetadata } from '@/lib/store/graphStore'
import { InfoModal } from '@/shared/components/InfoModal'
import { useGraphStore } from '@/lib/store/graphStore'

interface Props {
  userStats: UserStats
}

export function UserStatistics({ userStats }: Props) {
  const [showInfo, setShowInfo] = useState(false)
  const mentions = useGraphStore((state) => state.mentions)
  const datasetMetadata = useGraphStore((state) => state.datasetMetadata)

  const handleDownloadUsers = () => {
    if (!mentions || !mentions.nodes) {
      alert('No hay datos de usuarios disponibles')
      return
    }

    const csvRows = []

    // Header con todas las métricas
    csvRows.push([
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
      'bot_category',
      'community'
    ].join(','))

    // Exportar todos los usuarios
    mentions.nodes.forEach((node) => {
      csvRows.push([
        node.id,
        `"${node.label.replace(/"/g, '""')}"`,
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
        node.bot_category || 'N/A',
        node.community || 0
      ].join(','))
    })

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `usuarios_completo_${Date.now()}.csv`)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
  // Calcular totales para distribuciones
  const totalVerified = userStats.verified_distribution.verified +
    userStats.verified_distribution.blue_verified +
    userStats.verified_distribution.unverified

  const totalBots = userStats.bot_distribution.likely_bot + userStats.bot_distribution.human

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Título de sección */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '24px',
        borderRadius: '12px',
        color: 'white',
        position: 'relative'
      }}>
        <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '12px' }}>
          <button
            onClick={handleDownloadUsers}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
            title="Descargar todos los usuarios"
          >
            <Download size={16} />
            Descargar CSV
          </button>
          <button
            onClick={() => setShowInfo(true)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: 'none',
              padding: '8px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
            title="Información sobre las métricas"
          >
            <Info size={20} />
          </button>
        </div>
        <h2 style={{
          margin: 0,
          fontSize: '24px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Users size={28} />
          Usuarios
        </h2>
        <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
          Análisis detallado de {userStats.total_unique_users.toLocaleString()} usuarios únicos
        </p>
      </div>

      {/* Métricas agregadas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px'
      }}>
        <MetricCard
          icon={Users}
          label="Usuarios Únicos"
          value={userStats.total_unique_users.toLocaleString()}
          color="#667eea"
        />
        <MetricCard
          icon={TrendingUp}
          label="Promedio Seguidores"
          value={userStats.avg_followers.toLocaleString()}
          color="#3b82f6"
        />
        <MetricCard
          icon={TrendingUp}
          label="Mediana Seguidores"
          value={userStats.median_followers.toLocaleString()}
          color="#10b981"
        />
        <MetricCard
          icon={Calendar}
          label="Antigüedad Promedio"
          value={`${Math.round(userStats.avg_account_age_days / 365)} años`}
          color="#f59e0b"
        />
      </div>

      {/* Distribuciones */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Verificación */}
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{
            marginTop: 0,
            marginBottom: '20px',
            fontSize: '16px',
            fontWeight: 600,
            color: '#1f2937',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Award size={18} style={{ color: '#3b82f6' }} />
            Distribución por Verificación
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <DistributionBar
              label="Verificados (oficial)"
              value={userStats.verified_distribution.verified}
              total={totalVerified}
              color="#3b82f6"
            />
            <DistributionBar
              label="Blue Verified"
              value={userStats.verified_distribution.blue_verified}
              total={totalVerified}
              color="#10b981"
            />
            <DistributionBar
              label="No Verificados"
              value={userStats.verified_distribution.unverified}
              total={totalVerified}
              color="#6b7280"
            />
          </div>
        </div>

        {/* Bots */}
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{
            marginTop: 0,
            marginBottom: '20px',
            fontSize: '16px',
            fontWeight: 600,
            color: '#1f2937',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Bot size={18} style={{ color: '#ef4444' }} />
            Distribución Bot/Humano
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <DistributionBar
              label="Posibles Bots"
              value={userStats.bot_distribution.likely_bot}
              total={totalBots}
              color="#ef4444"
            />
            <DistributionBar
              label="Humanos"
              value={userStats.bot_distribution.human}
              total={totalBots}
              color="#10b981"
            />
          </div>
        </div>
      </div>

      {/* Top usuarios por seguidores */}
      <TopUsersTable
        title="Top 10 Usuarios por Seguidores"
        users={userStats.top_users_by_followers}
        datasetMetadata={datasetMetadata}
      />

      {/* Grid 2x1: Top ubicaciones y Distribución de seguidores */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Top ubicaciones */}
        {userStats.location_distribution.length > 0 && (
          <LocationsChart locations={userStats.location_distribution} />
        )}

        {/* Distribución de seguidores */}
        <FollowerBucketsChart buckets={userStats.follower_buckets} />
      </div>

      {/* Sospechosos de bots */}
      {userStats.suspected_bots.length > 0 && (
        <BotsTable bots={userStats.suspected_bots} />
      )}

      {/* Modal de información */}
      <InfoModal
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        title="Métricas de Usuarios"
      >
        <p style={{ marginTop: 0 }}>
          Esta sección proporciona estadísticas agregadas sobre los usuarios que participan en la conversación.
        </p>

        <h4 style={{ marginBottom: '12px', marginTop: '20px' }}>Usuarios Únicos</h4>
        <p>Número total de usuarios distintos que aparecen en el dataset (autores de tweets + usuarios mencionados).</p>

        <h4 style={{ marginBottom: '12px', marginTop: '20px' }}>Promedio de Seguidores</h4>
        <p><strong>Cálculo:</strong> Media aritmética simple</p>
        <p style={{ background: '#f5f5f5', padding: '12px', borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace' }}>
          avg_followers = Σ(followers_i) / N
        </p>
        <p>Suma de seguidores de todos los usuarios dividida por el número total de usuarios. Esta métrica puede estar sesgada por outliers (cuentas con millones de seguidores).</p>

        <h4 style={{ marginBottom: '12px', marginTop: '20px' }}>Mediana de Seguidores</h4>
        <p><strong>Cálculo:</strong> Valor central de la distribución ordenada</p>
        <p>Si hay N usuarios ordenados por número de seguidores, la mediana es el valor en la posición N/2. Es más robusta que la media ante valores extremos y representa mejor al "usuario típico".</p>

        <h4 style={{ marginBottom: '12px', marginTop: '20px' }}>Antigüedad Promedio</h4>
        <p><strong>Cálculo:</strong> Diferencia entre fecha actual y fecha de creación de la cuenta</p>
        <p style={{ background: '#f5f5f5', padding: '12px', borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace' }}>
          age_days = (today - created_at) / (24 * 3600)
          <br/>
          avg_age = Σ(age_days_i) / N
        </p>
        <p>Edad media de las cuentas en años. Útil para identificar si la conversación está dominada por cuentas recientes (potenciales bots) o cuentas establecidas.</p>

        <h4 style={{ marginBottom: '12px', marginTop: '20px' }}>Distribución por Verificación</h4>
        <ul style={{ marginLeft: '20px', fontSize: '14px', lineHeight: 1.8 }}>
          <li><strong>Verificados (oficial):</strong> Cuentas con verificación azul oficial de Twitter/X otorgada antes de la compra por Elon Musk (personajes públicos, medios, etc.)</li>
          <li><strong>Blue Verified:</strong> Cuentas que pagan la suscripción Twitter Blue/X Premium</li>
          <li><strong>No Verificados:</strong> Cuentas sin verificación</li>
        </ul>

        <h4 style={{ marginBottom: '12px', marginTop: '20px' }}>Distribución Bot/Humano</h4>
        <p><strong>Método:</strong> Basado en el campo `is_automated` de la API de Twitter/X</p>
        <p>Twitter marca explícitamente cuentas automatizadas (bots oficiales de noticias, servicios, etc.). Esta métrica NO es un análisis de comportamiento, solo refleja si el usuario se autodeclara como bot.</p>
        <p style={{ fontSize: '13px', color: '#666', background: '#fffbf0', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #f59e0b' }}>
          <strong>Limitación:</strong> Los bots maliciosos o no declarados NO se detectan con este método. Para detección avanzada de bots, consultar la métrica `bot_score` calculada por GRAPHS.
        </p>

        <h4 style={{ marginBottom: '12px', marginTop: '20px' }}>Top Ubicaciones</h4>
        <p>Distribución geográfica basada en el campo `location` del perfil del usuario. Es autodeclarado y puede ser inexacto o ficticio.</p>

        <h4 style={{ marginBottom: '12px', marginTop: '20px' }}>Distribución por Seguidores</h4>
        <p>Clasificación de usuarios en 5 rangos de popularidad:</p>
        <ul style={{ marginLeft: '20px', fontSize: '14px', lineHeight: 1.8 }}>
          <li><strong>0-100:</strong> Micro-usuarios, cuentas muy pequeñas</li>
          <li><strong>100-1K:</strong> Usuarios ocasionales</li>
          <li><strong>1K-10K:</strong> Usuarios activos con audiencia local</li>
          <li><strong>10K-100K:</strong> Influencers de nicho o locales</li>
          <li><strong>100K+:</strong> Mega-influencers, medios, celebridades</li>
        </ul>

        <p style={{ fontSize: '13px', color: '#666', marginTop: '20px', background: '#f0f9ff', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #3b82f6' }}>
          <strong>Nota:</strong> Las estadísticas solo están disponibles para usuarios cuyos perfiles fueron enriquecidos mediante la API. Usuarios mencionados sin enriquecimiento no se incluyen en estas métricas agregadas.
        </p>
      </InfoModal>
    </div>
  )
}

// Componentes auxiliares

interface MetricCardProps {
  icon: React.ElementType
  label: string
  value: string
  color: string
}

function MetricCard({ icon: Icon, label, value, color }: MetricCardProps) {
  return (
    <div style={{
      background: 'white',
      padding: '20px',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        background: `${color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Icon size={24} style={{ color }} />
      </div>
      <div>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
          {label}
        </div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#1f2937' }}>
          {value}
        </div>
      </div>
    </div>
  )
}

interface DistributionBarProps {
  label: string
  value: number
  total: number
  color: string
}

function DistributionBar({ label, value, total, color }: DistributionBarProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '6px',
        fontSize: '13px'
      }}>
        <span style={{ color: '#374151', fontWeight: 500 }}>{label}</span>
        <span style={{ color: '#6b7280' }}>
          {value.toLocaleString()} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div style={{
        height: '8px',
        background: '#f3f4f6',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          background: color,
          transition: 'width 0.3s ease'
        }} />
      </div>
    </div>
  )
}

interface TopUsersTableProps {
  title: string
  users: Array<{
    username: string
    followers: number
    following: number
    verified: boolean
    blue_verified: boolean
    location: string
    description: string
  }>
  datasetMetadata?: DatasetMetadata | null
}

function TopUsersTable({ title, users, datasetMetadata }: TopUsersTableProps) {
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>('followers')
  const [page, setPage] = useState(0)

  // Construir URL de búsqueda avanzada con parámetros del scraping
  const buildTwitterSearchURL = (username: string) => {
    if (!datasetMetadata?.query) {
      return `https://twitter.com/${username}`
    }

    // Buscar tweets DEL usuario (from:) sobre el tema
    let searchQuery = `${datasetMetadata.query} from:${username}`

    if (datasetMetadata.dateRange?.start) {
      searchQuery += ` since:${datasetMetadata.dateRange.start}`
    }
    // Nota: No agregar 'until' porque Twitter no lo soporta bien en enlaces directos

    const encodedQuery = encodeURIComponent(searchQuery)
    const mode = datasetMetadata.mode === 'top' ? 'top' : 'live'

    return `https://twitter.com/search?q=${encodedQuery}&f=${mode}`
  }
  const itemsPerPage = 10
  const maxPages = 5 // Máximo 50 usuarios (5 páginas de 10)

  // Ordenar usuarios según la pestaña activa
  const sortedUsers = [...users].sort((a, b) => {
    if (activeTab === 'followers') {
      return b.followers - a.followers
    } else {
      return b.following - a.following
    }
  })

  // Paginar usuarios
  const totalPages = Math.min(Math.ceil(sortedUsers.length / itemsPerPage), maxPages)
  const paginatedUsers = sortedUsers.slice(page * itemsPerPage, (page + 1) * itemsPerPage)
  const startIndex = page * itemsPerPage

  return (
    <div style={{
      background: 'white',
      padding: '24px',
      borderRadius: '12px',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{
          margin: 0,
          fontSize: '16px',
          fontWeight: 600,
          color: '#1f2937'
        }}>
          {title}
        </h3>

        {/* Pestañas */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => { setActiveTab('followers'); setPage(0); }}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: activeTab === 'followers' ? '2px solid #3b82f6' : '1px solid #e5e7eb',
              background: activeTab === 'followers' ? '#eff6ff' : 'white',
              color: activeTab === 'followers' ? '#3b82f6' : '#6b7280',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            Por Seguidores
          </button>
          <button
            onClick={() => { setActiveTab('following'); setPage(0); }}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: activeTab === 'following' ? '2px solid #3b82f6' : '1px solid #e5e7eb',
              background: activeTab === 'following' ? '#eff6ff' : 'white',
              color: activeTab === 'following' ? '#3b82f6' : '#6b7280',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            Por Siguiendo
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ textAlign: 'left', padding: '12px', color: '#6b7280', fontWeight: 600 }}>Usuario</th>
              <th style={{ textAlign: 'right', padding: '12px', color: '#6b7280', fontWeight: 600 }}>Seguidores</th>
              <th style={{ textAlign: 'right', padding: '12px', color: '#6b7280', fontWeight: 600 }}>Siguiendo</th>
              <th style={{ textAlign: 'center', padding: '12px', color: '#6b7280', fontWeight: 600 }}>Verificado</th>
              <th style={{ textAlign: 'left', padding: '12px', color: '#6b7280', fontWeight: 600 }}>Ubicación</th>
              <th style={{ textAlign: 'center', padding: '12px', color: '#6b7280', fontWeight: 600 }}>Ver tweets</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((user, index) => (
              <tr key={user.username} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px' }}>
                  <span style={{ marginRight: '8px', color: '#9ca3af' }}>#{startIndex + index + 1}</span>
                  <a
                    href={`https://twitter.com/${user.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#1f2937',
                      fontWeight: 500,
                      textDecoration: 'none',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#1f2937'}
                  >
                    @{user.username}
                  </a>
                </td>
                <td style={{ textAlign: 'right', padding: '12px', color: '#1f2937' }}>
                  {user.followers.toLocaleString()}
                </td>
                <td style={{ textAlign: 'right', padding: '12px', color: '#6b7280' }}>
                  {user.following.toLocaleString()}
                </td>
                <td style={{ textAlign: 'center', padding: '12px' }}>
                  {user.verified ? (
                    <span style={{ color: '#3b82f6', fontWeight: 600 }}>✓ Oficial</span>
                  ) : user.blue_verified ? (
                    <span style={{ color: '#10b981', fontWeight: 600 }}>✓ Blue</span>
                  ) : (
                    <span style={{ color: '#9ca3af' }}>-</span>
                  )}
                </td>
                <td style={{ padding: '12px', color: '#6b7280' }}>
                  {user.location || '-'}
                </td>
                <td style={{ textAlign: 'center', padding: '12px' }}>
                  <a
                    href={buildTwitterSearchURL(user.username)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '6px',
                      borderRadius: '6px',
                      color: '#6b7280',
                      transition: 'all 0.2s',
                      textDecoration: 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6'
                      e.currentTarget.style.color = '#3b82f6'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.color = '#6b7280'
                    }}
                    title={datasetMetadata?.query ? `Buscar tweets de ${user.username} con "${datasetMetadata.query}"` : `Ver tweets de ${user.username}`}
                  >
                    <ExternalLink size={16} />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {sortedUsers.length > itemsPerPage && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
              background: page === 0 ? '#f9fafb' : 'white',
              color: page === 0 ? '#9ca3af' : '#374151',
              cursor: page === 0 ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (page > 0) e.currentTarget.style.background = '#f3f4f6'
            }}
            onMouseLeave={(e) => {
              if (page > 0) e.currentTarget.style.background = 'white'
            }}
          >
            ← Anterior
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#6b7280', fontSize: '13px' }}>
              Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedUsers.length)} de {Math.min(sortedUsers.length, maxPages * itemsPerPage)}
            </span>
            <span style={{ color: '#9ca3af', fontSize: '13px' }}>•</span>
            <span style={{ color: '#374151', fontSize: '13px', fontWeight: 500 }}>
              Página {page + 1} de {totalPages}
            </span>
          </div>

          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page === totalPages - 1}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
              background: page === totalPages - 1 ? '#f9fafb' : 'white',
              color: page === totalPages - 1 ? '#9ca3af' : '#374151',
              cursor: page === totalPages - 1 ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (page < totalPages - 1) e.currentTarget.style.background = '#f3f4f6'
            }}
            onMouseLeave={(e) => {
              if (page < totalPages - 1) e.currentTarget.style.background = 'white'
            }}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  )
}

interface LocationsChartProps {
  locations: Array<{ location: string; count: number }>
}

function LocationsChart({ locations }: LocationsChartProps) {
  const maxCount = Math.max(...locations.map(l => l.count))

  return (
    <div style={{
      background: 'white',
      padding: '24px',
      borderRadius: '12px',
      border: '1px solid #e5e7eb'
    }}>
      <h3 style={{
        marginTop: 0,
        marginBottom: '20px',
        fontSize: '16px',
        fontWeight: 600,
        color: '#1f2937',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <MapPin size={18} style={{ color: '#f59e0b' }} />
        Top 10 Ubicaciones
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {locations.map((loc, index) => (
          <div key={loc.location}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '6px',
              fontSize: '13px'
            }}>
              <span style={{ color: '#374151', fontWeight: 500 }}>
                <span style={{ color: '#9ca3af', marginRight: '8px' }}>#{index + 1}</span>
                {loc.location}
              </span>
              <span style={{ color: '#6b7280' }}>
                {loc.count.toLocaleString()} usuarios
              </span>
            </div>
            <div style={{
              height: '6px',
              background: '#f3f4f6',
              borderRadius: '3px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${(loc.count / maxCount) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface FollowerBucketsChartProps {
  buckets: {
    '0-100': number
    '100-1K': number
    '1K-10K': number
    '10K-100K': number
    '100K+': number
  }
}

function FollowerBucketsChart({ buckets }: FollowerBucketsChartProps) {
  const data = [
    { label: '0-100', value: buckets['0-100'], color: '#ef4444' },
    { label: '100-1K', value: buckets['100-1K'], color: '#f59e0b' },
    { label: '1K-10K', value: buckets['1K-10K'], color: '#10b981' },
    { label: '10K-100K', value: buckets['10K-100K'], color: '#3b82f6' },
    { label: '100K+', value: buckets['100K+'], color: '#8b5cf6' }
  ]

  const total = Object.values(buckets).reduce((sum, v) => sum + v, 0)
  const maxValue = Math.max(...Object.values(buckets))

  return (
    <div style={{
      background: 'white',
      padding: '24px',
      borderRadius: '12px',
      border: '1px solid #e5e7eb'
    }}>
      <h3 style={{
        marginTop: 0,
        marginBottom: '20px',
        fontSize: '16px',
        fontWeight: 600,
        color: '#1f2937',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <BarChart2 size={18} style={{ color: '#8b5cf6' }} />
        Distribución por Seguidores
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {data.map(item => {
          const percentage = total > 0 ? (item.value / total) * 100 : 0
          return (
            <div key={item.label}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                fontSize: '14px'
              }}>
                <span style={{ color: '#374151', fontWeight: 500 }}>
                  {item.label} seguidores
                </span>
                <span style={{ color: '#6b7280' }}>
                  {item.value.toLocaleString()} ({percentage.toFixed(1)}%)
                </span>
              </div>
              <div style={{
                height: '10px',
                background: '#f3f4f6',
                borderRadius: '5px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  height: '100%',
                  background: item.color,
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface BotsTableProps {
  bots: Array<{
    username: string
    isAutomated: boolean
    automatedBy: string | null
    followers: number
  }>
}

function BotsTable({ bots }: BotsTableProps) {
  return (
    <div style={{
      background: '#fef2f2',
      padding: '24px',
      borderRadius: '12px',
      border: '1px solid #fecaca'
    }}>
      <h3 style={{
        marginTop: 0,
        marginBottom: '20px',
        fontSize: '16px',
        fontWeight: 600,
        color: '#991b1b',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <Bot size={18} style={{ color: '#ef4444' }} />
        Cuentas Sospechosas de Automatización ({bots.length})
      </h3>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #fecaca' }}>
              <th style={{ textAlign: 'left', padding: '12px', color: '#991b1b', fontWeight: 600 }}>Usuario</th>
              <th style={{ textAlign: 'right', padding: '12px', color: '#991b1b', fontWeight: 600 }}>Seguidores</th>
              <th style={{ textAlign: 'left', padding: '12px', color: '#991b1b', fontWeight: 600 }}>Automatizado por</th>
            </tr>
          </thead>
          <tbody>
            {bots.map((bot, index) => (
              <tr key={bot.username} style={{ borderBottom: '1px solid #fee2e2' }}>
                <td style={{ padding: '12px', color: '#7f1d1d', fontWeight: 500 }}>
                  <span style={{ marginRight: '8px', color: '#dc2626' }}>#{index + 1}</span>
                  @{bot.username}
                </td>
                <td style={{ textAlign: 'right', padding: '12px', color: '#7f1d1d' }}>
                  {bot.followers.toLocaleString()}
                </td>
                <td style={{ padding: '12px', color: '#991b1b' }}>
                  {bot.automatedBy || 'Detectado'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: 'white',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#7f1d1d',
        lineHeight: 1.6
      }}>
        <strong>Nota:</strong> Esta detección se basa en la metadata de isAutomated proporcionada por la API.
        No es un análisis de comportamiento exhaustivo.
      </div>
    </div>
  )
}
