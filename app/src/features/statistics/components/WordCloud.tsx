import { useState, useEffect, useRef } from 'react'
import { Cloud } from 'lucide-react'
import type { Statistics } from '@/types/graph'
import { InfoModal } from '@/shared/components/InfoModal'
import { InfoButton } from '@/shared/components/InfoButton'

interface WordCloudProps {
  stats: Statistics
}

interface Word {
  text: string
  count: number
  fontSize: number
  width: number
  height: number
  x: number
  y: number
  placed: boolean
  opacity: number
}

export function WordCloud({ stats }: WordCloudProps) {
  const [showInfo, setShowInfo] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const words = stats.word_frequencies || []

  useEffect(() => {
    if (words.length === 0 || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Configurar canvas - usar clientWidth del contenedor padre
    const container = canvas.parentElement
    const width = container?.clientWidth || 800
    canvas.width = width
    canvas.height = 500

    console.log('[WordCloud] Canvas size:', width, 'x', 500)

    // Limpiar canvas y pintar fondo blanco
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Calcular tamaños de fuente
    // NOTA: El worker retorna {word, count} no {word, frequency}
    const frequencies = words.map(w => (w as any).count || (w as any).frequency || 0)
    const maxCount = Math.max(...frequencies)
    const minCount = Math.min(...frequencies)
    const minFontSize = 16
    const maxFontSize = 72

    console.log('[WordCloud] Palabras totales:', words.length)
    console.log('[WordCloud] Frecuencias min/max:', minCount, '/', maxCount)

    // Ordenar por frecuencia (más grandes primero)
    const sortedWords = [...words]
      .sort((a, b) => {
        const aCount = (a as any).count || (a as any).frequency || 0
        const bCount = (b as any).count || (b as any).frequency || 0
        return bCount - aCount
      })
      .slice(0, 80)

    console.log('[WordCloud] Mostrando top', sortedWords.length, 'palabras')

    // Preparar palabras con dimensiones
    const wordObjects: Word[] = sortedWords.map(w => {
      const count = (w as any).count || (w as any).frequency || 0
      const ratio = (count - minCount) / (maxCount - minCount || 1)
      const fontSize = minFontSize + (ratio * (maxFontSize - minFontSize))

      ctx.font = `bold ${fontSize}px Arial, sans-serif`
      const metrics = ctx.measureText((w as any).word)
      const width = metrics.width
      const height = fontSize

      return {
        text: (w as any).word,
        count,
        fontSize,
        width,
        height,
        x: 0,
        y: 0,
        placed: false,
        opacity: 0.6 + (ratio * 0.4)
      }
    })

    // Función de colisión
    function collides(word1: Word, word2: Word, padding = 8) {
      return !(
        word1.x + word1.width / 2 + padding < word2.x - word2.width / 2 ||
        word1.x - word1.width / 2 - padding > word2.x + word2.width / 2 ||
        word1.y + word1.height / 2 + padding < word2.y - word2.height / 2 ||
        word1.y - word1.height / 2 - padding > word2.y + word2.height / 2
      )
    }

    // Colocar palabras usando espiral desde el centro
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const placedWords: Word[] = []

    wordObjects.forEach(word => {
      let placed = false
      let radius = 0
      let angle = 0
      const step = 2
      const angleStep = 0.3

      // Intentar colocar en espiral
      while (!placed && radius < Math.max(canvas.width, canvas.height)) {
        const x = centerX + radius * Math.cos(angle)
        const y = centerY + radius * Math.sin(angle)

        // Verificar límites del canvas
        if (
          x - word.width / 2 >= 0 &&
          x + word.width / 2 <= canvas.width &&
          y - word.height / 2 >= 10 &&
          y + word.height / 2 <= canvas.height - 10
        ) {
          word.x = x
          word.y = y

          // Verificar colisiones
          const hasCollision = placedWords.some(pw => collides(word, pw))

          if (!hasCollision) {
            placed = true
            word.placed = true
            placedWords.push(word)
          }
        }

        angle += angleStep
        radius += (step * angleStep) / (2 * Math.PI)
      }
    })

    // Paleta de colores
    const colors = [
      '#2c3e50',
      '#34495e',
      '#7f8c8d',
      '#95a5a6',
      '#16a085',
      '#27ae60',
      '#2980b9',
      '#8e44ad',
      '#c0392b',
      '#d35400'
    ]

    // Dibujar palabras colocadas
    placedWords.forEach((word, idx) => {
      ctx.font = `bold ${word.fontSize}px Arial, sans-serif`
      ctx.fillStyle = colors[idx % colors.length]
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(word.text, word.x, word.y)
    })

    console.log(`[WordCloud] Colocadas ${placedWords.length} de ${wordObjects.length} palabras`)
  }, [words])

  if (words.length === 0) {
    return (
      <div className="chart-card">
        <h3 className="chart-title">
          <Cloud style={{ display: 'inline', width: 20, height: 20, marginRight: 8 }} />
          Nube de Palabras
        </h3>
        <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
          No hay datos de palabras disponibles
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="chart-card">
        <h3 className="chart-title">
          <Cloud style={{ display: 'inline', width: 20, height: 20, marginRight: 8 }} />
          Nube de Palabras
          <InfoButton onClick={() => setShowInfo(true)} />
        </h3>
        <div style={{ padding: '20px', background: '#fafafa', borderRadius: '8px' }}>
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '500px',
              display: 'block',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>
      </div>

      <InfoModal
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        title="Nube de Palabras"
      >
        <h4 style={{ marginTop: 0, marginBottom: '12px' }}>¿Qué mide esta métrica?</h4>
        <p>La nube de palabras es una <strong>visualización de frecuencias léxicas</strong> que representa las palabras más utilizadas en el corpus de tweets analizado. El tamaño de cada palabra es proporcional a su frecuencia de aparición, permitiendo identificar de forma visual e intuitiva los términos dominantes en el discurso.</p>
        <p>Esta técnica de visualización facilita la identificación rápida de temas, conceptos y vocabulario característico de la conversación analizada.</p>

        <h4 style={{ marginBottom: '12px' }}>Procesamiento del texto</h4>
        <p>El sistema aplica técnicas de procesamiento de lenguaje natural (NLP) para extraer las palabras significativas:</p>
        <ol style={{ marginLeft: '20px', lineHeight: 1.8 }}>
          <li><strong>Tokenización:</strong> Se divide cada tweet en palabras individuales (tokens)</li>
          <li><strong>Normalización:</strong> Se convierten todas las palabras a minúsculas para unificar variantes</li>
          <li><strong>Filtrado de stopwords:</strong> Se eliminan palabras vacías sin significado semántico (artículos, preposiciones, pronombres: "el", "de", "que", "es", etc.)</li>
          <li><strong>Limpieza:</strong> Se eliminan menciones, URLs, hashtags (que se analizan por separado), puntuación y caracteres especiales</li>
          <li><strong>Conteo de frecuencias:</strong> Se calcula cuántas veces aparece cada palabra única en el corpus completo</li>
        </ol>

        <h4 style={{ marginBottom: '12px' }}>Algoritmo de escalamiento visual</h4>
        <p>El tamaño de cada palabra se calcula mediante transformación lineal proporcional a la frecuencia:</p>
        <p style={{ background: '#f5f5f5', padding: '16px', borderRadius: '6px', margin: '16px 0' }}>
          Tamaño<sub>palabra</sub> = Tamaño<sub>min</sub> + [(f - f<sub>min</sub>) / (f<sub>max</sub> - f<sub>min</sub>)] × (Tamaño<sub>max</sub> - Tamaño<sub>min</sub>)
        </p>
        <p style={{ fontSize: '13px' }}>
          Donde <em>f</em> es la frecuencia de la palabra, <em>f<sub>min</sub></em> es la frecuencia mínima (16px), <em>f<sub>max</sub></em> es la frecuencia máxima (72px). Las palabras se colocan usando un algoritmo de espiral desde el centro, evitando colisiones para crear una disposición orgánica tipo nube.
        </p>

        <h4 style={{ marginBottom: '12px' }}>¿Por qué es importante?</h4>
        <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
          <li><strong>Identificación temática rápida:</strong> Permite captar en segundos los temas centrales de conversaciones con miles de tweets</li>
          <li><strong>Análisis léxico:</strong> Revela el vocabulario característico de comunidades, movimientos o campañas específicas</li>
          <li><strong>Detección de marcos discursivos:</strong> Las palabras dominantes indican los marcos conceptuales (frames) que organizan el debate</li>
          <li><strong>Comparación temporal:</strong> Nubes de palabras de diferentes períodos muestran evolución temática</li>
          <li><strong>Validación cualitativa:</strong> Confirma o refuta hipótesis sobre los temas presentes en la conversación</li>
        </ul>

        <h4 style={{ marginBottom: '12px' }}>Interpretación académica</h4>
        <p>Desde la perspectiva del análisis del discurso:</p>
        <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
          <li><strong>Palabras políticas:</strong> Términos como "democracia", "libertad", "derechos" indican conversaciones cívicas o activismo</li>
          <li><strong>Palabras emocionales:</strong> Alta presencia de "miedo", "crisis", "problema" sugiere tono negativo o alarmista</li>
          <li><strong>Nombres propios:</strong> Presencia de nombres de políticos, marcas o lugares indica los actores y contextos centrales</li>
          <li><strong>Jerga técnica:</strong> Vocabulario especializado identifica comunidades expertas (médicas, tecnológicas, etc.)</li>
          <li><strong>Términos polarizantes:</strong> Palabras asociadas a bandos opuestos revelan controversias y divisiones</li>
        </ul>

        <h4 style={{ marginBottom: '12px' }}>Limitaciones metodológicas</h4>
        <p style={{ fontSize: '13px', color: '#666', background: '#fffbf0', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #f59e0b' }}>
          <strong>Consideraciones:</strong>
        </p>
        <ul style={{ marginLeft: '20px', fontSize: '13px', color: '#666', lineHeight: 1.8 }}>
          <li>La nube pierde el <strong>contexto</strong> de las palabras (no muestra oraciones completas ni relaciones sintácticas)</li>
          <li>Palabras polisémicas pueden tener <strong>múltiples significados</strong> que la visualización no distingue</li>
          <li>El filtrado de stopwords puede eliminar <strong>palabras contextualmente importantes</strong> en ciertos análisis</li>
          <li>No captura <strong>frases complejas</strong> o colocaciones (por ejemplo, "derechos humanos" se separa en dos palabras)</li>
          <li>Debe complementarse con análisis cualitativo y lectura de tweets representativos</li>
        </ul>

        <h4 style={{ marginBottom: '12px' }}>Visualización</h4>
        <p>Esta implementación muestra las <strong>80 palabras más frecuentes</strong> con tamaños que varían entre 16px y 72px. Las palabras se colocan usando un algoritmo de espiral que garantiza que no se superpongan, creando una disposición orgánica similar a una nube real.</p>
      </InfoModal>
    </>
  )
}
