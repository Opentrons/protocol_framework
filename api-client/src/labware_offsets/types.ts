import type { ModuleModel } from '@opentrons/shared-data'
import type { VectorOffset } from '../runs'

export interface BaseOffsetLocationSequenceComponent {
  kind: string
}

export interface OnLabwareOffsetLocationSequenceComponent
  extends BaseOffsetLocationSequenceComponent {
  kind: 'onLabware'
  labwareUri: string
}

export interface OnModuleOffsetLocationSequenceComponent
  extends BaseOffsetLocationSequenceComponent {
  kind: 'onModule'
  moduleModel: ModuleModel
}

export interface OnAddressableAreaOffsetLocationSequenceComponent
  extends BaseOffsetLocationSequenceComponent {
  kind: 'onAddressableArea'
  addressableAreaName: string
}

// A labware offset location sequence component from the future.
export interface UnknownLabwareOffsetLocationSequenceComponent
  extends BaseOffsetLocationSequenceComponent {
  kind: 'unknown'
  storedKind: string
  primaryValue: string
}

export type LabwareOffsetLocationSequenceComponent =
  | OnLabwareOffsetLocationSequenceComponent
  | OnModuleOffsetLocationSequenceComponent
  | OnAddressableAreaOffsetLocationSequenceComponent
  | UnknownLabwareOffsetLocationSequenceComponent

export interface StoredLabwareOffset {
  id: string
  createdAt: string
  definitionUri: string
  locationSequence: LabwareOffsetLocationSequenceComponent[]
  vector: VectorOffset
}

export interface MultiBodyMeta {
  cursor: number
  totalLength: number
}
