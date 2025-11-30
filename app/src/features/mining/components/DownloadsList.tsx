import { useState } from 'react'
import { Database, Download, RefreshCw, Trash2, Eye } from 'lucide-react'
import type { DownloadedFile } from "@/features/mining/services/scraperApi"
import { ConfirmDialog } from './ConfirmDialog'

interface DownloadsListProps {
  downloads: DownloadedFile[]
  loading: boolean
  onRefresh: () => void
  onDownload: (filename: string) => void
  onDelete: (filename: string) => void
  onVisualize: (filename: string) => void
}

export function DownloadsList({ downloads, loading, onRefresh, onDownload, onDelete, onVisualize }: DownloadsListProps) {
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    filename: string
    query: string
  }>({
    isOpen: false,
    filename: '',
    query: ''
  })
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div style={{
      background: 'white',
      padding: '24px',
      borderRadius: '12px',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: 600,
          color: '#1f2937',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Database />
          Archivos Descargados
        </h3>
        <button
          onClick={onRefresh}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            background: 'white',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#f9fafb')}
          onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
        >
          <RefreshCw style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} size={16} />
        </button>
      </div>

      {downloads.length === 0 ? (
        <p style={{
          color: '#9ca3af',
          fontSize: '14px',
          textAlign: 'center',
          padding: '32px',
          margin: 0
        }}>
          No hay archivos descargados aún
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {downloads.map((file) => (
            <div key={file.filename} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              background: '#f9fafb'
            }}>
              <div>
                <div style={{
                  fontWeight: 500,
                  marginBottom: '4px',
                  color: '#1f2937',
                  fontSize: '14px'
                }}>
                  {file.query}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: '#6b7280'
                }}>
                  {file.tweets} tweets • {formatFileSize(file.size)} • {formatDate(file.createdAt)}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  padding: '4px 12px',
                  background: file.status === 'complete' ? '#000' : '#f3f4f6',
                  color: file.status === 'complete' ? 'white' : '#6b7280',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500
                }}>
                  {file.status === 'complete' ? 'Completo' : 'En progreso'}
                </div>
                {file.status === 'complete' && (
                  <button
                    onClick={() => onVisualize(file.filename)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      background: '#000',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#374151'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#000'}
                  >
                    <Eye size={14} />
                    Visualizar
                  </button>
                )}
                <button
                  onClick={() => onDownload(file.filename)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    background: 'white',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                >
                  <Download size={14} />
                </button>
                <button
                  onClick={() => {
                    setConfirmDialog({
                      isOpen: true,
                      filename: file.filename,
                      query: file.query
                    })
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    background: 'white',
                    color: '#000',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#fee2e2'
                    e.currentTarget.style.borderColor = '#fca5a5'
                    e.currentTarget.style.color = '#dc2626'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white'
                    e.currentTarget.style.borderColor = '#d1d5db'
                    e.currentTarget.style.color = '#000'
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Eliminar archivo"
        message={`¿Estás seguro de que quieres eliminar "${confirmDialog.query}"? Esta acción no se puede deshacer.`}
        onConfirm={() => {
          onDelete(confirmDialog.filename)
          setConfirmDialog({ isOpen: false, filename: '', query: '' })
        }}
        onCancel={() => {
          setConfirmDialog({ isOpen: false, filename: '', query: '' })
        }}
      />
    </div>
  )
}
