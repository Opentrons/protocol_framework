import '../support/commands.ts'; // Importing the custom commands file
import {
  Actions,
  selectMix,
  Verifications,
  verifyMixSetup,
  runMixSetup,
  Locators,
  // selectWells
} from '../support/mixSetting'
import { UniversalActions } from '../support/universalActions'
import { TestFilePath, getTestFile } from '../support/testFiles'
import {
  // verifyOldProtocolModal,
  verifyImportProtocolPage,
} from '../support/import'

describe('Redesigned Mixing Steps - Happy Path', () => {
  beforeEach(() => {
    cy.visit('/')
    const protocol = getTestFile(TestFilePath.DoItAllV8)
    cy.importProtocol(protocol.path)
    verifyImportProtocolPage(protocol)

    // NOTE: vv make this chunk better//
    cy.contains("Edit protocol").click()
    cy.contains("Protocol steps").click()
    cy.get('[id="AddStepButton"]').contains("+ Add Step").click()
    cy.verifyOverflowBtn()
    selectMix()
    verifyMixSetup()
  });


  it('It should verify the working function of every permutation of mix checkboxes', () => {
    const steps: Array<Actions | Verifications | UniversalActions> = [
      Actions.SelectLabware,
      Actions.SelectWells,
      
    ]

    runMixSetup(steps)
    // selectWells(1)
  });
});

/*
-make selector for confirming that the protocol was made on an older version << doesn't pop up
-edit protocol -DONE
-select protocol steps -DONE
-click add step -DONE
-validate move, transfer, mix, pause, and any modules are available options -DONE
-select mix
-validate step number followed by mix
-Side Panel Appears on the right
-check that it contains:
  -Part 1/2
  -Pipette
    -Textbox with selected pipette
  -Tip rack
    -dropdown with appropriate list of tip rack options
  -Labware
    -dropdown of all labware
  -Choose wells - click
    -pop up modal with grid of wells
    -click and drag to highlight all
      -after selection, the number should update
    -click to deselect single well
      -after selection, the number should update
    -click to reselect single well
    -after selection, the number should update
    -Volume per well to mix
      enter some number
    -Tip handling
      -check dropdown
    -Tip drop location
      -will display option with respect to deck configs

*/