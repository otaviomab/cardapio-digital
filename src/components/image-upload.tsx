'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, AlertTriangle } from 'lucide-react'
import Image from 'next/image'
import { useSupabase } from '@/contexts/SupabaseContext'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  onError?: (error: string) => void
  bucket?: string
  folder?: string
  maxSize?: number // em bytes
  aspectRatio?: number // width/height
  enforceAspectRatio?: boolean // se true, força a proporção. se false, apenas sugere
  maxWidth?: string // largura máxima do container
}

export function ImageUpload({
  value,
  onChange,
  onError,
  bucket = 'restaurant-images',
  folder = 'products',
  maxSize = 5 * 1024 * 1024, // 5MB
  aspectRatio,
  enforceAspectRatio = false, // por padrão, não força a proporção
  maxWidth = 'w-full' // largura máxima padrão
}: ImageUploadProps) {
  const { supabase } = useSupabase()
  const [isUploading, setIsUploading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    // Limpa qualquer erro anterior
    setErrorMessage(null)

    try {
      setIsUploading(true)

      // Verifica o tamanho do arquivo
      if (file.size > maxSize) {
        throw new Error(`Arquivo muito grande. Máximo de ${maxSize / 1024 / 1024}MB`)
      }

      // Se precisar verificar aspect ratio, faz aqui
      if (aspectRatio) {
        const img = document.createElement('img')
        await new Promise((resolve, reject) => {
          img.onload = () => {
            const actualRatio = img.width / img.height
            const tolerance = 0.3 // Aumentando a tolerância para 30%
            
            if (Math.abs(actualRatio - aspectRatio) > tolerance) {
              let expectedDimensions = ''
              if (aspectRatio === 1) {
                expectedDimensions = 'mesma largura e altura (ex: 800x800)'
              } else if (aspectRatio === 16/9) {
                expectedDimensions = 'largura 1.77x maior que altura (ex: 1920x1080)'
              }

              const message = 
                `A imagem ${enforceAspectRatio ? 'precisa ter' : 'deveria ter'} ${expectedDimensions}.\n` +
                `Sua imagem tem proporção de ${actualRatio.toFixed(2)}:1\n` +
                `${enforceAspectRatio ? 'Sugestões:\n- Use um editor de imagens para recortar\n- Tente outra imagem com as dimensões corretas' : 
                  'A imagem pode ficar distorcida ou cortada em algumas partes do site.'}`

              if (enforceAspectRatio) {
                reject(new Error(message))
              } else {
                console.warn(message)
                resolve(null)
              }
            } else {
              resolve(null)
            }
          }
          img.onerror = () => reject(new Error('Erro ao carregar imagem'))
          img.src = URL.createObjectURL(file)
        })
      }

      // Gera um nome único para o arquivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${folder}/${Date.now()}.${fileExt}`

      // Faz o upload para o Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          upsert: true
        })

      if (error) throw error

      // Obtém a URL pública do arquivo
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName)

      onChange(publicUrl)
    } catch (error) {
      console.error('Erro no upload:', error)
      if (error instanceof Error) {
        setErrorMessage(error.message)
        onError?.(error.message)
      } else {
        setErrorMessage('Erro ao fazer upload da imagem')
        onError?.('Erro ao fazer upload da imagem')
      }
    } finally {
      setIsUploading(false)
    }
  }, [supabase, bucket, folder, maxSize, aspectRatio, enforceAspectRatio, onChange, onError])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    multiple: false
  })

  const handleRemove = () => {
    onChange('')
  }

  const handleCloseError = () => {
    setErrorMessage(null)
  }

  return (
    <div className="space-y-2">
      {/* Alerta de erro */}
      {errorMessage && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md animate-in fade-in zoom-in rounded-lg border border-red-200 bg-white p-4 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-red-100 p-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Erro no upload da imagem</h3>
                <div className="mt-1 whitespace-pre-line text-sm text-gray-600">
                  {errorMessage}
                </div>
              </div>
              <button
                onClick={handleCloseError}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleCloseError}
                className="rounded-lg bg-krato-500 px-4 py-2 text-sm font-medium text-white hover:bg-krato-600"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {value ? (
        <div className={`relative ${maxWidth} h-48 overflow-hidden rounded-lg border border-gray-200`}>
          <div className="relative flex h-full w-full items-center justify-center">
            {aspectRatio === 1 ? (
              // Para imagens quadradas (logo)
              <div className="relative h-32 w-32 overflow-hidden">
                <Image
                  src={value}
                  alt="Preview"
                  fill
                  sizes="100vw"
                  quality={90}
                  className="object-cover"
                />
              </div>
            ) : (
              // Para imagens retangulares (capa)
              <div className="relative h-full w-full">
                <Image
                  src={value}
                  alt="Preview"
                  fill
                  sizes="100vw"
                  quality={90}
                  className="object-cover"
                />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="absolute right-2 top-2 rounded-full bg-red-100 p-1 text-red-600 hover:bg-red-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`flex ${maxWidth} h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
            isDragActive
              ? 'border-krato-500 bg-krato-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-green-600" />
              <span className="text-sm text-gray-600">Enviando...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-gray-400" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900">
                  {isDragActive ? 'Solte a imagem aqui' : 'Clique ou arraste'}
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG ou WEBP até {maxSize / 1024 / 1024}MB
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 