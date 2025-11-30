import { useState } from 'react'
import { Triangle, Star, GitBranch, X, Download } from 'lucide-react'
import type { Statistics } from '@/types/graph'
import { InfoModal } from '@/shared/components/InfoModal'
import { InfoButton } from '@/shared/components/InfoButton'

interface NetworkMetricsProps {
  stats: Statistics
}

type ModalType = 'info' | 'details'
type NetworkMetricKey = 'triangles' | 'stars' | 'chains' | 'cohesion' | 'distribution' | 'networkType' | 'density' | 'broadcastRatio' | 'reciprocityRatio' | 'centralization'

export function NetworkMetrics({ stats }: NetworkMetricsProps) {
  const [selectedMetric, setSelectedMetric] = useState<NetworkMetricKey | null>(null)
  const [modalType, setModalType] = useState<ModalType>('info')
  const [showGeneralInfo, setShowGeneralInfo] = useState(false)

  const triangles = stats.triangles || 0
  const stars = stats.stars || 0
  const chains = stats.chains || 0
  const cohesion = stats.cohesion || 0
  const numNodes = stats.nodes || 0
  const numEdges = stats.edges || 0

  // Métricas derivadas adicionales
  const networkDensity = numNodes > 1 ? (numEdges / (numNodes * (numNodes - 1))) * 100 : 0
  const broadcastRatio = (triangles + stars + chains) > 0 ? (stars / (triangles + stars + chains)) * 100 : 0
  const reciprocityRatio = (triangles + stars + chains) > 0 ? (triangles / (triangles + stars + chains)) * 100 : 0
  const centralizationRatio = numNodes > 0 ? (stars / numNodes) * 100 : 0

  console.log('[NetworkMetrics] Datos recibidos:', {
    triangles,
    stars,
    chains,
    cohesion,
    hasTrianglesList: !!stats.trianglesList,
    hasStarsList: !!stats.starsList,
    hasChainsList: !!stats.chainsList,
    trianglesListLength: stats.trianglesList?.length || 0,
    starsListLength: stats.starsList?.length || 0,
    chainsListLength: stats.chainsList?.length || 0
  })

  // Funciones de interpretación
  const getDominantPattern = () => {
    const total = triangles + stars + chains
    if (total === 0) return 'balanced'

    const trianglesPercent = (triangles / total) * 100
    const starsPercent = (stars / total) * 100
    const chainsPercent = (chains / total) * 100

    if (trianglesPercent > 50) return 'triangles'
    if (starsPercent > 50) return 'stars'
    if (chainsPercent > 50) return 'chains'

    return 'balanced'
  }

  // Detectar tipo de red automáticamente
  const detectNetworkType = () => {
    // Broadcast Unidireccional: alta proporción de estrellas, baja reciprocidad, baja cohesión
    if (broadcastRatio > 60 && reciprocityRatio < 10 && cohesion < 10) {
      return {
        type: 'Broadcast Unidireccional',
        description: 'Red dominada por difusión uno-a-muchos sin interacción horizontal. Típico de medios de comunicación y cuentas institucionales.',
        color: '#ff6b6b'
      }
    }

    // Cámara de Eco: alta reciprocidad, alta cohesión, baja densidad global
    if (reciprocityRatio > 60 && cohesion > 60 && networkDensity < 20) {
      return {
        type: 'Cámara de Eco',
        description: 'Red altamente cohesionada con grupos cerrados que interactúan principalmente entre sí. Posible polarización.',
        color: '#f59e0b'
      }
    }

    // Campaña Coordinada: alta centralización, patrones anómalos de estrellas
    if (centralizationRatio > 30 && broadcastRatio > 50) {
      return {
        type: 'Campaña Coordinada',
        description: 'Red con estructura jerárquica pronunciada, posible amplificación artificial o campaña organizada.',
        color: '#8b5cf6'
      }
    }

    // Red Orgánica: balance entre patrones, cohesión moderada
    if (cohesion >= 15 && cohesion <= 60 && broadcastRatio < 60 && reciprocityRatio > 10) {
      return {
        type: 'Red Orgánica',
        description: 'Red con estructura balanceada y dinámicas naturales de interacción. Mezcla de difusión y conversación.',
        color: '#10b981'
      }
    }

    // Red Fragmentada: baja cohesión, múltiples componentes desconectados
    if (cohesion < 15) {
      return {
        type: 'Red Fragmentada',
        description: 'Red compuesta por múltiples grupos desconectados o débilmente conectados. Poca integración global.',
        color: '#ef4444'
      }
    }

    // Red Viral: muchas cadenas, alta propagación secuencial
    const chainRatio = (triangles + stars + chains) > 0 ? (chains / (triangles + stars + chains)) * 100 : 0
    if (chainRatio > 60) {
      return {
        type: 'Red Viral',
        description: 'Red con alta propagación en cascada. La información fluye a través de múltiples intermediarios.',
        color: '#3b82f6'
      }
    }

    return {
      type: 'Red Mixta',
      description: 'Red con características mixtas que no se ajusta a una tipología específica.',
      color: '#6b7280'
    }
  }

  const networkType = detectNetworkType()

  // Función para descargar CSV con todas las métricas
  const downloadCSV = () => {
    const csvRows = []

    // Encabezados
    csvRows.push(['metrica', 'valor', 'descripcion'].join(','))

    // Métricas básicas
    csvRows.push(['nodos', numNodes, 'Número total de nodos en la red'].join(','))
    csvRows.push(['aristas', numEdges, 'Número total de aristas en la red'].join(','))
    csvRows.push(['triangulos', triangles, 'Grupos de 3 nodos completamente conectados'].join(','))
    csvRows.push(['estrellas', stars, 'Nodos centrales con múltiples conexiones'].join(','))
    csvRows.push(['cadenas', chains, 'Secuencias lineales de conexiones'].join(','))
    csvRows.push([`cohesion_porcentaje`, cohesion.toFixed(2), getCohesionLabel()].join(','))

    // Métricas derivadas
    csvRows.push(['densidad_red_porcentaje', networkDensity.toFixed(2), 'Proporción de conexiones reales vs. posibles'].join(','))
    csvRows.push(['ratio_broadcast_porcentaje', broadcastRatio.toFixed(2), 'Proporción de difusión unidireccional'].join(','))
    csvRows.push(['ratio_reciprocidad_porcentaje', reciprocityRatio.toFixed(2), 'Proporción de conversaciones mutuas'].join(','))
    csvRows.push(['centralizacion_porcentaje', centralizationRatio.toFixed(2), 'Proporción de nodos centrales (hubs)'].join(','))

    // Tipo de red detectado
    csvRows.push([`tipo_red`, `"${networkType.type}"`, `"${networkType.description}"`].join(','))

    // Patrón dominante
    const dominantPattern = getDominantPattern()
    const dominantPatternLabel =
      dominantPattern === 'triangles' ? 'Triángulos' :
      dominantPattern === 'stars' ? 'Estrellas' :
      dominantPattern === 'chains' ? 'Cadenas' : 'Balanceado'
    csvRows.push(['patron_dominante', `"${dominantPatternLabel}"`, 'Patrón de red que supera el 50%'].join(','))

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `metricas_red_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const getCohesionColor = () => {
    if (cohesion < 5) return 'linear-gradient(90deg, #8b0000 0%, #dc3545 100%)' // Rojo oscuro: extremadamente fragmentada
    if (cohesion < 15) return 'linear-gradient(90deg, #dc3545 0%, #fd7e14 100%)' // Rojo-naranja: muy fragmentada
    if (cohesion < 30) return 'linear-gradient(90deg, #fd7e14 0%, #ffc107 100%)' // Naranja-amarillo: baja cohesión
    if (cohesion < 60) return 'linear-gradient(90deg, #ffc107 0%, #28a745 100%)' // Amarillo-verde: moderada
    if (cohesion < 85) return 'linear-gradient(90deg, #28a745 0%, #20c997 100%)' // Verde: alta
    return 'linear-gradient(90deg, #20c997 0%, #0066cc 100%)' // Verde-azul: cohesión extrema
  }

  const getCohesionLabel = () => {
    if (cohesion < 5) return 'Extremadamente fragmentada'
    if (cohesion < 15) return 'Muy fragmentada'
    if (cohesion < 30) return 'Baja cohesión'
    if (cohesion < 60) return 'Cohesión moderada'
    if (cohesion < 85) return 'Alta cohesión'
    return 'Cohesión extrema'
  }

  const openInfoModal = (metric: NetworkMetricKey) => {
    setSelectedMetric(metric)
    setModalType('info')
  }

  const openDetailsModal = (metric: NetworkMetricKey) => {
    setSelectedMetric(metric)
    setModalType('details')
  }

  const closeModal = () => {
    setSelectedMetric(null)
  }

  // Generar interpretación automática
  const generateInterpretation = () => {
    let interpretation = []

    // Análisis de cohesión general
    interpretation.push(
      <p key="cohesion" style={{ marginBottom: '16px' }}>
        <strong>Cohesión General:</strong>{' '}
        {cohesion < 5 && (
          <>La red está <strong>extremadamente fragmentada ({cohesion.toFixed(1)}%)</strong>, prácticamente sin integración. Los nodos están aislados o forman componentes desconectados.</>
        )}
        {cohesion >= 5 && cohesion < 15 && (
          <>La red está <strong>muy fragmentada ({cohesion.toFixed(1)}%)</strong>, con múltiples grupos débilmente conectados y poca comunicación entre ellos.</>
        )}
        {cohesion >= 15 && cohesion < 30 && (
          <>La red presenta <strong>baja cohesión ({cohesion.toFixed(1)}%)</strong>, indicando estructura fragmentada con algunos puentes entre grupos pero poca integración global.</>
        )}
        {cohesion >= 30 && cohesion < 60 && (
          <>La red tiene <strong>cohesión moderada ({cohesion.toFixed(1)}%)</strong>, con conexiones razonables entre grupos y comunicación fluida en varias zonas.</>
        )}
        {cohesion >= 60 && cohesion < 85 && (
          <>La red muestra <strong>alta cohesión ({cohesion.toFixed(1)}%)</strong>, indicando buena integración y comunicación fluida entre la mayoría de grupos.</>
        )}
        {cohesion >= 85 && (
          <>La red es <strong>extremadamente cohesiva ({cohesion.toFixed(1)}%)</strong>, con conexiones densas entre casi todos los miembros. Posible comunidad pequeña y cerrada.</>
        )}
      </p>
    )

    // Análisis de triángulos
    const trianglesPerNode = numNodes > 0 ? (triangles / numNodes).toFixed(2) : '0'
    interpretation.push(
      <p key="triangles" style={{ marginBottom: '16px' }}>
        <strong>Triángulos (Grupos Cohesivos):</strong>{' '}
        {triangles === 0 && 'No se detectaron triángulos, indicando ausencia de grupos cohesivos cerrados. La red es principalmente lineal o radial.'}
        {triangles > 0 && parseFloat(trianglesPerNode) < 1 && (
          <>Se encontraron <strong>{triangles} triángulos</strong> ({trianglesPerNode} por nodo), indicando pocos grupos cerrados. La conversación tiende a ser más unidireccional.</>
        )}
        {triangles > 0 && parseFloat(trianglesPerNode) >= 1 && parseFloat(trianglesPerNode) < 5 && (
          <>Se encontraron <strong>{triangles} triángulos</strong> ({trianglesPerNode} por nodo), mostrando presencia moderada de grupos cohesivos. Existen círculos de conversación mutuos.</>
        )}
        {triangles > 0 && parseFloat(trianglesPerNode) >= 5 && (
          <>Se encontraron <strong>{triangles} triángulos</strong> ({trianglesPerNode} por nodo), indicando muchos grupos altamente cohesivos. La red tiene múltiples "cámaras de eco" donde usuarios se mencionan mutuamente.</>
        )}
      </p>
    )

    // Análisis de estrellas
    const starsPercentage = numNodes > 0 ? ((stars / numNodes) * 100).toFixed(1) : '0'
    interpretation.push(
      <p key="stars" style={{ marginBottom: '16px' }}>
        <strong>Estrellas (Concentración de Poder):</strong>{' '}
        {stars === 0 && 'No se detectaron patrones de estrella, indicando ausencia de hubs centralizadores. La red es distribuida sin figuras dominantes.'}
        {stars > 0 && parseFloat(starsPercentage) < 5 && (
          <>Se encontraron <strong>{stars} estrellas</strong> ({starsPercentage}% de nodos), indicando pocos influencers o cuentas centrales. La difusión de información es distribuida.</>
        )}
        {stars > 0 && parseFloat(starsPercentage) >= 5 && parseFloat(starsPercentage) < 15 && (
          <>Se encontraron <strong>{stars} estrellas</strong> ({starsPercentage}% de nodos), mostrando presencia moderada de hubs. Algunos usuarios actúan como difusores centrales.</>
        )}
        {stars > 0 && parseFloat(starsPercentage) >= 15 && (
          <>Se encontraron <strong>{stars} estrellas</strong> ({starsPercentage}% de nodos), indicando estructura altamente jerárquica. Múltiples usuarios funcionan como puntos de concentración y difusión.</>
        )}
      </p>
    )

    // Análisis de cadenas
    const chainsPerEdge = numEdges > 0 ? (chains / numEdges).toFixed(2) : '0'
    interpretation.push(
      <p key="chains" style={{ marginBottom: '16px' }}>
        <strong>Cadenas (Flujos Lineales):</strong>{' '}
        {chains === 0 && 'No se detectaron cadenas significativas, indicando que las conexiones tienden a ser directas sin intermediarios.'}
        {chains > 0 && parseFloat(chainsPerEdge) < 2 && (
          <>Se encontraron <strong>{chains} cadenas</strong> ({chainsPerEdge} por arista), indicando pocos flujos lineales. La información fluye mayormente de forma directa.</>
        )}
        {chains > 0 && parseFloat(chainsPerEdge) >= 2 && parseFloat(chainsPerEdge) < 5 && (
          <>Se encontraron <strong>{chains} cadenas</strong> ({chainsPerEdge} por arista), mostrando flujos moderados de información a través de intermediarios. Existe propagación secuencial.</>
        )}
        {chains > 0 && parseFloat(chainsPerEdge) >= 5 && (
          <>Se encontraron <strong>{chains} cadenas</strong> ({chainsPerEdge} por arista), indicando muchos flujos lineales. La información se propaga extensamente a través de múltiples intermediarios.</>
        )}
      </p>
    )

    // Balance de patrones
    const dominantPattern = getDominantPattern()
    interpretation.push(
      <p key="balance" style={{ marginBottom: '0' }}>
        <strong>Balance de Patrones:</strong>{' '}
        {dominantPattern === 'triangles' && 'La red está dominada por triángulos, indicando una estructura comunitaria con grupos cerrados y alta reciprocidad. Típico de redes donde la conversación es circular entre miembros conocidos.'}
        {dominantPattern === 'stars' && 'La red está dominada por estrellas, indicando una estructura de difusión con figuras centrales. Típico de redes donde algunos usuarios son amplificadores principales.'}
        {dominantPattern === 'chains' && 'La red está dominada por cadenas, indicando una estructura de propagación secuencial. Típico de redes donde la información fluye linealmente a través de múltiples pasos.'}
        {dominantPattern === 'balanced' && 'La red muestra un balance equilibrado entre diferentes patrones, indicando diversidad estructural con múltiples dinámicas de comunicación coexistiendo.'}
      </p>
    )

    return interpretation
  }

  // Contenido de modales informativos
  const getInfoModalContent = (key: NetworkMetricKey) => {
    switch (key) {
      case 'triangles':
        return {
          title: 'Triángulos',
          content: (
            <>
              <h4 style={{ marginTop: 0, marginBottom: '12px' }}>¿Qué representa?</h4>
              <p>Los <strong>triángulos</strong> son estructuras de tres nodos donde cada nodo está conectado con los otros dos, formando un ciclo cerrado completo. En redes sociales, representan <strong>relaciones recíprocas</strong> y son el patrón más básico de cohesión social.</p>
              <p>Un triángulo se forma cuando el usuario A menciona a B, B menciona a C, y C menciona a A (o cualquier permutación de relaciones mutuas).</p>

              <h4 style={{ marginBottom: '12px' }}>Fórmula de detección</h4>
              <p>Para cada tripleta de nodos (i, j, k):</p>
              <p style={{ background: '#f5f5f5', padding: '16px', borderRadius: '6px', textAlign: 'center', margin: '16px 0' }}>
                Triángulo si: (i→j) ∧ (j→k) ∧ (k→i)
              </p>

              <h4 style={{ marginBottom: '12px' }}>¿Por qué es importante?</h4>
              <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
                <li><strong>Clustering social:</strong> Alta cantidad de triángulos indica comunidades cohesionadas donde los miembros se conocen mutuamente</li>
                <li><strong>Confianza y reciprocidad:</strong> Los triángulos representan relaciones bidireccionales y cierre transitivo</li>
                <li><strong>Robustez de red:</strong> Redes con muchos triángulos son más resistentes a la fragmentación</li>
                <li><strong>Difusión viral:</strong> Los triángulos facilitan cascadas de información dentro de grupos cerrados</li>
              </ul>

              <h4 style={{ marginBottom: '12px' }}>Interpretación</h4>
              <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
                <li>0 triángulos: Red completamente jerárquica o tipo broadcast (sin reciprocidad)</li>
                <li>Triángulos abundantes: Comunidad cohesionada con interacciones recíprocas</li>
                <li>Triángulos concentrados: Posibles echo chambers o grupos cerrados</li>
              </ul>
            </>
          )
        }
      case 'stars':
        return {
          title: 'Estrellas',
          content: (
            <>
              <h4 style={{ marginTop: 0, marginBottom: '12px' }}>¿Qué representa?</h4>
              <p>Una <strong>estrella</strong> (o hub) es una estructura donde un nodo central está conectado a múltiples nodos periféricos que NO están conectados entre sí. El patrón representa <strong>centralización</strong> y <strong>jerarquía</strong> en la red.</p>
              <p>En redes sociales, las estrellas identifican influencers, cuentas institucionales o medios de comunicación que difunden información a muchos usuarios sin que estos interactúen entre sí.</p>

              <h4 style={{ marginBottom: '12px' }}>Definición estructural</h4>
              <p style={{ background: '#f5f5f5', padding: '16px', borderRadius: '6px', textAlign: 'center', margin: '16px 0' }}>
                Un nodo central c conectado a k nodos donde no existe conexión entre los nodos periféricos
              </p>

              <h4 style={{ marginBottom: '12px' }}>¿Por qué es importante?</h4>
              <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
                <li><strong>Identificación de hubs:</strong> Nodos centrales de estrellas son puntos críticos de difusión</li>
                <li><strong>Estructura broadcast:</strong> Muchas estrellas indican comunicación uno-a-muchos (medios, instituciones)</li>
                <li><strong>Vulnerabilidad:</strong> Redes dominadas por estrellas son frágiles - eliminar el hub fragmenta la red</li>
                <li><strong>Falta de cohesión:</strong> A diferencia de los triángulos, las estrellas no crean comunidades cohesionadas</li>
              </ul>

              <h4 style={{ marginBottom: '12px' }}>Interpretación</h4>
              <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
                <li><strong>Muchas estrellas + pocos triángulos:</strong> Red broadcast o mediática (poca interacción horizontal)</li>
                <li><strong>Estrellas grandes:</strong> Presencia de influencers o cuentas institucionales dominantes</li>
                <li><strong>Estrellas distribuidas:</strong> Múltiples líderes de opinión en diferentes nichos</li>
              </ul>
            </>
          )
        }
      case 'chains':
        return {
          title: 'Cadenas',
          content: (
            <>
              <h4 style={{ marginTop: 0, marginBottom: '12px' }}>¿Qué representa?</h4>
              <p>Las <strong>cadenas</strong> son secuencias lineales de nodos conectados consecutivamente: A→B→C→D, donde no hay conexiones adicionales entre los nodos. Representan <strong>caminos de difusión</strong> y <strong>transmisión secuencial</strong> de información.</p>
              <p>En Twitter, las cadenas modelan cómo un mensaje se propaga paso a paso a través de retweets y menciones en cascada.</p>

              <h4 style={{ marginBottom: '12px' }}>¿Por qué es importante?</h4>
              <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
                <li><strong>Rutas de propagación:</strong> Cadenas largas indican difusión viral en múltiples saltos</li>
                <li><strong>Intermediarios:</strong> Nodos en medio de cadenas actúan como puentes entre comunidades</li>
                <li><strong>Velocidad de difusión:</strong> Cadenas cortas permiten difusión rápida, cadenas largas la ralentizan</li>
                <li><strong>Información degradada:</strong> Mensajes pueden distorsionarse al pasar por cadenas largas</li>
              </ul>

              <h4 style={{ marginBottom: '12px' }}>Interpretación</h4>
              <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
                <li><strong>Muchas cadenas largas:</strong> Información viaja por múltiples intermediarios</li>
                <li><strong>Cadenas cortas dominantes:</strong> Difusión eficiente con pocos saltos</li>
                <li><strong>Ausencia de cadenas:</strong> Red muy densa o muy fragmentada</li>
              </ul>
            </>
          )
        }
      case 'cohesion':
        return {
          title: 'Cohesión',
          content: (
            <>
              <h4 style={{ marginTop: 0, marginBottom: '12px' }}>¿Qué representa?</h4>
              <p>La <strong>cohesión</strong> mide el grado de <strong>conectividad global</strong> de la red. Indica qué tan bien integrada está la red como un todo y cuántos caminos independientes existen entre pares de nodos.</p>
              <p>Una red cohesionada es aquella donde la información puede fluir fácilmente de cualquier nodo a cualquier otro nodo a través de múltiples rutas.</p>

              <h4 style={{ marginBottom: '12px' }}>¿Por qué es importante?</h4>
              <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
                <li><strong>Velocidad de difusión:</strong> Alta cohesión permite que información viral se propague rápidamente</li>
                <li><strong>Fragmentación:</strong> Baja cohesión indica múltiples componentes desconectados o débilmente conectados</li>
                <li><strong>Resiliencia:</strong> Redes cohesionadas son más resistentes a fallos y ataques</li>
                <li><strong>Consenso:</strong> Mayor cohesión facilita la formación de narrativas compartidas</li>
              </ul>

              <h4 style={{ marginBottom: '12px' }}>Escala de interpretación</h4>
              <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
                <li><strong>0-5%:</strong> Extremadamente fragmentada - prácticamente sin integración</li>
                <li><strong>5-15%:</strong> Muy fragmentada - múltiples componentes débilmente conectados</li>
                <li><strong>15-30%:</strong> Baja cohesión - estructura fragmentada con algunos puentes</li>
                <li><strong>30-60%:</strong> Cohesión moderada - conexiones razonables entre grupos</li>
                <li><strong>60-85%:</strong> Alta cohesión - buena integración global</li>
                <li><strong>85-100%:</strong> Cohesión extrema - red altamente integrada (típico en comunidades pequeñas)</li>
              </ul>
            </>
          )
        }
      case 'distribution':
        return {
          title: 'Distribución de Patrones',
          content: (
            <>
              <h4 style={{ marginTop: 0, marginBottom: '12px' }}>¿Qué representa este gráfico?</h4>
              <p>La <strong>distribución de patrones</strong> muestra el balance relativo entre los tres tipos principales de estructuras en la red: triángulos, estrellas y cadenas. Este balance revela la <strong>naturaleza funcional</strong> de la red.</p>

              <h4 style={{ marginBottom: '12px' }}>Cómo interpretar las barras</h4>
              <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
                <li><strong>Triángulos (Reciprocidad):</strong> Representa el porcentaje de patrones que son grupos cohesivos con conversaciones mutuas</li>
                <li><strong>Estrellas (Broadcast):</strong> Representa el porcentaje de patrones de difusión unidireccional (hubs centrales)</li>
                <li><strong>Cadenas (Propagación):</strong> Representa el porcentaje de patrones de transmisión secuencial de información</li>
              </ul>

              <h4 style={{ marginBottom: '12px' }}>Escenarios típicos</h4>
              <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
                <li><strong>Broadcast dominante (&gt;60%):</strong> Red mediática o institucional - poca conversación horizontal</li>
                <li><strong>Reciprocidad dominante (&gt;60%):</strong> Comunidad dialogante - alta interacción mutua, posible cámara de eco</li>
                <li><strong>Cadenas dominantes (&gt;60%):</strong> Red viral - información fluye en cascada a través de intermediarios</li>
                <li><strong>Balance equilibrado:</strong> Red orgánica con múltiples dinámicas coexistiendo</li>
              </ul>

              <h4 style={{ marginBottom: '12px' }}>¿Por qué es importante?</h4>
              <p>El balance de patrones predice cómo se comportará la red:</p>
              <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
                <li><strong>Velocidad de difusión:</strong> Redes con muchas cadenas propagan rápido pero pueden distorsionar mensajes</li>
                <li><strong>Resiliencia:</strong> Redes con triángulos son más resistentes que redes tipo estrella</li>
                <li><strong>Polarización:</strong> Alta reciprocidad + baja densidad = grupos cerrados aislados</li>
                <li><strong>Influencia:</strong> Redes con muchas estrellas tienen puntos críticos de control</li>
              </ul>

              <h4 style={{ marginBottom: '12px' }}>Cálculo de porcentajes</h4>
              <p>Cada porcentaje se calcula como:</p>
              <p style={{ background: '#f5f5f5', padding: '16px', borderRadius: '6px', textAlign: 'center', margin: '16px 0' }}>
                % Patrón = (Cantidad del patrón / Total de patrones) × 100
              </p>
              <p style={{ fontSize: '13px', color: '#666' }}>
                Ejemplo: Si hay 0 triángulos, 11 estrellas y 107 cadenas, el total es 118 patrones.<br/>
                Broadcast = (11/118) × 100 = 9.3%<br/>
                Cadenas = (107/118) × 100 = 90.7%
              </p>
            </>
          )
        }
      case 'networkType':
        return {
          title: 'Tipo de Red Detectado',
          content: (
            <>
              <h4 style={{ marginTop: 0, marginBottom: '12px' }}>¿Cómo se detecta el tipo de red?</h4>
              <p>El sistema analiza automáticamente las métricas de la red y aplica un <strong>algoritmo de clasificación basado en umbrales</strong> para determinar qué tipología se ajusta mejor a los datos observados.</p>

              <h4 style={{ marginBottom: '12px' }}>Algoritmo de detección</h4>
              <p>El sistema evalúa las siguientes condiciones en orden de prioridad:</p>

              <ol style={{ marginLeft: '20px', lineHeight: 1.8 }}>
                <li><strong>Broadcast Unidireccional:</strong>
                  <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
                    <li>Ratio Broadcast &gt; 60%</li>
                    <li>Ratio Reciprocidad &lt; 10%</li>
                    <li>Cohesión &lt; 10%</li>
                  </ul>
                </li>
                <li><strong>Cámara de Eco:</strong>
                  <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
                    <li>Ratio Reciprocidad &gt; 60%</li>
                    <li>Cohesión &gt; 60%</li>
                    <li>Densidad &lt; 20%</li>
                  </ul>
                </li>
                <li><strong>Campaña Coordinada:</strong>
                  <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
                    <li>Centralización &gt; 30%</li>
                    <li>Ratio Broadcast &gt; 50%</li>
                  </ul>
                </li>
                <li><strong>Red Orgánica:</strong>
                  <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
                    <li>15% ≤ Cohesión ≤ 60%</li>
                    <li>Ratio Broadcast &lt; 60%</li>
                    <li>Ratio Reciprocidad &gt; 10%</li>
                  </ul>
                </li>
                <li><strong>Red Fragmentada:</strong>
                  <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
                    <li>Cohesión &lt; 15%</li>
                  </ul>
                </li>
                <li><strong>Red Viral:</strong>
                  <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
                    <li>Ratio Cadenas &gt; 60%</li>
                  </ul>
                </li>
              </ol>

              <h4 style={{ marginBottom: '12px' }}>Significado de cada tipo</h4>
              <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
                <li><strong>Broadcast Unidireccional:</strong> Información fluye desde hubs centrales sin conversación horizontal. Típico de medios, instituciones, cuentas oficiales.</li>
                <li><strong>Red Orgánica:</strong> Balance natural entre difusión y conversación. Interacciones espontáneas sin polarización extrema.</li>
                <li><strong>Cámara de Eco:</strong> Grupos cerrados con alta interacción interna pero aislados entre sí. Riesgo de polarización.</li>
                <li><strong>Campaña Coordinada:</strong> Estructura altamente jerárquica con concentración de poder. Posible amplificación artificial.</li>
                <li><strong>Red Fragmentada:</strong> Múltiples componentes desconectados. Poca integración global.</li>
                <li><strong>Red Viral:</strong> Información se propaga en cascada a través de múltiples intermediarios.</li>
              </ul>

              <h4 style={{ marginBottom: '12px' }}>Tabla comparativa</h4>
              <p>La tabla muestra valores de referencia para cada tipo de red, permitiendo comparar tu red con tipologías conocidas. Si tu red coincide con los rangos de un tipo específico, esa fila se resalta.</p>
            </>
          )
        }
      case 'density':
        return {
          title: 'Densidad de Red',
          content: (
            <>
              <h4 style={{ marginTop: 0, marginBottom: '12px' }}>¿Qué es la densidad de red?</h4>
              <p>La <strong>densidad</strong> mide qué proporción de todas las conexiones posibles en la red están realmente presentes. Es un indicador fundamental de qué tan <strong>conectada</strong> está la red.</p>

              <h4 style={{ marginBottom: '12px' }}>Fórmula</h4>
              <p style={{ background: '#f5f5f5', padding: '16px', borderRadius: '6px', textAlign: 'center', margin: '16px 0' }}>
                Densidad = (Aristas reales / Aristas posibles) × 100
              </p>
              <p>Para una red dirigida (como menciones en Twitter):</p>
              <p style={{ background: '#f5f5f5', padding: '16px', borderRadius: '6px', textAlign: 'center', margin: '16px 0' }}>
                Densidad = (E / [N × (N - 1)]) × 100
              </p>
              <p style={{ fontSize: '13px', color: '#666' }}>
                Donde <strong>E</strong> = número de aristas (menciones)<br/>
                <strong>N</strong> = número de nodos (usuarios)
              </p>

              <h4 style={{ marginBottom: '12px' }}>Interpretación</h4>
              <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
                <li><strong>&lt; 1%:</strong> Red extremadamente dispersa - típico en redes grandes (miles de nodos)</li>
                <li><strong>1-5%:</strong> Red dispersa - común en redes sociales a escala</li>
                <li><strong>5-20%:</strong> Densidad moderada - red bien conectada pero no saturada</li>
                <li><strong>&gt; 20%:</strong> Red densa - alta conectividad, típico en comunidades pequeñas</li>
              </ul>

              <h4 style={{ marginBottom: '12px' }}>¿Por qué importa?</h4>
              <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
                <li><strong>Velocidad de difusión:</strong> Redes más densas propagan información más rápido</li>
                <li><strong>Redundancia:</strong> Alta densidad = múltiples caminos entre nodos = mayor resiliencia</li>
                <li><strong>Contexto:</strong> Densidad muy baja en red pequeña indica fragmentación</li>
                <li><strong>Escala:</strong> Redes grandes tienden a tener menor densidad por diseño</li>
              </ul>

              <h4 style={{ marginBottom: '12px' }}>Ejemplo de cálculo</h4>
              <p style={{ fontSize: '13px', color: '#666', background: '#fffbf0', padding: '12px', borderRadius: '6px' }}>
                Red con 155 usuarios y 269 menciones:<br/>
                Aristas posibles = 155 × 154 = 23,870<br/>
                Densidad = (269 / 23,870) × 100 = <strong>1.13%</strong><br/>
                Interpretación: Red dispersa, típica de una red social de este tamaño
              </p>
            </>
          )
        }
      case 'broadcastRatio':
        return {
          title: 'Ratio de Broadcast',
          content: (
            <>
              <h4 style={{ marginTop: 0, marginBottom: '12px' }}>¿Qué es el Ratio de Broadcast?</h4>
              <p>El <strong>Ratio de Broadcast</strong> mide qué proporción de los patrones detectados en la red son <strong>estrellas</strong> (estructuras de difusión unidireccional). Indica el grado de <strong>comunicación uno-a-muchos</strong> vs. conversación mutua.</p>

              <h4 style={{ marginBottom: '12px' }}>Fórmula</h4>
              <p style={{ background: '#f5f5f5', padding: '16px', borderRadius: '6px', textAlign: 'center', margin: '16px 0' }}>
                Ratio Broadcast = (Estrellas / Total Patrones) × 100
              </p>
              <p style={{ fontSize: '13px', color: '#666' }}>
                Donde <strong>Total Patrones</strong> = Triángulos + Estrellas + Cadenas
              </p>

              <h4 style={{ marginBottom: '12px' }}>Interpretación</h4>
              <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
                <li><strong>&gt; 60%:</strong> Dominio broadcast - red mediática o institucional sin conversación horizontal</li>
                <li><strong>30-60%:</strong> Balance - mezcla de difusión y conversación</li>
                <li><strong>&lt; 30%:</strong> Baja difusión - predomina la conversación sobre el broadcast</li>
              </ul>

              <h4 style={{ marginBottom: '12px' }}>¿Qué indica un valor alto?</h4>
              <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
                <li>Presencia de <strong>influencers o cuentas institucionales</strong> que difunden sin recibir respuesta</li>
                <li>Comunicación <strong>asimétrica</strong>: pocos hablan, muchos escuchan</li>
                <li>Estructura tipo <strong>medio de comunicación</strong> o campaña publicitaria</li>
                <li>Baja <strong>reciprocidad</strong> - poca conversación mutua</li>
              </ul>

              <h4 style={{ marginBottom: '12px' }}>¿Qué indica un valor bajo?</h4>
              <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
                <li>Red más <strong>dialógica</strong> y menos jerárquica</li>
                <li>Alta participación horizontal entre usuarios</li>
                <li>Posible comunidad o grupo de discusión</li>
              </ul>

              <h4 style={{ marginBottom: '12px' }}>Relación con otras métricas</h4>
              <p style={{ fontSize: '13px', color: '#666', background: '#fffbf0', padding: '12px', borderRadius: '6px' }}>
                <strong>Alto Broadcast + Baja Reciprocidad + Baja Cohesión</strong> = Red Broadcast Unidireccional<br/>
                <strong>Bajo Broadcast + Alta Reciprocidad</strong> = Red dialogante o comunidad
              </p>
            </>
          )
        }
      case 'reciprocityRatio':
        return {
          title: 'Ratio de Reciprocidad',
          content: (
            <>
              <h4 style={{ marginTop: 0, marginBottom: '12px' }}>¿Qué es el Ratio de Reciprocidad?</h4>
              <p>El <strong>Ratio de Reciprocidad</strong> mide qué proporción de los patrones detectados son <strong>triángulos</strong> (grupos de 3 usuarios mutuamente conectados). Indica el grado de <strong>conversación bidireccional</strong> y cohesión social en la red.</p>

              <h4 style={{ marginBottom: '12px' }}>Fórmula</h4>
              <p style={{ background: '#f5f5f5', padding: '16px', borderRadius: '6px', textAlign: 'center', margin: '16px 0' }}>
                Ratio Reciprocidad = (Triángulos / Total Patrones) × 100
              </p>
              <p style={{ fontSize: '13px', color: '#666' }}>
                Donde <strong>Total Patrones</strong> = Triángulos + Estrellas + Cadenas
              </p>

              <h4 style={{ marginBottom: '12px' }}>Interpretación</h4>
              <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
                <li><strong>&gt; 60%:</strong> Alta reciprocidad - comunidad dialogante con conversaciones mutuas intensas</li>
                <li><strong>40-60%:</strong> Reciprocidad moderada-alta - buena interacción horizontal</li>
                <li><strong>10-40%:</strong> Reciprocidad moderada - mezcla de difusión y conversación</li>
                <li><strong>&lt; 10%:</strong> Baja reciprocidad - comunicación mayormente unidireccional</li>
              </ul>

              <h4 style={{ marginBottom: '12px' }}>¿Qué indica un valor alto?</h4>
              <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
                <li>Usuarios se <strong>mencionan mutuamente</strong> creando grupos cohesivos</li>
                <li>Posible formación de <strong>comunidades cerradas</strong> o "cámaras de eco"</li>
                <li>Alta <strong>confianza</strong> y relaciones establecidas entre miembros</li>
                <li>Conversaciones <strong>circulares</strong> donde A menciona B, B menciona C, C menciona A</li>
              </ul>

              <h4 style={{ marginBottom: '12px' }}>¿Qué indica un valor bajo?</h4>
              <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
                <li>Red tipo <strong>broadcast</strong> - poca conversación mutua</li>
                <li>Interacciones <strong>asimétricas</strong> (unos mencionan, otros no responden)</li>
                <li>Estructura <strong>jerárquica</strong> en lugar de comunitaria</li>
              </ul>

              <h4 style={{ marginBottom: '12px' }}>Detección de triángulos</h4>
              <p>Un triángulo existe cuando:</p>
              <p style={{ background: '#f5f5f5', padding: '16px', borderRadius: '6px', textAlign: 'center', margin: '16px 0' }}>
                Usuario A → Usuario B<br/>
                Usuario B → Usuario C<br/>
                Usuario C → Usuario A
              </p>
              <p style={{ fontSize: '13px', color: '#666' }}>
                Esto indica que los tres usuarios forman un <strong>ciclo cerrado</strong> de menciones mutuas.
              </p>

              <h4 style={{ marginBottom: '12px' }}>Relación con polarización</h4>
              <p style={{ fontSize: '13px', color: '#666', background: '#fffbf0', padding: '12px', borderRadius: '6px' }}>
                <strong>Alta Reciprocidad + Baja Densidad Global</strong> = Múltiples grupos cerrados aislados entre sí (polarización)<br/>
                <strong>Alta Reciprocidad + Alta Densidad</strong> = Comunidad cohesionada con alta integración
              </p>
            </>
          )
        }
      case 'centralization':
        return {
          title: 'Centralización',
          content: (
            <>
              <h4 style={{ marginTop: 0, marginBottom: '12px' }}>¿Qué es la Centralización?</h4>
              <p>La <strong>Centralización</strong> mide qué proporción de nodos en la red actúan como <strong>hubs centrales</strong> (centros de estrellas). Indica el grado de <strong>concentración de poder</strong> e influencia en pocos actores.</p>

              <h4 style={{ marginBottom: '12px' }}>Fórmula</h4>
              <p style={{ background: '#f5f5f5', padding: '16px', borderRadius: '6px', textAlign: 'center', margin: '16px 0' }}>
                Centralización = (Estrellas / Total Nodos) × 100
              </p>
              <p style={{ fontSize: '13px', color: '#666' }}>
                Donde <strong>Estrellas</strong> = número de patrones tipo estrella detectados<br/>
                <strong>Total Nodos</strong> = número total de usuarios en la red
              </p>

              <h4 style={{ marginBottom: '12px' }}>Interpretación</h4>
              <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
                <li><strong>&gt; 30%:</strong> Alta centralización - poder concentrado en muchos hubs</li>
                <li><strong>10-30%:</strong> Centralización moderada - algunos nodos centrales influyentes</li>
                <li><strong>&lt; 10%:</strong> Baja centralización - estructura distribuida sin dominancia clara</li>
              </ul>

              <h4 style={{ marginBottom: '12px' }}>¿Qué indica un valor alto?</h4>
              <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
                <li><strong>Jerarquía pronunciada</strong> - pocos usuarios controlan el flujo de información</li>
                <li>Presencia de <strong>influencers o líderes de opinión</strong></li>
                <li>Posible <strong>campaña coordinada</strong> con amplificadores centrales</li>
                <li><strong>Vulnerabilidad</strong> - eliminar hubs fragmenta la red</li>
              </ul>

              <h4 style={{ marginBottom: '12px' }}>¿Qué indica un valor bajo?</h4>
              <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
                <li>Red más <strong>igualitaria</strong> y distribuida</li>
                <li>Poder e influencia <strong>descentralizados</strong></li>
                <li>Mayor <strong>resiliencia</strong> - no depende de nodos críticos</li>
              </ul>

              <h4 style={{ marginBottom: '12px' }}>¿Qué es un hub (estrella)?</h4>
              <p>Un hub o estrella es un usuario que:</p>
              <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
                <li>Está <strong>conectado a múltiples usuarios</strong> que NO se conectan entre sí</li>
                <li>Actúa como <strong>punto de difusión</strong> central</li>
                <li>Puede ser un medio, influencer, cuenta oficial o bot amplificador</li>
              </ul>

              <h4 style={{ marginBottom: '12px' }}>Riesgos de alta centralización</h4>
              <p style={{ fontSize: '13px', color: '#666', background: '#fff3cd', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #f59e0b' }}>
                ⚠️ <strong>Redes altamente centralizadas</strong> son vulnerables a:<br/>
                - <strong>Manipulación</strong>: Controlando hubs se controla el flujo de información<br/>
                - <strong>Fragmentación</strong>: Eliminar hubs desconecta la red<br/>
                - <strong>Desinformación</strong>: Amplificación coordinada desde centros<br/>
                - <strong>Bots y automatización</strong>: Hubs pueden ser cuentas automatizadas
              </p>
            </>
          )
        }
      default:
        return { title: '', content: null }
    }
  }

  // Contenido de modales de detalles
  const getDetailsModalContent = (key: NetworkMetricKey) => {
    switch (key) {
      case 'triangles': {
        const trianglesList = stats.trianglesList || []
        const displayList = trianglesList.slice(0, 100)
        const hasMore = triangles > displayList.length

        return {
          title: 'Triángulos en la Red',
          content: (
            <div>
              <p style={{ marginBottom: '12px', fontSize: '14px' }}>
                <strong>{triangles} triángulos</strong> detectados en total.
                {hasMore && ` Mostrando los primeros ${displayList.length}.`}
              </p>
              <p style={{ marginBottom: '20px', fontSize: '13px', color: '#666' }}>
                Un triángulo es un grupo de 3 usuarios mutuamente conectados (A ↔ B ↔ C ↔ A).
                Indica cohesión local, círculos cerrados de conversación y posibles "cámaras de eco".
              </p>

              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {displayList.map((triangle, index) => {
                  const [a, b, c] = triangle.nodes
                  return (
                    <div
                      key={index}
                      style={{
                        padding: '12px',
                        marginBottom: '8px',
                        background: '#f5f5f5',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
                      <div style={{ fontSize: '12px', color: '#999', minWidth: '40px' }}>
                        #{index + 1}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', flexWrap: 'wrap' }}>
                        <span style={{
                          padding: '4px 8px',
                          background: '#fff',
                          borderRadius: '4px',
                          fontFamily: 'monospace'
                        }}>
                          @{a}
                        </span>
                        <span style={{ color: '#666' }}>↔</span>
                        <span style={{
                          padding: '4px 8px',
                          background: '#fff',
                          borderRadius: '4px',
                          fontFamily: 'monospace'
                        }}>
                          @{b}
                        </span>
                        <span style={{ color: '#666' }}>↔</span>
                        <span style={{
                          padding: '4px 8px',
                          background: '#fff',
                          borderRadius: '4px',
                          fontFamily: 'monospace'
                        }}>
                          @{c}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {hasMore && (
                <p style={{ marginTop: '16px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
                  + {triangles - displayList.length} triángulos adicionales no mostrados
                </p>
              )}
            </div>
          )
        }
      }

      case 'stars': {
        const starsList = stats.starsList || []
        const displayList = starsList.slice(0, 50)
        const hasMore = stars > displayList.length

        return {
          title: 'Estrellas en la Red',
          content: (
            <div>
              <p style={{ marginBottom: '12px', fontSize: '14px' }}>
                <strong>{stars} estrellas</strong> detectadas en total.
                {hasMore && ` Mostrando las ${displayList.length} más relevantes ordenadas por grado.`}
              </p>
              <p style={{ marginBottom: '20px', fontSize: '13px', color: '#666' }}>
                Una estrella es un usuario central (hub) conectado a muchos otros que no se conectan entre sí.
                Indica estructura jerárquica, concentración de poder y posibles influencers o cuentas amplificadoras.
              </p>

              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {displayList.map((star, index) => {
                  const satellitesPreview = star.satellites.slice(0, 5)
                  const moreCount = star.satellites.length - 5

                  return (
                    <div
                      key={index}
                      style={{
                        padding: '12px',
                        marginBottom: '8px',
                        background: '#f5f5f5',
                        borderRadius: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div style={{ fontSize: '12px', color: '#999', minWidth: '40px' }}>
                          #{index + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ marginBottom: '6px' }}>
                            <strong style={{ fontSize: '13px' }}>Centro:</strong>{' '}
                            <span style={{
                              padding: '4px 8px',
                              background: '#fff',
                              borderRadius: '4px',
                              fontFamily: 'monospace',
                              fontSize: '13px'
                            }}>
                              @{star.center}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>
                            <span style={{ marginRight: '12px' }}>
                              <strong>Grado:</strong> {star.degree}
                            </span>
                            <span>
                              <strong>Conectividad:</strong> {star.connectivity}%
                            </span>
                          </div>
                          <div style={{ fontSize: '12px' }}>
                            <strong style={{ color: '#666' }}>Satélites:</strong>{' '}
                            {satellitesPreview.map((s, i) => (
                              <span key={i}>
                                @{s}
                                {i < satellitesPreview.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                            {moreCount > 0 && (
                              <span style={{ color: '#999' }}> +{moreCount} más</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {hasMore && (
                <p style={{ marginTop: '16px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
                  + {stars - displayList.length} estrellas adicionales no mostradas
                </p>
              )}
            </div>
          )
        }
      }

      case 'chains': {
        const chainsList = stats.chainsList || []
        const displayList = chainsList.slice(0, 100)
        const hasMore = chains > displayList.length

        return {
          title: 'Cadenas en la Red',
          content: (
            <div>
              <p style={{ marginBottom: '12px', fontSize: '14px' }}>
                <strong>{chains} cadenas</strong> detectadas en total.
                {hasMore && ` Mostrando las primeras ${displayList.length}.`}
              </p>
              <p style={{ marginBottom: '20px', fontSize: '13px', color: '#666' }}>
                Una cadena es una secuencia A → B → C donde A y C no están directamente conectados.
                Indica flujos lineales de información, propagación secuencial y el rol de intermediarios (B).
              </p>

              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {displayList.map((chain, index) => {
                  const [a, b, c] = chain.nodes
                  return (
                    <div
                      key={index}
                      style={{
                        padding: '12px',
                        marginBottom: '8px',
                        background: '#f5f5f5',
                        borderRadius: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontSize: '12px', color: '#999', minWidth: '40px' }}>
                          #{index + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', flexWrap: 'wrap', marginBottom: '4px' }}>
                            <span style={{
                              padding: '4px 8px',
                              background: '#fff',
                              borderRadius: '4px',
                              fontFamily: 'monospace'
                            }}>
                              @{a}
                            </span>
                            <span style={{ color: '#666' }}>→</span>
                            <span style={{
                              padding: '4px 8px',
                              background: '#ffc107',
                              borderRadius: '4px',
                              fontFamily: 'monospace',
                              fontWeight: 600
                            }}>
                              @{b}
                            </span>
                            <span style={{ color: '#666' }}>→</span>
                            <span style={{
                              padding: '4px 8px',
                              background: '#fff',
                              borderRadius: '4px',
                              fontFamily: 'monospace'
                            }}>
                              @{c}
                            </span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#666', fontStyle: 'italic' }}>
                            {b} actúa como intermediario
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {hasMore && (
                <p style={{ marginTop: '16px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
                  + {chains - displayList.length} cadenas adicionales no mostradas
                </p>
              )}
            </div>
          )
        }
      }

      default:
        return { title: '', content: null }
    }
  }

  const modal = selectedMetric
    ? (modalType === 'info' ? getInfoModalContent(selectedMetric) : getDetailsModalContent(selectedMetric))
    : { title: '', content: null }

  return (
    <>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 className="chart-title" style={{ margin: 0 }}>
            Patrones de Red
            <InfoButton onClick={() => setShowGeneralInfo(true)} />
          </h3>
          <button
            onClick={downloadCSV}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
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

        {/* Tarjetas de patrones (clickeables) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          {/* Triángulos */}
          <div
            className="stat-card"
            style={{
              position: 'relative',
              cursor: triangles > 0 && stats.trianglesList ? 'pointer' : 'default',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onClick={() => triangles > 0 && stats.trianglesList && openDetailsModal('triangles')}
            onMouseEnter={(e) => {
              if (triangles > 0 && stats.trianglesList) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
              <InfoButton onClick={(e) => { e.stopPropagation(); openInfoModal('triangles'); }} />
            </div>
            <div className="stat-icon">
              <Triangle />
            </div>
            <div className="stat-content">
              <div className="stat-label">Triángulos</div>
              <div className="stat-value">{triangles.toLocaleString()}</div>
              <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                Grupos de 3 nodos completamente conectados
              </div>
              {triangles > 0 && stats.trianglesList && (
                <div style={{ fontSize: '11px', color: '#007bff', marginTop: '8px', fontWeight: 500 }}>
                  Click para ver detalles
                </div>
              )}
            </div>
          </div>

          {/* Estrellas */}
          <div
            className="stat-card"
            style={{
              position: 'relative',
              cursor: stars > 0 && stats.starsList ? 'pointer' : 'default',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onClick={() => stars > 0 && stats.starsList && openDetailsModal('stars')}
            onMouseEnter={(e) => {
              if (stars > 0 && stats.starsList) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
              <InfoButton onClick={(e) => { e.stopPropagation(); openInfoModal('stars'); }} />
            </div>
            <div className="stat-icon">
              <Star />
            </div>
            <div className="stat-content">
              <div className="stat-label">Estrellas</div>
              <div className="stat-value">{stars.toLocaleString()}</div>
              <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                Nodos centrales con múltiples conexiones
              </div>
              {stars > 0 && stats.starsList && (
                <div style={{ fontSize: '11px', color: '#007bff', marginTop: '8px', fontWeight: 500 }}>
                  Click para ver detalles
                </div>
              )}
            </div>
          </div>

          {/* Cadenas */}
          <div
            className="stat-card"
            style={{
              position: 'relative',
              cursor: chains > 0 && stats.chainsList ? 'pointer' : 'default',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onClick={() => chains > 0 && stats.chainsList && openDetailsModal('chains')}
            onMouseEnter={(e) => {
              if (chains > 0 && stats.chainsList) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
              <InfoButton onClick={(e) => { e.stopPropagation(); openInfoModal('chains'); }} />
            </div>
            <div className="stat-icon">
              <GitBranch />
            </div>
            <div className="stat-content">
              <div className="stat-label">Cadenas</div>
              <div className="stat-value">{chains.toLocaleString()}</div>
              <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                Secuencias lineales de conexiones
              </div>
              {chains > 0 && stats.chainsList && (
                <div style={{ fontSize: '11px', color: '#007bff', marginTop: '8px', fontWeight: 500 }}>
                  Click para ver detalles
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Grid 2x1: Cohesión y Distribución de Patrones */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
          {/* Barra de Cohesión */}
          <div className="chart-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 className="chart-title" style={{ margin: 0 }}>
                Cohesión de la Red
              </h3>
              <InfoButton onClick={() => openInfoModal('cohesion')} />
            </div>

            <div style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>
              {getCohesionLabel()}: <strong style={{ fontSize: '18px', color: '#000' }}>{cohesion}%</strong>
            </div>

            <div style={{
              width: '100%',
              height: '30px',
              background: '#e0e0e0',
              borderRadius: '15px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                width: `${cohesion}%`,
                height: '100%',
                background: getCohesionColor(),
                transition: 'width 0.5s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: '10px',
                color: '#fff',
                fontWeight: 600,
                fontSize: '14px'
              }}>
                {cohesion > 10 && `${cohesion}%`}
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '8px',
              fontSize: '11px',
              color: '#999'
            }}>
              <span>Fragmentada</span>
              <span>Integrada</span>
            </div>
          </div>

          {/* Gráfico de Barras: Distribución de Patrones */}
          <div className="chart-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 className="chart-title" style={{ margin: 0 }}>Distribución de Patrones</h3>
              <InfoButton onClick={() => openInfoModal('distribution')} />
            </div>
            <div style={{ padding: '20px 0' }}>
            {/* Triángulos */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                <span style={{ fontWeight: 600 }}>Triángulos (Reciprocidad)</span>
                <span style={{ color: '#666' }}>{triangles} ({reciprocityRatio.toFixed(1)}%)</span>
              </div>
              <div style={{
                width: '100%',
                height: '28px',
                background: '#e5e7eb',
                borderRadius: '6px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                  width: `${reciprocityRatio}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #8b5cf6 0%, #a78bfa 100%)',
                  transition: 'width 0.5s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingRight: '8px',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '12px'
                }}>
                  {reciprocityRatio > 5 && `${reciprocityRatio.toFixed(1)}%`}
                </div>
              </div>
            </div>

            {/* Estrellas */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                <span style={{ fontWeight: 600 }}>Estrellas (Broadcast)</span>
                <span style={{ color: '#666' }}>{stars} ({broadcastRatio.toFixed(1)}%)</span>
              </div>
              <div style={{
                width: '100%',
                height: '28px',
                background: '#e5e7eb',
                borderRadius: '6px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                  width: `${broadcastRatio}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)',
                  transition: 'width 0.5s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingRight: '8px',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '12px'
                }}>
                  {broadcastRatio > 5 && `${broadcastRatio.toFixed(1)}%`}
                </div>
              </div>
            </div>

            {/* Cadenas */}
            <div style={{ marginBottom: '0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                <span style={{ fontWeight: 600 }}>Cadenas (Propagación)</span>
                <span style={{ color: '#666' }}>{chains} ({((chains / (triangles + stars + chains || 1)) * 100).toFixed(1)}%)</span>
              </div>
              <div style={{
                width: '100%',
                height: '28px',
                background: '#e5e7eb',
                borderRadius: '6px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                  width: `${((chains / (triangles + stars + chains || 1)) * 100)}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
                  transition: 'width 0.5s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingRight: '8px',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '12px'
                }}>
                  {((chains / (triangles + stars + chains || 1)) * 100) > 5 && `${((chains / (triangles + stars + chains || 1)) * 100).toFixed(1)}%`}
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Grid 2x1: Tipo de Red y Métricas Derivadas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
          {/* Tipo de Red Detectado */}
          <div className="chart-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 className="chart-title" style={{ margin: 0 }}>Tipo de Red Detectado</h3>
              <InfoButton onClick={() => openInfoModal('networkType')} />
            </div>
            <div style={{
              padding: '20px',
              background: `${networkType.color}15`,
              border: `2px solid ${networkType.color}`,
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <div style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: networkType.color,
                marginBottom: '8px'
              }}>
                {networkType.type}
              </div>
              <div style={{ fontSize: '14px', color: '#4b5563', lineHeight: 1.6 }}>
                {networkType.description}
              </div>
            </div>

          {/* Tabla comparativa con redes típicas */}
          <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #d1d5db' }}>
                <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600 }}>Tipo de Red</th>
                <th style={{ padding: '10px', textAlign: 'center', fontWeight: 600 }}>Reciprocidad</th>
                <th style={{ padding: '10px', textAlign: 'center', fontWeight: 600 }}>Broadcast</th>
                <th style={{ padding: '10px', textAlign: 'center', fontWeight: 600 }}>Cohesión</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ background: networkType.type === 'Broadcast Unidireccional' ? `${networkType.color}20` : 'transparent', borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '10px', fontWeight: networkType.type === 'Broadcast Unidireccional' ? 600 : 400 }}>Broadcast Unidireccional</td>
                <td style={{ padding: '10px', textAlign: 'center', color: '#999' }}>Muy baja (&lt;10%)</td>
                <td style={{ padding: '10px', textAlign: 'center', color: '#999' }}>Muy alta (&gt;60%)</td>
                <td style={{ padding: '10px', textAlign: 'center', color: '#999' }}>Muy baja (&lt;10%)</td>
              </tr>
              <tr style={{ background: networkType.type === 'Red Orgánica' ? `${networkType.color}20` : 'transparent', borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '10px', fontWeight: networkType.type === 'Red Orgánica' ? 600 : 400 }}>Red Orgánica</td>
                <td style={{ padding: '10px', textAlign: 'center', color: '#999' }}>Moderada (10-40%)</td>
                <td style={{ padding: '10px', textAlign: 'center', color: '#999' }}>Moderada (30-60%)</td>
                <td style={{ padding: '10px', textAlign: 'center', color: '#999' }}>Moderada (15-60%)</td>
              </tr>
              <tr style={{ background: networkType.type === 'Cámara de Eco' ? `${networkType.color}20` : 'transparent', borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '10px', fontWeight: networkType.type === 'Cámara de Eco' ? 600 : 400 }}>Cámara de Eco</td>
                <td style={{ padding: '10px', textAlign: 'center', color: '#999' }}>Muy alta (&gt;60%)</td>
                <td style={{ padding: '10px', textAlign: 'center', color: '#999' }}>Baja (&lt;30%)</td>
                <td style={{ padding: '10px', textAlign: 'center', color: '#999' }}>Alta (&gt;60%)</td>
              </tr>
              <tr style={{ background: networkType.type === 'Campaña Coordinada' ? `${networkType.color}20` : 'transparent', borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '10px', fontWeight: networkType.type === 'Campaña Coordinada' ? 600 : 400 }}>Campaña Coordinada</td>
                <td style={{ padding: '10px', textAlign: 'center', color: '#999' }}>Baja (&lt;20%)</td>
                <td style={{ padding: '10px', textAlign: 'center', color: '#999' }}>Alta (&gt;50%)</td>
                <td style={{ padding: '10px', textAlign: 'center', color: '#999' }}>Variable</td>
              </tr>
              <tr style={{ background: 'transparent' }}>
                <td style={{ padding: '10px', fontWeight: 600, color: networkType.color }}>Tu Red</td>
                <td style={{ padding: '10px', textAlign: 'center', fontWeight: 600, color: networkType.color }}>{reciprocityRatio.toFixed(1)}%</td>
                <td style={{ padding: '10px', textAlign: 'center', fontWeight: 600, color: networkType.color }}>{broadcastRatio.toFixed(1)}%</td>
                <td style={{ padding: '10px', textAlign: 'center', fontWeight: 600, color: networkType.color }}>{cohesion.toFixed(1)}%</td>
              </tr>
            </tbody>
          </table>
        </div>

          {/* Métricas Derivadas */}
          <div className="chart-card">
            <h3 className="chart-title">Métricas Derivadas</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
              {/* Densidad de Red */}
              <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                  <InfoButton onClick={(e) => { e.stopPropagation(); openInfoModal('density'); }} />
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px', fontWeight: 600 }}>
                  DENSIDAD DE RED
                </div>
                <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}>
                  {networkDensity.toFixed(2)}%
                </div>
                <div style={{ fontSize: '10px', color: '#9ca3af' }}>
                  Proporción de conexiones reales vs. posibles
                </div>
              </div>

              {/* Ratio de Broadcast */}
              <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                  <InfoButton onClick={(e) => { e.stopPropagation(); openInfoModal('broadcastRatio'); }} />
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px', fontWeight: 600 }}>
                  RATIO DE BROADCAST
                </div>
                <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}>
                  {broadcastRatio.toFixed(1)}%
                </div>
                <div style={{ fontSize: '10px', color: '#9ca3af' }}>
                  Proporción de difusión unidireccional
                </div>
              </div>

              {/* Ratio de Reciprocidad */}
              <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                  <InfoButton onClick={(e) => { e.stopPropagation(); openInfoModal('reciprocityRatio'); }} />
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px', fontWeight: 600 }}>
                  RATIO DE RECIPROCIDAD
                </div>
                <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}>
                  {reciprocityRatio.toFixed(1)}%
                </div>
                <div style={{ fontSize: '10px', color: '#9ca3af' }}>
                  Proporción de conversaciones mutuas
                </div>
              </div>

              {/* Centralización */}
              <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                  <InfoButton onClick={(e) => { e.stopPropagation(); openInfoModal('centralization'); }} />
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px', fontWeight: 600 }}>
                  CENTRALIZACIÓN
                </div>
                <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}>
                  {centralizationRatio.toFixed(1)}%
                </div>
                <div style={{ fontSize: '10px', color: '#9ca3af' }}>
                  Proporción de nodos centrales (hubs)
                </div>
              </div>
            </div>

            {/* Interpretación de las métricas derivadas */}
            <div style={{ marginTop: '16px', padding: '12px', background: '#fffbf0', borderRadius: '8px', border: '1px solid #fbbf24' }}>
              <div style={{ fontSize: '12px', lineHeight: 1.6, color: '#4b5563' }}>
                <strong>Interpretación:</strong>{' '}
                {networkDensity < 5 && 'La red es muy dispersa con pocas conexiones entre nodos. '}
                {networkDensity >= 5 && networkDensity < 20 && 'La red tiene densidad baja, típica de redes grandes. '}
                {networkDensity >= 20 && 'La red es relativamente densa, con muchas conexiones. '}

                {broadcastRatio > 60 && 'Domina la difusión unidireccional, típico de medios o instituciones. '}
                {broadcastRatio >= 30 && broadcastRatio <= 60 && 'Existe balance entre difusión y conversación. '}
                {broadcastRatio < 30 && 'Predomina la conversación sobre la difusión. '}

                {reciprocityRatio > 40 && 'Alta reciprocidad indica comunidades dialogantes. '}
                {reciprocityRatio >= 10 && reciprocityRatio <= 40 && 'Reciprocidad moderada, mezcla de difusión y conversación. '}
                {reciprocityRatio < 10 && 'Baja reciprocidad, comunicación mayormente unidireccional. '}

                {centralizationRatio > 20 && 'Alta centralización sugiere concentración de poder en pocos nodos.'}
                {centralizationRatio <= 20 && 'Baja centralización indica estructura distribuida.'}
              </div>
            </div>
          </div>
        </div>

        {/* Interpretación Automática */}
        <div className="chart-card" style={{ marginTop: '24px' }}>
          <h3 className="chart-title">Interpretación Automática</h3>
          <div style={{ fontSize: '14px', lineHeight: 1.8, color: '#333' }}>
            {generateInterpretation()}
          </div>
        </div>
      </div>

      {/* Modal único que cambia de contenido */}
      <InfoModal
        isOpen={selectedMetric !== null}
        onClose={closeModal}
        title={modal.title}
      >
        {modal.content}
      </InfoModal>

      {/* Modal informativo general */}
      <InfoModal
        isOpen={showGeneralInfo}
        onClose={() => setShowGeneralInfo(false)}
        title="Patrones de Red"
      >
        <h4 style={{ marginTop: 0, marginBottom: '12px' }}>¿Qué son los patrones de red?</h4>
        <p>Los <strong>patrones de red</strong> (también llamados <strong>motifs</strong> o <strong>subgrafos</strong>) son configuraciones recurrentes de conexiones entre pequeños grupos de nodos. Son los "bloques de construcción" fundamentales que caracterizan la estructura y dinámica de una red social.</p>
        <p>Al analizar qué patrones dominan en una red, podemos inferir su función, comportamiento y tipo de interacciones que se dan en ella.</p>

        <h4 style={{ marginBottom: '12px' }}>Los tres patrones básicos</h4>
        <p>En redes sociales, tres patrones fundamentales capturan la mayoría de las dinámicas de interacción:</p>
        <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
          <li><strong>Triángulos:</strong> Representan reciprocidad y cohesión social (A ↔ B ↔ C ↔ A)</li>
          <li><strong>Estrellas:</strong> Representan jerarquía y difusión centralizada (un hub con muchos periféricos)</li>
          <li><strong>Cadenas:</strong> Representan propagación secuencial de información (A → B → C)</li>
        </ul>
        <p>Cada patrón revela un aspecto diferente de cómo fluye la información y se estructuran las relaciones.</p>

        <h4 style={{ marginBottom: '12px' }}>¿Por qué son importantes?</h4>
        <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
          <li><strong>Tipología de redes:</strong> Redes con muchos triángulos son cohesivas, redes con muchas estrellas son jerárquicas, redes con muchas cadenas son dispersas</li>
          <li><strong>Predicción de comportamiento:</strong> Los patrones predicen cómo se propagará información (viral vs. fragmentada)</li>
          <li><strong>Detección de anomalías:</strong> Patrones inusuales pueden indicar comportamiento coordin ado o automatizado</li>
          <li><strong>Estrategias de intervención:</strong> Saber qué patrones dominan ayuda a diseñar estrategias de difusión o moderación</li>
        </ul>

        <h4 style={{ marginBottom: '12px' }}>Cohesión de red</h4>
        <p>La <strong>cohesión</strong> mide qué tan integrada está la red como un todo. Se calcula mediante una fórmula compuesta que combina:</p>
        <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
          <li><strong>Factor de triángulos (40%):</strong> Densidad de triángulos relativa al máximo posible</li>
          <li><strong>Clustering promedio (30%):</strong> Tendencia de los vecinos de un nodo a conectarse entre sí</li>
          <li><strong>Densidad de red (30%):</strong> Proporción de conexiones reales vs. posibles</li>
        </ul>
        <p style={{ background: '#f5f5f5', padding: '16px', borderRadius: '6px', margin: '16px 0' }}>
          Cohesión = [(Factor_triángulos × 0.4) + (Clustering × 0.3) + (Densidad × 0.3)] × 100
        </p>

        <h4 style={{ marginBottom: '12px' }}>Interpretación automática</h4>
        <p>El sistema genera automáticamente una interpretación basada en las métricas calculadas, que incluye:</p>
        <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
          <li>Evaluación del nivel de cohesión general (baja/moderada/alta/extrema)</li>
          <li>Análisis de la presencia de triángulos y su significado para la reciprocidad</li>
          <li>Evaluación de estrellas y su indicación de concentración de poder</li>
          <li>Análisis de cadenas y flujos lineales de información</li>
          <li>Identificación del patrón dominante si alguno supera el 50%</li>
        </ul>

        <h4 style={{ marginBottom: '12px' }}>Interactividad</h4>
        <p>Las tarjetas de patrones son <strong>clickeables</strong>. Al hacer click en una tarjeta (si tiene datos), se abre un modal con:</p>
        <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
          <li><strong>Lista detallada:</strong> Todos los motifs detectados con sus nodos participantes</li>
          <li><strong>Contexto:</strong> Explicación del significado de ese patrón específico</li>
          <li><strong>Formato visual:</strong> Representación clara de las conexiones (ej: @user1 ↔ @user2 ↔ @user3)</li>
        </ul>

        <h4 style={{ marginBottom: '12px' }}>Aplicaciones prácticas</h4>
        <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
          <li><strong>Análisis de polarización:</strong> Muchos triángulos aislados indican cámaras de eco</li>
          <li><strong>Identificación de influencers:</strong> Centros de estrellas son difusores clave</li>
          <li><strong>Análisis de viralidad:</strong> Muchas cadenas sugieren propagación en cascada</li>
          <li><strong>Evaluación de campañas:</strong> Comparar patrones antes/después de intervenciones</li>
          <li><strong>Detección de bots:</strong> Patrones anormales pueden indicar automatización</li>
        </ul>

        <h4 style={{ marginBottom: '12px' }}>Limitaciones</h4>
        <p style={{ fontSize: '13px', color: '#666', background: '#fffbf0', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #f59e0b' }}>
          <strong>Consideraciones:</strong>
        </p>
        <ul style={{ marginLeft: '20px', fontSize: '13px', color: '#666', lineHeight: 1.8 }}>
          <li>El análisis se limita a patrones de 3 nodos por eficiencia computacional</li>
          <li>Motifs más complejos (4+ nodos) no se detectan pero pueden ser importantes</li>
          <li>La interpretación es descriptiva, no causal (correlación ≠ causación)</li>
          <li>En redes muy grandes, se muestran solo las primeras ocurrencias para no sobrecargar la UI</li>
        </ul>
      </InfoModal>
    </>
  )
}
