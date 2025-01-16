import { beforeEach, describe, it, expect, vi } from 'vitest'
import {
  ABSORBANCE_READER_TYPE,
  ABSORBANCE_READER_V1,
} from '@opentrons/shared-data'
import {
  getErrorResult,
  makeContext,
  getInitialRobotStateStandard,
} from '../fixtures'
import { absorbanceReaderCloseLid } from '../commandCreators/atomic/absorbanceReaderCloseLid'
import { absorbanceReaderStateGetter } from '../robotStateSelectors'
import type {
  AbsorbanceReaderState,
  InvariantContext,
  RobotState,
} from '../types'

const moduleId = 'absorbanceReaderId'
vi.mock('../robotStateSelectors')

describe('absorbanceReaderCloseLid', () => {
  let invariantContext: InvariantContext
  let robotState: RobotState
  beforeEach(() => {
    invariantContext = makeContext()
    invariantContext.moduleEntities[moduleId] = {
      id: moduleId,
      type: ABSORBANCE_READER_TYPE,
      model: ABSORBANCE_READER_V1,
    }
    robotState = getInitialRobotStateStandard(invariantContext)
    robotState.modules[moduleId] = {
      slot: 'D3',
      moduleState: {
        type: ABSORBANCE_READER_TYPE,
        initialization: null,
        lidOpen: false,
      },
    }
    vi.mocked(absorbanceReaderStateGetter).mockReturnValue(
      {} as AbsorbanceReaderState
    )
  })
  it.only('creates absorbance reader close lid command', () => {
    const module = moduleId
    const result = absorbanceReaderCloseLid(
      {
        module,
        commandCreatorFnName: 'absorbanceReaderCloseLid',
      },
      invariantContext,
      robotState
    )
    expect(result).toEqual({
      commands: [
        {
          commandType: 'absorbanceReader/closeLid',
          key: expect.any(String),
          params: {
            moduleId: module,
          },
        },
      ],
    })
  })
  it('creates returns error if bad module state', () => {
    const module = moduleId
    vi.mocked(absorbanceReaderStateGetter).mockReturnValue(null)
    const result = absorbanceReaderCloseLid(
      {
        module,
        commandCreatorFnName: 'absorbanceReaderCloseLid',
      },
      invariantContext,
      robotState
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'MISSING_MODULE',
    })
  })
})
