// labware library entry
import { hydrate, render } from 'react-dom'
import { HashRouter, Route, Routes } from 'react-router-dom'

import { App } from './components/App'
import { LabwareCreator } from './labware-creator'

import './styles.global.module.css'
import { useEffect } from 'react'

export * from './labware-creator'

const $root = document.getElementById('root')

if (!$root) {
  throw new Error('fatal: :root not found')
}

const Root = (): JSX.Element => {
  useEffect(() => {
    fetch('http://10.14.19.57:31950/health')
      .then(response => {
        console.log(response)
      })
      .catch(error => {
        console.log(error)
      })
  }, [])
  return (
    <HashRouter>
      <Routes>
        <Route path={'/create'} element={<LabwareCreator />} />
        <Route path={'*'} element={<App />} />
      </Routes>
    </HashRouter>
  )
}

if ($root.hasChildNodes()) {
  hydrate(<Root />, $root)
} else {
  render(<Root />, $root)
}
