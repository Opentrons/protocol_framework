import { useState } from 'react'
import type { PipetteMount } from '@opentrons/shared-data'
import type {
  Gen,
  PipetteType,
} from '../../pages/CreateNewProtocolWizard/types'

export function usePipetteConfig() {
  const [page, setPage] = useState<'add' | 'overview'>('overview')
  const [mount, setMount] = useState<PipetteMount>('left')
  const [pipetteType, setPipetteType] = useState<PipetteType | null>(null)
  const [pipetteGen, setPipetteGen] = useState<Gen | 'flex'>('flex')
  const [pipetteVolume, setPipetteVolume] = useState<string | null>(null)
  const [selectedTips, setSelectedTips] = useState<string[]>([])

  const resetFields = (): void => {
    setPipetteType(null)
    setPipetteGen('flex')
    setPipetteVolume(null)
    setSelectedTips([])
  }

  return {
    page,
    setPage,
    mount,
    setMount,
    pipetteType,
    setPipetteType,
    pipetteGen,
    setPipetteGen,
    pipetteVolume,
    setPipetteVolume,
    selectedTips,
    setSelectedTips,
    resetFields,
  }
}
