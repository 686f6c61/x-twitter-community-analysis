import { useEffect, useRef } from 'react'
import { Terminal } from 'lucide-react'

interface LogMessage {
  jobId: string
  timestamp: string
  level: 'info' | 'success' | 'warning' | 'error'
  message: string
}

interface ScraperConsoleProps {
  logs: LogMessage[]
  isRunning: boolean
}

export function ScraperConsole({ logs, isRunning }: ScraperConsoleProps) {
  const consoleEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs])

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'success': return '#10b981'
      case 'warning': return '#f59e0b'
      case 'error': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 16px',
        background: '#f9fafb',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <Terminal size={16} style={{ color: '#6b7280' }} />
        <span style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
          Consola de scraping
        </span>
        {isRunning && (
          <span style={{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#10b981',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            marginLeft: '4px'
          }} />
        )}
      </div>

      <div style={{
        padding: '12px',
        background: '#111',
        minHeight: '200px',
        maxHeight: '400px',
        overflowY: 'auto',
        fontFamily: 'monospace',
        fontSize: '12px',
        lineHeight: '1.6'
      }}>
        {logs.length === 0 ? (
          <div style={{ color: '#6b7280', fontStyle: 'italic' }}>
            Esperando inicio de scraping...
          </div>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              style={{
                marginBottom: '4px',
                display: 'flex',
                gap: '8px'
              }}
            >
              <span style={{ color: '#6b7280', flexShrink: 0 }}>
                [{formatTimestamp(log.timestamp)}]
              </span>
              <span
                style={{
                  color: getLevelColor(log.level),
                  fontWeight: log.level === 'error' ? 500 : 400
                }}
              >
                {log.message}
              </span>
            </div>
          ))
        )}
        <div ref={consoleEndRef} />
      </div>
    </div>
  )
}
