import { useState, useRef, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Hash, Calendar, RotateCcw } from 'lucide-react'
import type { Statistics, DetectedEvent } from '@/types/graph'
import { InfoModal } from '@/shared/components/InfoModal'
import { InfoButton } from '@/shared/components/InfoButton'
import { EventDrillDownModal } from './EventDrillDownModal'

interface HashtagsAndTimelineProps {
  stats: Statistics
}

export function HashtagsAndTimeline({ stats }: HashtagsAndTimelineProps) {
  const [showHashtagsInfo, setShowHashtagsInfo] = useState(false)
  const [showTimelineInfo, setShowTimelineInfo] = useState(false)
  const [showEventsInfo, setShowEventsInfo] = useState(false)
  const [selectedTimePoint, setSelectedTimePoint] = useState<{ time: string; count: number } | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<DetectedEvent | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)

  const timelineData = stats.temporal_activity?.map(item => ({
    time: item.time,
    displayTime: new Date(item.time).toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit'
    }),
    count: item.count
  })) || []

  // Create a set of event times for quick lookup
  const eventTimes = new Set(stats.detected_events?.map(e => e.time) || [])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
      {/* Top Hashtags */}
      <div className="chart-card">
        <h3 className="chart-title">
          <Hash style={{ display: 'inline', width: 20, height: 20, marginRight: 8 }} />
          Top Hashtags
          <InfoButton onClick={() => setShowHashtagsInfo(true)} />
        </h3>
        <div style={{ overflowY: 'auto', maxHeight: '400px' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px'
          }}>
            <thead style={{ position: 'sticky', top: 0, background: 'white' }}>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Hashtag</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>Menciones</th>
              </tr>
            </thead>
            <tbody>
              {stats.top_hashtags?.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>
                    <a
                      href={`https://twitter.com/hashtag/${item.hashtag}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}
                      onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                    >
                      #{item.hashtag}
                    </a>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 500 }}>{item.count.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Timeline de actividad */}
      <div className="chart-card">
        <h3 className="chart-title">
          <Calendar style={{ display: 'inline', width: 20, height: 20, marginRight: 8 }} />
          Timeline de Actividad
          <InfoButton onClick={() => setShowTimelineInfo(true)} />
        </h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={timelineData}
            onClick={(data: any) => {
              console.log('[Timeline] Click en BarChart:', data)
              if (data && data.activePayload && data.activePayload[0]) {
                const payload = data.activePayload[0].payload
                console.log('[Timeline] Payload:', payload)
                const event = stats.detected_events?.find(e => e.time === payload.time)
                console.log('[Timeline] Evento encontrado:', event)
                setSelectedTimePoint({ time: payload.time, count: payload.count })
                setSelectedEvent(event || null)
                setShowEventModal(true)
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis
              dataKey="displayTime"
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={11}
            />
            <YAxis fontSize={12} />
            <Tooltip
              cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '13px'
              }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  const isPeak = eventTimes.has(data.time)
                  const event = stats.detected_events?.find(e => e.time === data.time)
                  return (
                    <div style={{
                      backgroundColor: 'white',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      padding: '8px',
                      fontSize: '13px'
                    }}>
                      <div><strong>{data.displayTime}</strong></div>
                      <div>Tweets: {data.count}</div>
                      {isPeak && event && (
                        <div style={{ color: '#d32f2f', marginTop: '4px' }}>
                          🔔 Pico detectado ({event.intensity}σ)
                        </div>
                      )}
                      <div style={{ fontSize: '11px', color: '#999', marginTop: '4px', fontStyle: 'italic' }}>
                        Click para ver detalles
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar
              dataKey="count"
              cursor="pointer"
              onClick={(data: any, index: number) => {
                console.log('[Timeline] Click en Bar:', data, index)
                const event = stats.detected_events?.find(e => e.time === data.time)
                setSelectedTimePoint({ time: data.time, count: data.count })
                setSelectedEvent(event || null)
                setShowEventModal(true)
              }}
            >
              {timelineData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={eventTimes.has(entry.time) ? '#000000' : '#cccccc'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Controles de zoom (opcional - simplificado sin zoom real) */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginTop: '0.5rem',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.8rem', color: '#666', fontStyle: 'italic' }}>
            ℹ Haz clic en cualquier barra para ver detalles del periodo
          </span>
        </div>

        {/* Eventos detectados */}
        {stats.detected_events && stats.detected_events.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
              Eventos Detectados ({stats.detected_events.length})
              <InfoButton onClick={() => setShowEventsInfo(true)} />
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {stats.detected_events.map((event, idx) => {
                const formatDate = (timeStr: string) => {
                  try {
                    const date = new Date(timeStr)
                    if (isNaN(date.getTime())) {
                      return timeStr
                    }
                    return date.toLocaleString('es-ES', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  } catch {
                    return timeStr
                  }
                }

                return (
                  <span
                    key={idx}
                    onClick={() => {
                      setSelectedTimePoint({ time: event.time, count: event.count })
                      setSelectedEvent(event)
                      setShowEventModal(true)
                    }}
                    style={{
                      padding: '0.4rem 0.8rem',
                      background: '#000000',
                      color: 'white',
                      borderRadius: '16px',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      display: 'inline-block'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                    onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    {formatDate(event.time)} ({event.count} tweets)
                  </span>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Event Drill-Down Modal */}
      {showEventModal && selectedTimePoint && (
        <EventDrillDownModal
          timePoint={selectedTimePoint}
          event={selectedEvent}
          onClose={() => {
            setShowEventModal(false)
            setSelectedTimePoint(null)
            setSelectedEvent(null)
          }}
        />
      )}

      {/* Modales informativos */}
      <InfoModal
        isOpen={showHashtagsInfo}
        onClose={() => setShowHashtagsInfo(false)}
        title="Top Hashtags"
      >
        <h4 style={{ marginTop: 0, marginBottom: '12px' }}>¿Qué mide esta métrica?</h4>
        <p>Esta métrica identifica los <strong>hashtags más utilizados</strong> en la conversación analizada, ordenados por frecuencia de aparición. Los hashtags son etiquetas que los usuarios emplean para categorizar contenido, unirse a conversaciones temáticas y aumentar la visibilidad de sus publicaciones.</p>
        <p>El análisis de hashtags permite identificar los temas dominantes, narrativas emergentes y marcos discursivos que estructuran la conversación en redes sociales.</p>

        <h4 style={{ marginBottom: '12px' }}>Fórmula de cálculo</h4>
        <p>Para cada hashtag único en el dataset:</p>
        <p style={{ background: '#f5f5f5', padding: '16px', borderRadius: '6px', textAlign: 'center', margin: '16px 0' }}>
          Frecuencia<sub>hashtag</sub> = Σ apariciones en todos los tweets
        </p>
        <p style={{ fontSize: '13px' }}>
          Los hashtags se normalizan a minúsculas para evitar duplicaciones (por ejemplo, #COVID19 y #covid19 se cuentan como el mismo hashtag), y se ordenan en orden descendente por frecuencia.
        </p>

        <h4 style={{ marginBottom: '12px' }}>¿Por qué es importante?</h4>
        <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
          <li><strong>Identificación de temas:</strong> Los hashtags revelan los temas centrales de la conversación y permiten mapear la agenda temática</li>
          <li><strong>Campañas coordinadas:</strong> Hashtags con alta frecuencia pueden indicar campañas organizadas o movimientos sociales activos</li>
          <li><strong>Análisis temporal:</strong> El surgimiento súbito de nuevos hashtags puede señalar eventos noticiosos o crisis emergentes</li>
          <li><strong>Comunidades discursivas:</strong> Los hashtags funcionan como marcadores de identidad que agrupan a usuarios con intereses similares</li>
        </ul>

        <h4 style={{ marginBottom: '12px' }}>Algoritmo de procesamiento</h4>
        <ol style={{ marginLeft: '20px', lineHeight: 1.8 }}>
          <li><strong>Extracción:</strong> Se procesan todos los tweets del dataset buscando patrones que comiencen con el símbolo numeral (#)</li>
          <li><strong>Normalización:</strong> Los hashtags extraídos se convierten a minúsculas y se eliminan caracteres especiales</li>
          <li><strong>Agregación:</strong> Se utiliza una estructura de datos tipo diccionario (hash map) para contar las ocurrencias de cada hashtag único</li>
          <li><strong>Ordenamiento:</strong> Se aplica un algoritmo de ordenamiento descendente por frecuencia</li>
          <li><strong>Presentación:</strong> Se muestran todos los hashtags encontrados en orden de relevancia</li>
        </ol>

        <h4 style={{ marginBottom: '12px' }}>Interpretación académica</h4>
        <p>Desde la perspectiva del análisis del discurso digital:</p>
        <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
          <li>Los hashtags dominantes representan <strong>marcos de encuadre</strong> (framing) que organizan la interpretación de eventos</li>
          <li>La coexistencia de hashtags puede revelar <strong>coaliciones</strong> entre diferentes grupos o movimientos</li>
          <li>Hashtags polarizantes pueden indicar <strong>fragmentación</strong> del espacio público digital</li>
          <li>La evolución temporal de hashtags permite rastrear <strong>ciclos de atención</strong> mediática</li>
        </ul>
      </InfoModal>

      <InfoModal
        isOpen={showTimelineInfo}
        onClose={() => setShowTimelineInfo(false)}
        title="Timeline de Actividad"
      >
        <h4 style={{ marginTop: 0, marginBottom: '12px' }}>¿Qué mide esta métrica?</h4>
        <p>El timeline de actividad visualiza la <strong>distribución temporal</strong> de los tweets a lo largo del período analizado. Muestra el volumen de publicaciones en diferentes momentos del tiempo, permitiendo identificar patrones temporales, picos de actividad y ritmos de conversación.</p>
        <p>Esta visualización es fundamental para comprender la <strong>dinámica temporal</strong> de las conversaciones en redes sociales y detectar momentos críticos en el desarrollo de narrativas.</p>

        <h4 style={{ marginBottom: '12px' }}>Construcción del timeline</h4>
        <p>El sistema agrupa los tweets en intervalos temporales y cuenta las publicaciones en cada intervalo:</p>
        <p style={{ background: '#f5f5f5', padding: '16px', borderRadius: '6px', textAlign: 'center', margin: '16px 0' }}>
          Actividad<sub>t</sub> = cantidad de tweets en el intervalo de tiempo t
        </p>
        <p style={{ fontSize: '13px' }}>
          Los intervalos temporales se determinan automáticamente según la duración total del dataset (por ejemplo: horaria para datasets de días, diaria para datasets de semanas, etc.).
        </p>

        <h4 style={{ marginBottom: '12px' }}>¿Por qué es importante?</h4>
        <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
          <li><strong>Detección de eventos:</strong> Los picos abruptos en el timeline suelen corresponder con eventos noticiosos, anuncios importantes o momentos virales</li>
          <li><strong>Patrones de comportamiento:</strong> Permite identificar ritmos circadianos (actividad diurna vs. nocturna) y patrones semanales</li>
          <li><strong>Campañas coordinadas:</strong> Actividad simultánea y sincronizada puede indicar campañas organizadas o comportamiento automatizado</li>
          <li><strong>Duración del fenómeno:</strong> Permite evaluar si la conversación es sostenida en el tiempo o se trata de un fenómeno efímero</li>
        </ul>

        <h4 style={{ marginBottom: '12px' }}>Algoritmo de agregación temporal</h4>
        <ol style={{ marginLeft: '20px', lineHeight: 1.8 }}>
          <li><strong>Extracción de timestamps:</strong> Se lee el campo de fecha/hora de cada tweet del dataset</li>
          <li><strong>Determinación de intervalos:</strong> Se calcula el rango temporal total y se divide en intervalos apropiados</li>
          <li><strong>Bucketing:</strong> Cada tweet se asigna a su intervalo temporal correspondiente (técnica de "binning")</li>
          <li><strong>Conteo:</strong> Se suma la cantidad de tweets por cada intervalo temporal</li>
          <li><strong>Visualización:</strong> Se genera un gráfico de líneas donde el eje X representa el tiempo y el eje Y el volumen de tweets</li>
        </ol>

        <h4 style={{ marginBottom: '12px' }}>Interpretación de patrones</h4>
        <p>Los diferentes patrones temporales tienen significados específicos:</p>
        <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
          <li><strong>Picos aislados:</strong> Respuestas reactivas a eventos específicos (conferencias de prensa, anuncios, incidentes)</li>
          <li><strong>Actividad sostenida:</strong> Conversaciones estructurales sobre temas de importancia continua</li>
          <li><strong>Patrones cíclicos:</strong> Conversaciones ligadas a rutinas (horarios de trabajo, días laborales vs. fines de semana)</li>
          <li><strong>Crescendos progresivos:</strong> Acumulación de atención mediática y amplificación viral</li>
          <li><strong>Actividad 24/7 uniforme:</strong> Posible indicador de automatización (bots) o audiencias geográficamente distribuidas</li>
        </ul>
      </InfoModal>

      <InfoModal
        isOpen={showEventsInfo}
        onClose={() => setShowEventsInfo(false)}
        title="Eventos Detectados"
      >
        <h4 style={{ marginTop: 0, marginBottom: '12px' }}>¿Qué son los eventos detectados?</h4>
        <p>Los eventos detectados son <strong>picos de actividad</strong> identificados automáticamente en el timeline mediante algoritmos de detección de anomalías. Representan momentos en los que el volumen de tweets supera significativamente el nivel basal de conversación.</p>
        <p>Esta funcionalidad permite identificar de forma automatizada los momentos más relevantes de la conversación sin necesidad de revisar manualmente todo el timeline.</p>

        <h4 style={{ marginBottom: '12px' }}>Algoritmo de detección</h4>
        <p>El sistema utiliza un método estadístico para identificar anomalías temporales:</p>
        <ol style={{ marginLeft: '20px', lineHeight: 1.8 }}>
          <li><strong>Cálculo de baseline:</strong> Se calcula la media (μ) y desviación estándar (σ) del volumen de tweets por intervalo temporal</li>
          <li><strong>Establecimiento de umbral:</strong> Se define un umbral de detección típicamente en:
            <p style={{ background: '#f5f5f5', padding: '12px', borderRadius: '6px', margin: '12px 0', textAlign: 'center' }}>
              Umbral = μ + k·σ
            </p>
            donde k es un factor de sensibilidad (comúnmente entre 2 y 3)
          </li>
          <li><strong>Identificación de picos:</strong> Se marcan como eventos los intervalos temporales donde el volumen supera el umbral</li>
          <li><strong>Caracterización:</strong> Para cada evento detectado se extraen:
            <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
              <li>Timestamp del pico</li>
              <li>Volumen máximo de tweets</li>
              <li>Hashtags más frecuentes durante ese pico</li>
              <li>Intensidad relativa del evento</li>
            </ul>
          </li>
        </ol>

        <h4 style={{ marginBottom: '12px' }}>¿Por qué es importante?</h4>
        <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
          <li><strong>Identificación automática de momentos clave:</strong> Permite detectar los momentos más importantes sin análisis manual exhaustivo</li>
          <li><strong>Correlación con eventos externos:</strong> Los picos detectados pueden correlacionarse con eventos del mundo real para entender causas y efectos</li>
          <li><strong>Análisis de viralidad:</strong> Los eventos representan momentos donde el contenido se difunde masivamente</li>
          <li><strong>Validación de hipótesis:</strong> Permite confirmar si eventos específicos generaron impacto en la conversación digital</li>
        </ul>

        <h4 style={{ marginBottom: '12px' }}>Interpretación contextual</h4>
        <p>Para interpretar correctamente los eventos detectados:</p>
        <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
          <li>Revisar los <strong>hashtags asociados</strong> al evento para entender el tema que generó el pico</li>
          <li>Correlacionar el timestamp con <strong>eventos externos</strong> (noticias, declaraciones, incidentes)</li>
          <li>Analizar si múltiples eventos están relacionados formando una <strong>cascada informativa</strong></li>
          <li>Considerar si el evento es <strong>orgánico</strong> (respuesta natural) o <strong>artificial</strong> (campaña coordinada)</li>
          <li>Evaluar la <strong>velocidad de respuesta</strong>: eventos que ocurren minutos después de noticias sugieren audiencias muy atentas</li>
        </ul>

        <h4 style={{ marginBottom: '12px' }}>Limitaciones metodológicas</h4>
        <p style={{ fontSize: '13px', color: '#666', background: '#fffbf0', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #f59e0b' }}>
          <strong>Nota:</strong> El algoritmo de detección puede generar falsos positivos (detectar picos no relevantes) o falsos negativos (no detectar eventos importantes con patrones atípicos). Se recomienda siempre revisar manualmente los eventos detectados y complementar con análisis cualitativo del contenido.
        </p>
      </InfoModal>
    </div>
  )
}
