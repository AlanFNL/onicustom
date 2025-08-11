import { motion } from 'framer-motion'
import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Stage, Layer, Image as KonvaImage, Rect, Text } from 'react-konva'

interface EditorCanvasProps {
  imageFile: File | null
  productId: string
}

export interface EditorCanvasRef {
  getCanvasDataUrl: () => string
}

const EditorCanvas = forwardRef<EditorCanvasRef, EditorCanvasProps>(({ imageFile, productId }, ref) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [sourceImageSize, setSourceImageSize] = useState<{ width: number; height: number } | null>(null)
  const [imageProps, setImageProps] = useState({
    x: 0,
    y: 0,
    width: 400,
    height: 300,
    rotation: 0,
    scaleX: 1,
    scaleY: 1
  })
  const [isSelected, setIsSelected] = useState(false)
  const [showResizeHandles, setShowResizeHandles] = useState(false)
  const [controlsOpacity, setControlsOpacity] = useState(0)
  const [mobileControlsTimeout, setMobileControlsTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)
  // Removed rotate hint — we now handle mobile via responsive scaling
  const stageRef = useRef<any>(null)
  const imageRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Product dimensions mapping (in pixels for final export/print)
  const productDimensions = {
    'mousepad-90x40': { width: 900, height: 400 },
    'mousepad-60x40': { width: 600, height: 400 },
    'keycap-kda': { width: 400, height: 400 },
    'spacebar': { width: 600, height: 200 }
  }
  const design = productDimensions[productId as keyof typeof productDimensions] || { width: 600, height: 400 }

  // Responsive display canvas size (visual only). We keep a separate design size for export.
  const [displayWidth, setDisplayWidth] = useState<number>(() => {
    if (typeof window === 'undefined') return Math.min(800, design.width)
    const viewportWidth = window.innerWidth
    // Account for inner container padding (p-2 => 8px each side) and 1px border on Stage per side
    const horizontalFrame = 16 + 2
    const maxVisual = Math.min(800, Math.floor(viewportWidth * (viewportWidth < 768 ? 0.85 : 0.9)) - horizontalFrame)
    return Math.max(100, Math.min(design.width, maxVisual))
  })
  const displayHeight = (displayWidth * design.height) / design.width

  useEffect(() => {
    const handleResize = () => {
      const viewportWidth = window.innerWidth
      const horizontalFrame = 16 + 2
      const maxVisual = Math.min(800, Math.floor(viewportWidth * (viewportWidth < 768 ? 0.85 : 0.9)) - horizontalFrame)
      setDisplayWidth(prev => {
        const next = Math.max(100, Math.min(design.width, maxVisual))
        return next === prev ? prev : next
      })
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [design.width])

  // Expose canvas export functionality to parent component
  useImperativeHandle(ref, () => ({
    getCanvasDataUrl: () => {
      if (stageRef.current && image) {
        // Create a new temporary stage for clean export at design/original pixel size
        // Determine export scale to avoid downscaling the original image
        let exportScale = 1
        if (sourceImageSize) {
          const scaleToDesign = design.width / displayWidth
          const placedImageWidthInDesign = imageProps.width * scaleToDesign
          const placedImageHeightInDesign = imageProps.height * scaleToDesign

          const scaleByWidth = sourceImageSize.width / Math.max(1, placedImageWidthInDesign)
          const scaleByHeight = sourceImageSize.height / Math.max(1, placedImageHeightInDesign)

          // Use the limiting dimension to preserve detail without upscaling beyond source
          exportScale = Math.max(1, Math.min(scaleByWidth, scaleByHeight))
        }

        const exportWidth = Math.round(design.width * exportScale)
        const exportHeight = Math.round(design.height * exportScale)

        const tempStage = new (window as any).Konva.Stage({
          container: document.createElement('div'),
          width: exportWidth,
          height: exportHeight
        })
        
        // Create a new layer
        const tempLayer = new (window as any).Konva.Layer()
        tempStage.add(tempLayer)
        
        // Add white background
        const background = new (window as any).Konva.Rect({
          x: 0,
          y: 0,
          width: exportWidth,
          height: exportHeight,
          fill: 'white'
        })
        tempLayer.add(background)
        
        // Map display coordinates to design coordinates for precise export
        const scaleToDesign = design.width / displayWidth
        
        // Add user image with current position and size (scaled to design size)
        const tempImage = new (window as any).Konva.Image({
          x: imageProps.x * scaleToDesign * exportScale,
          y: imageProps.y * scaleToDesign * exportScale,
          width: imageProps.width * scaleToDesign * exportScale,
          height: imageProps.height * scaleToDesign * exportScale,
          image: image
        })
        tempLayer.add(tempImage)
        
        // Draw the temporary stage
        tempLayer.draw()
        
        // Export the clean stage
        const dataURL = tempStage.toDataURL({
          mimeType: 'image/png',
          quality: 1,
          pixelRatio: 1
        })
        
        // Clean up
        tempStage.destroy()
        
        return dataURL
      }
      return ''
    }
  }))

  // Utility functions
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           (typeof window !== 'undefined' && window.innerWidth < 768)
  }

  // Helper kept for potential future logic on large products

  // Rotation hint removed

  // Handle mobile controls timeout
  const handleMobileTouch = () => {
    if (!isMobileDevice()) return
    
    // Clear any existing timeout
    if (mobileControlsTimeout) {
      clearTimeout(mobileControlsTimeout)
    }
    
    // Show controls immediately
    setIsSelected(true)
    setShowResizeHandles(true)
    
    // Set new timeout to hide controls after 5 seconds
    const newTimeout = setTimeout(() => {
      setIsSelected(false)
      setShowResizeHandles(false)
    }, 5000)
    
    setMobileControlsTimeout(newTimeout)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (mobileControlsTimeout) {
        clearTimeout(mobileControlsTimeout)
      }
    }
  }, [mobileControlsTimeout])

  // Display canvas size (visual)
  const canvasWidth = displayWidth
  const canvasHeight = displayHeight

  useEffect(() => {
    if (imageFile) {
      const img = new window.Image()
      img.onload = () => {
        setImage(img)
        setSourceImageSize({ width: img.naturalWidth, height: img.naturalHeight })
        
        // Stretch image to fill the entire container (ignore aspect ratio)
        const newWidth = canvasWidth
        const newHeight = canvasHeight
        const newX = 0
        const newY = 0
        
        // Set initial position (small and centered)
        const initialWidth = newWidth * 0.2
        const initialHeight = newHeight * 0.2
        const initialX = (canvasWidth - initialWidth) / 2
        const initialY = (canvasHeight - initialHeight) / 2
        
        setImageProps(prev => ({
          ...prev,
          width: initialWidth,
          height: initialHeight,
          x: initialX,
          y: initialY
        }))
        
        // Animate to full size with springy animation using Konva tween
        setTimeout(() => {
          if (imageRef.current) {
            const tween = new (window as any).Konva.Tween({
              node: imageRef.current,
              duration: 0.8,
              easing: (window as any).Konva.Easings.EaseOut,
              x: newX,
              y: newY,
              width: newWidth,
              height: newHeight,
              onFinish: () => {
                setImageProps(prev => ({
                  ...prev,
                  x: newX,
                  y: newY,
                  width: newWidth,
                  height: newHeight
                }))
              }
            })
            tween.play()
          } else {
            // Fallback if ref is not available
            setImageProps(prev => ({
              ...prev,
              width: newWidth,
              height: newHeight,
              x: newX,
              y: newY
            }))
          }
        }, 100) // Small delay to ensure initial state is set
      }
      img.src = URL.createObjectURL(imageFile)
      
      return () => {
        URL.revokeObjectURL(img.src)
      }
    } else {
      setImage(null)
      setSourceImageSize(null)
    }
  }, [imageFile, canvasWidth, canvasHeight])

  // Smooth animation for controls
  useEffect(() => {
    let animationFrame: number
    const animate = () => {
      if (isSelected || showResizeHandles) {
        setControlsOpacity(prev => Math.min(1, prev + 0.15)) // Smooth fade in
        if (controlsOpacity < 1) {
          animationFrame = requestAnimationFrame(animate)
        }
      } else {
        setControlsOpacity(prev => Math.max(0, prev - 0.1)) // Smooth fade out  
        if (controlsOpacity > 0) {
          animationFrame = requestAnimationFrame(animate)
        }
      }
    }
    
    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [isSelected, showResizeHandles, controlsOpacity])
  
  // Handle image drag
  const handleImageDragEnd = (e: any) => {
    setImageProps(prev => ({
      ...prev,
      x: e.target.x(),
      y: e.target.y()
    }))
  }

  // Simplified mouse move - just for hover effects, no longer controls handle visibility
  const handleMouseMove = useCallback(() => {
    // Only used for any future hover effects if needed
  }, [])
  
  // Bleed area (red) - 2% margin from full size of the editable area
  const bleedStrokeWidth = 2
  const bleedMarginRatio = 0.02
  const bleedInsetX = canvasWidth * bleedMarginRatio
  const bleedInsetY = canvasHeight * bleedMarginRatio
  const bleedArea = {
    x: bleedInsetX,
    y: bleedInsetY,
    width: canvasWidth - bleedInsetX * 2,
    height: canvasHeight - bleedInsetY * 2
  }

  return (
    <motion.div 
      className="flex justify-center relative max-w-[95vw] landscape:max-w-[90vw] mx-auto"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.3, ease: [0.32, 0.72, 0, 1] }}
    >
      <div className="bg-white rounded-2xl shadow-lg p-2 relative overflow-hidden" ref={containerRef}>
        <Stage 
          width={canvasWidth} 
          height={canvasHeight} 
          ref={stageRef}
          className="border border-gray-200 rounded-xl touch-none select-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => {
            // Don't hide handles on mouse leave - they stay visible when selected
          }}
          onTouchStart={handleMobileTouch}
          onClick={(e) => {
            // Check if clicked on image
            const clickedOnImage = e.target === imageRef.current
            if (isMobileDevice()) {
              if (clickedOnImage) {
                handleMobileTouch()
              }
            } else {
              setIsSelected(clickedOnImage)
            }
          }}
        >
          {/* Background Layer */}
          <Layer>
            {/* Background */}
            <Rect
              x={0}
              y={0}
              width={canvasWidth}
              height={canvasHeight}
              fill="white"
            />
            
            {/* User image */}
            {image && (
              <KonvaImage
                ref={imageRef}
                image={image}
                x={imageProps.x}
                y={imageProps.y}
                width={imageProps.width}
                height={imageProps.height}
                draggable
                onDragEnd={handleImageDragEnd}
              />
            )}
          </Layer>

          {/* Guide Lines Layer - Always on top */}
          <Layer listening={false}>
            {/* Red bleed line - 2% margin from edges */}
            <Rect
              x={bleedArea.x}
              y={bleedArea.y}
              width={bleedArea.width}
              height={bleedArea.height}
              stroke="red"
              strokeWidth={bleedStrokeWidth}
              fill="transparent"
              opacity={0.8}
            />
            {/* Label */}
            <Text
              x={bleedArea.x + 10}
              y={bleedArea.y + 10}
              text="Línea de sangrado (rellená hasta aquí)"
              fontSize={12}
              fill="red"
              fontFamily="Arial, sans-serif"
            />
          </Layer>
        </Stage>

        {/* HTML Overlay Controls - Above everything */}
        {image && controlsOpacity > 0 && (
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{ opacity: controlsOpacity }}
          >
            {/* Move handle at bottom center */}
            <div
              className="absolute w-6 h-6 pointer-events-auto cursor-move select-none"
              style={{
                left: `${8 + imageProps.x + imageProps.width / 2 - 12}px`,
                top: `${8 + imageProps.y + imageProps.height + 13}px`,
              }}
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                document.body.style.cursor = 'move'
                
                const startX = e.clientX
                const startY = e.clientY
                const startImageX = imageProps.x
                const startImageY = imageProps.y

                const handleMouseMove = (e: MouseEvent) => {
                  e.preventDefault()
                  const deltaX = e.clientX - startX
                  const deltaY = e.clientY - startY
                  setImageProps(prev => ({
                    ...prev,
                    x: startImageX + deltaX,
                    y: startImageY + deltaY
                  }))
                }

                const handleMouseUp = () => {
                  document.body.style.cursor = ''
                  document.removeEventListener('mousemove', handleMouseMove)
                  document.removeEventListener('mouseup', handleMouseUp)
                }

                document.addEventListener('mousemove', handleMouseMove)
                document.addEventListener('mouseup', handleMouseUp)
              }}
              onTouchStart={(e) => {
                e.preventDefault()
                const touch = e.touches[0]
                const startX = touch.clientX
                const startY = touch.clientY
                const startImageX = imageProps.x
                const startImageY = imageProps.y

                const handleTouchMove = (e: TouchEvent) => {
                  e.preventDefault()
                  const touch = e.touches[0]
                  const deltaX = touch.clientX - startX
                  const deltaY = touch.clientY - startY
                  setImageProps(prev => ({
                    ...prev,
                    x: startImageX + deltaX,
                    y: startImageY + deltaY
                  }))
                }

                const handleTouchEnd = () => {
                  document.removeEventListener('touchmove', handleTouchMove)
                  document.removeEventListener('touchend', handleTouchEnd)
                }

                document.addEventListener('touchmove', handleTouchMove)
                document.addEventListener('touchend', handleTouchEnd)
              }}
            >
              <div className="w-6 h-6 bg-[#7a4dff]/90 border-2 border-white rounded-full shadow-lg flex items-center justify-center">
                <div className="flex flex-col space-y-0.5">
                  <div className="w-3 h-0.5 bg-white rounded-full"></div>
                  <div className="w-3 h-0.5 bg-white rounded-full"></div>
                  <div className="w-3 h-0.5 bg-white rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Corner resize handles - Always show when image is selected */}
            {(isSelected || showResizeHandles) && (
              <>
                {/* Top-left corner */}
                <div
                  className="absolute w-12 h-12 pointer-events-auto cursor-nw-resize select-none flex items-center justify-center"
                  style={{
                    left: `${8 + imageProps.x - 24}px`,
                    top: `${8 + imageProps.y - 24}px`,
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    document.body.style.cursor = 'nw-resize'
                    
                    const startX = e.clientX
                    const startY = e.clientY
                    const startProps = { ...imageProps }

                    const handleMouseMove = (e: MouseEvent) => {
                      e.preventDefault()
                      const deltaX = e.clientX - startX
                      const deltaY = e.clientY - startY
                      
                      const newWidth = Math.max(50, startProps.width - deltaX)
                      const newHeight = Math.max(50, startProps.height - deltaY)
                      
                      const actualDeltaX = startProps.width - newWidth
                      const actualDeltaY = startProps.height - newHeight
                      
                      setImageProps({
                        ...startProps,
                        x: startProps.x + actualDeltaX,
                        y: startProps.y + actualDeltaY,
                        width: newWidth,
                        height: newHeight
                      })
                    }

                    const handleMouseUp = () => {
                      document.body.style.cursor = ''
                      document.removeEventListener('mousemove', handleMouseMove)
                      document.removeEventListener('mouseup', handleMouseUp)
                    }

                    document.addEventListener('mousemove', handleMouseMove)
                    document.addEventListener('mouseup', handleMouseUp)
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault()
                    const touch = e.touches[0]
                    const startX = touch.clientX
                    const startY = touch.clientY
                    const startProps = { ...imageProps }

                    const handleTouchMove = (e: TouchEvent) => {
                      e.preventDefault()
                      const t = e.touches[0]
                      const deltaX = t.clientX - startX
                      const deltaY = t.clientY - startY
                      const newWidth = Math.max(50, startProps.width - deltaX)
                      const newHeight = Math.max(50, startProps.height - deltaY)
                      const actualDeltaX = startProps.width - newWidth
                      const actualDeltaY = startProps.height - newHeight
                      setImageProps({
                        ...startProps,
                        x: startProps.x + actualDeltaX,
                        y: startProps.y + actualDeltaY,
                        width: newWidth,
                        height: newHeight
                      })
                    }

                    const handleTouchEnd = () => {
                      document.removeEventListener('touchmove', handleTouchMove)
                      document.removeEventListener('touchend', handleTouchEnd)
                    }

                    document.addEventListener('touchmove', handleTouchMove, { passive: false })
                    document.addEventListener('touchend', handleTouchEnd)
                  }}
                >
                  <div 
                    className="w-4 h-4 bg-[#7a4dff]/90 border-2 border-white shadow-lg"
                    style={{
                      borderRadius: '0 0 16px 0',
                      transform: 'rotate(180deg)',
                    }}
                  />
                </div>

                {/* Top-right corner */}
                <div
                  className="absolute w-12 h-12 pointer-events-auto cursor-ne-resize select-none flex items-center justify-center"
                  style={{
                    left: `${8 + imageProps.x + imageProps.width - 24}px`,
                    top: `${8 + imageProps.y - 24}px`,
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    document.body.style.cursor = 'ne-resize'
                    
                    const startX = e.clientX
                    const startY = e.clientY
                    const startProps = { ...imageProps }

                    const handleMouseMove = (e: MouseEvent) => {
                      e.preventDefault()
                      const deltaX = e.clientX - startX
                      const deltaY = e.clientY - startY
                      
                      const newWidth = Math.max(50, startProps.width + deltaX)
                      const newHeight = Math.max(50, startProps.height - deltaY)
                      
                      const actualDeltaY = startProps.height - newHeight
                      
                      setImageProps({
                        ...startProps,
                        y: startProps.y + actualDeltaY,
                        width: newWidth,
                        height: newHeight
                      })
                    }

                    const handleMouseUp = () => {
                      document.body.style.cursor = ''
                      document.removeEventListener('mousemove', handleMouseMove)
                      document.removeEventListener('mouseup', handleMouseUp)
                    }

                    document.addEventListener('mousemove', handleMouseMove)
                    document.addEventListener('mouseup', handleMouseUp)
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault()
                    const touch = e.touches[0]
                    const startX = touch.clientX
                    const startY = touch.clientY
                    const startProps = { ...imageProps }

                    const handleTouchMove = (e: TouchEvent) => {
                      e.preventDefault()
                      const t = e.touches[0]
                      const deltaX = t.clientX - startX
                      const deltaY = t.clientY - startY
                      const newWidth = Math.max(50, startProps.width + deltaX)
                      const newHeight = Math.max(50, startProps.height - deltaY)
                      const actualDeltaY = startProps.height - newHeight
                      setImageProps({
                        ...startProps,
                        y: startProps.y + actualDeltaY,
                        width: newWidth,
                        height: newHeight
                      })
                    }

                    const handleTouchEnd = () => {
                      document.removeEventListener('touchmove', handleTouchMove)
                      document.removeEventListener('touchend', handleTouchEnd)
                    }

                    document.addEventListener('touchmove', handleTouchMove, { passive: false })
                    document.addEventListener('touchend', handleTouchEnd)
                  }}
                >
                  <div 
                    className="w-4 h-4 bg-[#7a4dff]/90 border-2 border-white shadow-lg"
                    style={{
                      borderRadius: '0 0 16px 0',
                      transform: 'rotate(270deg)',
                    }}
                  />
                </div>

                {/* Bottom-left corner */}
                <div
                  className="absolute w-12 h-12 pointer-events-auto cursor-sw-resize select-none flex items-center justify-center"
                  style={{
                    left: `${8 + imageProps.x - 24}px`,
                    top: `${8 + imageProps.y + imageProps.height - 24}px`,
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    document.body.style.cursor = 'sw-resize'
                    
                    const startX = e.clientX
                    const startY = e.clientY
                    const startProps = { ...imageProps }

                    const handleMouseMove = (e: MouseEvent) => {
                      e.preventDefault()
                      const deltaX = e.clientX - startX
                      const deltaY = e.clientY - startY
                      
                      const newWidth = Math.max(50, startProps.width - deltaX)
                      const newHeight = Math.max(50, startProps.height + deltaY)
                      
                      const actualDeltaX = startProps.width - newWidth
                      
                      setImageProps({
                        ...startProps,
                        x: startProps.x + actualDeltaX,
                        width: newWidth,
                        height: newHeight
                      })
                    }

                    const handleMouseUp = () => {
                      document.body.style.cursor = ''
                      document.removeEventListener('mousemove', handleMouseMove)
                      document.removeEventListener('mouseup', handleMouseUp)
                    }

                    document.addEventListener('mousemove', handleMouseMove)
                    document.addEventListener('mouseup', handleMouseUp)
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault()
                    const touch = e.touches[0]
                    const startX = touch.clientX
                    const startY = touch.clientY
                    const startProps = { ...imageProps }

                    const handleTouchMove = (e: TouchEvent) => {
                      e.preventDefault()
                      const t = e.touches[0]
                      const deltaX = t.clientX - startX
                      const deltaY = t.clientY - startY
                      const newWidth = Math.max(50, startProps.width - deltaX)
                      const newHeight = Math.max(50, startProps.height + deltaY)
                      const actualDeltaX = startProps.width - newWidth
                      setImageProps({
                        ...startProps,
                        x: startProps.x + actualDeltaX,
                        width: newWidth,
                        height: newHeight
                      })
                    }

                    const handleTouchEnd = () => {
                      document.removeEventListener('touchmove', handleTouchMove)
                      document.removeEventListener('touchend', handleTouchEnd)
                    }

                    document.addEventListener('touchmove', handleTouchMove, { passive: false })
                    document.addEventListener('touchend', handleTouchEnd)
                  }}
                >
                  <div 
                    className="w-4 h-4 bg-[#7a4dff]/90 border-2 border-white shadow-lg"
                    style={{
                      borderRadius: '0 0 16px 0',
                      transform: 'rotate(90deg)',
                    }}
                  />
                </div>

                {/* Bottom-right corner */}
                <div
                  className="absolute w-12 h-12 pointer-events-auto cursor-se-resize select-none flex items-center justify-center"
                  style={{
                    left: `${8 + imageProps.x + imageProps.width - 24}px`,
                    top: `${8 + imageProps.y + imageProps.height - 24}px`,
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    document.body.style.cursor = 'se-resize'
                    
                    const startX = e.clientX
                    const startY = e.clientY
                    const startProps = { ...imageProps }

                    const handleMouseMove = (e: MouseEvent) => {
                      e.preventDefault()
                      const deltaX = e.clientX - startX
                      const deltaY = e.clientY - startY
                      
                      const newWidth = Math.max(50, startProps.width + deltaX)
                      const newHeight = Math.max(50, startProps.height + deltaY)
                      
                      setImageProps({
                        ...startProps,
                        width: newWidth,
                        height: newHeight
                      })
                    }

                    const handleMouseUp = () => {
                      document.body.style.cursor = ''
                      document.removeEventListener('mousemove', handleMouseMove)
                      document.removeEventListener('mouseup', handleMouseUp)
                    }

                    document.addEventListener('mousemove', handleMouseMove)
                    document.addEventListener('mouseup', handleMouseUp)
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault()
                    const touch = e.touches[0]
                    const startX = touch.clientX
                    const startY = touch.clientY
                    const startProps = { ...imageProps }

                    const handleTouchMove = (e: TouchEvent) => {
                      e.preventDefault()
                      const t = e.touches[0]
                      const deltaX = t.clientX - startX
                      const deltaY = t.clientY - startY
                      const newWidth = Math.max(50, startProps.width + deltaX)
                      const newHeight = Math.max(50, startProps.height + deltaY)
                      setImageProps({
                        ...startProps,
                        width: newWidth,
                        height: newHeight
                      })
                    }

                    const handleTouchEnd = () => {
                      document.removeEventListener('touchmove', handleTouchMove)
                      document.removeEventListener('touchend', handleTouchEnd)
                    }

                    document.addEventListener('touchmove', handleTouchMove, { passive: false })
                    document.addEventListener('touchend', handleTouchEnd)
                  }}
                >
                  <div 
                    className="w-4 h-4 bg-[#7a4dff]/90 border-2 border-white shadow-lg"
                    style={{
                      borderRadius: '0 0 16px 0',
                    }}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

    </motion.div>
  )
})

EditorCanvas.displayName = 'EditorCanvas'

export default EditorCanvas