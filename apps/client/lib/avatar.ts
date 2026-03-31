import imageCompression from 'browser-image-compression'

const AVATAR_MAX_SIZE_MB = 0.35
const AVATAR_MAX_DIMENSION = 512

function fileToDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string') {
        resolve(result)
        return
      }

      reject(new Error('No fue posible leer el archivo seleccionado.'))
    }
    reader.onerror = () => {
      reject(new Error('No fue posible procesar la imagen.'))
    }
    reader.readAsDataURL(file)
  })
}

export async function compressAvatarImage(file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Selecciona una imagen válida.')
  }

  const compressedFile = await imageCompression(file, {
    maxSizeMB: AVATAR_MAX_SIZE_MB,
    maxWidthOrHeight: AVATAR_MAX_DIMENSION,
    useWebWorker: true,
    initialQuality: 0.8,
    fileType: 'image/webp',
  })

  const dataUrl = await fileToDataUrl(compressedFile)
  if (!dataUrl.startsWith('data:image/webp;base64,')) {
    throw new Error('No fue posible convertir el avatar a formato WebP.')
  }

  return dataUrl
}

export function getUserDisplayName(user?: { name?: string | null; email?: string | null } | null) {
  return user?.name?.trim() || user?.email?.trim() || 'Cuenta'
}

export function getAvatarInitials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || 'OP'
  const parts = source
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.slice(0, 2).toUpperCase()
  }

  return source.replace(/\s+/g, '').slice(0, 2).toUpperCase() || 'OP'
}