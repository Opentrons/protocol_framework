import { Route, Navigate, Routes, useNavigate } from 'react-router-dom'
import { ErrorBoundary } from 'react-error-boundary'
import { Box } from '@opentrons/components'
import {
  CreateNewProtocolWizard,
  Designer,
  Landing,
  Liquids,
  ProtocolOverview,
  Settings,
} from './pages'
import {
  FileUploadMessagesModal,
  GateModal,
  Kitchen,
  LabwareUploadModal,
  NavigationBar,
} from './organisms'
import { ProtocolDesignerAppFallback } from './resources/ProtocolDesignerAppFallback'

import type { RouteProps } from './types'

const pdRoutes: RouteProps[] = [
  {
    Component: ProtocolOverview,
    name: 'Protocol overview',
    navLinkTo: '/overview',
    path: '/overview',
  },
  {
    Component: Liquids,
    name: 'Liquids',
    navLinkTo: '/liquids',
    path: '/liquids',
  },
  {
    Component: Designer,
    name: 'Edit protocol',
    navLinkTo: '/designer',
    path: '/designer',
  },
  {
    Component: CreateNewProtocolWizard,
    name: 'Create new protocol',
    navLinkTo: '/createNew',
    path: '/createNew',
  },
  {
    Component: Settings,
    name: 'Settings',
    navLinkTo: '/settings',
    path: '/settings',
  },
]

export function ProtocolRoutes(): JSX.Element {
  const landingPage: RouteProps = {
    Component: Landing,
    name: 'Landing',
    navLinkTo: '/',
    path: '/',
  }
  const allRoutes: RouteProps[] = [...pdRoutes, landingPage]
  const showGateModal =
    process.env.NODE_ENV === 'production' || process.env.OT_PD_SHOW_GATE

  const navigate = useNavigate()
  const handleReset = (): void => {
    navigate('/', { replace: true })
  }

  return (
    <ErrorBoundary
      FallbackComponent={ProtocolDesignerAppFallback}
      onReset={handleReset}
    >
      <NavigationBar />
      <Kitchen>
        <Box width="100%">
          {showGateModal ? <GateModal /> : null}
          <LabwareUploadModal />
          <FileUploadMessagesModal />
          <Routes>
            {allRoutes.map(({ Component, path }: RouteProps) => {
              return <Route key={path} path={path} element={<Component />} />
            })}
            <Route path="*" element={<Navigate to={landingPage.path} />} />
          </Routes>
        </Box>
      </Kitchen>
    </ErrorBoundary>
  )
}
