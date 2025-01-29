import '../support/commands'
import {
  MixActions,
  MixVerifications,
  runMixSetup,
} from '../support/mixSetting'
import { UniversalActions } from '../support/universalActions'
import { TestFilePath, getTestFile } from '../support/testFiles'
import {
  verifyImportProtocolPage,
} from '../support/import'
import { runSteps } from '../support/StepExecution'
import type { StepsList } from '../support/StepExecution'

describe('Redesigned Mixing Steps - Happy Path', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.closeAnalyticsModal()
    const protocol = getTestFile(TestFilePath.DoItAllV8)
    cy.importProtocol(protocol.path)
    verifyImportProtocolPage(protocol)
    
    // NOTE: vv make this chunk better//
    cy.contains("Edit protocol").click()
    cy.contains("Protocol steps").click()
    cy.get('[id="AddStepButton"]').contains("Add Step").click()
    cy.verifyOverflowBtn()
  });


  it('It should verify the working function of every permutation of mix checkboxes', () => {
    const steps: Array<MixActions | MixVerifications | UniversalActions> = [
      MixActions.SelectMix,
      UniversalActions.Snapshot,
      MixVerifications.PartOne,
      MixActions.SelectLabware,
      MixActions.SelectWellInputField,
      MixVerifications.WellSelectPopout,
      UniversalActions.Snapshot,
      MixActions.Save,
      MixActions.EnterVolume,
      MixActions.EnterMixReps,
      MixActions.SelectTipHandling,
      UniversalActions.Snapshot,
      MixActions.Continue,
      MixVerifications.PartTwoAsp,
      MixActions.AspirateFlowRate,
      MixActions.AspWellOrder,
      MixVerifications.AspWellOrder,
      // Actions.Delay,
      // Actions.Back,
      // UniversalActions.Snapshot,
      // Verifications.AdvancedAspSettings,
      // Actions.Dispense,
      // Verifications.PartTwoDisp,

    ]

    runMixSetup(steps)
    // cy.contains('Primary order').closest('div')
  });
});

/*
NEED TO ADD RENAME
*/