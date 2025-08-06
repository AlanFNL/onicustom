import { motion } from 'framer-motion'
import { useState, useRef, useCallback } from 'react'

interface DragDropAreaProps {
  onFileUpload: (file: File) => void
}

export default function DragDropArea({ onFileUpload }: DragDropAreaProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find(file => file.type.startsWith('image/'))
    
    if (imageFile) {
      onFileUpload(imageFile)
    }
  }, [onFileUpload])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      onFileUpload(file)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <motion.div
      className={`
        relative w-full h-96 md:h-[32rem] border-2 border-dashed rounded-3xl
        cursor-pointer transition-all duration-300 ease-out
        ${isDragOver 
          ? 'border-blue-400 bg-blue-50 scale-[1.02]' 
          : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
        }
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: [0.32, 0.72, 0, 1] }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 p-8">
        <motion.div
          className={`w-16 h-16 rounded-full flex items-center justify-center ${
            isDragOver ? 'bg-blue-200' : 'bg-gray-200'
          }`}
          animate={{ scale: isDragOver ? 1.1 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <svg 
            className={`w-8 h-8 ${isDragOver ? 'text-blue-600' : 'text-gray-500'}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
            />
          </svg>
        </motion.div>
        
        <div className="text-center space-y-2">
          <p className={`text-lg font-medium ${isDragOver ? 'text-blue-700' : 'text-gray-700'}`}>
            {isDragOver ? '¡Soltá tu imagen aquí!' : 'Arrastrá tu imagen aquí'}
          </p>
          <p className="text-sm text-gray-500">
            o hacé clic para seleccionar un archivo
          </p>
          <p className="text-xs text-gray-400">
            PNG, JPG, WEBP hasta 10MB
          </p>
        </div>
      </div>
    </motion.div>
  )
}