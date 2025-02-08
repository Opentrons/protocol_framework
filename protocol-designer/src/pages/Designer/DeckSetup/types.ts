import type { Dispatch, SetStateAction } from 'react'
import type { CoordinateTuple } from '@opentrons/shared-data'
import type { DeckSetupTabType } from '../types'

export interface SharedControlsType extends DeckSetupTabType {
  slotPosition: CoordinateTuple | null
  //  this is either the slotId or offDeck labwareId
  itemId: string
  hover: string | null
  setHover: Dispatch<SetStateAction<string | null>>
  setShowMenuListForId: Dispatch<SetStateAction<string | null>>
  isSelected: boolean
}
