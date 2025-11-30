import { useState, useRef } from 'react'
import { FileText, Upload, Download, CheckCircle, AlertCircle, User, Briefcase, AlertTriangle, BarChart3, FileBarChart } from 'lucide-react'
import { useGraphData } from '@/shared/hooks/useGraphData'
import { useGraphStore } from '@/lib/store/graphStore'
import type { ReportConfig } from '@/types/report'
import { DEFAULT_REPORT_CONFIG } from '@/types/report'
import { generateExecutiveReport } from '@/lib/utils/pdfGenerators/executiveReport'
import { generateCompleteReport } from '@/lib/utils/pdfGenerators/completeReport'
import { ChartCapture, type ChartCaptureHandle } from '@/features/reports/components/ChartCapture'

export function InformesPage() {
  const { mentions, cohashtags, statistics, urlAnalysis } = useGraphData()
  const datasetMetadata = useGraphStore((state) => state.datasetMetadata)

  const [config, setConfig] = useState<ReportConfig>(DEFAULT_REPORT_CONFIG)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [dragActiveClient, setDragActiveClient] = useState(false)
  const [dragActiveConsulting, setDragActiveConsulting] = useState(false)

  const clientLogoInputRef = useRef<HTMLInputElement>(null)
  const consultingLogoInputRef = useRef<HTMLInputElement>(null)
  const chartCaptureRef = useRef<ChartCaptureHandle>(null)

  const hasData = mentions !== null || statistics !== null
  const isClientMode = config.usageMode === 'client'

  // Handler para subir imágenes
  const handleLogoUpload = (type: 'client' | 'consulting', file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor sube solo archivos de imagen (PNG, JPG)')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      if (type === 'client') {
        setConfig(prev => ({ ...prev, clientLogo: base64 }))
      } else {
        setConfig(prev => ({ ...prev, consultingLogo: base64 }))
      }
    }
    reader.readAsDataURL(file)
  }

  // Handlers para drag & drop
  const handleDragOver = (e: React.DragEvent, type: 'client' | 'consulting') => {
    e.preventDefault()
    if (type === 'client') {
      setDragActiveClient(true)
    } else {
      setDragActiveConsulting(true)
    }
  }

  const handleDragLeave = (type: 'client' | 'consulting') => {
    if (type === 'client') {
      setDragActiveClient(false)
    } else {
      setDragActiveConsulting(false)
    }
  }

  const handleDrop = (e: React.DragEvent, type: 'client' | 'consulting') => {
    e.preventDefault()
    if (type === 'client') {
      setDragActiveClient(false)
    } else {
      setDragActiveConsulting(false)
    }

    const file = e.dataTransfer.files[0]
    if (file) {
      handleLogoUpload(type, file)
    }
  }

  // Handler para generar el informe
  const handleGenerateReport = async () => {
    if (!hasData || !statistics || !datasetMetadata) return

    // Si es modo cliente, validar campos obligatorios
    if (isClientMode && (!config.clientName || !config.clientContact)) {
      return
    }

    // Validar título del informe
    if (!config.reportTitle) {
      alert('Por favor ingresa un título para el informe')
      return
    }

    setIsGenerating(true)
    try {
      // Capturar gráficos solo para informe completo
      let chartImages = undefined
      if (config.reportType === 'complete' && chartCaptureRef.current && statistics) {
        console.log('[InformesPage] Capturando gráficos...')
        chartImages = await chartCaptureRef.current.captureCharts()
        console.log('[InformesPage] Gráficos capturados:', Object.keys(chartImages))
      }

      // Actualizar config con las imágenes
      const configWithCharts = { ...config, chartImages }

      if (config.reportType === 'executive') {
        await generateExecutiveReport({
          config: configWithCharts,
          statistics,
          metadata: datasetMetadata,
          urlAnalysis
        })
      } else {
        await generateCompleteReport({
          config: configWithCharts,
          statistics,
          metadata: datasetMetadata,
          urlAnalysis
        })
      }

      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error('Error generando informe:', error)
      alert('Error generando el informe')
    } finally {
      setIsGenerating(false)
    }
  }

  if (!hasData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <p style={{ color: '#999', fontSize: '16px' }}>Carga un archivo JSON para generar informes</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <FileText size={28} />
          <h1 style={{ fontSize: '28px', fontWeight: '600', margin: 0 }}>Generador de Informes GRAPHS</h1>
        </div>
        <div style={{
          background: '#f5f5f5',
          border: '1px solid #ddd',
          borderRadius: '6px',
          padding: '12px 16px',
          marginTop: '12px',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertTriangle size={18} color="#000" />
          <div>
            <p style={{ color: '#000', fontSize: '13px', fontWeight: '600', margin: '0 0 4px 0' }}>
              Funcionalidad BETA
            </p>
            <p style={{ color: '#666', fontSize: '12px', margin: 0, lineHeight: '1.5' }}>
              Esta funcionalidad está en fase de pruebas. Los informes generados pueden contener errores o inconsistencias.
            </p>
          </div>
        </div>

        <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.6', marginTop: '16px' }}>
          Genera informes profesionales en PDF con el análisis completo de tu comunidad digital
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginTop: '12px',
          fontSize: '13px',
          color: '#444'
        }}>
          <div style={{
            background: '#f8f9fa',
            padding: '16px',
            borderRadius: '6px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <FileBarChart size={20} strokeWidth={2} />
              <p style={{ fontWeight: '600', margin: 0, color: '#000' }}>Informe Ejecutivo</p>
            </div>
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', lineHeight: '1.6', color: '#555' }}>
              Resumen ejecutivo de 2 páginas con las métricas más relevantes
            </p>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', lineHeight: '1.6', color: '#666' }}>
              <li>KPIs principales (tweets, usuarios, engagement, comunidades)</li>
              <li>Top 5 influencers por engagement</li>
              <li>Top 5 comunidades con keywords</li>
              <li>Hashtags más usados y eventos detectados</li>
              <li>Tipo de red y métricas derivadas</li>
              <li>Top 10 palabras y top 5 URLs</li>
              <li>Conclusiones clave automáticas</li>
            </ul>
          </div>

          <div style={{
            background: '#f8f9fa',
            padding: '16px',
            borderRadius: '6px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <BarChart3 size={20} strokeWidth={2} />
              <p style={{ fontWeight: '600', margin: 0, color: '#000' }}>Informe Completo</p>
            </div>
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', lineHeight: '1.6', color: '#555' }}>
              Análisis exhaustivo con todas las métricas y visualizaciones
            </p>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', lineHeight: '1.6', color: '#666' }}>
              <li>Todas las comunidades detectadas</li>
              <li>Gráficos comparativos (radar, barras, timeline)</li>
              <li>Nube de palabras</li>
              <li>Top 20 URLs compartidas</li>
              <li>Patrones de red (triángulos, estrellas, cadenas)</li>
              <li>Métricas derivadas y clasificación de red</li>
            </ul>
          </div>
        </div>

        <div style={{
          background: '#f5f5f5',
          border: '1px solid #ddd',
          borderRadius: '6px',
          padding: '12px 16px',
          marginTop: '16px',
          fontSize: '13px',
          lineHeight: '1.6',
          color: '#333'
        }}>
          <strong>Modos de uso:</strong> Selecciona <strong>Cliente</strong> para informes con branding personalizado (logos, colores, datos del cliente) o <strong>Personal</strong> para descarga rápida sin configuración adicional
        </div>
      </div>

      {/* Selector: Cliente vs Personal */}
      <div style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
          ¿Para quién es este informe?
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <button
            onClick={() => setConfig(prev => ({ ...prev, usageMode: 'client' }))}
            style={{
              padding: '20px',
              background: isClientMode ? '#000' : '#fff',
              color: isClientMode ? '#fff' : '#000',
              border: `2px solid ${isClientMode ? '#000' : '#ddd'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <Briefcase size={24} />
              <div style={{ fontWeight: '600', fontSize: '16px' }}>Para Cliente</div>
            </div>
            <div style={{ fontSize: '13px', opacity: 0.8, lineHeight: '1.5' }}>
              Informe con branding personalizado, logos y datos del cliente
            </div>
          </button>

          <button
            onClick={() => setConfig(prev => ({ ...prev, usageMode: 'personal' }))}
            style={{
              padding: '20px',
              background: !isClientMode ? '#000' : '#fff',
              color: !isClientMode ? '#fff' : '#000',
              border: `2px solid ${!isClientMode ? '#000' : '#ddd'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <User size={24} />
              <div style={{ fontWeight: '600', fontSize: '16px' }}>Uso Personal</div>
            </div>
            <div style={{ fontSize: '13px', opacity: 0.8, lineHeight: '1.5' }}>
              Descarga directa sin configuración adicional
            </div>
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isClientMode ? '1fr 400px' : '1fr', gap: '24px' }}>
        {/* Formulario */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Tipo de Informe + Información del Informe en matriz 2x1 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Tipo de Informe */}
            <div style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '20px'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                Tipo de Informe
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  onClick={() => setConfig(prev => ({ ...prev, reportType: 'executive' }))}
                  style={{
                    padding: '16px',
                    background: config.reportType === 'executive' ? '#000' : '#fff',
                    color: config.reportType === 'executive' ? '#fff' : '#000',
                    border: `2px solid ${config.reportType === 'executive' ? '#000' : '#ddd'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>Ejecutivo</div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>1 página • Resumen estratégico</div>
                </button>

                <button
                  onClick={() => setConfig(prev => ({ ...prev, reportType: 'complete' }))}
                  style={{
                    padding: '16px',
                    background: config.reportType === 'complete' ? '#000' : '#fff',
                    color: config.reportType === 'complete' ? '#fff' : '#000',
                    border: `2px solid ${config.reportType === 'complete' ? '#000' : '#ddd'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>Completo</div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>15 páginas • Análisis exhaustivo</div>
                </button>
              </div>
            </div>

            {/* Información del Informe */}
            <div style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '20px'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                Información del Informe
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                    Título {!isClientMode && '*'}
                  </label>
                  <input
                    type="text"
                    value={config.reportTitle}
                    onChange={(e) => setConfig(prev => ({ ...prev, reportTitle: e.target.value }))}
                    placeholder="Ej: Análisis Campaña #EleccionesMX"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid #ddd',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                    Subtítulo (opcional)
                  </label>
                  <input
                    type="text"
                    value={config.reportSubtitle || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, reportSubtitle: e.target.value }))}
                    placeholder="Ej: Análisis Comunidad Digital - Octubre 2025"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid #ddd',
                      fontSize: '14px'
                    }}
                  />
                </div>

                {isClientMode && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                      Autor
                    </label>
                    <input
                      type="text"
                      value={config.author}
                      onChange={(e) => setConfig(prev => ({ ...prev, author: e.target.value }))}
                      placeholder="Ej: Equipo Analytics - GRAPHS"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* MODO CLIENTE: Branding */}
          {isClientMode && (
            <div style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '20px'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                Logos (Opcional)
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Logo Cliente */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '8px' }}>
                    Logo del Cliente
                  </label>

                  <div
                    onDragOver={(e) => handleDragOver(e, 'client')}
                    onDragLeave={() => handleDragLeave('client')}
                    onDrop={(e) => handleDrop(e, 'client')}
                    onClick={() => clientLogoInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${dragActiveClient ? '#000' : '#ddd'}`,
                      borderRadius: '8px',
                      padding: '24px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: dragActiveClient ? '#f5f5f5' : '#fafafa',
                      transition: 'all 0.2s'
                    }}
                  >
                    {config.clientLogo ? (
                      <img src={config.clientLogo} alt="Logo cliente" style={{ maxWidth: '100%', maxHeight: '60px', objectFit: 'contain' }} />
                    ) : (
                      <>
                        <Upload size={24} style={{ margin: '0 auto 8px', color: '#999' }} />
                        <div style={{ fontSize: '13px', color: '#666' }}>
                          Arrastra o haz clic
                        </div>
                        <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                          PNG o JPG, max 200x60px
                        </div>
                      </>
                    )}
                  </div>

                  <input
                    ref={clientLogoInputRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleLogoUpload('client', file)
                    }}
                    style={{ display: 'none' }}
                  />

                  {config.clientLogo && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setConfig(prev => ({ ...prev, clientLogo: null }))
                      }}
                      style={{
                        marginTop: '8px',
                        fontSize: '12px',
                        color: '#666',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Eliminar
                    </button>
                  )}
                </div>

                {/* Logo Consultora */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '8px' }}>
                    Tu Logo
                  </label>

                  <div
                    onDragOver={(e) => handleDragOver(e, 'consulting')}
                    onDragLeave={() => handleDragLeave('consulting')}
                    onDrop={(e) => handleDrop(e, 'consulting')}
                    onClick={() => consultingLogoInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${dragActiveConsulting ? '#000' : '#ddd'}`,
                      borderRadius: '8px',
                      padding: '24px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: dragActiveConsulting ? '#f5f5f5' : '#fafafa',
                      transition: 'all 0.2s'
                    }}
                  >
                    {config.consultingLogo ? (
                      <img src={config.consultingLogo} alt="Tu logo" style={{ maxWidth: '100%', maxHeight: '60px', objectFit: 'contain' }} />
                    ) : (
                      <>
                        <Upload size={24} style={{ margin: '0 auto 8px', color: '#999' }} />
                        <div style={{ fontSize: '13px', color: '#666' }}>
                          Arrastra o haz clic
                        </div>
                        <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                          PNG o JPG, max 200x60px
                        </div>
                      </>
                    )}
                  </div>

                  <input
                    ref={consultingLogoInputRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleLogoUpload('consulting', file)
                    }}
                    style={{ display: 'none' }}
                  />

                  {config.consultingLogo && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setConfig(prev => ({ ...prev, consultingLogo: null }))
                      }}
                      style={{
                        marginTop: '8px',
                        fontSize: '12px',
                        color: '#666',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* MODO CLIENTE: Información del Cliente */}
          {isClientMode && (
            <div style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '20px'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                Información del Cliente
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                    Nombre de la Empresa *
                  </label>
                  <input
                    type="text"
                    value={config.clientName}
                    onChange={(e) => setConfig(prev => ({ ...prev, clientName: e.target.value }))}
                    placeholder="Ej: Acme Corporation"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid #ddd',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                    Contacto *
                  </label>
                  <input
                    type="text"
                    value={config.clientContact}
                    onChange={(e) => setConfig(prev => ({ ...prev, clientContact: e.target.value }))}
                    placeholder="Ej: contacto@acme.com"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid #ddd',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                    Dirección (opcional)
                  </label>
                  <input
                    type="text"
                    value={config.clientAddress || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, clientAddress: e.target.value }))}
                    placeholder="Ej: Calle Mayor 123, Madrid"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid #ddd',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* MODO PERSONAL: Botón de descarga directo */}
          {!isClientMode && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={handleGenerateReport}
                disabled={isGenerating || !config.reportTitle}
                style={{
                  padding: '16px 32px',
                  background: isGenerating || !config.reportTitle ? '#ccc' : '#000',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: isGenerating || !config.reportTitle ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'all 0.2s',
                  boxShadow: isGenerating || !config.reportTitle ? 'none' : '0 2px 4px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  if (!isGenerating && config.reportTitle) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = isGenerating || !config.reportTitle ? 'none' : '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                {isGenerating ? (
                  'Generando PDF...'
                ) : (
                  <>
                    <Download size={20} />
                    Descargar Informe PDF
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* MODO CLIENTE: Preview y Acción */}
        {isClientMode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '20px',
              position: 'sticky',
              top: '20px'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                Vista Previa
              </h3>

              <div style={{
                background: '#f5f5f5',
                border: '1px solid #ddd',
                borderRadius: '6px',
                padding: '16px',
                marginBottom: '16px',
                minHeight: '200px'
              }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
                  {config.reportType === 'executive' ? 'Informe Ejecutivo (1 página)' : 'Informe Completo (15 páginas)'}
                </div>

                {config.clientName && (
                  <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                    {config.clientName}
                  </div>
                )}

                {config.reportTitle && (
                  <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>
                    {config.reportTitle}
                  </div>
                )}

                {config.reportSubtitle && (
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
                    {config.reportSubtitle}
                  </div>
                )}

                {datasetMetadata && (
                  <div style={{ fontSize: '11px', color: '#999', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #ddd' }}>
                    Query: "{datasetMetadata.query}"
                    <br />
                    Periodo: {new Date(datasetMetadata.dateRange?.start || '').toLocaleDateString()} - {new Date(datasetMetadata.dateRange?.end || '').toLocaleDateString()}
                  </div>
                )}
              </div>

              <button
                onClick={handleGenerateReport}
                disabled={isGenerating || !config.clientName || !config.clientContact}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: isGenerating || !config.clientName || !config.clientContact ? '#ccc' : '#000',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: isGenerating || !config.clientName || !config.clientContact ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {isGenerating ? (
                  'Generando...'
                ) : (
                  <>
                    <Download size={18} />
                    Generar Informe PDF
                  </>
                )}
              </button>

              {(!config.clientName || !config.clientContact) && (
                <div style={{
                  marginTop: '12px',
                  display: 'flex',
                  alignItems: 'start',
                  gap: '8px',
                  fontSize: '12px',
                  color: '#f59e0b',
                  background: '#fef3c7',
                  padding: '12px',
                  borderRadius: '6px'
                }}>
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span>Completa los campos obligatorios (*) para generar el informe</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Success Popup */}
      {showSuccess && (
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CheckCircle size={24} style={{ color: '#10b981' }} />
            <div>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                Informe generado exitosamente
              </h4>
              <p style={{ margin: 0, fontSize: '14px', color: '#666', marginTop: '4px' }}>
                El archivo PDF se ha descargado
              </p>
            </div>
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

      {/* Componente oculto para capturar gráficos */}
      {statistics && (
        <ChartCapture ref={chartCaptureRef} statistics={statistics} />
      )}
    </div>
  )
}
