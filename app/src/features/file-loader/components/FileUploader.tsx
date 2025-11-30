import { useState, useEffect, useRef } from 'react'
import { Upload, Loader2, FileText, FolderOpen, ChevronDown } from 'lucide-react'
import { useFileUpload } from '../hooks/useFileUpload'
import { scraperAPI, type DownloadedFile } from '@/features/mining/services/scraperApi'

export function FileUploader() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { uploadFile, uploadFromServer, isLoading } = useFileUpload()
  const [downloads, setDownloads] = useState<DownloadedFile[]>([])
  const [loadingDownloads, setLoadingDownloads] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    loadDownloads()
  }, [])

  const loadDownloads = async () => {
    setLoadingDownloads(true)
    try {
      const files = await scraperAPI.listDownloads()
      setDownloads(files)
    } catch (err) {
      console.error('Error loading downloads:', err)
    } finally {
      setLoadingDownloads(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadFile(file)
      // Reset input para poder cargar el mismo archivo otra vez
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleLocalFileClick = () => {
    setShowDropdown(false)
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (filename: string) => {
    setShowDropdown(false)
    await uploadFromServer(filename)
  }

  const handleButtonClick = () => {
    if (downloads.length === 0) {
      loadDownloads()
    }
    setShowDropdown(!showDropdown)
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Input oculto para carga local */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Botón Upload con dropdown */}
      <button
        onClick={handleButtonClick}
        disabled={isLoading || loadingDownloads}
        className="nav-tab"
      >
        {isLoading || loadingDownloads ? <Loader2 className="spinner" /> : <Upload />}
        <span>{isLoading ? 'Cargando...' : 'Upload'}</span>
        <ChevronDown size={16} style={{ opacity: 0.6 }} />
      </button>

      {/* Dropdown con opciones */}
      {showDropdown && !isLoading && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '8px',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            minWidth: '320px',
            maxWidth: '500px',
            maxHeight: '450px',
            overflowY: 'auto',
            zIndex: 9999,
          }}
        >
          {/* Opción: Cargar desde disco local */}
          <button
            onClick={handleLocalFileClick}
            style={{
              width: '100%',
              padding: '14px 16px',
              border: 'none',
              borderBottom: '2px solid #e5e7eb',
              background: 'white',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f0f9ff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FolderOpen size={20} style={{ color: '#3b82f6', flexShrink: 0 }} />
              <div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#111827',
                }}>
                  Cargar desde mi ordenador
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  marginTop: '2px'
                }}>
                  Selecciona un archivo JSON local
                </div>
              </div>
            </div>
          </button>

          {/* Sección: Archivos del servidor */}
          {loadingDownloads ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: '#6b7280' }}>
              <Loader2 className="spinner" style={{ margin: '0 auto' }} />
              <p style={{ marginTop: '8px', fontSize: '14px' }}>Cargando archivos del servidor...</p>
            </div>
          ) : downloads.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: '#6b7280' }}>
              <FileText size={32} style={{ margin: '0 auto', opacity: 0.5 }} />
              <p style={{ marginTop: '8px', fontSize: '14px', fontWeight: 500 }}>
                No hay archivos en el servidor
              </p>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>
                Descarga datos desde la pestaña Minería
              </p>
            </div>
          ) : (
            <div>
              <div style={{
                padding: '10px 16px',
                background: '#f9fafb',
                fontWeight: 600,
                fontSize: '13px',
                color: '#374151',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Archivos del servidor ({downloads.length})
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {downloads.map((file) => (
                  <button
                    key={file.filename}
                    onClick={() => handleFileSelect(file.filename)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: 'none',
                      borderBottom: '1px solid #f3f4f6',
                      background: 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f9fafb'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <FileText size={18} style={{ color: '#10b981', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: 500,
                          color: '#111827',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {file.query}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          marginTop: '2px'
                        }}>
                          {file.tweets.toLocaleString()} tweets • {(file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Overlay para cerrar el dropdown al hacer click fuera */}
      {showDropdown && (
        <div
          onClick={() => setShowDropdown(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9998,
          }}
        />
      )}
    </div>
  )
}
