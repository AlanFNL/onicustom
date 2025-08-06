import { Group, Circle, Rect, Arc } from 'react-konva'

interface ImageControlsProps {
  imageProps: {
    x: number
    y: number
    width: number
    height: number
  }
  controlsOpacity: number
  showResizeHandles: boolean
  onMoveHandleDrag: (e: any) => void
  onResizeDrag: (corner: 'tl' | 'tr' | 'bl' | 'br') => (e: any) => void
  onResizeEnd: () => void
}

export default function ImageControls({ 
  imageProps, 
  controlsOpacity, 
  showResizeHandles, 
  onMoveHandleDrag, 
  onResizeDrag, 
  onResizeEnd 
}: ImageControlsProps) {
  return (
    <>
      {/* Move handle at bottom center */}
      {controlsOpacity > 0 && (
        <Group opacity={controlsOpacity}>
          {/* Bottom move handle */}
          <Circle
            x={imageProps.x + imageProps.width / 2}
            y={imageProps.y + imageProps.height + 25}
            radius={12}
            fill="rgba(122, 77, 255, 0.9)"
            stroke="white"
            strokeWidth={2}
            draggable
            onDragMove={onMoveHandleDrag}
            shadowColor="black"
            shadowOpacity={0.2}
            shadowOffset={{ x: 0, y: 2 }}
            shadowBlur={4}
            hitStrokeWidth={20}
          />
          
          {/* Move handle icon - horizontal lines */}
          <Rect
            x={imageProps.x + imageProps.width / 2 - 6}
            y={imageProps.y + imageProps.height + 20}
            width={12}
            height={1.5}
            fill="white"
            listening={false}
          />
          <Rect
            x={imageProps.x + imageProps.width / 2 - 6}
            y={imageProps.y + imageProps.height + 23}
            width={12}
            height={1.5}
            fill="white"
            listening={false}
          />
          <Rect
            x={imageProps.x + imageProps.width / 2 - 6}
            y={imageProps.y + imageProps.height + 26}
            width={12}
            height={1.5}
            fill="white"
            listening={false}
          />
        </Group>
      )}
      
      {/* Corner resize handles */}
      {controlsOpacity > 0 && showResizeHandles && (
        <Group opacity={controlsOpacity}>
          {/* Top-left corner */}
          <Arc
            x={imageProps.x}
            y={imageProps.y}
            innerRadius={8}
            outerRadius={16}
            angle={90}
            rotation={180}
            fill="rgba(122, 77, 255, 0.9)"
            stroke="white"
            strokeWidth={2}
            draggable
            onDragMove={onResizeDrag('tl')}
            onDragEnd={onResizeEnd}
            shadowColor="black"
            shadowOpacity={0.2}
            shadowOffset={{ x: 0, y: 2 }}
            shadowBlur={4}
            hitStrokeWidth={20}
          />
          
          {/* Top-right corner */}
          <Arc
            x={imageProps.x + imageProps.width}
            y={imageProps.y}
            innerRadius={8}
            outerRadius={16}
            angle={90}
            rotation={270}
            fill="rgba(122, 77, 255, 0.9)"
            stroke="white"
            strokeWidth={2}
            draggable
            onDragMove={onResizeDrag('tr')}
            onDragEnd={onResizeEnd}
            shadowColor="black"
            shadowOpacity={0.2}
            shadowOffset={{ x: 0, y: 2 }}
            shadowBlur={4}
            hitStrokeWidth={20}
          />
          
          {/* Bottom-left corner */}
          <Arc
            x={imageProps.x}
            y={imageProps.y + imageProps.height}
            innerRadius={8}
            outerRadius={16}
            angle={90}
            rotation={90}
            fill="rgba(122, 77, 255, 0.9)"
            stroke="white"
            strokeWidth={2}
            draggable
            onDragMove={onResizeDrag('bl')}
            onDragEnd={onResizeEnd}
            shadowColor="black"
            shadowOpacity={0.2}
            shadowOffset={{ x: 0, y: 2 }}
            shadowBlur={4}
            hitStrokeWidth={20}
          />
          
          {/* Bottom-right corner */}
          <Arc
            x={imageProps.x + imageProps.width}
            y={imageProps.y + imageProps.height}
            innerRadius={8}
            outerRadius={16}
            angle={90}
            rotation={0}
            fill="rgba(122, 77, 255, 0.9)"
            stroke="white"
            strokeWidth={2}
            draggable
            onDragMove={onResizeDrag('br')}
            onDragEnd={onResizeEnd}
            shadowColor="black"
            shadowOpacity={0.2}
            shadowOffset={{ x: 0, y: 2 }}
            shadowBlur={4}
            hitStrokeWidth={20}
          />
        </Group>
      )}
    </>
  )
}