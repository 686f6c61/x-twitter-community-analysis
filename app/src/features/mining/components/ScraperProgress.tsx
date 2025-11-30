import { Loader2, CheckCircle } from 'lucide-react'
import type { ScrapingJob } from "@/features/mining/services/scraperApi"

interface ScraperProgressProps {
  isRunning: boolean
  job: ScrapingJob | null
  progress: number
  message: string
}

export function ScraperProgress({ isRunning, job, progress, message }: ScraperProgressProps) {
  return (
    <div style={{
      background: 'white',
      padding: '24px',
      borderRadius: '12px',
      border: '1px solid #e5e7eb'
    }}>
      <h3 style={{
        marginTop: 0,
        marginBottom: '20px',
        fontSize: '18px',
        fontWeight: 600,
        color: '#1f2937',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        {isRunning ? (
          <>
            <Loader2 style={{ animation: 'spin 1s linear infinite' }} />
            Descargando...
          </>
        ) : job?.status === 'completed' ? (
          <>
            <CheckCircle style={{ color: '#22c55e' }} />
            Completado
          </>
        ) : (
          'Progreso'
        )}
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <div style={{
            width: '100%',
            height: '8px',
            background: '#e5e7eb',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
              width: `${progress}%`,
              transition: 'width 0.3s ease'
            }} />
          </div>
          <div style={{
            marginTop: '8px',
            fontSize: '14px',
            color: '#6b7280'
          }}>
            {progress}% - {message}
          </div>
        </div>

        {job && (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{
              padding: '6px 12px',
              background: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#374151'
            }}>
              Tweets: {job.tweetsCollected}
            </div>
            {job.query && (
              <div style={{
                padding: '6px 12px',
                background: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#374151'
              }}>
                Query: {job.query}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
