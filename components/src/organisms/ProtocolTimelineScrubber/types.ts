import type {
  CompletedProtocolAnalysis,
  Liquid,
  LoadedLabware,
  LoadedModule,
  LoadedPipette,
  ModuleModel,
  RunCommandError,
  RunTimeCommand,
  RunTimeParameter,
} from '@opentrons/shared-data'

export type CommandTextData = Pick<
  CompletedProtocolAnalysis,
  'pipettes' | 'labware' | 'modules' | 'liquids' | 'commands'
>
