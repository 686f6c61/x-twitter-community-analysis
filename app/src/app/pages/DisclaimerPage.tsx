import { AlertTriangle, BookOpen, Scale, Info, ShieldAlert, Github, Twitter } from 'lucide-react'

export function DisclaimerPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div>
        <h1 className="page-title">Descargo de Responsabilidad</h1>
        <p style={{ fontSize: '16px', color: '#666', marginTop: '8px' }}>
          Términos de uso y limitaciones del proyecto GRAPHS
        </p>
      </div>

      {/* Proyecto Educativo */}
      <div className="chart-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <BookOpen size={24} />
          <h2 className="chart-title">Proyecto Educativo</h2>
        </div>
        <p style={{ fontSize: '14px', lineHeight: '1.8', color: '#333', marginBottom: '12px' }}>
          GRAPHS es un <strong>proyecto educativo y de investigación</strong> desarrollado con fines académicos y de aprendizaje.
          El sistema está diseñado para:
        </p>
        <ul style={{ fontSize: '14px', lineHeight: '1.8', color: '#333', paddingLeft: '24px', marginBottom: '12px' }}>
          <li>Demostrar la aplicación de teoría de grafos en el análisis de redes sociales</li>
          <li>Enseñar conceptos de métricas de centralidad y análisis de comunidades digitales</li>
          <li>Proporcionar una herramienta de aprendizaje para estudiantes e investigadores</li>
          <li>Experimentar con visualización de datos y análisis de redes</li>
        </ul>
        <p style={{ fontSize: '14px', lineHeight: '1.8', color: '#333' }}>
          Este proyecto <strong>NO tiene fines comerciales</strong> y no está destinado a ser utilizado como herramienta
          profesional de análisis de mercado, inteligencia de negocios o toma de decisiones estratégicas.
        </p>
      </div>

      {/* Naturaleza Orientativa */}
      <div className="chart-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Info size={24} />
          <h2 className="chart-title">Naturaleza Orientativa</h2>
        </div>
        <p style={{ fontSize: '14px', lineHeight: '1.8', color: '#333', marginBottom: '12px' }}>
          Los análisis, métricas y visualizaciones proporcionados por GRAPHS tienen un carácter
          <strong> puramente orientativo e informativo</strong>. Los resultados obtenidos:
        </p>
        <ul style={{ fontSize: '14px', lineHeight: '1.8', color: '#333', paddingLeft: '24px', marginBottom: '12px' }}>
          <li>Representan aproximaciones basadas en datos parciales y específicos</li>
          <li>Dependen de la calidad y completitud de los datos de entrada</li>
          <li>Pueden contener sesgos inherentes al método de recolección de datos</li>
          <li>No constituyen pruebas definitivas ni conclusiones científicas validadas</li>
          <li>Deben interpretarse en su contexto temporal y metodológico específico</li>
        </ul>
        <div style={{
          background: '#f9f9f9',
          border: '2px solid #ddd',
          borderRadius: '8px',
          padding: '16px',
          marginTop: '16px'
        }}>
          <p style={{ fontSize: '14px', lineHeight: '1.8', color: '#333', margin: 0 }}>
            <strong>Importante:</strong> Los resultados de este sistema deben utilizarse exclusivamente como
            punto de partida para investigaciones más profundas, nunca como conclusiones finales o únicas fuentes
            de información para la toma de decisiones.
          </p>
        </div>
      </div>

      {/* Limitaciones Técnicas */}
      <div className="chart-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <AlertTriangle size={24} />
          <h2 className="chart-title">Limitaciones Técnicas</h2>
        </div>
        <p style={{ fontSize: '14px', lineHeight: '1.8', color: '#333', marginBottom: '12px' }}>
          El usuario debe ser consciente de las siguientes limitaciones técnicas del sistema:
        </p>

        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>1. Datos y Muestreo</h3>
          <ul style={{ fontSize: '14px', lineHeight: '1.8', color: '#333', paddingLeft: '24px' }}>
            <li>Los análisis se basan en muestras limitadas de datos, no en conjuntos de datos completos</li>
            <li>Los datos pueden estar sesgados por los criterios de búsqueda y recolección utilizados</li>
            <li>No se garantiza la representatividad estadística de las muestras</li>
            <li>Los datos son snapshots temporales que pueden quedar obsoletos rápidamente</li>
          </ul>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>2. Algoritmos y Métricas</h3>
          <ul style={{ fontSize: '14px', lineHeight: '1.8', color: '#333', paddingLeft: '24px' }}>
            <li>Los algoritmos de detección pueden generar falsos positivos y falsos negativos</li>
            <li>Las métricas de centralidad son sensibles a la estructura y tamaño del grafo</li>
            <li>Los resultados pueden variar según los parámetros de configuración utilizados</li>
            <li>No todas las interacciones sociales pueden ser capturadas o medidas con precisión</li>
          </ul>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>3. Funcionalidades Experimentales</h3>
          <ul style={{ fontSize: '14px', lineHeight: '1.8', color: '#333', paddingLeft: '24px' }}>
            <li>Algunas funcionalidades están marcadas como BETA o experimentales</li>
            <li>Los algoritmos están en continuo desarrollo y pueden cambiar</li>
            <li>No se garantiza la estabilidad o consistencia de resultados entre versiones</li>
          </ul>
        </div>
      </div>

      {/* Uso Responsable */}
      <div className="chart-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Scale size={24} />
          <h2 className="chart-title">Uso Responsable de los Datos</h2>
        </div>
        <p style={{ fontSize: '14px', lineHeight: '1.8', color: '#333', marginBottom: '12px' }}>
          Los usuarios de GRAPHS deben comprometerse a un uso ético y responsable de la información:
        </p>
        <ul style={{ fontSize: '14px', lineHeight: '1.8', color: '#333', paddingLeft: '24px', marginBottom: '12px' }}>
          <li><strong>Privacidad:</strong> Respetar la privacidad de los usuarios analizados</li>
          <li><strong>Contexto:</strong> No sacar conclusiones de los datos sin considerar el contexto completo</li>
          <li><strong>Verificación:</strong> Contrastar los resultados con otras fuentes y metodologías</li>
          <li><strong>Transparencia:</strong> Ser transparente sobre las limitaciones y sesgos de los datos</li>
          <li><strong>No discriminación:</strong> No utilizar los datos para discriminar, acosar o perjudicar a individuos o grupos</li>
          <li><strong>Propósito educativo:</strong> Utilizar la herramienta principalmente con fines de aprendizaje e investigación</li>
        </ul>
      </div>

      {/* Exención de Responsabilidad Legal */}
      <div className="chart-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <ShieldAlert size={24} />
          <h2 className="chart-title">Exención de Responsabilidad Legal</h2>
        </div>
        <p style={{ fontSize: '14px', lineHeight: '1.8', color: '#333', marginBottom: '12px' }}>
          Al utilizar GRAPHS, el usuario acepta que:
        </p>
        <ul style={{ fontSize: '14px', lineHeight: '1.8', color: '#333', paddingLeft: '24px', marginBottom: '16px' }}>
          <li>Los desarrolladores no se hacen responsables de decisiones tomadas basándose en los análisis del sistema</li>
          <li>El software se proporciona "tal cual" (AS IS), sin garantías de ningún tipo</li>
          <li>No se garantiza la precisión, confiabilidad o completitud de los resultados</li>
          <li>Los desarrolladores no son responsables de daños directos, indirectos, incidentales o consecuentes</li>
          <li>El usuario es responsable de validar y verificar todos los resultados antes de utilizarlos</li>
          <li>El uso del sistema implica la aceptación completa de estos términos y limitaciones</li>
        </ul>
        <div style={{
          background: '#f5f5f5',
          border: '2px solid #333',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <p style={{ fontSize: '14px', lineHeight: '1.8', color: '#333', margin: 0, fontWeight: 600 }}>
            El usuario utiliza este sistema bajo su propia responsabilidad y acepta todas las limitaciones,
            advertencias y exenciones aquí descritas.
          </p>
        </div>
      </div>

      {/* Actualización de Términos */}
      <div className="chart-card">
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Actualización de Términos</h3>
        <p style={{ fontSize: '14px', lineHeight: '1.8', color: '#333' }}>
          Los desarrolladores se reservan el derecho de actualizar o modificar este descargo de responsabilidad
          en cualquier momento. Se recomienda revisar periódicamente esta página para estar al tanto de cualquier cambio.
          El uso continuado del sistema después de modificaciones constituye la aceptación de los términos actualizados.
        </p>
        <p style={{ fontSize: '13px', color: '#666', marginTop: '12px', fontStyle: 'italic' }}>
          Última actualización: Octubre 2025
        </p>
      </div>

      {/* Footer con contacto */}
      <div style={{
        background: '#f5f5f5',
        border: '2px solid #ddd',
        borderRadius: '8px',
        padding: '24px',
        fontSize: '14px',
        lineHeight: '1.6',
        textAlign: 'center'
      }}>
        <p style={{ margin: 0, marginBottom: '16px', color: '#666' }}>
          Para preguntas sobre este descargo de responsabilidad o el uso del sistema
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <a
            href="https://github.com/686f6c61/x-twitter-community-analysis"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: '#000',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#333'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#000'}
          >
            <Github size={18} />
            <span>GitHub</span>
          </a>
          <a
            href="https://x.com/hex686f6c61"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: '#000',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#333'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#000'}
          >
            <Twitter size={18} />
            <span>Twitter/X</span>
          </a>
        </div>
      </div>
    </div>
  )
}
