/**
 * Componente oculto para renderizar y capturar gráficos como imágenes
 * Usado por InformesPage para generar PDFs con gráficos
 */

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, BarController, RadarController, RadialLinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import type { ChartImages } from '@/types/report'
import type { Statistics } from '@/types/graph'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  RadarController,
  RadialLinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface ChartCaptureProps {
  statistics: Statistics
}

export interface ChartCaptureHandle {
  captureCharts: () => Promise<ChartImages>
}

/**
 * Componente que renderiza gráficos de forma oculta y permite capturarlos
 */
export const ChartCapture = forwardRef<ChartCaptureHandle, ChartCaptureProps>(
  ({ statistics }, ref) => {
    const radarCanvasRef = useRef<HTMLCanvasElement>(null)
    const followersCanvasRef = useRef<HTMLCanvasElement>(null)
    const engagementCanvasRef = useRef<HTMLCanvasElement>(null)
    const reachRatioCanvasRef = useRef<HTMLCanvasElement>(null)
    const timelineCanvasRef = useRef<HTMLCanvasElement>(null)
    const wordCloudCanvasRef = useRef<HTMLCanvasElement>(null)

    const radarChartRef = useRef<ChartJS | null>(null)
    const followersChartRef = useRef<ChartJS | null>(null)
    const engagementChartRef = useRef<ChartJS | null>(null)
    const reachRatioChartRef = useRef<ChartJS | null>(null)
    const timelineChartRef = useRef<ChartJS | null>(null)

    useEffect(() => {
      if (!statistics) return

      // Limpiar gráficos existentes
      radarChartRef.current?.destroy()
      followersChartRef.current?.destroy()
      engagementChartRef.current?.destroy()
      reachRatioChartRef.current?.destroy()
      timelineChartRef.current?.destroy()

      const topUsers = statistics.top_engagement_users?.slice(0, 10) || []

      // 1. Radar Chart (Engagement por Usuario)
      if (radarCanvasRef.current && topUsers.length > 0) {
        const ctx = radarCanvasRef.current.getContext('2d')
        if (ctx) {
          radarChartRef.current = new ChartJS(ctx, {
            type: 'radar',
            data: {
              labels: topUsers.map(u => u.name || u.username).slice(0, 10),
              datasets: [
                {
                  label: 'Likes',
                  data: topUsers.map(u => u.likes || 0),
                  backgroundColor: 'rgba(255, 99, 132, 0.2)',
                  borderColor: 'rgba(255, 99, 132, 1)',
                  borderWidth: 2
                },
                {
                  label: 'Replies',
                  data: topUsers.map(u => u.replies || 0),
                  backgroundColor: 'rgba(54, 162, 235, 0.2)',
                  borderColor: 'rgba(54, 162, 235, 1)',
                  borderWidth: 2
                },
                {
                  label: 'Views',
                  data: topUsers.map(u => u.views || 0),
                  backgroundColor: 'rgba(75, 192, 192, 0.2)',
                  borderColor: 'rgba(75, 192, 192, 1)',
                  borderWidth: 2
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: true,
              scales: {
                r: {
                  beginAtZero: true
                }
              },
              plugins: {
                legend: {
                  position: 'top'
                },
                title: {
                  display: true,
                  text: 'Engagement por Usuario (Radar)'
                }
              }
            }
          })
        }
      }

      // 2. Followers Bar Chart
      if (followersCanvasRef.current && topUsers.length > 0) {
        const ctx = followersCanvasRef.current.getContext('2d')
        if (ctx) {
          followersChartRef.current = new ChartJS(ctx, {
            type: 'bar',
            data: {
              labels: topUsers.map(u => u.name || u.username),
              datasets: [{
                label: 'Followers',
                data: topUsers.map(u => u.followers || 0),
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: true,
              indexAxis: 'y',
              scales: {
                x: {
                  beginAtZero: true
                }
              },
              plugins: {
                legend: {
                  display: false
                },
                title: {
                  display: true,
                  text: 'Followers por Usuario'
                }
              }
            }
          })
        }
      }

      // 3. Engagement Total Bar Chart
      if (engagementCanvasRef.current && topUsers.length > 0) {
        const ctx = engagementCanvasRef.current.getContext('2d')
        if (ctx) {
          engagementChartRef.current = new ChartJS(ctx, {
            type: 'bar',
            data: {
              labels: topUsers.map(u => u.name || u.username),
              datasets: [{
                label: 'Engagement Total',
                data: topUsers.map(u => u.engagement || 0),
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: true,
              indexAxis: 'y',
              scales: {
                x: {
                  beginAtZero: true
                }
              },
              plugins: {
                legend: {
                  display: false
                },
                title: {
                  display: true,
                  text: 'Engagement Total'
                }
              }
            }
          })
        }
      }

      // 4. Reach Ratio Bar Chart
      if (reachRatioCanvasRef.current && topUsers.length > 0) {
        const ctx = reachRatioCanvasRef.current.getContext('2d')
        if (ctx) {
          reachRatioChartRef.current = new ChartJS(ctx, {
            type: 'bar',
            data: {
              labels: topUsers.map(u => u.name || u.username),
              datasets: [{
                label: 'Reach Ratio',
                data: topUsers.map(u => parseFloat(u.reach_ratio || '0')),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: true,
              indexAxis: 'y',
              scales: {
                x: {
                  beginAtZero: true
                }
              },
              plugins: {
                legend: {
                  display: false
                },
                title: {
                  display: true,
                  text: 'Reach Ratio'
                }
              }
            }
          })
        }
      }

      // 5. Timeline Chart
      if (timelineCanvasRef.current && statistics.temporal_activity) {
        const ctx = timelineCanvasRef.current.getContext('2d')
        if (ctx) {
          const timeData = statistics.temporal_activity.slice(0, 50) // Limitar para legibilidad
          timelineChartRef.current = new ChartJS(ctx, {
            type: 'bar',
            data: {
              labels: timeData.map(d => new Date(d.time).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit' })),
              datasets: [{
                label: 'Tweets',
                data: timeData.map(d => d.count),
                backgroundColor: 'rgba(153, 102, 255, 0.6)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: true,
              scales: {
                y: {
                  beginAtZero: true
                }
              },
              plugins: {
                legend: {
                  display: false
                },
                title: {
                  display: true,
                  text: 'Timeline de Actividad'
                }
              }
            }
          })
        }
      }

      // 6. Word Cloud
      if (wordCloudCanvasRef.current && statistics.word_frequencies && statistics.word_frequencies.length > 0) {
        const canvas = wordCloudCanvasRef.current
        const ctx = canvas.getContext('2d')
        if (ctx) {
          const width = 800
          const height = 600
          canvas.width = width
          canvas.height = height

          // Limpiar y pintar fondo blanco
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, width, height)

          const words = statistics.word_frequencies
          const frequencies = words.map(w => (w as any).count || (w as any).frequency || 0)
          const maxCount = Math.max(...frequencies)
          const minCount = Math.min(...frequencies)
          const minFontSize = 16
          const maxFontSize = 72

          // Ordenar por frecuencia
          const sortedWords = [...words]
            .sort((a, b) => {
              const aCount = (a as any).count || (a as any).frequency || 0
              const bCount = (b as any).count || (b as any).frequency || 0
              return bCount - aCount
            })
            .slice(0, 80)

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

          // Preparar palabras con dimensiones
          const wordObjects: Word[] = sortedWords.map(w => {
            const count = (w as any).count || (w as any).frequency || 0
            const ratio = (count - minCount) / (maxCount - minCount || 1)
            const fontSize = minFontSize + (ratio * (maxFontSize - minFontSize))

            ctx.font = `bold ${fontSize}px Arial, sans-serif`
            const metrics = ctx.measureText((w as any).word)

            return {
              text: (w as any).word,
              count,
              fontSize,
              width: metrics.width,
              height: fontSize,
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
          const centerX = width / 2
          const centerY = height / 2
          const placedWords: Word[] = []

          wordObjects.forEach(word => {
            let placed = false
            let radius = 0
            let angle = 0
            const step = 2
            const angleStep = 0.3

            // Intentar colocar en espiral
            while (!placed && radius < Math.max(width, height)) {
              const x = centerX + radius * Math.cos(angle)
              const y = centerY + radius * Math.sin(angle)

              // Verificar límites del canvas
              if (
                x - word.width / 2 >= 0 &&
                x + word.width / 2 <= width &&
                y - word.height / 2 >= 10 &&
                y + word.height / 2 <= height - 10
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
        }
      }

      return () => {
        radarChartRef.current?.destroy()
        followersChartRef.current?.destroy()
        engagementChartRef.current?.destroy()
        reachRatioChartRef.current?.destroy()
        timelineChartRef.current?.destroy()
      }
    }, [statistics])

    // Exponer función para capturar los gráficos
    useImperativeHandle(ref, () => ({
      captureCharts: async (): Promise<ChartImages> => {
        // Esperar un frame para asegurar que los gráficos estén renderizados
        await new Promise(resolve => setTimeout(resolve, 100))

        return {
          radarChart: radarChartRef.current?.toBase64Image(),
          followersBarChart: followersChartRef.current?.toBase64Image(),
          engagementBarChart: engagementChartRef.current?.toBase64Image(),
          reachRatioChart: reachRatioChartRef.current?.toBase64Image(),
          timelineChart: timelineChartRef.current?.toBase64Image(),
          wordCloudChart: wordCloudCanvasRef.current?.toDataURL('image/png')
        }
      }
    }))

    // Renderizar canvas ocultos
    return (
      <div style={{ position: 'absolute', left: '-9999px', width: '800px', height: '600px' }}>
        <canvas ref={radarCanvasRef} width="800" height="600" />
        <canvas ref={followersCanvasRef} width="800" height="600" />
        <canvas ref={engagementCanvasRef} width="800" height="600" />
        <canvas ref={reachRatioCanvasRef} width="800" height="600" />
        <canvas ref={timelineCanvasRef} width="800" height="600" />
        <canvas ref={wordCloudCanvasRef} width="800" height="600" />
      </div>
    )
  }
)

ChartCapture.displayName = 'ChartCapture'
