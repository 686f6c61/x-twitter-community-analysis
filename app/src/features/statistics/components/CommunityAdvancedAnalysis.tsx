import { useState } from 'react'
import { BarChart3, AlertTriangle, CheckCircle, Circle, FileText, Brain, Users, TrendingUp } from 'lucide-react'
import type { Community } from '@/types/graph'
import { InfoModal } from '@/shared/components/InfoModal'
import { InfoButton } from '@/shared/components/InfoButton'

interface CommunityAdvancedAnalysisProps {
  community: Community
}

export function CommunityAdvancedAnalysis({ community }: CommunityAdvancedAnalysisProps) {
  const [showInfo, setShowInfo] = useState(false)

  if (!community.sentiment && !community.coordination && !community.echo_chamber) {
    return null
  }

  const getEchoChamberColor = (type: string) => {
    switch (type) {
      case 'ECHO_CHAMBER_FUERTE': return '#dc2626'
      case 'ECHO_CHAMBER_MODERADO': return '#f59e0b'
      case 'DISCURSO_HETEROGENEO': return '#10b981'
      default: return '#9ca3af'
    }
  }

  const getSentimentIcon = (type: string) => {
    switch (type) {
      case 'REACTIVA_NEGATIVA': return Brain
      case 'POSITIVA': return TrendingUp
      case 'TOXICA': return AlertTriangle
      case 'NEUTRAL_ANALITICA': return BarChart3
      default: return Circle
    }
  }

  return (
    <>
      <div style={{ marginTop: '24px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} />
            Análisis Avanzado
          </h4>
          <InfoButton onClick={() => setShowInfo(true)} />
        </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
        {/* Análisis de Sentimiento */}
        {community.sentiment && (
          <div style={{ background: 'white', padding: '16px', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#666', marginBottom: '12px' }}>
              Análisis de Sentimiento
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{
                padding: '8px',
                borderRadius: '6px',
                background: `${community.sentiment.classification.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {(() => {
                  const Icon = getSentimentIcon(community.sentiment.classification.type)
                  return <Icon size={20} color={community.sentiment.classification.color} strokeWidth={2} />
                })()}
              </div>
              <div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: community.sentiment.classification.color
                }}>
                  {community.sentiment.classification.type.replace(/_/g, ' ')}
                </div>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  Sentimiento promedio: {community.sentiment.avgScore.toFixed(2)}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                Toxicidad: {(community.sentiment.toxicityRate * 100).toFixed(1)}%
              </div>
              <div style={{
                width: '100%',
                height: '6px',
                background: '#e0e0e0',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${community.sentiment.toxicityRate * 100}%`,
                  height: '100%',
                  background: community.sentiment.toxicityRate > 0.3 ? '#dc2626' : community.sentiment.toxicityRate > 0.15 ? '#f59e0b' : '#10b981'
                }} />
              </div>
            </div>

            <div style={{ marginTop: '12px', fontSize: '12px' }}>
              <strong>Emoción dominante:</strong> {community.sentiment.dominantEmotion}
            </div>
          </div>
        )}

        {/* Campaña Coordinada */}
        {community.coordination && (
          <div style={{ background: 'white', padding: '16px', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#666', marginBottom: '12px' }}>
              Detección de Coordinación
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{
                padding: '8px',
                borderRadius: '6px',
                background: `${community.coordination.classification.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {community.coordination.classification.type === 'COORDINADA'
                  ? <AlertTriangle size={20} color={community.coordination.classification.color} strokeWidth={2} />
                  : <CheckCircle size={20} color={community.coordination.classification.color} strokeWidth={2} />
                }
              </div>
              <div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: community.coordination.classification.color
                }}>
                  {community.coordination.classification.type}
                </div>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  Score: {(community.coordination.score * 100).toFixed(1)}% - {community.coordination.classification.level}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '11px', color: '#666', lineHeight: 1.5 }}>
              <div>Sincronización temporal: {(community.coordination.temporalSync * 100).toFixed(1)}%</div>
              <div>Duplicación contenido: {(community.coordination.contentDuplication * 100).toFixed(1)}%</div>
              <div>Concentración bots: {(community.coordination.botConcentration * 100).toFixed(1)}%</div>
            </div>
          </div>
        )}

        {/* Echo Chamber */}
        {community.echo_chamber && (
          <div style={{ background: 'white', padding: '16px', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#666', marginBottom: '12px' }}>
              Echo Chamber
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{
                padding: '8px',
                borderRadius: '6px',
                background: `${getEchoChamberColor(community.echo_chamber.classification.type)}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Circle
                  size={20}
                  color={getEchoChamberColor(community.echo_chamber.classification.type)}
                  strokeWidth={2}
                  fill={getEchoChamberColor(community.echo_chamber.classification.type)}
                />
              </div>
              <div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: getEchoChamberColor(community.echo_chamber.classification.type)
                }}>
                  {community.echo_chamber.classification.type.replace(/_/g, ' ')}
                </div>
                <div style={{ fontSize: '11px', color: '#666', marginTop: '4px', lineHeight: 1.4 }}>
                  {community.echo_chamber.classification.description}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '11px', color: '#666', lineHeight: 1.5, marginTop: '12px' }}>
              <div>Aislamiento: {(community.echo_chamber.isolation * 100).toFixed(1)}%</div>
              <div>Similaridad contenido: {(community.echo_chamber.contentSimilarity * 100).toFixed(1)}%</div>
            </div>
          </div>
        )}

        {/* Vocabulario Único */}
        {community.vocabulary_uniqueness !== undefined && (
          <div style={{ background: 'white', padding: '16px', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#666', marginBottom: '12px' }}>
              Vocabulario Único
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{
                padding: '8px',
                borderRadius: '6px',
                background: '#3b82f615',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FileText size={20} color="#3b82f6" strokeWidth={2} />
              </div>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>
                  {community.vocabulary_uniqueness}
                </div>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  palabras únicas
                </div>
              </div>
            </div>

            <div style={{ fontSize: '11px', color: '#666', lineHeight: 1.4, marginTop: '8px' }}>
              Diversidad léxica de la comunidad. Mayor número indica vocabulario más variado.
            </div>
          </div>
        )}
      </div>
    </div>

    <InfoModal
      isOpen={showInfo}
      onClose={() => setShowInfo(false)}
      title="Análisis Avanzado de Comunidades"
    >
      <p style={{ marginTop: 0 }}>
        El <strong>análisis avanzado</strong> proporciona métricas adicionales sobre el comportamiento, sentimiento y características del discurso de cada comunidad detectada.
      </p>

      <h4 style={{ marginBottom: '12px', marginTop: '20px' }}>Análisis de Sentimiento</h4>
      <p>Evalúa el tono emocional agregado de todos los tweets de la comunidad usando el motor léxico GRAPHS.</p>
      <ul style={{ marginLeft: '20px', fontSize: '14px', lineHeight: 1.6 }}>
        <li><strong>Sentimiento promedio:</strong> Valor numérico que representa la polaridad general (-3 muy negativo a +3 muy positivo). Un valor cercano a 0 indica neutralidad.</li>
        <li><strong>Clasificación:</strong> Categoriza la comunidad en 4 tipos:
          <ul style={{ marginLeft: '20px', fontSize: '13px', marginTop: '8px' }}>
            <li><strong>NEUTRAL ANALÍTICA:</strong> Discurso equilibrado, poco emocional, enfocado en hechos</li>
            <li><strong>REACTIVA NEGATIVA:</strong> Predomina lenguaje crítico, quejas, indignación (sentimiento {'<'} -1)</li>
            <li><strong>POSITIVA:</strong> Predomina lenguaje optimista, celebratorio, de apoyo (sentimiento {'>'} 1)</li>
            <li><strong>TÓXICA:</strong> Alta presencia de lenguaje ofensivo, insultos ({'>'} 30% de tweets tóxicos)</li>
          </ul>
        </li>
        <li><strong>Toxicidad:</strong> Porcentaje de tweets que contienen lenguaje agresivo u ofensivo</li>
        <li><strong>Emoción dominante:</strong> La emoción más frecuente detectada (ira, miedo, felicidad, tristeza, neutral)</li>
      </ul>

      <h4 style={{ marginBottom: '12px', marginTop: '20px' }}>Detección de Coordinación</h4>
      <p>Identifica patrones que sugieren actividad coordinada o campañas organizadas dentro de la comunidad.</p>
      <ul style={{ marginLeft: '20px', fontSize: '14px', lineHeight: 1.6 }}>
        <li><strong>Score de coordinación:</strong> Métrica compuesta (0-100%) que combina tres señales:
          <ul style={{ marginLeft: '20px', fontSize: '13px', marginTop: '8px' }}>
            <li><strong>Sincronización temporal:</strong> Usuarios publican al mismo tiempo (1 - entropía temporal). Valores altos sugieren actividad programada.</li>
            <li><strong>Duplicación de contenido:</strong> Similaridad entre tweets usando n-gramas de 3 palabras. Alto valor indica copy-paste o scripts.</li>
            <li><strong>Concentración de bots:</strong> Proporción de cuentas con bot_score {'>'} 0.6. Alto valor sugiere automatización.</li>
          </ul>
        </li>
        <li><strong>Clasificación:</strong>
          <ul style={{ marginLeft: '20px', fontSize: '13px', marginTop: '8px' }}>
            <li><strong>ORGÁNICA:</strong> Score ≤ 50% - Actividad espontánea sin señales claras de coordinación</li>
            <li><strong>COORDINADA:</strong> Score {'>'} 50% - Posible campaña organizada (niveles: Bajo 50-65%, Moderado 65-80%, Alto {'>'} 80%)</li>
          </ul>
        </li>
      </ul>

      <h4 style={{ marginBottom: '12px', marginTop: '20px' }}>Echo Chamber (Cámara de Eco)</h4>
      <p>Analiza si la comunidad está aislada discursivamente del resto de comunidades.</p>
      <ul style={{ marginLeft: '20px', fontSize: '14px', lineHeight: 1.6 }}>
        <li><strong>Aislamiento:</strong> Proporción del vocabulario que NO comparte con otras comunidades. Alto aislamiento indica que usan términos exclusivos.</li>
        <li><strong>Similaridad de contenido:</strong> Distancia de Jaccard entre el vocabulario de esta comunidad y otras. Baja similaridad indica discursos paralelos sin intersección.</li>
        <li><strong>Clasificación:</strong>
          <ul style={{ marginLeft: '20px', fontSize: '13px', marginTop: '8px' }}>
            <li><strong>DISCURSO HETEROGÉNEO:</strong> Comparte vocabulario con otras comunidades, discurso integrado</li>
            <li><strong>ECHO CHAMBER MODERADO:</strong> Aislamiento {'>'} 50%, algo de vocabulario propio pero con conexiones</li>
            <li><strong>ECHO CHAMBER FUERTE:</strong> Aislamiento {'>'} 70%, vocabulario muy diferenciado, posible burbuja informativa</li>
          </ul>
        </li>
      </ul>

      <h4 style={{ marginBottom: '12px', marginTop: '20px' }}>Vocabulario Único</h4>
      <p>Cuenta el número de palabras distintas usadas por la comunidad (diversidad léxica).</p>
      <ul style={{ marginLeft: '20px', fontSize: '14px', lineHeight: 1.6 }}>
        <li><strong>Interpretación:</strong> Mayor número indica vocabulario más rico y variado. Comunidades con vocabulario muy limitado pueden indicar discurso repetitivo o bots.</li>
        <li><strong>Contexto:</strong> Valores típicos varían según tamaño de la comunidad. Una comunidad de 100 usuarios con 800 palabras únicas tiene alta diversidad léxica.</li>
      </ul>

      <p style={{ fontSize: '13px', color: '#666', marginTop: '20px', background: '#fffbf0', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #f59e0b' }}>
        <strong>Nota:</strong> Estos análisis son aproximaciones algorítmicas. Para análisis académico riguroso, se recomienda validación manual y uso de herramientas complementarias.
      </p>
    </InfoModal>
  </>
  )
}
