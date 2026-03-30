'use client'

import { useCallback, useState } from 'react'
import { Upload, FileText, X, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

interface FileUploadDropzoneProps {
  onFileSelect: (file: File) => void
  onClear?: () => void
  accept?: string
  maxSize?: number // in bytes
  disabled?: boolean
  isProcessing?: boolean
  className?: string
}

export function FileUploadDropzone({
  onFileSelect,
  onClear,
  accept = '*/*',
  maxSize = 100 * 1024 * 1024, // 100MB default
  disabled = false,
  isProcessing = false,
  className,
}: FileUploadDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const validateFile = useCallback((file: File): boolean => {
    if (file.size > maxSize) {
      setError(`El archivo excede el tamaño máximo de ${formatFileSize(maxSize)}`)
      return false
    }
    setError(null)
    return true
  }, [maxSize])

  const handleFile = useCallback((file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file)
      onFileSelect(file)
    }
  }, [validateFile, onFileSelect])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled && !isProcessing) {
      setIsDragActive(true)
    }
  }, [disabled, isProcessing])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    if (disabled || isProcessing) return

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }, [disabled, isProcessing, handleFile])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
    e.target.value = ''
  }, [handleFile])

  const handleClear = useCallback(() => {
    setSelectedFile(null)
    setError(null)
    onClear?.()
  }, [onClear])

  return (
    <div className={cn('w-full', className)}>
      {!selectedFile ? (
        <label
          htmlFor="file-upload"
          className={cn(
            'relative flex flex-col items-center justify-center w-full min-h-[200px] p-6',
            'border-2 border-dashed rounded-lg cursor-pointer',
            'transition-all duration-200',
            isDragActive
              ? 'border-accent bg-accent/5'
              : 'border-border hover:border-muted-foreground/50 bg-card/50',
            (disabled || isProcessing) && 'opacity-50 cursor-not-allowed'
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            id="file-upload"
            type="file"
            className="sr-only"
            accept={accept}
            onChange={handleInputChange}
            disabled={disabled || isProcessing}
          />
          
          <div className="flex flex-col items-center gap-4">
            <div className={cn(
              'p-4 rounded-full',
              isDragActive ? 'bg-accent/10' : 'bg-secondary'
            )}>
              <Upload className={cn(
                'w-8 h-8',
                isDragActive ? 'text-accent' : 'text-muted-foreground'
              )} />
            </div>
            
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                {isDragActive ? 'Suelta el archivo aquí' : 'Arrastra y suelta tu archivo'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                o haz clic para seleccionar
              </p>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Máximo {formatFileSize(maxSize)}
            </p>
          </div>
        </label>
      ) : (
        <div className="relative p-4 border border-border rounded-lg bg-card">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-md bg-secondary">
              <FileText className="w-6 h-6 text-muted-foreground" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(selectedFile.size)}
              </p>
              
              {isProcessing && (
                <div className="flex items-center gap-2 mt-2">
                  <Spinner className="w-4 h-4" />
                  <span className="text-xs text-muted-foreground">
                    Calculando hash...
                  </span>
                </div>
              )}
            </div>
            
            {!isProcessing && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClear}
                className="shrink-0"
              >
                <X className="w-4 h-4" />
                <span className="sr-only">Eliminar archivo</span>
              </Button>
            )}
          </div>
        </div>
      )}
      
      {error && (
        <div className="flex items-center gap-2 mt-2 text-sm text-destructive">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
