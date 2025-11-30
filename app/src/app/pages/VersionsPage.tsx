import { Clock, Package, GitCommit } from 'lucide-react'

export function VersionsPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div>
        <h1 className="page-title">Control de Versiones</h1>
        <p style={{ fontSize: '16px', color: '#666', marginTop: '8px' }}>
          Historial de cambios y evolución del proyecto GRAPHS
        </p>
      </div>

      {/* Versión Actual */}
      <div className="chart-card" style={{ borderLeft: '4px solid #000' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <Package size={24} />
          <h2 className="chart-title">Versión Actual: 0.8.8</h2>
        </div>
        <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
          Sistema completo de generación de informes PDF
        </p>
      </div>

      {/* Timeline de Versiones */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* v0.8.8 */}
        <div className="chart-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <GitCommit size={20} />
            <h3 style={{ fontSize: '18px', fontWeight: 600 }}>v0.8.8 - Informes PDF Completos</h3>
            <span style={{
              padding: '4px 8px',
              background: '#000',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 700,
              borderRadius: '4px'
            }}>ACTUAL</span>
          </div>
          <div style={{ fontSize: '13px', color: '#999', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} />
            <span>Octubre 2025</span>
          </div>
          <ul style={{ fontSize: '14px', lineHeight: '1.8', color: '#333', paddingLeft: '24px' }}>
            <li><strong>Informe Ejecutivo rediseñado:</strong> 2 páginas con métricas clave, comunidades, tipo de red, palabras frecuentes y URLs</li>
            <li><strong>Informe Completo mejorado:</strong> Todas las comunidades, gráficos detallados, nube de palabras, top 20 URLs, patrones de red</li>
            <li><strong>Detección automática de tipo de red:</strong> Fragmentada, Orgánica, Cámara de Eco, Broadcast, Campaña Coordinada</li>
            <li><strong>Métricas derivadas:</strong> Densidad, Reciprocidad, Centralización, Broadcast Ratio con interpretación automática</li>
            <li><strong>Interfaz mejorada:</strong> Descripciones detalladas de cada tipo de informe, BETA badge, diseño blanco y negro</li>
            <li><strong>Configuración por defecto:</strong> Informe Completo en modo Personal para descarga rápida</li>
            <li><strong>Conclusiones automáticas mejoradas:</strong> Insights más detallados basados en todas las métricas calculadas</li>
          </ul>
        </div>

        {/* v0.8.0 */}
        <div className="chart-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <GitCommit size={20} />
            <h3 style={{ fontSize: '18px', fontWeight: 600 }}>v0.8.0 - React + TypeScript</h3>
          </div>
          <div style={{ fontSize: '13px', color: '#999', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} />
            <span>Octubre 2025</span>
          </div>
          <ul style={{ fontSize: '14px', lineHeight: '1.8', color: '#333', paddingLeft: '24px' }}>
            <li><strong>Migración completa a React + TypeScript + Vite</strong></li>
            <li><strong>Sistema de exportación avanzado:</strong> PDF, Excel, GraphML, GEXF, CSV</li>
            <li><strong>Página de Influencers:</strong> Análisis multidimensional con score ponderado</li>
            <li><strong>Migración de métricas a JavaScript:</strong> PageRank, Betweenness, Degree Centrality</li>
            <li><strong>Documentación completa:</strong> Página de Ayuda con fórmulas y referencias académicas</li>
            <li><strong>Descargo de responsabilidad:</strong> Proyecto educativo sin fines comerciales</li>
            <li><strong>Análisis con IA:</strong> Integración preparada para análisis avanzados</li>
            <li><strong>Arquitectura moderna:</strong> Componentes React, store con Zustand, routing interno</li>
          </ul>
        </div>

        {/* v0.7.1 */}
        <div className="chart-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <GitCommit size={20} />
            <h3 style={{ fontSize: '18px', fontWeight: 600 }}>v0.7.1 - Timeline y URLs</h3>
            <span style={{
              padding: '4px 8px',
              background: '#666',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 700,
              borderRadius: '4px'
            }}>BETA</span>
          </div>
          <div style={{ fontSize: '13px', color: '#999', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} />
            <span>Octubre 2025</span>
          </div>
          <ul style={{ fontSize: '14px', lineHeight: '1.8', color: '#333', paddingLeft: '24px' }}>
            <li><strong>Timeline de Eventos:</strong> Detección de picos con desviación estándar adaptativa</li>
            <li><strong>Drill-down temporal:</strong> Click en periodos para análisis detallado</li>
            <li><strong>Análisis de URLs:</strong> Top URLs con métricas de viralidad</li>
            <li><strong>Tooltips informativos:</strong> Explicación de fórmulas (σ, tipos de evento)</li>
            <li><strong>Exportación temporal:</strong> Descarga de datos en JSON</li>
            <li><strong>Limpieza automática de caché:</strong> Invalidación al cargar nuevo archivo</li>
          </ul>
        </div>

        {/* v0.6.8 */}
        <div className="chart-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <GitCommit size={20} />
            <h3 style={{ fontSize: '18px', fontWeight: 600 }}>v0.6.8 - Network Motifs</h3>
            <span style={{
              padding: '4px 8px',
              background: '#666',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 700,
              borderRadius: '4px'
            }}>BETA</span>
          </div>
          <div style={{ fontSize: '13px', color: '#999', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} />
            <span>Septiembre 2025</span>
          </div>
          <ul style={{ fontSize: '14px', lineHeight: '1.8', color: '#333', paddingLeft: '24px' }}>
            <li><strong>Análisis de patrones estructurales:</strong> Triángulos, estrellas, cadenas</li>
            <li><strong>Métrica de cohesión:</strong> Indicador compuesto 0-100%</li>
            <li><strong>Selector de grafos:</strong> Cambio dinámico entre Menciones y Co-hashtags</li>
            <li><strong>Modales interactivos:</strong> Click en motifs para ver usuarios</li>
            <li><strong>Exportación por tipo:</strong> CSV/JSON de cada patrón</li>
            <li><strong>Referencias académicas:</strong> Papers clave (Milo 2002, Newman 2003)</li>
          </ul>
        </div>

        {/* v0.6.6 */}
        <div className="chart-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <GitCommit size={20} />
            <h3 style={{ fontSize: '18px', fontWeight: 600 }}>v0.6.6 - Exportación Avanzada</h3>
            <span style={{
              padding: '4px 8px',
              background: '#666',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 700,
              borderRadius: '4px'
            }}>BETA</span>
          </div>
          <div style={{ fontSize: '13px', color: '#999', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} />
            <span>Septiembre 2025</span>
          </div>
          <ul style={{ fontSize: '14px', lineHeight: '1.8', color: '#333', paddingLeft: '24px' }}>
            <li><strong>PDF Report:</strong> Informe completo con visualizaciones capturadas</li>
            <li><strong>Excel XLSX:</strong> 4 hojas (Nodos, Aristas, Métricas, Comunidades)</li>
            <li><strong>GraphML mejorado:</strong> 21 atributos por nodo para Gephi/Cytoscape</li>
            <li><strong>Tab Exportar:</strong> Selección granular de 16 formatos</li>
            <li><strong>Búsqueda global:</strong> Buscador universal en header</li>
          </ul>
        </div>

        {/* v0.6.5 */}
        <div className="chart-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <GitCommit size={20} />
            <h3 style={{ fontSize: '18px', fontWeight: 600 }}>v0.6.5 - Refactorización Modular</h3>
            <span style={{
              padding: '4px 8px',
              background: '#666',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 700,
              borderRadius: '4px'
            }}>BETA</span>
          </div>
          <div style={{ fontSize: '13px', color: '#999', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} />
            <span>Agosto 2025</span>
          </div>
          <ul style={{ fontSize: '14px', lineHeight: '1.8', color: '#333', paddingLeft: '24px' }}>
            <li><strong>Refactorización JavaScript:</strong> app.js reducido de 3140 a 294 líneas (-90%)</li>
            <li><strong>Arquitectura modular:</strong> 30 módulos organizados (core, ui, features)</li>
            <li><strong>Refactorización Python:</strong> 3 scripts → 20 módulos</li>
            <li><strong>CLI moderno:</strong> Análisis de múltiples datasets y comparación</li>
            <li><strong>Type hints completos:</strong> Anotaciones en todo el código Python</li>
            <li><strong>Footer mejorado:</strong> Enlaces a ayuda y versiones</li>
          </ul>
        </div>

        {/* v0.5 */}
        <div className="chart-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <GitCommit size={20} />
            <h3 style={{ fontSize: '18px', fontWeight: 600 }}>v0.5 - Análisis Temporal</h3>
          </div>
          <div style={{ fontSize: '13px', color: '#999', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} />
            <span>Julio 2025</span>
          </div>
          <ul style={{ fontSize: '14px', lineHeight: '1.8', color: '#333', paddingLeft: '24px' }}>
            <li><strong>Análisis Temporal BETA:</strong> Ventanas configurables para análisis dinámico</li>
            <li><strong>Nube de Palabras:</strong> Integrada en tab Estadísticas</li>
            <li><strong>Rising/Falling Stars:</strong> Identificación de cambios de influencia</li>
            <li><strong>Export ampliado:</strong> Incluye temporal_analysis y word_frequencies</li>
          </ul>
        </div>

        {/* v0.4 */}
        <div className="chart-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <GitCommit size={20} />
            <h3 style={{ fontSize: '18px', fontWeight: 600 }}>v0.4 - Comunidades</h3>
          </div>
          <div style={{ fontSize: '13px', color: '#999', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} />
            <span>Junio 2025</span>
          </div>
          <ul style={{ fontSize: '14px', lineHeight: '1.8', color: '#333', paddingLeft: '24px' }}>
            <li><strong>Detección de comunidades:</strong> Algoritmo Union-Find</li>
            <li><strong>Modal de comunidades:</strong> Exploración interactiva con estadísticas</li>
            <li><strong>Export ZIP ampliado:</strong> 12 archivos incluyendo communities.json</li>
            <li><strong>Panel Avanzado:</strong> Radio buttons descriptivos</li>
            <li><strong>Branding:</strong> GRAPHS - 686f6c61</li>
          </ul>
        </div>

        {/* v0.3 */}
        <div className="chart-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <GitCommit size={20} />
            <h3 style={{ fontSize: '18px', fontWeight: 600 }}>v0.3 - Sistema de Influencers</h3>
          </div>
          <div style={{ fontSize: '13px', color: '#999', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} />
            <span>Mayo 2025</span>
          </div>
          <ul style={{ fontSize: '14px', lineHeight: '1.8', color: '#333', paddingLeft: '24px' }}>
            <li><strong>Sistema de influencers:</strong> Detección con categorización</li>
            <li><strong>UX/UI mejorada:</strong> Tooltips, popups y ayuda contextual</li>
            <li><strong>Exportación ampliada:</strong> Influencers en JSON y CSV</li>
          </ul>
        </div>

        {/* v0.2 */}
        <div className="chart-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <GitCommit size={20} />
            <h3 style={{ fontSize: '18px', fontWeight: 600 }}>v0.2 - Métricas Avanzadas</h3>
          </div>
          <div style={{ fontSize: '13px', color: '#999', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} />
            <span>Abril 2025</span>
          </div>
          <ul style={{ fontSize: '14px', lineHeight: '1.8', color: '#333', paddingLeft: '24px' }}>
            <li><strong>Métricas avanzadas:</strong> Cálculo en navegador con optimizaciones</li>
            <li><strong>Web Workers:</strong> Procesamiento paralelo sin bloqueo de UI</li>
            <li><strong>Sistema de caché:</strong> localStorage para datos procesados</li>
            <li><strong>Exportación ZIP:</strong> GraphML para Gephi y Cytoscape</li>
          </ul>
        </div>

        {/* v0.1 */}
        <div className="chart-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <GitCommit size={20} />
            <h3 style={{ fontSize: '18px', fontWeight: 600 }}>v0.1 - Versión Inicial</h3>
          </div>
          <div style={{ fontSize: '13px', color: '#999', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} />
            <span>Marzo 2025</span>
          </div>
          <ul style={{ fontSize: '14px', lineHeight: '1.8', color: '#333', paddingLeft: '24px' }}>
            <li><strong>Análisis básico:</strong> Detección de comunidades con Louvain</li>
            <li><strong>Visualización interactiva:</strong> Grafos con vis.js</li>
            <li><strong>Métricas fundamentales:</strong> PageRank, Betweenness, Degree Centrality</li>
          </ul>
        </div>

      </div>

      {/* Info */}
      <div style={{
        background: '#f5f5f5',
        border: '2px solid #ddd',
        borderRadius: '8px',
        padding: '16px',
        fontSize: '14px',
        lineHeight: '1.6'
      }}>
        <p style={{ margin: 0 }}>
          <strong>Nota:</strong> Este proyecto sigue en desarrollo activo. Las versiones BETA pueden contener
          funcionalidades experimentales sujetas a cambios.
        </p>
      </div>
    </div>
  )
}
