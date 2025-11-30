import { Info } from 'lucide-react'

interface InfoButtonProps {
  onClick: () => void
}

export function InfoButton({ onClick }: InfoButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '4px',
        display: 'inline-flex',
        alignItems: 'center',
        color: '#666',
        transition: 'color 0.2s',
        marginLeft: '8px'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = '#000'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = '#666'
      }}
      title="Ver información"
    >
      <Info style={{ width: 18, height: 18 }} />
    </button>
  )
}
