import { DndProvider } from 'react-dnd'
import { HashRouter } from 'react-router-dom'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { useSelector } from 'react-redux'
import {
  Box,
  DIRECTION_COLUMN,
  Flex,
  OVERFLOW_AUTO,
} from '@opentrons/components'
import { ProtocolRoutes } from './ProtocolRoutes'
import { PortalRoot } from './organisms'
import { getEnableReactScan } from './feature-flags/selectors'
import { useEffect } from 'react'

export function ProtocolEditor(): JSX.Element {
  useEffect(() => {
    fetch('http://10.14.19.57:31950/health')
      .then(response => {
        console.log(response)
      })
      .catch(error => {
        console.log(error)
      })
  }, [])
  // note for react-scan
  const enableReactScan = useSelector(getEnableReactScan)
  // Dynamically import `react-scan` to avoid build errors
  if (typeof window !== 'undefined' && enableReactScan) {
    import('react-scan')
      .then(({ scan }) => {
        scan({
          enabled: enableReactScan,
          log: true,
        })
      })
      .catch(error => {
        console.error('Failed to load react-scan:', error)
      })
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <Box
        width="100%"
        height="100vh"
        overflow={OVERFLOW_AUTO}
        id="protocol-editor"
      >
        <PortalRoot />
        <Flex flexDirection={DIRECTION_COLUMN}>
          <HashRouter>
            <ProtocolRoutes />
          </HashRouter>
        </Flex>
      </Box>
    </DndProvider>
  )
}
