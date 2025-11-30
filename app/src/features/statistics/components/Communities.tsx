import { useState } from 'react'
import { Users, Download } from 'lucide-react'
import type { Statistics, Node } from '@/types/graph'
import { CommunityDetailsModal } from './CommunityDetailsModal'
import { InfoModal } from '@/shared/components/InfoModal'
import { InfoButton } from '@/shared/components/InfoButton'

interface CommunitiesProps {
  stats: Statistics
  graphNodes?: Node[]  // Nodos del grafo de menciones para exportación completa
}

export function Communities({ stats, graphNodes }: CommunitiesProps) {
  const [selectedCommunityId, setSelectedCommunityId] = useState<number | null>(null)
  const [showInfo, setShowInfo] = useState(false)

  const communities = stats.communities || []
  const modularity = stats.modularity || 0

  // Función para descargar todas las comunidades en un CSV global
  const handleDownloadAllCommunities = () => {
    if (!communities || communities.length === 0) {
      alert('No hay comunidades disponibles para descargar')
      return
    }

    const csvRows = []
    csvRows.push(['community_id', 'community_size', 'member_username', 'member_type'].join(','))

    communities.forEach(community => {
      community.members.forEach(member => {
        csvRows.push([
          community.id,
          community.size,
          member,
          'member'
        ].join(','))
      })
    })

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `todas_comunidades_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  console.log('[Communities] Datos recibidos:', {
    numCommunities: communities.length,
    modularity,
    communities: communities.slice(0, 3)
  })

  if (communities.length === 0) {
    return (
      <div className="chart-card">
        <h3 className="chart-title">Comunidades Detectadas</h3>
        <p style={{ color: '#666', textAlign: 'center', padding: '40px 0' }}>
          No se detectaron comunidades en la red
        </p>
      </div>
    )
  }

  const getModularityLabel = () => {
    if (modularity < 0.3) return 'Baja modularidad'
    if (modularity < 0.5) return 'Modularidad moderada'
    if (modularity < 0.7) return 'Alta modularidad'
    return 'Modularidad muy alta'
  }

  const getModularityColor = () => {
    if (modularity < 0.3) return '#dc3545'
    if (modularity < 0.5) return '#ffc107'
    if (modularity < 0.7) return '#28a745'
    return '#20c997'
  }

  return (
    <>
      <div>
        <div className="chart-card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className="chart-title" style={{ margin: 0 }}>
              Comunidades Detectadas
              <InfoButton onClick={() => setShowInfo(true)} />
            </h3>
            <button
              onClick={handleDownloadAllCommunities}
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
              Descargar Todas (CSV)
            </button>
          </div>

          <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                Total de Comunidades
              </div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#333' }}>
                {communities.length}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                {getModularityLabel()}: <strong style={{ color: getModularityColor() }}>
                  {modularity.toFixed(3)}
                </strong>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                background: '#e0e0e0',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${Math.min(modularity * 100, 100)}%`,
                  height: '100%',
                  background: getModularityColor(),
                  transition: 'width 0.5s ease'
                }} />
              </div>
              <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                Valores típicos: 0.3-0.7 (mayor = comunidades más definidas)
              </div>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
            marginTop: '20px'
          }}>
            {communities.map((community) => (
              <div
                key={community.id}
                className="stat-card"
                style={{
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  borderLeft: `4px solid ${community.color}`,
                  position: 'relative'
                }}
                onClick={() => setSelectedCommunityId(community.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    background: `linear-gradient(135deg, ${community.color}ee, ${community.color}cc)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Users size={24} color="white" />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                        Comunidad {community.id}
                      </h4>
                    </div>

                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                      {community.size} miembros
                    </div>

                    {community.top_hashtags && community.top_hashtags.length > 0 && (
                      <div style={{
                        fontSize: '12px',
                        color: '#1DA1F2',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px'
                      }}>
                        {community.top_hashtags.slice(0, 3).map((ht, idx) => (
                          <span
                            key={idx}
                            style={{
                              background: '#e3f2fd',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            #{ht.hashtag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{
                      fontSize: '11px',
                      color: '#007bff',
                      marginTop: '12px',
                      fontWeight: 500
                    }}>
                      Click para ver detalles
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {modularity > 0 && (
          <div className="chart-card">
            <h3 className="chart-title">Interpretación de Comunidades</h3>
            <div style={{ fontSize: '14px', lineHeight: 1.8, color: '#555' }}>
              <p>
                Se detectaron <strong>{communities.length} comunidades</strong> en la red con una
                modularidad de <strong>{modularity.toFixed(3)}</strong>.
              </p>
              <p>
                {modularity < 0.3 && (
                  <>
                    La <strong>baja modularidad</strong> indica que las comunidades no están
                    claramente diferenciadas. La red tiene una estructura más homogénea con
                    muchas conexiones entre grupos.
                  </>
                )}
                {modularity >= 0.3 && modularity < 0.5 && (
                  <>
                    La <strong>modularidad moderada</strong> sugiere que existen grupos
                    distinguibles, pero con conexiones significativas entre ellos. Las comunidades
                    tienen cierta identidad propia pero mantienen comunicación inter-comunitaria.
                  </>
                )}
                {modularity >= 0.5 && modularity < 0.7 && (
                  <>
                    La <strong>alta modularidad</strong> indica comunidades bien definidas con
                    identidad clara. Los grupos tienen alta cohesión interna y conexiones limitadas
                    entre sí, sugiriendo subculturas o nichos temáticos diferenciados.
                  </>
                )}
                {modularity >= 0.7 && (
                  <>
                    La <strong>modularidad muy alta</strong> revela comunidades extremadamente
                    aisladas. Los grupos funcionan como "cámaras de eco" con mínima comunicación
                    externa, indicando posible polarización o fragmentación temática.
                  </>
                )}
              </p>
              <p>
                La comunidad más grande tiene <strong>{communities[0]?.size || 0} miembros</strong>
                {communities[0]?.top_hashtags?.[0] && (
                  <> y está caracterizada por el hashtag <strong>#{communities[0].top_hashtags[0].hashtag}</strong></>
                )}.
              </p>
            </div>
          </div>
        )}
      </div>

      {selectedCommunityId !== null && (
        <CommunityDetailsModal
          community={communities.find(c => c.id === selectedCommunityId)!}
          onClose={() => setSelectedCommunityId(null)}
          allNodes={graphNodes}
        />
      )}

      <InfoModal
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        title="Comunidades Detectadas"
      >
        <h4 style={{ marginTop: 0, marginBottom: '12px' }}>¿Qué son las comunidades?</h4>
        <p>Las <strong>comunidades</strong> son grupos de nodos (usuarios) que están <strong>más densamente conectados entre sí</strong> que con el resto de la red. En redes sociales, representan clusters o grupos de usuarios que interactúan frecuentemente formando subcomunidades con intereses, temas o afinidades comunes.</p>
        <p>La detección de comunidades es fundamental para entender la <strong>estructura modular</strong> de la red y cómo se organizan las conversaciones en grupos temáticos o ideológicos.</p>

        <h4 style={{ marginBottom: '12px' }}>Algoritmo de Louvain</h4>
        <p>El sistema utiliza el <strong>algoritmo de Louvain</strong>, uno de los métodos más eficientes para detección de comunidades en redes grandes. El algoritmo funciona en dos fases iterativas:</p>
        <ol style={{ marginLeft: '20px', lineHeight: 1.8 }}>
          <li><strong>Optimización local:</strong> Cada nodo intenta unirse a la comunidad vecina que más incremente la modularidad, repitiéndose hasta que no haya mejoras</li>
          <li><strong>Agregación:</strong> Se colapsan las comunidades en super-nodos y se repite el proceso, creando una jerarquía de comunidades</li>
        </ol>
        <p>El algoritmo termina cuando la modularidad no puede mejorar más, garantizando una división óptima.</p>

        <h4 style={{ marginBottom: '12px' }}>Modularidad</h4>
        <p>La <strong>modularidad</strong> (Q) es la métrica que cuantifica la calidad de la división en comunidades. Se calcula comparando la densidad de conexiones internas de cada comunidad con lo que se esperaría en una red aleatoria:</p>
        <p style={{ background: '#f5f5f5', padding: '16px', borderRadius: '6px', textAlign: 'center', margin: '16px 0' }}>
          Q = (1/2m) × Σ [A<sub>ij</sub> - (k<sub>i</sub> × k<sub>j</sub>)/(2m)] × δ(c<sub>i</sub>, c<sub>j</sub>)
        </p>
        <p style={{ fontSize: '13px' }}>
          Donde <em>m</em> es el número de aristas, <em>A<sub>ij</sub></em> es la matriz de adyacencia, <em>k<sub>i</sub></em> es el grado del nodo <em>i</em>, y <em>δ</em> vale 1 si los nodos están en la misma comunidad, 0 si no.
        </p>

        <h4 style={{ marginBottom: '12px' }}>Interpretación de la modularidad</h4>
        <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
          <li><strong>Q {"<"} 0.3:</strong> Comunidades débiles o poco definidas. La red es relativamente homogénea</li>
          <li><strong>0.3 ≤ Q {"<"} 0.5:</strong> Comunidades moderadas. Estructura modular detectab le pero no muy marcada</li>
          <li><strong>0.5 ≤ Q {"<"} 0.7:</strong> Comunidades bien definidas. Clara división en grupos con identidad propia</li>
          <li><strong>Q ≥ 0.7:</strong> Comunidades muy fuertes. La red está altamente modularizada con grupos muy cohesionados</li>
        </ul>
        <p style={{ fontSize: '13px', color: '#666', marginTop: '12px' }}>
          Valores típicos en redes sociales reales oscilan entre 0.3 y 0.7. Valores superiores a 0.7 indican comunidades excepcionalm ente definidas o aislamiento entre grupos.
        </p>

        <h4 style={{ marginBottom: '12px' }}>¿Por qué es importante?</h4>
        <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
          <li><strong>Segmentación de audiencias:</strong> Permite identificar diferentes grupos con intereses o ideologías distintas</li>
          <li><strong>Análisis de polarización:</strong> Comunidades muy separadas pueden indicar fragmentación o cámaras de eco</li>
          <li><strong>Detección de temas:</strong> Cada comunidad suele girar en torno a hashtags o tópicos específicos</li>
          <li><strong>Identificación de líderes:</strong> Los influencers suelen ser centrales dentro de sus comunidades</li>
          <li><strong>Estrategias de comunicación:</strong> Permite diseñar mensajes específicos para cada comunidad</li>
        </ul>

        <h4 style={{ marginBottom: '12px' }}>Información por comunidad</h4>
        <p>Al hacer click en una comunidad, se muestra información detallada:</p>
        <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
          <li><strong>Estadísticas generales:</strong> Tweets totales, engagement acumulado, score promedio de influencia, densidad interna</li>
          <li><strong>Top 10 influencers:</strong> Usuarios más influyentes dentro de la comunidad según su score</li>
          <li><strong>Top 10 hashtags:</strong> Hashtags más utilizados que caracterizan temáticamente a la comunidad</li>
          <li><strong>Descripción automática:</strong> Interpretación generada según las métricas de cohesión e influencia</li>
          <li><strong>Análisis avanzado:</strong> Sentimiento, emociones, coordinación y echo chambers (cuando hay datos de tweets)</li>
          <li><strong>Descarga CSV:</strong> Exportar datos completos de todos los miembros de la comunidad</li>
        </ul>

        <h4 style={{ marginBottom: '12px', marginTop: '24px', borderTop: '2px solid #e0e0e0', paddingTop: '20px' }}>📊 Análisis Avanzado de Comunidades</h4>
        <p>Cuando se dispone de contenido de tweets, el sistema realiza un <strong>análisis avanzado sin APIs externas</strong>, utilizando técnicas de procesamiento de lenguaje natural (NLP) basadas en diccionarios léxicos.</p>

        <div style={{ background: '#f0f9ff', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #3b82f6', marginBottom: '16px' }}>
          <strong>⚠️ Aproximación:</strong> Los análisis son aproximaciones basadas en diccionarios con precisión estimada del 70-75%. Para análisis de producción, se recomienda usar modelos de machine learning o APIs especializadas.
        </div>

        <h5 style={{ marginBottom: '8px', fontSize: '15px' }}>1. Análisis de Sentimiento</h5>
        <p style={{ fontSize: '14px' }}>Se utiliza un <strong>motor léxico de análisis de sentimiento</strong> con un diccionario especializado en español de más de 300 palabras mapeadas a valores de polaridad (-3 a +3). El motor clasifica palabras en 6 niveles de intensidad:</p>
        <ul style={{ marginLeft: '20px', fontSize: '13px', lineHeight: 1.6 }}>
          <li><strong>Muy positivo (+3):</strong> excelente, increíble, maravilloso, perfecto, extraordinario, sublime, glorioso...</li>
          <li><strong>Positivo (+2):</strong> genial, fantástico, bueno, feliz, alegre, hermoso, valiente, justo, solidario...</li>
          <li><strong>Ligeramente positivo (+1):</strong> agradable, satisfecho, favorable, optimista, útil, coherente, tranquilo...</li>
          <li><strong>Ligeramente negativo (-1):</strong> malo, triste, problema, error, preocupante, dudoso, mediocre, frustrante...</li>
          <li><strong>Negativo (-2):</strong> terrible, pésimo, desastre, corrupto, mentira, fraude, cruel, injusto, destructivo...</li>
          <li><strong>Muy negativo (-3):</strong> genocidio, asesino, terrorista, abominable, atroz, perverso, fascista, execrable...</li>
        </ul>

        <p style={{ fontSize: '14px', marginTop: '12px' }}>El sistema calcula el <strong>sentimiento promedio</strong> sumando las polaridades de todas las palabras encontradas en los tweets de la comunidad y clasificándola en 4 categorías:</p>
        <ul style={{ marginLeft: '20px', fontSize: '13px', lineHeight: 1.6 }}>
          <li><strong>😡 REACTIVA NEGATIVA:</strong> Sentimiento promedio {'<'} -1 (comunidades con discurso predominantemente negativo)</li>
          <li><strong>😊 POSITIVA:</strong> Sentimiento promedio {'>'} 1 (comunidades con discurso predominantemente positivo)</li>
          <li><strong>🔥 TOXICA:</strong> Tasa de toxicidad {'>'} 30% (alta presencia de palabras tóxicas independientemente del sentimiento)</li>
          <li><strong>🤔 NEUTRAL ANALÍTICA:</strong> Resto de casos (discurso equilibrado o poco emocional)</li>
        </ul>

        <h5 style={{ marginBottom: '8px', fontSize: '15px', marginTop: '16px' }}>2. Detección de Emociones</h5>
        <p style={{ fontSize: '14px' }}>El motor clasifica tweets en 5 emociones básicas usando un catálogo léxico especializado:</p>
        <ul style={{ marginLeft: '20px', fontSize: '13px', lineHeight: 1.6 }}>
          <li><strong>🔴 Ira:</strong> rabia, enojo, odio, furia, indignación, ira, enfado, cabreo, irritación...</li>
          <li><strong>😨 Miedo:</strong> miedo, terror, pánico, temor, angustia, ansiedad, preocupación, inquietud...</li>
          <li><strong>😊 Felicidad:</strong> alegría, felicidad, contento, dicha, júbilo, euforia, entusiasmo, celebración...</li>
          <li><strong>😢 Tristeza:</strong> tristeza, pena, dolor, melancolía, decepción, frustración, desconsuelo, aflicción...</li>
          <li><strong>⚪ Neutral:</strong> Sin palabras emocionales detectadas</li>
        </ul>
        <p style={{ fontSize: '13px', marginTop: '8px' }}>La <strong>emoción dominante</strong> de la comunidad es aquella que aparece en más tweets. Se muestra también la distribución porcentual de cada emoción.</p>

        <h5 style={{ marginBottom: '8px', fontSize: '15px', marginTop: '16px' }}>3. Detección de Coordinación</h5>
        <p style={{ fontSize: '14px' }}>Identifica posibles <strong>campañas coordinadas</strong> dentro de una comunidad mediante 3 señales:</p>
        <ul style={{ marginLeft: '20px', fontSize: '13px', lineHeight: 1.6 }}>
          <li><strong>Sincronización temporal (1 - entropía temporal):</strong> Usuarios que publican al mismo tiempo (entropía baja = sincronización alta)</li>
          <li><strong>Duplicación de contenido:</strong> Similaridad de texto usando n-gramas de 3 palabras (Jaccard)</li>
          <li><strong>Concentración de bots:</strong> Porcentaje de usuarios con bot_score {'>'} 0.6 en la comunidad</li>
        </ul>
        <p style={{ fontSize: '13px', marginTop: '8px' }}>El <strong>score de coordinación</strong> combina estas 3 métricas. Clasificación:</p>
        <ul style={{ marginLeft: '20px', fontSize: '13px', lineHeight: 1.6 }}>
          <li><strong>⚠️ COORDINADA:</strong> Score {'>'} 0.5 (Alta, Moderada o Baja según el nivel)</li>
          <li><strong>✅ ORGÁNICA:</strong> Score ≤ 0.5 (Actividad espontánea sin señales de coordinación)</li>
        </ul>

        <h5 style={{ marginBottom: '8px', fontSize: '15px', marginTop: '16px' }}>4. Detección de Echo Chambers (Cámaras de Eco)</h5>
        <p style={{ fontSize: '14px' }}>Analiza si las comunidades tienen <strong>vocabulario único</strong> o comparten términos con otras comunidades:</p>
        <ul style={{ marginLeft: '20px', fontSize: '13px', lineHeight: 1.6 }}>
          <li><strong>Vocabulario único:</strong> Número de palabras únicas usadas en la comunidad (diversidad léxica)</li>
          <li><strong>Similaridad de contenido:</strong> Comparación del vocabulario entre comunidades usando distancia de Jaccard</li>
          <li><strong>Aislamiento:</strong> Proporción de vocabulario que NO comparte con otras comunidades</li>
        </ul>
        <p style={{ fontSize: '13px', marginTop: '8px' }}>Clasificación en 3 niveles:</p>
        <ul style={{ marginLeft: '20px', fontSize: '13px', lineHeight: 1.6 }}>
          <li><strong>🔴 ECHO CHAMBER FUERTE:</strong> Aislamiento {'>'} 70% y similaridad {'<'} 30% (vocabulario muy diferenciado, baja interacción semántica)</li>
          <li><strong>🟡 ECHO CHAMBER MODERADO:</strong> Aislamiento {'>'} 50% y similaridad {'<'} 50% (cierto aislamiento pero con alguna conexión)</li>
          <li><strong>🟢 DISCURSO HETEROGÉNEO:</strong> Resto de casos (vocabulario compartido, discurso integrado)</li>
        </ul>

        <h5 style={{ marginBottom: '8px', fontSize: '15px', marginTop: '16px' }}>5. Detección de Toxicidad</h5>
        <p style={{ fontSize: '14px' }}>Se calcula la <strong>tasa de toxicidad</strong> (% de tweets con lenguaje tóxico) usando un catálogo especializado de palabras ofensivas, insultos y lenguaje agresivo.</p>
        <p style={{ fontSize: '13px', marginLeft: '20px' }}><em>El motor detecta patrones de discurso violento, discriminatorio u ofensivo</em></p>
        <p style={{ fontSize: '13px', marginTop: '8px' }}>Interpretación con código de colores:</p>
        <ul style={{ marginLeft: '20px', fontSize: '13px', lineHeight: 1.6 }}>
          <li><strong style={{ color: '#10b981' }}>Verde:</strong> Toxicidad {'<'} 15% (bajo nivel)</li>
          <li><strong style={{ color: '#f59e0b' }}>Naranja:</strong> 15% ≤ Toxicidad ≤ 30% (moderado)</li>
          <li><strong style={{ color: '#dc2626' }}>Rojo:</strong> Toxicidad {'>'} 30% (alto nivel)</li>
        </ul>

        <div style={{ background: '#fffbf0', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #f59e0b', marginTop: '16px' }}>
          <strong>⚙️ Motor de Análisis GRAPHS:</strong>
          <ul style={{ marginLeft: '20px', fontSize: '13px', lineHeight: 1.6, marginTop: '8px', marginBottom: 0 }}>
            <li><strong>Base léxica:</strong> Más de 400 palabras especializadas en español (330 sentimiento, 60 emociones, 25 toxicidad)</li>
            <li><strong>Sentimiento:</strong> Suma ponderada de polaridades léxicas / número de tweets</li>
            <li><strong>Emociones:</strong> Conteo de palabras emocionales, emoción con mayor frecuencia es dominante</li>
            <li><strong>Coordinación:</strong> Score = (1 - entropía_temporal) × similaridad_contenido × concentración_bots</li>
            <li><strong>Echo Chambers:</strong> Distancia de Jaccard entre vocabularios únicos de comunidades</li>
            <li><strong>Toxicidad:</strong> Detección de patrones tóxicos en texto normalizado</li>
            <li><strong>Arquitectura modular:</strong> El motor es ampliable sin modificar código del sistema</li>
          </ul>
        </div>

        <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #dc2626', marginTop: '12px' }}>
          <strong>⚠️ Limitaciones del Análisis Avanzado:</strong>
          <ul style={{ marginLeft: '20px', fontSize: '13px', lineHeight: 1.6, marginTop: '8px', marginBottom: 0 }}>
            <li>Enfoque léxico sin análisis contextual (no detecta negaciones, sarcasmo ni ironía)</li>
            <li>Precisión estimada del 70-75% vs 85-95% con modelos de machine learning</li>
            <li>Echo chambers requieren suficiente volumen de texto para ser estadísticamente significativos</li>
            <li>Coordinación puede generar falsos positivos en eventos virales orgánicos</li>
            <li>Palabras polisémicas se interpretan con un único sentido predefinido</li>
            <li>Para análisis académico riguroso, considerar usar APIs especializadas (Sentiment Analysis API, Perspective API, etc.)</li>
          </ul>
        </div>

        <h4 style={{ marginBottom: '12px' }}>Limitaciones de la Detección de Comunidades</h4>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
          Es importante entender las limitaciones inherentes al análisis algorítmico de comunidades:
        </p>
        <ul style={{ marginLeft: '20px', fontSize: '13px', color: '#666', lineHeight: 1.8 }}>
          <li><strong>Naturaleza algorítmica:</strong> La detección es computacional y puede no coincidir exactamente con divisiones sociales percibidas o esperadas. Las comunidades detectadas son agrupaciones estadísticas basadas en patrones de interacción.</li>
          <li><strong>Sensibilidad a cambios:</strong> Las comunidades pueden cambiar significativamente si se añaden o eliminan nodos del grafo. La estructura modular es sensible a la composición del dataset.</li>
          <li><strong>Sesgo de tamaño:</strong> El algoritmo de Louvain tiende a favorecer comunidades de tamaño similar, lo que puede resultar en la subdivisión artificial de grupos grandes o la fusión de grupos pequeños naturalmente separados.</li>
          <li><strong>Usuarios puente:</strong> Aquellos usuarios que conectan múltiples comunidades (brokers o mediadores) pueden ser asignados arbitrariamente a una comunidad u otra, cuando en realidad pertenecen a ambas.</li>
          <li><strong>Límite de resolución:</strong> El algoritmo no puede detectar comunidades muy pequeñas si la red es muy grande (resolution limit problem).</li>
          <li><strong>Comunidades no jerárquicas:</strong> El método actual no captura estructuras jerárquicas ni comunidades superpuestas (overlapping communities).</li>
        </ul>
        <p style={{ fontSize: '13px', color: '#999', marginTop: '16px', fontStyle: 'italic' }}>
          A pesar de estas limitaciones, la detección de comunidades proporciona insights valiosos sobre la estructura de la red y patrones de interacción que serían difíciles de identificar manualmente.
        </p>
      </InfoModal>
    </>
  )
}
