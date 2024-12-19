import { useState, useRef, useCallback, useEffect } from 'react'
import styled from 'styled-components'
import {
  Box,
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
} from '@opentrons/components'
import { TimelineToolbox } from './Timeline/TimelineToolbox'

const INITIAL_SIDEBAR_WIDTH = 276
const MIN_SIDEBAR_WIDTH = 80
const MAX_SIDEBAR_WIDTH = 350

interface DraggableSidebarProps {
  setTargetWidth: (width: number) => void
}

export function DraggableSidebar({
  setTargetWidth,
}: DraggableSidebarProps): JSX.Element {
  const sidebarRef = useRef<HTMLDivElement>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(INITIAL_SIDEBAR_WIDTH)

  const startResizing = useCallback(() => {
    setIsResizing(true)
  }, [])

  const stopResizing = useCallback(() => {
    setIsResizing(false)
  }, [])

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing && sidebarRef.current != null) {
        const newWidth =
          mouseMoveEvent.clientX -
          sidebarRef.current.getBoundingClientRect().left

        if (newWidth >= MIN_SIDEBAR_WIDTH && newWidth <= MAX_SIDEBAR_WIDTH) {
          setSidebarWidth(newWidth)
          setTargetWidth(newWidth)
        }
      }
    },
    [isResizing, setTargetWidth]
  )

  useEffect(() => {
    window.addEventListener('mousemove', resize)
    window.addEventListener('mouseup', stopResizing)

    return () => {
      window.removeEventListener('mousemove', resize)
      window.removeEventListener('mouseup', stopResizing)
    }
  }, [resize, stopResizing])

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      height="100%"
    >
      <SidebarContainer ref={sidebarRef} resizedWidth={sidebarWidth}>
        <SidebarContent>
          <TimelineToolbox sidebarWidth={sidebarWidth} />
        </SidebarContent>
        <SidebarResizer dragging={isResizing} onMouseDown={startResizing} />
      </SidebarContainer>
    </Flex>
  )
}

const SidebarContainer = styled(Box)`
  display: ${DISPLAY_FLEX};
  flex-direction: ${DIRECTION_COLUMN};
  border-right: 1px solid #ccc;
  position: relative;
  /* overflow: hidden; */
  height: 100%;
`

const SidebarContent = styled(Flex)`
  flex: 1;
`

interface SidebarResizerProps {
  dragging: boolean
}

const SidebarResizer = styled(Flex)<SidebarResizerProps>`
  user-select: none;
  width: 0.3125rem;
  cursor: ew-resize;
  background-color: #ddd;
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  margin: 0;
  padding: 0;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: blue; /* Hover state */
  }

  ${props =>
    props.dragging === true &&
    `
    background-color: darkblue; /* Dragging state */
  `}
`
