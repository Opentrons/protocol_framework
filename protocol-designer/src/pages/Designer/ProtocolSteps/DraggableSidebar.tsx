import { useState, useRef, useCallback, useEffect } from 'react'
import styled from 'styled-components'
import { DIRECTION_COLUMN, DISPLAY_FLEX, Flex } from '@opentrons/components'
import { TimelineToolbox } from './Timeline/TimelineToolbox'

const INITIAL_SIDEBAR_WIDTH = 350
const MIN_SIDEBAR_WIDTH = 80
const MAX_SIDEBAR_WIDTH = 350

export function DraggableSidebar(): JSX.Element {
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
        }
      }
    },
    [isResizing]
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
    <SidebarContainer ref={sidebarRef} width={sidebarWidth}>
      <SidebarContent>
        <TimelineToolbox sidebarWidth={sidebarWidth} />
      </SidebarContent>
      <SidebarResizer dragging={isResizing} onMouseDown={startResizing} />
    </SidebarContainer>
  )
}

const SidebarContainer = styled(Flex)<{ width: number }>`
  display: ${DISPLAY_FLEX};
  flex-direction: ${DIRECTION_COLUMN};
  background-color: #f4f4f4;
  border-right: 1px solid #ccc;
  position: relative;
  width: ${props => props.width}px;
  /* width: 100%; */
  overflow: hidden;
`

const SidebarContent = styled(Flex)`
  flex: 1;
`

const SidebarResizer = styled(Flex)<{ dragging: boolean }>`
  width: 0.3125rem;
  cursor: ew-resize;
  background-color: #ddd;
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
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
