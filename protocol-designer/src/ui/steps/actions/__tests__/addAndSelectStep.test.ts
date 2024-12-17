import { describe, expect, it, vi, beforeEach } from 'vitest'
import { addAndSelectStep } from '../thunks'
import { PRESAVED_STEP_ID } from '../../../../steplist/types'
import { addHint } from '../../../../tutorial/actions'
import { selectors as labwareIngredSelectors } from '../../../../labware-ingred/selectors'
import * as fileDataSelectors from '../../../../file-data/selectors'
import { getInitialDeckSetup } from '../../../../step-forms/selectors'
import type { StepType } from '../../../../form-types'

vi.mock('../../../../tutorial/actions')
vi.mock('../../../../ui/modules/selectors')
vi.mock('../../../../labware-ingred/selectors')
vi.mock('../../../../file-data/selectors')
vi.mock('../../../../step-forms/selectors')
const dispatch = vi.fn()
const getState = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(addHint).mockReturnValue('addHintReturnValue' as any)
  vi.mocked(labwareIngredSelectors.getDeckHasLiquid).mockReturnValue(true)
  vi.mocked(fileDataSelectors.getRobotStateTimeline).mockReturnValue(
    'mockGetRobotStateTimelineValue' as any
  )
  vi.mocked(getInitialDeckSetup).mockReturnValue({
    modules: {},
    labware: {},
    pipettes: {},
    additionalEquipmentOnDeck: {},
  })
})
describe('addAndSelectStep', () => {
  it('should dispatch addStep thunk, and no hints when no hints are applicable (eg pause step)', () => {
    const stepType: StepType = 'pause'
    const payload = {
      stepType,
    }
    addAndSelectStep(payload)(dispatch, getState)
    expect(dispatch.mock.calls).toEqual([
      [
        {
          type: 'ADD_STEP',
          payload: {
            id: PRESAVED_STEP_ID,
            stepType: 'pause',
          },
          meta: {
            robotStateTimeline: 'mockGetRobotStateTimelineValue',
          },
        },
      ],
    ])
  })
  it('should dispatch a thermocycler selected action if the step type is thermocycler', () => {
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      modules: {
        modId: {
          type: 'thermocyclerModuleType',
          id: 'modId',
          slot: 'B2',
          model: 'thermocyclerModuleV1',
          moduleState: {} as any,
        },
      },
      labware: {},
      pipettes: {},
      additionalEquipmentOnDeck: {},
    })
    const stepType: StepType = 'thermocycler'
    const payload = {
      stepType,
    }
    addAndSelectStep(payload)(dispatch, getState)
    expect(dispatch.mock.calls).toEqual([
      [
        {
          type: 'ADD_STEP',
          payload: {
            id: PRESAVED_STEP_ID,
            stepType: 'thermocycler',
          },
          meta: {
            robotStateTimeline: 'mockGetRobotStateTimelineValue',
          },
        },
      ],
      [
        {
          type: 'SELECT_DROPDOWN_ITEM',
          payload: {
            selection: { id: 'modId', text: 'Selected', field: '1' },
            mode: 'add',
          },
        },
      ],
    ])
  })
})
