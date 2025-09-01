'use client'

import { useState, useRef } from 'react'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Camera, X, Upload, Image } from 'lucide-react'
import { uploadMultipleFiles, validateImageFile } from '@/lib/storage/upload'

interface FileUploadProps {
  onUpload: (urls: string[]) => void
  maxFiles?: number
  className?: string
}

export function FileUpload({ onUpload, maxFiles = 5, className = '' }: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [previews, setPreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (!selectedFiles) return

    const newFiles: File[] = []
    const newPreviews: string[] = []
    const errors: string[] = []

    Array.from(selectedFiles).forEach(file => {
      const validation = validateImageFile(file)
      if (validation.valid) {
        if (files.length + newFiles.length < maxFiles) {
          newFiles.push(file)
          const preview = URL.createObjectURL(file)
          newPreviews.push(preview)
        }
      } else {
        errors.push(`${file.name}: ${validation.error}`)
      }
    })

    if (errors.length > 0) {
      alert('Some files were rejected:\n' + errors.join('\n'))
    }

    setFiles(prev => [...prev, ...newFiles])
    setPreviews(prev => [...prev, ...newPreviews])
  }

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index])
    setFiles(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)
    try {
      const fileList = new DataTransfer()
      files.forEach(file => fileList.items.add(file))

      const result = await uploadMultipleFiles(fileList.files)
      
      if (result.success) {
        onUpload(result.urls)
        setFiles([])
        setPreviews(prev => {
          prev.forEach(url => URL.revokeObjectURL(url))
          return []
        })
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        alert('Upload failed:\n' + result.errors.join('\n'))
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <Label htmlFor="photos">Photos</Label>
        <div className="flex items-center space-x-2">
          <Input
            ref={fileInputRef}
            id="photos"
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={files.length >= maxFiles}
            className="flex-1"
          >
            <Camera className="h-4 w-4 mr-2" />
            {files.length === 0 ? 'Add Photos' : `Add More Photos (${files.length}/${maxFiles})`}
          </Button>
          {files.length > 0 && (
            <Button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              className="min-w-[100px]"
            >
              {uploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          )}
        </div>
        <p className="text-xs text-gray-500">
          Upload up to {maxFiles} photos. Supported formats: JPEG, PNG, GIF, WebP (max 5MB each)
        </p>
      </div>

      {previews.length > 0 && (
        <div className="space-y-2">
          <Label>Selected Photos</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {previews.map((preview, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </Button>
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  {files[index]?.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}