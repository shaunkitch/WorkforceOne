import { supabase } from '../supabase/client'

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

export const uploadFile = async (
  file: File,
  bucket: string = 'incident-attachments',
  folder: string = 'photos'
): Promise<UploadResult> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file)

    if (error) {
      console.error('Upload error:', error)
      return { success: false, error: error.message }
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    return { success: true, url: publicUrl }
  } catch (error) {
    console.error('Upload error:', error)
    return { success: false, error: 'Failed to upload file' }
  }
}

export const uploadMultipleFiles = async (
  files: FileList,
  bucket: string = 'incident-attachments',
  folder: string = 'photos'
): Promise<{ success: boolean; urls: string[]; errors: string[] }> => {
  const results = await Promise.all(
    Array.from(files).map(file => uploadFile(file, bucket, folder))
  )

  const urls: string[] = []
  const errors: string[] = []

  results.forEach((result, index) => {
    if (result.success && result.url) {
      urls.push(result.url)
    } else {
      errors.push(`File ${files[index].name}: ${result.error}`)
    }
  })

  return {
    success: errors.length === 0,
    urls,
    errors
  }
}

export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  const maxSize = 5 * 1024 * 1024 // 5MB

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File must be an image (JPEG, PNG, GIF, or WebP)' }
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 5MB' }
  }

  return { valid: true }
}