import { useState } from 'react'
import './App.css'
import { Network, BarChart3, Users, Download, Sparkles, HelpCircle, FileText, Clock, Github, Twitter, FolderKanban } from 'lucide-react'
import { useGraphStore, type TabId } from './lib/store/graphStore'
import { FileUploader } from './features/file-loader/components/FileUploader'
import { ProjectsPage } from './app/pages/ProjectsPage'
import { GraphPage } from './app/pages/GraphPage'
import { StatisticsPage } from './app/pages/StatisticsPage'
import { InformesPage } from './app/pages/InformesPage'
import { ExportPage } from './app/pages/ExportPage'
import { AIAnalysisPage } from './app/pages/AIAnalysisPage'
import { HelpPage } from './app/pages/HelpPage'
import { DisclaimerPage } from './app/pages/DisclaimerPage'
import { VersionsPage } from './app/pages/VersionsPage'

const tabs = [
  { id: 'projects' as TabId, label: 'Proyectos', icon: FolderKanban, requiresData: false },
  { id: 'graph' as TabId, label: 'Grafo', icon: Network, requiresData: true },
  { id: 'statistics' as TabId, label: 'Estadísticas', icon: BarChart3, requiresData: true },
  { id: 'reports' as TabId, label: 'Informes', icon: FileText, requiresData: true, badge: 'BETA' },
  { id: 'export' as TabId, label: 'Exportar', icon: Download, requiresData: true },
  { id: 'ai' as TabId, label: 'IA', icon: Sparkles, requiresData: true },
]

function App() {
  const activeTab = useGraphStore((state) => state.activeTab)
  const setActiveTab = useGraphStore((state) => state.setActiveTab)
  const isLoading = useGraphStore((state) => state.isLoading)
  const [showHelp, setShowHelp] = useState(false)
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [showVersions, setShowVersions] = useState(false)
  const hasData = useGraphStore((state) => state.hasData())

  // Log para debug
  console.log('[App] isLoading:', isLoading, 'activeTab:', activeTab)

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <Network style={{ width: 32, height: 32 }} strokeWidth={2} />
            <h1 className="app-title">GRAPHS</h1>
            <span className="version-badge">v0.8.8</span>
          </div>
          <span className="header-subtitle">Análisis de comunidades digitales</span>
        </div>
      </header>

      {/* NAVIGATION */}
      <nav className="app-nav">
        <div className="nav-content">
          <div className="nav-tabs">
            <FileUploader />
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              const isDisabled = tab.requiresData && !hasData

              return (
                <button
                  key={tab.id}
                  onClick={() => !isDisabled && setActiveTab(tab.id)}
                  className={`nav-tab ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                  disabled={isDisabled}
                >
                  <Icon />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="tab-badge">{tab.badge}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="app-main">
        <div className="main-content">
          {showHelp ? (
            <HelpPage />
          ) : showDisclaimer ? (
            <DisclaimerPage />
          ) : showVersions ? (
            <VersionsPage />
          ) : (
            <>
              {activeTab === 'projects' && <ProjectsPage />}
              {activeTab === 'graph' && <GraphPage />}
              {activeTab === 'statistics' && <StatisticsPage />}
              {activeTab === 'reports' && <InformesPage />}
              {activeTab === 'export' && <ExportPage />}
              {activeTab === 'ai' && <AIAnalysisPage />}
            </>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="app-footer">
        <div className="footer-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, justifyContent: 'space-between' }}>
            <span>© 2025 GRAPHS - Análisis de comunidades digitales</span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => {
                  setShowHelp(!showHelp)
                  setShowDisclaimer(false)
                  setShowVersions(false)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: showHelp ? '#000' : '#666',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f0f0f0'
                  e.currentTarget.style.color = '#000'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = showHelp ? '#000' : '#666'
                }}
              >
                <HelpCircle size={16} />
                <span>{showHelp ? 'Cerrar Ayuda' : 'Ayuda'}</span>
              </button>
              <button
                onClick={() => {
                  setShowDisclaimer(!showDisclaimer)
                  setShowHelp(false)
                  setShowVersions(false)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: showDisclaimer ? '#000' : '#666',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f0f0f0'
                  e.currentTarget.style.color = '#000'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = showDisclaimer ? '#000' : '#666'
                }}
              >
                <FileText size={16} />
                <span>{showDisclaimer ? 'Cerrar' : 'Descargo'}</span>
              </button>
              <button
                onClick={() => {
                  setShowVersions(!showVersions)
                  setShowHelp(false)
                  setShowDisclaimer(false)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: showVersions ? '#000' : '#666',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f0f0f0'
                  e.currentTarget.style.color = '#000'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = showVersions ? '#000' : '#666'
                }}
              >
                <Clock size={16} />
                <span>{showVersions ? 'Cerrar' : 'Versiones'}</span>
              </button>
              <div style={{ width: '1px', height: '20px', background: '#ddd', margin: '0 4px' }} />
              <a
                href="https://github.com/686f6c61/x-twitter-community-analysis"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transition: 'all 0.2s',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f0f0f0'
                  e.currentTarget.style.color = '#000'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#666'
                }}
              >
                <Github size={16} />
              </a>
              <a
                href="https://x.com/hex686f6c61"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transition: 'all 0.2s',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f0f0f0'
                  e.currentTarget.style.color = '#000'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#666'
                }}
              >
                <Twitter size={16} />
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* LOADING OVERLAY */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <div className="loading-title">
            Procesando dataset...
          </div>
          <div className="loading-text">
            Analizando tweets, calculando métricas de red y generando grafos de interacciones.
            <br />
            Esto puede tardar hasta 60 segundos en datasets grandes.
          </div>
        </div>
      )}
    </div>
  )
}

export default App
