import { useState } from 'react'

interface ColumnInfoTooltipProps {
  title: string
  children: React.ReactNode
}

export function ColumnInfoTooltip({ title, children }: ColumnInfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'help',
          color: '#3b82f6',
          fontSize: '14px',
          marginLeft: '4px',
          padding: '0 4px',
          verticalAlign: 'middle'
        }}
        title={title}
      >
        ℹ️
      </button>
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: '8px',
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            minWidth: '250px',
            maxWidth: '350px',
            fontSize: '13px',
            lineHeight: 1.6,
            pointerEvents: 'none'
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '8px', color: '#1f2937' }}>
            {title}
          </div>
          <div style={{ color: '#4b5563' }}>
            {children}
          </div>
        </div>
      )}
    </div>
  )
}
