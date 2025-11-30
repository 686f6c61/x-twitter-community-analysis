/**
 * Tipos para el sistema de generación de reportes PDF
 */

export interface ChartImages {
  // Gráficos de usuarios
  radarChart?: string                 // Base64 del gráfico radar de engagement
  followersBarChart?: string          // Base64 del gráfico de barras de followers
  engagementBarChart?: string         // Base64 del gráfico de engagement total
  reachRatioChart?: string            // Base64 del gráfico de reach ratio

  // Timeline temporal
  timelineChart?: string              // Base64 del timeline de actividad

  // Nube de palabras
  wordCloudChart?: string             // Base64 de la nube de palabras
}

export interface ReportConfig {
  // MODO DE USO
  usageMode: 'client' | 'personal'    // Cliente (con opciones) o Personal (descarga directa)

  // BRANDING (solo para modo cliente)
  clientLogo: string | null           // Base64 del logo del cliente
  consultingLogo: string | null       // Base64 del logo de la consultora

  // CLIENTE (solo para modo cliente)
  clientName: string                  // Nombre de la empresa cliente
  clientContact: string               // Email o teléfono de contacto
  clientAddress?: string              // Dirección (opcional)

  // REPORTE
  reportTitle: string                 // Título del reporte
  reportSubtitle?: string             // Subtítulo (opcional)
  author: string                      // Autor del reporte

  // GRÁFICOS (imágenes capturadas)
  chartImages?: ChartImages           // Imágenes base64 de los gráficos

  // TIPO Y CONTENIDO
  reportType: 'executive' | 'complete'

  // OPCIONES DE CONTENIDO (solo para "complete")
  sections: {
    wordCloud: boolean
    graphVisualization: boolean
    temporalAnalysis: boolean
    influencers: boolean
    engagement: boolean
    users: boolean
    hashtags: boolean
    urls: boolean
    suspiciousUsers: boolean
    networkMotifs: boolean
    methodology: boolean
  }

  // VISUALIZACIÓN
  showLogos: boolean
  showPageNumbers: boolean
  language: 'es' | 'en'

  // NOTAS PERSONALIZADAS
  customInsights?: string
  customConclusions?: string
  disclaimer?: string
}

export const DEFAULT_REPORT_CONFIG: ReportConfig = {
  usageMode: 'personal',
  clientLogo: null,
  consultingLogo: null,
  clientName: '',
  clientContact: '',
  reportTitle: 'Análisis de Redes Sociales',
  author: 'GRAPHS Analytics',
  reportType: 'complete',
  sections: {
    wordCloud: true,
    graphVisualization: true,
    temporalAnalysis: true,
    influencers: true,
    engagement: true,
    users: true,
    hashtags: true,
    urls: true,
    suspiciousUsers: true,
    networkMotifs: true,
    methodology: true
  },
  showLogos: true,
  showPageNumbers: true,
  language: 'es'
}
