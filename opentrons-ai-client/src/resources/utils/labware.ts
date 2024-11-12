import {
  LABWAREV2_DO_NOT_LIST,
  RETIRED_LABWARE,
  getAllDefinitions as _getAllDefinitions,
} from '@opentrons/shared-data'
import type { LabwareDefByDefURI } from '@opentrons/shared-data'

let _definitions: LabwareDefByDefURI | null = null
export function getAllDefinitions(): LabwareDefByDefURI {
  if (_definitions == null) {
    _definitions = _getAllDefinitions([
      ...RETIRED_LABWARE,
      ...LABWAREV2_DO_NOT_LIST,
    ])
  }
  return _definitions
}
