import { useState, useEffect } from 'react'
import { FolderKanban, Zap, DollarSign } from 'lucide-react'
import { projectsApi } from '@/features/mining/services/projectsApi'
import { scraperAPI } from '@/features/mining/services/scraperApi'
import type { ProjectMetadata } from '@/types/project'
import type { ProviderConfig, ProviderType } from '@/features/mining/services/scraperApi'
import { CreateProjectDialog } from '@/features/mining/components/CreateProjectDialog'
import { ProjectCard } from '@/features/mining/components/ProjectCard'
import { QuickScrapingSection } from '@/features/mining/components/QuickScrapingSection'
import { ProviderSelector } from '@/features/mining/components/ProviderSelector'

export function ProjectsPage() {
  const [view, setView] = useState<'quick' | 'monitoring' | 'costs'>('quick')
  const [projects, setProjects] = useState<ProjectMetadata[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [providers, setProviders] = useState<ProviderConfig[]>([])
  const [selectedProvider, setSelectedProvider] = useState<ProviderType>('twitterapi')
  const [loadingProviders, setLoadingProviders] = useState(true)

  useEffect(() => {
    loadProviders()
  }, [])

  useEffect(() => {
    if (view === 'monitoring') {
      loadProjects()
    }
  }, [view])

  const loadProviders = async () => {
    setLoadingProviders(true)
    try {
      const { providers: availableProviders, default: defaultProvider } = await scraperAPI.getProviders()
      setProviders(availableProviders)
      if (defaultProvider) {
        setSelectedProvider(defaultProvider)
      }
    } catch (err) {
      console.error('Error loading providers:', err)
    } finally {
      setLoadingProviders(false)
    }
  }

  const loadProjects = async () => {
    try {
      setLoading(true)
      const data = await projectsApi.listProjects()
      setProjects(data)
    } catch (err: any) {
      console.error('Error loading projects:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleProjectCreated = () => {
    setShowCreateDialog(false)
    loadProjects()
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('¿Eliminar este proyecto? Se perderán todos los datos.')) return

    try {
      await projectsApi.deleteProject(projectId)
      loadProjects()
    } catch (err: any) {
      alert(err.message || 'Error eliminando proyecto')
    }
  }

  const handleUpdateStatus = async (projectId: string, status: 'active' | 'paused' | 'completed') => {
    try {
      await projectsApi.updateStatus(projectId, status)
      loadProjects()
    } catch (err: any) {
      alert(err.message || 'Error actualizando estado')
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <FolderKanban size={32} style={{ color: '#000' }} />
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>Proyectos</h1>
        </div>
        <p style={{ margin: 0, fontSize: '15px', color: '#666' }}>
          Extrae datos de X/Twitter para análisis de redes sociales
        </p>
      </div>

      {/* View Selector */}
      <div style={{
        display: 'flex',
        gap: '12px',
        padding: '4px',
        background: 'white',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        width: 'fit-content',
        marginBottom: '24px'
      }}>
        <button
          onClick={() => setView('quick')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: view === 'quick' ? '#000' : 'transparent',
            color: view === 'quick' ? 'white' : '#6b7280',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <Zap size={16} />
          Scraping Rápido
        </button>
        <button
          onClick={() => setView('monitoring')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: view === 'monitoring' ? '#000' : 'transparent',
            color: view === 'monitoring' ? 'white' : '#6b7280',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <FolderKanban size={16} />
          Monitor Continuo
        </button>
        <button
          onClick={() => setView('costs')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: view === 'costs' ? '#000' : 'transparent',
            color: view === 'costs' ? 'white' : '#6b7280',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <DollarSign size={16} />
          Costes
        </button>
      </div>

      {/* Content */}
      {view === 'quick' ? (
        <QuickScrapingSection />
      ) : view === 'costs' ? (
        /* Costs View */
        <div style={{
          maxWidth: '700px',
          margin: '0 auto'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 600 }}>
                Estimación de coste (TwitterAPI.io)
              </h2>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                Referencia de costes para 1,000 tweets
              </p>
            </div>

            {/* Content */}
            <div style={{ padding: '24px' }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                fontSize: '13px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0'
                }}>
                  <div>
                    <div style={{ fontWeight: 500, color: '#1f2937', fontSize: '15px' }}>Tweets</div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                      1,000 tweets
                    </div>
                  </div>
                  <div style={{
                    fontWeight: 600,
                    fontSize: '16px',
                    color: '#1f2937'
                  }}>
                    €0.1500
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0'
                }}>
                  <div>
                    <div style={{ fontWeight: 500, color: '#1f2937', fontSize: '15px' }}>Usuarios</div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                      ~300 perfiles
                    </div>
                  </div>
                  <div style={{
                    fontWeight: 600,
                    fontSize: '16px',
                    color: '#1f2937'
                  }}>
                    €0.0540
                  </div>
                </div>

                <div style={{
                  height: '1px',
                  background: '#e5e7eb',
                  margin: '8px 0'
                }} />

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 16px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  marginTop: '8px'
                }}>
                  <div style={{
                    fontWeight: 600,
                    fontSize: '16px',
                    color: '#1f2937'
                  }}>
                    Total estimado
                  </div>
                  <div style={{
                    fontWeight: 700,
                    fontSize: '20px',
                    color: '#059669'
                  }}>
                    €0.2040
                  </div>
                </div>
              </div>

              <div style={{
                marginTop: '24px',
                padding: '16px',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#6b7280',
                lineHeight: '1.6'
              }}>
                <div style={{ fontWeight: 600, marginBottom: '8px', color: '#374151', fontSize: '14px' }}>
                  Precios TwitterAPI.io (USD → EUR aprox.)
                </div>
                <div style={{ marginBottom: '6px' }}>
                  • Tweets: $0.15/1K → €0.141/1K (15 créditos)<br />
                  • Perfiles: $0.18/1K → €0.169/1K (18 créditos)
                </div>
                <div style={{ fontSize: '12px', opacity: 0.85, fontStyle: 'italic', marginTop: '8px' }}>
                  * Estimación usuarios: ~30% del total de tweets (autores + menciones únicas)
                </div>
              </div>

              <div style={{
                marginTop: '16px',
                padding: '16px',
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#6b7280',
                lineHeight: '1.6'
              }}>
                <div style={{ fontWeight: 600, marginBottom: '8px', color: '#374151', fontSize: '14px' }}>
                  ℹ️ Información sobre el enriquecimiento
                </div>
                <div>
                  El <strong>enriquecimiento de usuarios</strong> obtiene información detallada de cada usuario único
                  que aparece en los tweets (autores + usuarios mencionados):
                </div>
                <ul style={{ marginTop: '8px', marginBottom: '0', paddingLeft: '20px' }}>
                  <li>Número de seguidores y seguidos</li>
                  <li>Verificación (blue check, tipo de verificación)</li>
                  <li>Fecha de creación de la cuenta</li>
                  <li>Ubicación y descripción del perfil</li>
                  <li>Si es cuenta automatizada</li>
                  <li>Estado de la cuenta (suspendida, no disponible, etc.)</li>
                </ul>
                <div style={{ fontSize: '12px', opacity: 0.85, fontStyle: 'italic', marginTop: '8px' }}>
                  💡 Útil para análisis de influencers, detección de bots y métricas de comunidad
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          {/* Provider Selector */}
          {!loadingProviders && (
            <div style={{ marginBottom: '32px' }}>
              <ProviderSelector
                providers={providers}
                selectedProvider={selectedProvider}
                onProviderChange={setSelectedProvider}
                disabled={false}
              />
            </div>
          )}

          {/* Monitoring Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px'
          }}>
            <div>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 600 }}>
                Proyectos de Monitor
              </h2>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                Monitor continuo con queries dinámicas y datasets acumulativos
              </p>
            </div>
            <button
              onClick={() => setShowCreateDialog(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                background: '#000',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              Nuevo Proyecto
            </button>
          </div>

          {/* Projects Grid or Empty State */}
          {loading ? (
            <div style={{
              padding: '60px',
              textAlign: 'center',
              background: 'white',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                margin: '0 auto 16px',
                border: '3px solid #f3f4f6',
                borderTopColor: '#000',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }} />
              <div style={{ fontSize: '15px', color: '#666' }}>Cargando proyectos...</div>
            </div>
          ) : projects.length === 0 ? (
            <div style={{
              padding: '60px',
              textAlign: 'center',
              background: 'white',
              borderRadius: '12px',
              border: '2px dashed #d1d5db'
            }}>
              <FolderKanban size={48} style={{ color: '#d1d5db', margin: '0 auto 16px' }} />
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600, color: '#374151' }}>
                No hay proyectos de monitor
              </h3>
              <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#6b7280', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
                Los proyectos de monitor te permiten hacer scraping continuo desde una fecha inicial
                y añadir nuevas queries dinámicamente sin perder datos.
              </p>
              <button
                onClick={() => setShowCreateDialog(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  background: '#000',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Crear Primer Proyecto
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
              gap: '20px'
            }}>
              {projects.map((project) => (
                <ProjectCard
                  key={project.projectId}
                  project={project}
                  onDelete={() => handleDeleteProject(project.projectId)}
                  onUpdateStatus={(status) => handleUpdateStatus(project.projectId, status)}
                  onRefresh={loadProjects}
                />
              ))}
            </div>
          )}

          {/* Create Project Dialog */}
          {showCreateDialog && (
            <CreateProjectDialog
              onClose={() => setShowCreateDialog(false)}
              onCreated={handleProjectCreated}
            />
          )}
        </div>
      )}
    </div>
  )
}
