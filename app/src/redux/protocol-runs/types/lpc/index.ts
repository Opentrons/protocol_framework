import type {
  DeckConfiguration,
  ModuleModel,
  LabwareDefinition2,
  CompletedProtocolAnalysis,
} from '@opentrons/shared-data'
import type { VectorOffset } from '@opentrons/api-client'
import type { LPC_STEP } from '/app/redux/protocol-runs'

type LabwareURI = string
type LabwareId = string

export * from './actions'
export type LPCStep = keyof typeof LPC_STEP

export type LPCFlowType = 'default' | 'location-specific'
export type LPCOffsetKind = 'default' | 'location-specific' | 'hardcoded'
export type HandleLwSubstep =
  | 'handle-lw/list'
  | 'handle-lw/details'
  | 'handle-lw/edit-offset/prepare-labware'
  | 'handle-lw/edit-offset/check-labware'
export type LPCSubstep = HandleLwSubstep

export interface StepInfo {
  currentStepIndex: number
  totalStepCount: number
  all: LPCStep[]
  /* The last step idx in the user's routing history - not necessarily the previous step idx. */
  lastStepIndices: number[] | null
  /* Certain steps utilize substeps. These substeps shouldn't impact state the same way as steps,
   * so they are treated differently. */
  currentSubstep: HandleLwSubstep | null
}

export interface ExistingOffset {
  createdAt: string
  vector: VectorOffset
}

interface WorkingBaseOffset {
  initialPosition: VectorOffset | null
  finalPosition: VectorOffset | null
  confirmedVector: VectorOffset | 'RESET_TO_DEFAULT' | null
}

export interface WorkingDefaultOffset extends WorkingBaseOffset {
  confirmedVector: VectorOffset | null
}

export interface WorkingLocationSpecificOffset extends WorkingBaseOffset {}

export type WorkingOffset = WorkingDefaultOffset | WorkingLocationSpecificOffset

export type OffsetLocationDetails =
  | LPCLabwareOffsetDefaultDetails
  | LPCLabwareOffsetLocationSpecificDetails

interface LPCLabwareOffsetDetails {
  kind: LPCOffsetKind
  labwareId: string
  definitionUri: string
  moduleModel?: ModuleModel
  moduleId?: string
  adapterId?: string
}

export interface LPCLabwareOffsetDefaultDetails
  extends LPCLabwareOffsetDetails {
  slotName: 'C2' // Always use slot C2 for calculating the default offset.
  kind: 'default'
}

export interface LPCLabwareOffsetLocationSpecificDetails
  extends LPCLabwareOffsetDetails {
  slotName: string
  kind: 'location-specific'
}

interface BaseOffsetDetails {
  existingOffset: ExistingOffset | null
  /* An offset locally configured but not yet sent to the server. */
  workingOffset: WorkingOffset | null
  locationDetails: OffsetLocationDetails
}

export interface LocationSpecificOffsetDetails extends BaseOffsetDetails {
  locationDetails: LPCLabwareOffsetLocationSpecificDetails
  workingOffset: WorkingLocationSpecificOffset | null
}

export interface DefaultOffsetDetails extends BaseOffsetDetails {
  locationDetails: LPCLabwareOffsetDefaultDetails
  workingOffset: WorkingDefaultOffset | null
}

export interface LabwareDetails {
  id: LabwareId
  displayName: string
  defaultOffsetDetails: DefaultOffsetDetails
  locationSpecificOffsetDetails: LocationSpecificOffsetDetails[]
}

export interface PositionParams {
  labwareUri: string
  location: OffsetLocationDetails
  position: VectorOffset
}

export interface SelectedLabwareWithOffsetInfo {
  uri: LabwareURI
  id: LabwareId
  /* Indicates the type of LPC offset flow the user is performing, a "default" flow, a "location-specific" flow, or no active flow.
   * There is no `slotName` when a user performs the default offset flow.
   * Until the user is in a default or location-specific offset flow, there are no location details. */
  offsetLocationDetails: OffsetLocationDetails | null
}

export interface LPCLabwareInfo {
  selectedLabware: SelectedLabwareWithOffsetInfo | null
  labware: Record<LabwareURI, LabwareDetails>
}

export interface LPCWizardState {
  steps: StepInfo
  activePipetteId: string
  labwareInfo: LPCLabwareInfo
  protocolData: CompletedProtocolAnalysis
  labwareDefs: LabwareDefinition2[]
  deckConfig: DeckConfiguration
  protocolName: string
  maintenanceRunId: string
}
