import { useState, useEffect, useRef } from 'react'
import { Cloud, Download, Settings, RotateCcw } from 'lucide-react'
import cloud from 'd3-cloud'
import { scaleLinear } from 'd3-scale'
import { interpolateBlues, interpolateViridis, interpolateWarm, interpolateCool, interpolatePlasma } from 'd3-scale-chromatic'
import type { Statistics } from '@/types/graph'
import { InfoModal } from '@/shared/components/InfoModal'
import { InfoButton } from '@/shared/components/InfoButton'

interface WordCloudProps {
  stats: Statistics
}

interface CloudWord {
  text: string
  size: number
  count: number
  x?: number
  y?: number
  rotate?: number
}

type ColorScheme = 'greys' | 'viridis' | 'warm' | 'cool' | 'plasma'

const colorSchemes: Record<ColorScheme, (t: number) => string> = {
  greys: (t: number) => {
    // Escala de grises de claro a oscuro
    const gray = Math.round(200 - (t * 130)) // De #C8C8C8 a #464646
    return `rgb(${gray}, ${gray}, ${gray})`
  },
  viridis: interpolateViridis,
  warm: interpolateWarm,
  cool: interpolateCool,
  plasma: interpolatePlasma,
}

export function WordCloudInteractive({ stats }: WordCloudProps) {
  const [showInfo, setShowInfo] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const [words, setWords] = useState<CloudWord[]>([])
  const [hoveredWord, setHoveredWord] = useState<CloudWord | null>(null)
  const [maxWords, setMaxWords] = useState(80)
  const [enableRotation, setEnableRotation] = useState(false)
  const [colorScheme, setColorScheme] = useState<ColorScheme>('greys')
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const rawWords = stats.word_frequencies || []

  useEffect(() => {
    if (rawWords.length === 0) return

    const width = 800
    const height = 500

    // Preparar datos
    const sortedWords = [...rawWords]
      .sort((a, b) => {
        const aCount = (a as any).count || (a as any).frequency || 0
        const bCount = (b as any).count || (b as any).frequency || 0
        return bCount - aCount
      })
      .slice(0, maxWords)

    const frequencies = sortedWords.map(w => (w as any).count || (w as any).frequency || 0)
    const maxCount = Math.max(...frequencies)
    const minCount = Math.min(...frequencies)

    const fontScale = scaleLinear()
      .domain([minCount, maxCount])
      .range([16, 72])

    // Preparar palabras para d3-cloud
    const wordsData: CloudWord[] = sortedWords.map(w => ({
      text: (w as any).word,
      size: fontScale((w as any).count || (w as any).frequency || 0),
      count: (w as any).count || (w as any).frequency || 0,
    }))

    // Generar layout con d3-cloud
    const layout = cloud<CloudWord>()
      .size([width, height])
      .words(wordsData)
      .padding(5)
      .rotate(() => enableRotation ? (~~(Math.random() * 2) * 90) : 0)
      .fontSize(d => d.size)
      .on('end', (words) => {
        setWords(words)
      })

    layout.start()
  }, [rawWords, maxWords, enableRotation])

  const downloadSVG = () => {
    if (!svgRef.current) return

    const svgData = new XMLSerializer().serializeToString(svgRef.current)
    const blob = new Blob([svgData], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `wordcloud_${new Date().toISOString().split('T')[0]}.svg`
    link.click()
    URL.revokeObjectURL(url)
  }

  const downloadPNG = () => {
    if (!svgRef.current) return

    const svgData = new XMLSerializer().serializeToString(svgRef.current)
    const canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 500
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    img.onload = () => {
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)

      canvas.toBlob((blob) => {
        if (!blob) return
        const pngUrl = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = pngUrl
        link.download = `wordcloud_${new Date().toISOString().split('T')[0]}.png`
        link.click()
        URL.revokeObjectURL(pngUrl)
      })
    }
    img.src = url
  }

  const handleWordClick = (word: CloudWord) => {
    const query = encodeURIComponent(word.text)
    window.open(`https://twitter.com/search?q=${query}`, '_blank')
  }

  const getWordColor = (word: CloudWord) => {
    const frequencies = words.map(w => w.count)
    const maxCount = Math.max(...frequencies)
    const minCount = Math.min(...frequencies)
    const ratio = (word.count - minCount) / (maxCount - minCount || 1)
    return colorSchemes[colorScheme](0.3 + ratio * 0.7)
  }

  if (rawWords.length === 0) {
    return (
      <div className="chart-card">
        <h3 className="chart-title">
          <Cloud style={{ display: 'inline', width: 20, height: 20, marginRight: 8 }} />
          Nube de Palabras Interactiva
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="chart-title" style={{ margin: 0 }}>
            <Cloud style={{ display: 'inline', width: 20, height: 20, marginRight: 8 }} />
            Nube de Palabras Interactiva
            <InfoButton onClick={() => setShowInfo(true)} />
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowControls(!showControls)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                background: showControls ? '#1f2937' : '#fff',
                color: showControls ? '#fff' : '#333',
                border: '1px solid #ddd',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500
              }}
            >
              <Settings size={16} />
              {showControls ? 'Ocultar' : 'Configurar'}
            </button>
            <button
              onClick={downloadSVG}
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
              SVG
            </button>
            <button
              onClick={downloadPNG}
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
              PNG
            </button>
          </div>
        </div>

        {/* Panel de controles */}
        {showControls && (
          <div style={{
            background: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Número de palabras */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#495057', display: 'block', marginBottom: '8px' }}>
                  Número de palabras: {maxWords}
                </label>
                <input
                  type="range"
                  min="20"
                  max="150"
                  value={maxWords}
                  onChange={(e) => setMaxWords(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6c757d', marginTop: '4px' }}>
                  <span>20</span>
                  <span>150</span>
                </div>
              </div>

              {/* Esquema de colores */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#495057', display: 'block', marginBottom: '8px' }}>
                  Paleta de colores
                </label>
                <select
                  value={colorScheme}
                  onChange={(e) => setColorScheme(e.target.value as ColorScheme)}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    border: '1px solid #ced4da',
                    fontSize: '13px'
                  }}
                >
                  <option value="greys">Grises (por defecto)</option>
                  <option value="viridis">Viridis (verde-azul-morado)</option>
                  <option value="warm">Cálidos (rojo-naranja-amarillo)</option>
                  <option value="cool">Fríos (verde-azul)</option>
                  <option value="plasma">Plasma (morado-rosa-naranja)</option>
                </select>
              </div>
            </div>

            {/* Toggle rotación */}
            <div style={{ marginTop: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                <input
                  type="checkbox"
                  checked={enableRotation}
                  onChange={(e) => setEnableRotation(e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                Habilitar rotación de palabras (90°)
              </label>
            </div>
          </div>
        )}

        {/* SVG Nube de palabras */}
        <div ref={containerRef} style={{ position: 'relative', background: '#fafafa', borderRadius: '8px', padding: '20px' }}>
          <svg
            ref={svgRef}
            width="100%"
            height="500"
            viewBox="0 0 800 500"
            style={{ display: 'block', background: 'white', borderRadius: '4px' }}
          >
            <g transform={`translate(${800 / 2}, ${500 / 2})`}>
              {words.map((word, i) => (
                <text
                  key={i}
                  style={{
                    fontSize: `${word.size}px`,
                    fontFamily: 'Arial, sans-serif',
                    fontWeight: 'bold',
                    fill: getWordColor(word),
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: hoveredWord === word ? 1 : 0.85,
                  }}
                  transform={`translate(${word.x}, ${word.y}) rotate(${word.rotate || 0})`}
                  textAnchor="middle"
                  onClick={() => handleWordClick(word)}
                  onMouseEnter={() => setHoveredWord(word)}
                  onMouseLeave={() => setHoveredWord(null)}
                >
                  {word.text}
                </text>
              ))}
            </g>
          </svg>

          {/* Tooltip */}
          {hoveredWord && (
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'rgba(0, 0, 0, 0.9)',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              pointerEvents: 'none',
              zIndex: 1000
            }}>
              <div style={{ fontWeight: 'bold' }}>{hoveredWord.text}</div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>Frecuencia: {hoveredWord.count.toLocaleString()}</div>
              <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '4px' }}>Click para buscar en Twitter</div>
            </div>
          )}
        </div>

        <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '12px', fontStyle: 'italic' }}>
          Pasa el mouse sobre las palabras para ver detalles. Haz click para buscar en Twitter.
        </div>
      </div>

      <InfoModal
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        title="Nube de Palabras Interactiva"
      >
        <h4 style={{ marginTop: 0, marginBottom: '12px' }}>¿Qué es esta visualización?</h4>
        <p>La nube de palabras interactiva es una <strong>visualización dinámica de frecuencias léxicas</strong> que representa las palabras más utilizadas en el corpus de tweets. A diferencia de una nube estática, esta versión permite explorar y interactuar con los datos.</p>

        <h4 style={{ marginBottom: '12px' }}>Funcionalidades interactivas</h4>
        <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
          <li><strong>Hover:</strong> Al pasar el mouse sobre una palabra, se muestra su frecuencia exacta</li>
          <li><strong>Click:</strong> Hacer click en una palabra abre la búsqueda de Twitter para ese término</li>
          <li><strong>Controles personalizables:</strong>
            <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
              <li>Ajustar número de palabras (20-150)</li>
              <li>Cambiar paleta de colores</li>
              <li>Activar/desactivar rotación</li>
            </ul>
          </li>
          <li><strong>Exportación:</strong> Descargar la nube en formato SVG (vectorial) o PNG (imagen)</li>
        </ul>

        <h4 style={{ marginBottom: '12px' }}>Ventajas sobre la versión estática</h4>
        <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
          <li>✅ Exploración interactiva con tooltips informativos</li>
          <li>✅ Búsqueda directa en Twitter con un click</li>
          <li>✅ SVG escalable sin pérdida de calidad</li>
          <li>✅ Personalización en tiempo real</li>
          <li>✅ Colores basados en frecuencia para mejor análisis visual</li>
        </ul>

        <h4 style={{ marginBottom: '12px' }}>Algoritmo de colocación</h4>
        <p>Utiliza el algoritmo d3-cloud, que emplea una espiral de Arquímedes para colocar palabras desde el centro hacia afuera, detectando colisiones y garantizando que ninguna palabra se superponga.</p>

        <h4 style={{ marginBottom: '12px' }}>Interpretación de colores</h4>
        <p>La intensidad del color representa la frecuencia relativa:</p>
        <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
          <li><strong>Colores más oscuros/intensos:</strong> Palabras con mayor frecuencia</li>
          <li><strong>Colores más claros:</strong> Palabras menos frecuentes pero relevantes</li>
        </ul>
      </InfoModal>
    </>
  )
}
