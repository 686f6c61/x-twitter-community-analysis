import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import type { Statistics } from '@/types/graph'
import { InfoModal } from '@/shared/components/InfoModal'
import { InfoButton } from '@/shared/components/InfoButton'
import { Download, Info, BadgeCheck, CheckCircle2, ExternalLink } from 'lucide-react'
import type { DatasetMetadata } from '@/lib/store/graphStore'

interface TopUsersChartsProps {
  stats: Statistics
  metadata?: DatasetMetadata | null
}

export function TopUsersCharts({ stats, metadata }: TopUsersChartsProps) {
  const [showActivityInfo, setShowActivityInfo] = useState(false)
  const [showEngagementInfo, setShowEngagementInfo] = useState(false)
  const [activityPage, setActivityPage] = useState(0)

  // Construir URL de búsqueda avanzada con parámetros del scraping
  const buildTwitterSearchURL = (username: string) => {
    if (!metadata?.query) {
      // Fallback: ir al perfil si no hay metadata
      return `https://twitter.com/${username}`
    }

    // Buscar tweets DEL usuario (from:) sobre el tema
    let searchQuery = `${metadata.query} from:${username}`

    // Agregar rango de fechas si existe (solo 'since' - 'until' causa problemas en Twitter)
    if (metadata.dateRange?.start) {
      searchQuery += ` since:${metadata.dateRange.start}`
    }
    // Nota: No agregar 'until' porque Twitter no lo soporta bien en enlaces directos

    // URL encode y agregar parámetro de modo
    const encodedQuery = encodeURIComponent(searchQuery)
    const mode = metadata.mode === 'top' ? 'top' : 'live'

    return `https://twitter.com/search?q=${encodedQuery}&f=${mode}`
  }

  // Estados para popups de columnas individuales - Top Usuarios por Actividad
  const [showFollowersInfo, setShowFollowersInfo] = useState(false)
  const [showVerifiedInfo, setShowVerifiedInfo] = useState(false)
  const [showEngagementPerTweetInfo, setShowEngagementPerTweetInfo] = useState(false)
  const [showAgeInfo, setShowAgeInfo] = useState(false)

  // Estados para popups de columnas individuales - Top Usuarios por Engagement
  const [showEngFollowersInfo, setShowEngFollowersInfo] = useState(false)
  const [showReachRatioInfo, setShowReachRatioInfo] = useState(false)
  const [showLocationInfo, setShowLocationInfo] = useState(false)
  const [engagementPage, setEngagementPage] = useState(0)

  // Estados para controlar visibilidad de series en el radar
  const [radarVisibility, setRadarVisibility] = useState({
    Likes: true,
    Replies: true,
    Views: true
  })

  const itemsPerPage = 10
  const maxPages = 5 // Máximo 50 usuarios

  // Handler para toggle de visibilidad en el radar
  const handleRadarLegendClick = (dataKey: string) => {
    setRadarVisibility(prev => ({
      ...prev,
      [dataKey]: !prev[dataKey]
    }))
  }

  // Función para obtener color según reach ratio
  const getReachRatioColor = (reachRatio: string) => {
    const ratio = parseFloat(reachRatio)
    if (isNaN(ratio)) return { bg: '#f9fafb', text: '#374151', label: 'N/A' }
    if (ratio < 0.01) return { bg: '#f9fafb', text: '#6b7280', label: 'Muy bajo' }
    if (ratio < 0.10) return { bg: '#f0fdf4', text: '#15803d', label: 'Normal bajo' }
    if (ratio < 1.00) return { bg: '#fef3c7', text: '#b45309', label: 'Normal alto' }
    if (ratio < 5.00) return { bg: '#dbeafe', text: '#1e40af', label: 'Viralización' }
    return { bg: '#fee2e2', text: '#b91c1c', label: 'Anómalo' }
  }

  // Funciones de descarga CSV
  const handleDownloadActivityUsers = () => {
    if (!stats.top_active_users || stats.top_active_users.length === 0) {
      alert('No hay datos de usuarios activos disponibles')
      return
    }

    const csvRows = []
    csvRows.push(['username', 'tweets', 'followers', 'verified', 'blue_verified', 'engagement_per_tweet', 'account_age_years'].join(','))

    const allUsers = stats.top_active_users.slice(0, 50)
    allUsers.forEach(user => {
      csvRows.push([
        user.username || user.name || '',
        user.tweets || 0,
        user.followers || 0,
        user.verified ? 'true' : 'false',
        user.blue_verified ? 'true' : 'false',
        user.engagement_per_tweet || 0,
        user.account_age_years || 0
      ].join(','))
    })

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `top_usuarios_actividad_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const handleDownloadEngagementUsers = () => {
    if (!stats.top_engagement_users || stats.top_engagement_users.length === 0) {
      alert('No hay datos de usuarios por engagement disponibles')
      return
    }

    const csvRows = []
    csvRows.push(['username', 'engagement', 'likes', 'views', 'replies', 'followers', 'reach_ratio', 'location'].join(','))

    const allUsers = stats.top_engagement_users.slice(0, 50)
    allUsers.forEach(user => {
      csvRows.push([
        user.username || user.name || '',
        user.engagement || 0,
        user.likes || 0,
        user.views || 0,
        user.replies || 0,
        user.followers || 0,
        user.reach_ratio || '0.0000',
        (user.location || '-').replace(/,/g, ';') // Replace commas to avoid CSV issues
      ].join(','))
    })

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `top_usuarios_engagement_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // Paginación para Top Usuarios por Actividad
  const allActiveUsers = stats.top_active_users || []
  const totalActivityPages = Math.min(Math.ceil(allActiveUsers.length / itemsPerPage), maxPages)
  const paginatedActiveUsers = allActiveUsers.slice(
    activityPage * itemsPerPage,
    (activityPage + 1) * itemsPerPage
  )
  const activityStartIndex = activityPage * itemsPerPage

  // Paginación para Top Usuarios por Engagement
  const allEngagementUsers = stats.top_engagement_users || []
  const totalEngagementPages = Math.min(Math.ceil(allEngagementUsers.length / itemsPerPage), maxPages)
  const paginatedEngagementUsers = allEngagementUsers.slice(
    engagementPage * itemsPerPage,
    (engagementPage + 1) * itemsPerPage
  )
  const engagementStartIndex = engagementPage * itemsPerPage

  return (
    <>
      {/* Top Usuarios por Actividad */}
      <div className="chart-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="chart-title" style={{ margin: 0 }}>
            Top Usuarios por Actividad
            <InfoButton onClick={() => setShowActivityInfo(true)} />
          </h3>
          <button
            onClick={handleDownloadActivityUsers}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
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
            Descargar CSV
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px'
          }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Usuario</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>Tweets</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                    Followers
                    <InfoButton onClick={() => setShowFollowersInfo(true)} />
                  </div>
                </th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    Verified
                    <InfoButton onClick={() => setShowVerifiedInfo(true)} />
                  </div>
                </th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                    Engagement/Tweet
                    <InfoButton onClick={() => setShowEngagementPerTweetInfo(true)} />
                  </div>
                </th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                    Age (years)
                    <InfoButton onClick={() => setShowAgeInfo(true)} />
                  </div>
                </th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>Ver tweets</th>
              </tr>
            </thead>
            <tbody>
              {paginatedActiveUsers.map((user, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <a
                        href={`https://twitter.com/${user.username || user.name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#1f2937', textDecoration: 'none', fontWeight: 500 }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#1f2937'}
                      >
                        {user.name}
                      </a>
                      {user.verified && <BadgeCheck size={16} style={{ color: '#1d9bf0' }} title="Verified" />}
                      {user.blue_verified && <CheckCircle2 size={16} style={{ color: '#1d9bf0' }} title="Blue Verified" />}
                    </div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>
                    <a
                      href={buildTwitterSearchURL(user.username || user.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#1f2937', textDecoration: 'none' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#3b82f6'
                        e.currentTarget.style.textDecoration = 'underline'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#1f2937'
                        e.currentTarget.style.textDecoration = 'none'
                      }}
                      title={metadata?.query ? `Buscar tweets de ${user.name} con "${metadata.query}"` : `Ver tweets de ${user.name}`}
                    >
                      {user.tweets?.toLocaleString() || 0}
                    </a>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    {user.followers?.toLocaleString() || 0}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {user.verified ? <BadgeCheck size={14} style={{ color: '#1d9bf0', margin: '0 auto', display: 'block' }} /> : user.blue_verified ? <CheckCircle2 size={14} style={{ color: '#1d9bf0', margin: '0 auto', display: 'block' }} /> : '-'}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    {user.engagement_per_tweet?.toLocaleString() || 0}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    {user.account_age_years || 0}
                  </td>
                  <td style={{ textAlign: 'center', padding: '12px' }}>
                    <a
                      href={buildTwitterSearchURL(user.username || user.name)}
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
                      title={metadata?.query ? `Buscar tweets de ${user.name} con "${metadata.query}"` : `Ver tweets de ${user.name}`}
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
        {allActiveUsers.length > itemsPerPage && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid #e5e7eb'
          }}>
            <button
              onClick={() => setActivityPage(Math.max(0, activityPage - 1))}
              disabled={activityPage === 0}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                background: activityPage === 0 ? '#f9fafb' : 'white',
                color: activityPage === 0 ? '#9ca3af' : '#374151',
                cursor: activityPage === 0 ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (activityPage > 0) e.currentTarget.style.background = '#f3f4f6'
              }}
              onMouseLeave={(e) => {
                if (activityPage > 0) e.currentTarget.style.background = 'white'
              }}
            >
              ← Anterior
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: '#6b7280', fontSize: '13px' }}>
                Mostrando {activityStartIndex + 1}-{Math.min(activityStartIndex + itemsPerPage, allActiveUsers.length)} de {Math.min(allActiveUsers.length, maxPages * itemsPerPage)}
              </span>
              <span style={{ color: '#9ca3af', fontSize: '13px' }}>•</span>
              <span style={{ color: '#374151', fontSize: '13px', fontWeight: 500 }}>
                Página {activityPage + 1} de {totalActivityPages}
              </span>
            </div>

            <button
              onClick={() => setActivityPage(Math.min(totalActivityPages - 1, activityPage + 1))}
              disabled={activityPage === totalActivityPages - 1}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                background: activityPage === totalActivityPages - 1 ? '#f9fafb' : 'white',
                color: activityPage === totalActivityPages - 1 ? '#9ca3af' : '#374151',
                cursor: activityPage === totalActivityPages - 1 ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (activityPage < totalActivityPages - 1) e.currentTarget.style.background = '#f3f4f6'
              }}
              onMouseLeave={(e) => {
                if (activityPage < totalActivityPages - 1) e.currentTarget.style.background = 'white'
              }}
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>

      {/* Grid 2x1: Gráficos de Engagement Radar y Followers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Gráfico de Radar - Engagement por Usuario */}
        <div className="chart-card">
          <h3 className="chart-title">
            Engagement por Usuario (Radar)
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
            <Info size={14} />
            <span>Haz clic en cualquier punto del gráfico para abrir el perfil de Twitter</span>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart
              data={allActiveUsers.slice(0, 10).map(user => {
              const totalEngagement = (user.engagement_per_tweet || 0) * (user.tweets || 1)
              return {
                name: user.name.length > 12 ? user.name.substring(0, 12) + '...' : user.name,
                username: user.username || user.name,
                Likes: Math.round(totalEngagement * 0.4), // Estimación
                Replies: Math.round(totalEngagement * 0.2),
                Views: Math.round(totalEngagement * 0.4),
              }
            })}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis angle={90} domain={[0, 'auto']} tick={{ fontSize: 11 }} />
              {radarVisibility.Likes && (
                <Radar
                  name="Likes"
                  dataKey="Likes"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.5}
                  cursor="pointer"
                  onClick={(data: any) => {
                    if (data && data.payload && data.payload.username) {
                      window.open(`https://twitter.com/${data.payload.username}`, '_blank')
                    }
                  }}
                />
              )}
              {radarVisibility.Replies && (
                <Radar
                  name="Replies"
                  dataKey="Replies"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.5}
                  cursor="pointer"
                  onClick={(data: any) => {
                    if (data && data.payload && data.payload.username) {
                      window.open(`https://twitter.com/${data.payload.username}`, '_blank')
                    }
                  }}
                />
              )}
              {radarVisibility.Views && (
                <Radar
                  name="Views"
                  dataKey="Views"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.5}
                  cursor="pointer"
                  onClick={(data: any) => {
                    if (data && data.payload && data.payload.username) {
                      window.open(`https://twitter.com/${data.payload.username}`, '_blank')
                    }
                  }}
                />
              )}
              <Legend
                onClick={(e) => handleRadarLegendClick(e.dataKey)}
                wrapperStyle={{ cursor: 'pointer' }}
                formatter={(value: string) => (
                  <span style={{
                    opacity: radarVisibility[value as keyof typeof radarVisibility] ? 1 : 0.5,
                    textDecoration: radarVisibility[value as keyof typeof radarVisibility] ? 'none' : 'line-through'
                  }}>
                    {value}
                  </span>
                )}
              />
              <Tooltip
                formatter={(value: number) => value.toLocaleString()}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '13px'
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Barras - Followers */}
        <div className="chart-card">
          <h3 className="chart-title">Followers por Usuario</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
            <Info size={14} />
            <span>Haz clic en cualquier barra para abrir el perfil de Twitter</span>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={allActiveUsers.slice(0, 10).map(user => ({
              name: user.name.length > 12 ? user.name.substring(0, 12) + '...' : user.name,
              username: user.username || user.name,
              followers: user.followers || 0
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={100}
                fontSize={11}
              />
              <YAxis fontSize={11} />
              <Tooltip
                formatter={(value: number) => value.toLocaleString()}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '13px'
                }}
              />
              <Bar
                dataKey="followers"
                fill="#3b82f6"
                name="Followers"
                cursor="pointer"
                onClick={(data: any) => {
                  if (data && data.username) {
                    window.open(`https://twitter.com/${data.username}`, '_blank')
                  }
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Usuarios / Engagement */}
      <div className="chart-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="chart-title" style={{ margin: 0 }}>
            Usuarios / Engagement
            <InfoButton onClick={() => setShowEngagementInfo(true)} />
          </h3>
          <button
            onClick={handleDownloadEngagementUsers}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
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
            Descargar CSV
          </button>
        </div>

        {/* Tabla detallada */}
        <div style={{ marginBottom: '32px', overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px'
          }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Usuario</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>Engagement</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>Likes</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>Views</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>Replies</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                    Followers
                    <InfoButton onClick={() => setShowEngFollowersInfo(true)} />
                  </div>
                </th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                    Reach Ratio
                    <InfoButton onClick={() => setShowReachRatioInfo(true)} />
                  </div>
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Location
                    <InfoButton onClick={() => setShowLocationInfo(true)} />
                  </div>
                </th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>Ver tweets</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEngagementUsers.map((user, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <a
                        href={`https://twitter.com/${user.username || user.name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#1f2937', textDecoration: 'none', fontWeight: 500 }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#1f2937'}
                      >
                        {user.name}
                      </a>
                      {user.verified && <BadgeCheck size={16} style={{ color: '#1d9bf0' }} title="Verified" />}
                      {user.blue_verified && <CheckCircle2 size={16} style={{ color: '#1d9bf0' }} title="Blue Verified" />}
                    </div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>
                    {user.engagement?.toLocaleString() || 0}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    {user.likes?.toLocaleString() || 0}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    {user.views?.toLocaleString() || 0}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    {user.replies?.toLocaleString() || 0}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    {user.followers?.toLocaleString() || 0}
                  </td>
                  <td style={{
                    padding: '12px',
                    textAlign: 'right',
                    background: getReachRatioColor(user.reach_ratio || '0').bg,
                    color: getReachRatioColor(user.reach_ratio || '0').text,
                    fontWeight: 600
                  }}>
                    {user.reach_ratio || '0.0000'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {user.location || '-'}
                  </td>
                  <td style={{ textAlign: 'center', padding: '12px' }}>
                    <a
                      href={buildTwitterSearchURL(user.username || user.name)}
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
                      title={metadata?.query ? `Buscar tweets de ${user.name} con "${metadata.query}"` : `Ver tweets de ${user.name}`}
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
        {allEngagementUsers.length > itemsPerPage && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px',
            paddingTop: '16px',
            borderTop: '1px solid #e5e7eb'
          }}>
            <button
              onClick={() => setEngagementPage(Math.max(0, engagementPage - 1))}
              disabled={engagementPage === 0}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                background: engagementPage === 0 ? '#f9fafb' : 'white',
                color: engagementPage === 0 ? '#9ca3af' : '#374151',
                cursor: engagementPage === 0 ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (engagementPage > 0) e.currentTarget.style.background = '#f3f4f6'
              }}
              onMouseLeave={(e) => {
                if (engagementPage > 0) e.currentTarget.style.background = 'white'
              }}
            >
              ← Anterior
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: '#6b7280', fontSize: '13px' }}>
                Mostrando {engagementStartIndex + 1}-{Math.min(engagementStartIndex + itemsPerPage, allEngagementUsers.length)} de {Math.min(allEngagementUsers.length, maxPages * itemsPerPage)}
              </span>
              <span style={{ color: '#9ca3af', fontSize: '13px' }}>•</span>
              <span style={{ color: '#374151', fontSize: '13px', fontWeight: 500 }}>
                Página {engagementPage + 1} de {totalEngagementPages}
              </span>
            </div>

            <button
              onClick={() => setEngagementPage(Math.min(totalEngagementPages - 1, engagementPage + 1))}
              disabled={engagementPage === totalEngagementPages - 1}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                background: engagementPage === totalEngagementPages - 1 ? '#f9fafb' : 'white',
                color: engagementPage === totalEngagementPages - 1 ? '#9ca3af' : '#374151',
                cursor: engagementPage === totalEngagementPages - 1 ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (engagementPage < totalEngagementPages - 1) e.currentTarget.style.background = '#f3f4f6'
              }}
              onMouseLeave={(e) => {
                if (engagementPage < totalEngagementPages - 1) e.currentTarget.style.background = 'white'
              }}
            >
              Siguiente →
            </button>
          </div>
        )}

        {/* Grid 2x1: Radar de Engagement + Radar de Reach Ratio */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Radar de Engagement */}
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: '#374151' }}>
              Engagement Total
            </h4>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart
                data={allEngagementUsers.slice(0, 10).map(user => ({
                  name: user.name.length > 12 ? user.name.substring(0, 12) + '...' : user.name,
                  username: user.username || user.name,
                  Engagement: user.engagement || 0,
                }))}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 'auto']} tick={{ fontSize: 11 }} />
                <Radar
                  name="Engagement"
                  dataKey="Engagement"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                  cursor="pointer"
                  onClick={(data: any) => {
                    if (data && data.payload && data.payload.username) {
                      window.open(`https://twitter.com/${data.payload.username}`, '_blank')
                    }
                  }}
                />
                <Legend />
                <Tooltip
                  formatter={(value: number) => value.toLocaleString()}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '13px'
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Radar de Reach Ratio */}
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: '#374151' }}>
              Reach Ratio
            </h4>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart
                data={allEngagementUsers.slice(0, 10).map(user => {
                  const reachRatio = parseFloat(user.reach_ratio || '0')
                  return {
                    name: user.name.length > 12 ? user.name.substring(0, 12) + '...' : user.name,
                    username: user.username || user.name,
                    'Reach Ratio': reachRatio,
                  }
                })}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 'auto']} tick={{ fontSize: 11 }} />
                <Radar
                  name="Reach Ratio"
                  dataKey="Reach Ratio"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.6}
                  cursor="pointer"
                  onClick={(data: any) => {
                    if (data && data.payload && data.payload.username) {
                      window.open(`https://twitter.com/${data.payload.username}`, '_blank')
                    }
                  }}
                />
                <Legend />
                <Tooltip
                  formatter={(value: number) => value.toFixed(4)}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '13px'
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Modales informativos */}
      <InfoModal
        isOpen={showActivityInfo}
        onClose={() => setShowActivityInfo(false)}
        title="Top Usuarios por Actividad"
      >
        <h4 style={{ marginTop: 0, marginBottom: '12px' }}>¿Qué mide esta métrica?</h4>
        <p>Esta métrica identifica a los usuarios más activos en la conversación analizada, basándose en el <strong>número total de tweets</strong> que cada usuario ha publicado durante el período de estudio.</p>
        <p>Es una medida cuantitativa simple que permite identificar qué actores tienen mayor presencia volumétrica en el discurso.</p>

        <h4 style={{ marginBottom: '12px' }}>Metodología de cálculo</h4>
        <p>El sistema procesa todos los tweets del dataset y realiza las siguientes operaciones:</p>
        <ol style={{ marginLeft: '20px', marginBottom: '16px', lineHeight: 1.8 }}>
          <li>Para cada tweet, se identifica su autor mediante el campo de nombre de usuario</li>
          <li>Se mantiene un contador acumulativo para cada usuario único</li>
          <li>Una vez procesados todos los tweets, se ordenan los usuarios en orden descendente según su contador</li>
          <li>Se seleccionan los top 20 usuarios con mayor actividad</li>
        </ol>

        <h4 style={{ marginBottom: '12px' }}>Interpretación académica</h4>
        <p>Un alto volumen de tweets por parte de un usuario puede tener múltiples interpretaciones en el análisis de redes sociales:</p>
        <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
          <li><strong>Líderes de opinión:</strong> Personas con alta influencia que participan activamente en la conversación para guiar el discurso</li>
          <li><strong>Cuentas automatizadas (bots):</strong> Perfiles con patrones de publicación anormalmente altos que pueden indicar automatización</li>
          <li><strong>Activistas digitales:</strong> Usuarios comprometidos con una causa que utilizan la plataforma para difundir su mensaje</li>
          <li><strong>Medios o instituciones:</strong> Organizaciones con estrategias de comunicación intensivas</li>
        </ul>

        <h4 style={{ marginBottom: '12px' }}>Consideraciones metodológicas</h4>
        <p>Es importante notar que esta métrica <strong>no distingue entre calidad y cantidad</strong>. Un usuario con muchos tweets no necesariamente tiene más influencia o genera más impacto que uno con menos publicaciones pero mayor engagement.</p>
        <p>Se recomienda analizar esta métrica en conjunto con "Top Usuarios por Engagement" para obtener una visión más completa del ecosistema comunicacional.</p>
      </InfoModal>

      <InfoModal
        isOpen={showEngagementInfo}
        onClose={() => setShowEngagementInfo(false)}
        title="Top Usuarios por Engagement"
      >
        <h4 style={{ marginTop: 0, marginBottom: '12px' }}>¿Qué mide esta métrica?</h4>
        <p>El <strong>engagement</strong> es una métrica compuesta que identifica a los usuarios cuyo contenido genera mayor <strong>interacción y alcance</strong> en la plataforma. A diferencia de la métrica de actividad (que mide cantidad de publicaciones), el engagement evalúa la <strong>calidad del impacto</strong> y la <strong>capacidad de influencia</strong> del contenido publicado.</p>
        <p>Esta métrica es fundamental para identificar líderes de opinión reales, distinguiéndolos de cuentas meramente activas pero sin influencia efectiva.</p>

        <h4 style={{ marginBottom: '12px' }}>Fórmula matemática</h4>
        <p>Para cada usuario <em>u</em> en el dataset, el engagement total se calcula como:</p>
        <p style={{ background: '#f5f5f5', padding: '16px', borderRadius: '6px', fontSize: '14px', textAlign: 'center', margin: '16px 0' }}>
          E<sub>u</sub> = Σ(likes<sub>i</sub>) + Σ(views<sub>i</sub>) + Σ(replies<sub>i</sub>)
        </p>
        <p style={{ fontSize: '13px', marginTop: '12px' }}>
          Donde <em>i</em> representa cada tweet publicado por el usuario <em>u</em>, y Σ denota la suma acumulativa de todas sus publicaciones en el período analizado.
        </p>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '12px', background: '#fffbf0', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #f59e0b' }}>
          <strong>Nota importante:</strong> Los retweets se recopilan en el dataset pero <strong>NO se incluyen</strong> en el cálculo de engagement. Esta decisión metodológica se basa en que los retweets reflejan difusión pasiva, mientras que likes, views y replies representan interacción activa y deliberada.
        </p>

        <h4 style={{ marginBottom: '12px' }}>¿Por qué es importante?</h4>
        <p>Esta métrica es crucial en el análisis de redes sociales por varias razones:</p>
        <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
          <li><strong>Identificación de influencers:</strong> Permite distinguir entre usuarios meramente activos y aquellos que realmente influyen en la conversación pública</li>
          <li><strong>Calidad sobre cantidad:</strong> Un usuario con pocas publicaciones pero alto engagement puede ser más relevante que uno con muchas publicaciones sin interacción</li>
          <li><strong>Legitimidad del discurso:</strong> Alto engagement sugiere que el contenido resuena con la audiencia y no es producto de automatización o spam</li>
          <li><strong>Análisis de campañas:</strong> Permite evaluar el impacto real de estrategias de comunicación digital</li>
          <li><strong>Detección de información viral:</strong> Usuarios con alto engagement son vectores clave para la propagación de narrativas</li>
        </ul>

        <h4 style={{ marginBottom: '12px' }}>Algoritmo de cálculo</h4>
        <p>El sistema implementa un algoritmo de agregación y ordenamiento en el procesador de datos:</p>
        <ol style={{ marginLeft: '20px', marginBottom: '16px', lineHeight: 1.8 }}>
          <li><strong>Inicialización:</strong> Se crea una estructura de datos (mapa hash) donde cada clave es un nombre de usuario y su valor es un objeto con contadores inicializados en cero</li>
          <li><strong>Procesamiento iterativo:</strong> Para cada tweet del dataset:
            <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
              <li>Se extrae el identificador del autor</li>
              <li>Se extraen las métricas de interacción: likes, views y replies</li>
              <li>Se acumulan estas métricas en el contador del usuario correspondiente</li>
              <li>Se maneja el caso de valores nulos o indefinidos asignando valor cero por defecto</li>
            </ul>
          </li>
          <li><strong>Cálculo de engagement:</strong> Una vez procesados todos los tweets, para cada usuario se realiza la suma de sus tres métricas: likes más views más replies</li>
          <li><strong>Ordenamiento:</strong> Se aplica un algoritmo de ordenamiento descendente (típicamente QuickSort) basado en el valor de engagement calculado</li>
          <li><strong>Selección:</strong> Se extraen los top 20 usuarios con mayor engagement para la visualización en tabla, y los top 10 para el gráfico de barras apiladas</li>
        </ol>

        <h4 style={{ marginBottom: '12px' }}>Componentes del Engagement</h4>
        <p>Cada componente aporta una dimensión específica de la interacción:</p>
        <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
          <li><strong>Likes (Aprobación):</strong> Indican acuerdo o aprobación del contenido. Son la forma más rápida y sencilla de interacción, reflejando resonancia emocional o ideológica</li>
          <li><strong>Views (Alcance):</strong> Miden el número de impresiones del contenido. Un alto número de views indica que el contenido alcanzó una audiencia amplia, aunque no garantiza interacción profunda</li>
          <li><strong>Replies (Conversación):</strong> Representan el nivel más alto de engagement, ya que requieren inversión de tiempo y esfuerzo cognitivo. Indican que el contenido generó suficiente interés como para provocar una respuesta elaborada</li>
        </ul>

        <h4 style={{ marginBottom: '12px' }}>Interpretación académica</h4>
        <p>Desde una perspectiva de análisis de redes sociales y comunicación política digital:</p>
        <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
          <li>Alto engagement combinado con alta actividad sugiere un <strong>líder de opinión legítimo</strong> con capacidad de movilización</li>
          <li>Alto engagement con baja actividad indica un <strong>influencer selectivo</strong> cuyo contenido tiene alto valor percibido</li>
          <li>Baja actividad con bajo engagement puede señalar cuentas <strong>periféricas</strong> o nuevas en la red</li>
          <li>Alta actividad con bajo engagement es un <strong>indicador potencial de automatización</strong> (bots o cuentas spam)</li>
        </ul>

        <h4 style={{ marginBottom: '12px' }}>Consideraciones metodológicas</h4>
        <p>Es importante tener en cuenta las limitaciones de esta métrica:</p>
        <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
          <li>El engagement puede ser <strong>artificialmente inflado</strong> mediante estrategias de astroturfing o granjas de bots</li>
          <li>La métrica no distingue entre engagement <strong>positivo y negativo</strong> (apoyo vs. crítica)</li>
          <li>Usuarios con audiencias grandes tienen ventaja estructural en métricas absolutas; para análisis más equitativo se puede calcular <strong>engagement rate</strong> (engagement/followers)</li>
          <li>Se recomienda triangular esta métrica con análisis de centralidad de red, análisis de sentimiento y detección de bots para obtener una imagen completa del ecosistema informativo</li>
        </ul>
      </InfoModal>

      {/* Modales para columnas individuales */}
      <InfoModal
        isOpen={showFollowersInfo}
        onClose={() => setShowFollowersInfo(false)}
        title="Followers (Seguidores)"
      >
        <h4 style={{ marginTop: 0, marginBottom: '12px' }}>¿Qué mide?</h4>
        <p>Número de seguidores del usuario en Twitter. Indica el <strong>tamaño de su audiencia potencial</strong> y su <strong>capacidad de difusión</strong>.</p>

        <h4 style={{ marginBottom: '12px' }}>Interpretación</h4>
        <p>Un alto número de seguidores sugiere:</p>
        <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
          <li><strong>Mayor alcance potencial:</strong> Cada tweet puede llegar a una audiencia más amplia</li>
          <li><strong>Influencia social:</strong> El usuario tiene credibilidad establecida en la red</li>
          <li><strong>Capacidad de viralización:</strong> Mayor probabilidad de que el contenido se difunda rápidamente</li>
        </ul>

        <p style={{ background: '#fffbf0', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #f59e0b', fontSize: '13px', marginTop: '16px' }}>
          <strong>Nota:</strong> El número de seguidores por sí solo no garantiza influencia efectiva. Es importante analizar también el engagement rate (interacción por seguidor) para determinar la influencia real.
        </p>
      </InfoModal>

      <InfoModal
        isOpen={showVerifiedInfo}
        onClose={() => setShowVerifiedInfo(false)}
        title="Verified (Verificación)"
      >
        <h4 style={{ marginTop: 0, marginBottom: '12px' }}>¿Qué indica?</h4>
        <p>Estado de verificación de la cuenta de Twitter. Existen dos tipos principales de verificación:</p>

        <h4 style={{ marginBottom: '12px' }}>Tipos de verificación</h4>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #3b82f6', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BadgeCheck size={18} style={{ color: '#1e40af' }} />
              <strong style={{ color: '#1e40af' }}>Verificación Oficial (Business/Government)</strong>
            </div>
            <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>
              Cuentas de organizaciones, empresas, medios de comunicación, instituciones gubernamentales o figuras públicas auténticas. Garantiza autenticidad e identidad oficial.
            </p>
          </div>

          <div style={{ background: '#f0f9ff', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #0ea5e9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} style={{ color: '#0369a1' }} />
              <strong style={{ color: '#0369a1' }}>Blue Verified (Twitter Blue)</strong>
            </div>
            <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>
              Verificación de pago disponible para cualquier usuario mediante suscripción a Twitter Blue. No garantiza autenticidad oficial, pero confirma que la cuenta es de una persona real que ha pagado por el servicio.
            </p>
          </div>
        </div>

        <h4 style={{ marginBottom: '12px' }}>Importancia en el análisis</h4>
        <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
          <li><strong>Credibilidad:</strong> Las cuentas verificadas oficialmente tienden a tener mayor legitimidad y confianza pública</li>
          <li><strong>Detección de desinformación:</strong> Cuentas no verificadas con alto alcance requieren mayor escrutinio</li>
          <li><strong>Identificación de fuentes:</strong> Facilita distinguir cuentas oficiales de parodias o imitaciones</li>
        </ul>
      </InfoModal>

      <InfoModal
        isOpen={showEngagementPerTweetInfo}
        onClose={() => setShowEngagementPerTweetInfo(false)}
        title="Engagement/Tweet (Engagement por Tweet)"
      >
        <h4 style={{ marginTop: 0, marginBottom: '12px' }}>¿Qué mide?</h4>
        <p>Engagement promedio que genera cada tweet del usuario. Mide la <strong>calidad promedio</strong> del contenido en términos de interacción.</p>

        <h4 style={{ marginBottom: '12px' }}>Fórmula de cálculo</h4>
        <p style={{ background: '#f5f5f5', padding: '16px', borderRadius: '6px', fontSize: '14px', textAlign: 'center', margin: '16px 0' }}>
          Engagement/Tweet = (Likes + Views + Replies) / Número de Tweets
        </p>

        <h4 style={{ marginBottom: '12px' }}>Interpretación</h4>
        <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
          <li><strong>Valor alto:</strong> El contenido del usuario genera consistentemente alta interacción. Indica calidad, relevancia y resonancia con la audiencia</li>
          <li><strong>Valor bajo:</strong> Poca interacción por tweet. Puede indicar contenido poco relevante, spam, o desconexión con la audiencia</li>
          <li><strong>Comparación:</strong> Permite comparar usuarios independientemente de su volumen de publicación</li>
        </ul>

        <h4 style={{ marginBottom: '12px' }}>Diferencia con Engagement Total</h4>
        <p>Mientras que el <strong>engagement total</strong> mide el impacto acumulativo, el <strong>engagement/tweet</strong> normaliza por cantidad de publicaciones, revelando la <strong>eficiencia</strong> de cada mensaje.</p>

        <p style={{ background: '#f0fdf4', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #22c55e', fontSize: '13px', marginTop: '16px' }}>
          <strong>Ejemplo:</strong> Un usuario con 10 tweets y 10,000 engagement tiene 1,000 eng/tweet. Otro con 100 tweets y 20,000 engagement tiene 200 eng/tweet. El primero tiene mejor calidad promedio por publicación.
        </p>
      </InfoModal>

      <InfoModal
        isOpen={showAgeInfo}
        onClose={() => setShowAgeInfo(false)}
        title="Age (Antigüedad de la Cuenta)"
      >
        <h4 style={{ marginTop: 0, marginBottom: '12px' }}>¿Qué mide?</h4>
        <p>Años transcurridos desde la creación de la cuenta de Twitter hasta la fecha actual.</p>

        <h4 style={{ marginBottom: '12px' }}>Importancia en el análisis</h4>
        <p>La antigüedad de la cuenta es un indicador relevante para:</p>
        <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
          <li><strong>Detección de cuentas sospechosas:</strong> Cuentas muy nuevas (&lt;1 año) con alta actividad pueden indicar creación para campañas específicas o automatización</li>
          <li><strong>Credibilidad histórica:</strong> Cuentas antiguas con historial consistente tienden a tener mayor legitimidad</li>
          <li><strong>Identificación de trolls:</strong> Cuentas creadas recientemente para participar en eventos específicos requieren mayor escrutinio</li>
          <li><strong>Análisis de campañas coordinadas:</strong> Grupos de cuentas con antigüedad similar pueden indicar operaciones de astroturfing</li>
        </ul>

        <h4 style={{ marginBottom: '12px' }}>Patrones a observar</h4>
        <div style={{ marginTop: '16px' }}>
          <div style={{ background: '#fee2e2', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #ef4444', marginBottom: '12px' }}>
            <strong style={{ color: '#b91c1c' }}>Señal de alerta:</strong>
            <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>
              Cuenta con menos de 90 días de antigüedad + Alta actividad (muchos tweets) + Alto engagement = Posible bot o cuenta creada para campaña específica
            </p>
          </div>

          <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #22c55e' }}>
            <strong style={{ color: '#15803d' }}>Señal de confianza:</strong>
            <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>
              Cuenta con varios años de antigüedad + Historial de actividad consistente = Mayor probabilidad de ser cuenta legítima
            </p>
          </div>
        </div>

        <p style={{ background: '#fffbf0', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #f59e0b', fontSize: '13px', marginTop: '16px' }}>
          <strong>Nota metodológica:</strong> La antigüedad debe analizarse en conjunto con otras métricas (actividad, engagement, patrones de publicación) para obtener una evaluación completa de la cuenta.
        </p>
      </InfoModal>

      {/* Modales para Usuarios / Engagement */}
      <InfoModal
        isOpen={showEngFollowersInfo}
        onClose={() => setShowEngFollowersInfo(false)}
        title="Followers (Seguidores)"
      >
        <h4 style={{ marginTop: 0, marginBottom: '12px' }}>¿Qué mide?</h4>
        <p>Número de seguidores del usuario en Twitter. Indica el <strong>tamaño de su audiencia potencial</strong> y su <strong>capacidad de difusión</strong>.</p>

        <h4 style={{ marginBottom: '12px' }}>Interpretación</h4>
        <p>Un alto número de seguidores sugiere:</p>
        <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
          <li><strong>Mayor alcance potencial:</strong> Cada tweet puede llegar a una audiencia más amplia</li>
          <li><strong>Influencia social:</strong> El usuario tiene credibilidad establecida en la red</li>
          <li><strong>Capacidad de viralización:</strong> Mayor probabilidad de que el contenido se difunda rápidamente</li>
        </ul>

        <p style={{ background: '#fffbf0', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #f59e0b', fontSize: '13px', marginTop: '16px' }}>
          <strong>Nota:</strong> El número de seguidores por sí solo no garantiza influencia efectiva. Es importante analizar también el engagement rate (interacción por seguidor) para determinar la influencia real.
        </p>
      </InfoModal>

      <InfoModal
        isOpen={showReachRatioInfo}
        onClose={() => setShowReachRatioInfo(false)}
        title="Reach Ratio (Ratio de Alcance)"
      >
        <h4 style={{ marginTop: 0, marginBottom: '12px' }}>¿Qué mide?</h4>
        <p>El Reach Ratio mide la <strong>eficiencia de alcance</strong>: ¿cuánta interacción genera el usuario en relación a su audiencia?</p>

        <h4 style={{ marginBottom: '12px' }}>Fórmula de cálculo</h4>
        <p style={{ background: '#f5f5f5', padding: '16px', borderRadius: '6px', fontSize: '14px', textAlign: 'center', margin: '16px 0' }}>
          Reach Ratio = Total Engagement / Followers
        </p>

        <h4 style={{ marginBottom: '12px' }}>Rangos de interpretación</h4>
        <div style={{ marginTop: '16px' }}>
          <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #9ca3af', marginBottom: '12px' }}>
            <strong style={{ color: '#6b7280' }}>&lt; 0.01 (Muy bajo)</strong>
            <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>
              Audiencia masiva pero muy poca interacción relativa. Puede indicar seguidores inactivos o desinteresados.
            </p>
          </div>

          <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #22c55e', marginBottom: '12px' }}>
            <strong style={{ color: '#15803d' }}>0.01 - 0.10 (Normal bajo)</strong>
            <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>
              Típico de cuentas grandes (medios, instituciones). Engagement bajo pero audiencia masiva.
            </p>
          </div>

          <div style={{ background: '#fef3c7', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #f59e0b', marginBottom: '12px' }}>
            <strong style={{ color: '#b45309' }}>0.10 - 1.00 (Normal alto)</strong>
            <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>
              Audiencia mediana con buena interacción. Engagement proporcional a followers.
            </p>
          </div>

          <div style={{ background: '#dbeafe', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #3b82f6', marginBottom: '12px' }}>
            <strong style={{ color: '#1e40af' }}>1.00 - 5.00 (Viralización)</strong>
            <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>
              Contenido trasciende audiencia base. Típico de tweets virales o micro-influencers.
            </p>
          </div>

          <div style={{ background: '#fee2e2', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #ef4444' }}>
            <strong style={{ color: '#b91c1c' }}>&gt; 5.00 (Anómalo)</strong>
            <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>
              Puede indicar amplificación artificial, bots, o viralización extrema. Requiere inspección.
            </p>
          </div>
        </div>

        <h4 style={{ marginBottom: '12px' }}>Utilidad analítica</h4>
        <p>El Reach Ratio es especialmente útil para:</p>
        <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
          <li><strong>Comparar cuentas de diferentes tamaños:</strong> Normaliza el engagement según la audiencia base</li>
          <li><strong>Detectar contenido viral:</strong> Ratios altos indican que el contenido se está difundiendo más allá de los seguidores directos</li>
          <li><strong>Identificar anomalías:</strong> Ratios extremos pueden señalar manipulación o comportamiento inorgánico</li>
          <li><strong>Evaluar calidad de audiencia:</strong> Un ratio bajo puede indicar seguidores comprados o inactivos</li>
        </ul>
      </InfoModal>

      <InfoModal
        isOpen={showLocationInfo}
        onClose={() => setShowLocationInfo(false)}
        title="Location (Ubicación)"
      >
        <h4 style={{ marginTop: 0, marginBottom: '12px' }}>¿Qué representa?</h4>
        <p>Ubicación geográfica autodeclarada por el usuario en su perfil de Twitter. Este campo es de texto libre y no está verificado por la plataforma.</p>

        <h4 style={{ marginBottom: '12px' }}>Utilidad en el análisis</h4>
        <p>La ubicación es útil para:</p>
        <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
          <li><strong>Análisis de distribución geográfica:</strong> Identificar desde dónde se origina el discurso y qué regiones participan más en la conversación</li>
          <li><strong>Detección de campañas coordinadas:</strong> Concentraciones inusuales en ubicaciones específicas pueden indicar operaciones organizadas</li>
          <li><strong>Contexto cultural:</strong> La ubicación ayuda a interpretar el contenido dentro de marcos culturales y políticos locales</li>
          <li><strong>Verificación de autenticidad:</strong> Cuentas con ubicaciones genéricas o sin especificar pueden requerir mayor escrutinio</li>
        </ul>

        <h4 style={{ marginBottom: '12px' }}>Limitaciones</h4>
        <div style={{ background: '#fffbf0', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #f59e0b', fontSize: '13px' }}>
          <strong>Advertencias metodológicas:</strong>
          <ul style={{ marginLeft: '20px', marginTop: '8px', marginBottom: 0 }}>
            <li>El campo es autodeclarado y no verificado: los usuarios pueden introducir información falsa, humorística o ambigua</li>
            <li>Muchos usuarios dejan este campo vacío o usan valores genéricos como "Internet", "En todas partes", etc.</li>
            <li>La ubicación del perfil no necesariamente corresponde con la ubicación real desde donde se publican los tweets</li>
            <li>Para análisis geográfico preciso, se recomienda usar geolocalización de tweets (cuando esté disponible) en lugar del campo de perfil</li>
          </ul>
        </div>
      </InfoModal>
    </>
  )
}
