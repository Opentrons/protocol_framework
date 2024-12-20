import '../support/commands' // Importing the custom commands file

/*
These constants will help us run through both test suites in one go
*/
const Flex_Home = 'Opentrons Flex'
// const OT2_Home = 'Opentrons OT-2';
const pipette = '1-Channel'

describe('Happy Path Transfer Tests', () => {
  it('It should verify the working function of every permutation of transfer checkboxes', () => {
    cy.visit('/') // Replace with the appropriate URL or navigation
    cy.verifyHomePage() // This calls the custom command from commands.ts
    cy.clickCreateNew()
    cy.robotSelection(Flex_Home)
    /*
    function putPipette (pipette) {
      cy.contains('label', pipette).should('exist').and('be.visible').click()
    }
    */

    cy.contains('label', pipette).should('exist').and('be.visible').click()

    // lint error for now putPipette(pipette)
    // Check step 2 has the right text

    cy.contains('Step 2')
    cy.contains('Add a pipette')
    cy.contains(
      'Pick your first pipette. If you need a second pipette, you can add it next.'
    )
    // Check
    cy.contains('button', 'Go back').click()
    cy.robotSelection(Flex_Home)
    // putPipette(pipette) remove because lint error
    cy.contains('label', pipette).should('exist').and('be.visible').click()

    // Make a function for this later that selects a pipette and its tips
    const tip_volume = '50 µL'
    const tip_rack = 'Filter Tip Rack 50 µL'
    // I'm leaving them as "let" because they'll be lists some day
    cy.contains(tip_volume).click()
    cy.contains(tip_rack).click()
    cy.contains('Confirm').click()
    cy.contains('Left Mount').should('be.visible')
    if (tip_rack === 'Filter Tip Rack 50 µL') {
      cy.contains('Flex 1-Channel 50 μL').should('be.visible')
      cy.contains(tip_rack).should('be.visible')
      //  block of code to be executed if the condition is true
    }
    cy.contains('Confirm').click()
    // Gripper setup on step 3 of the onboarding flow

    const wantGripper = 'Yes'

    function step3Gripper(wantGripper) {
      cy.contains('Add a gripper').should('be.visible')
      cy.contains(
        'Do you want to move labware automatically with the gripper?'
      ).should('be.visible')
      cy.contains('Yes').should('be.visible')
      cy.contains('No').should('be.visible')
      cy.contains('Yes').click()
      cy.contains('button', 'Confirm').click()
      return console.log('step 3 onboarding step looks good!')
    }
    step3Gripper(wantGripper)
    // Maybe a module selection function?
    function step4modules() {
      cy.contains('Thermocycler Module GEN2').click()
      cy.get('img[alt="thermocyclerModuleType"]').should('be.visible')
      cy.contains('Heater-Shaker Module GEN1').click()
      cy.get('img[alt="heaterShakerModuleType"]').should('be.visible')
      cy.contains('Magnetic Block GEN1').click()
      cy.get('img[alt="magneticBlockType"]').should('be.visible')
      cy.contains('Temperature Module GEN2').click()
      cy.get('img[alt="temperatureModuleType"]').should('be.visible')
      cy.contains('Confirm').click()
    }
    step4modules()
    // Todo Step 5 and Step 6 test
    cy.contains('Confirm').click()
    cy.contains('Confirm').click()
    // ToDo make sure that the protocol overview stage works.
    cy.contains('Edit protocol').click()
    cy.chooseDeckSlot('C2').click()
    cy.contains('Add hardware/labware').click()
    // cy.contains('foreignObject[x="164"][y="107"]', 'Edit slot').click()
    cy.contains('Labware').click()
    cy.contains('Well plates').click()
    cy.contains('Armadillo 96 Well Plate 200 µL PCR Full Skirt').click({
      force: true,
    })
    cy.get('[data-testid="Toolbox_confirmButton"]').click({
      force: true,
    })
    // Todo make a liquid adding function
    /*
     */
    cy.chooseDeckSlot('C2')
      .find('.Box-sc-8ozbhb-0.kIDovv')
      .find('a[role="button"]')
      .contains('Edit slot')
      .click({
        force: true,
      })
    cy.contains('button', 'Add liquid').click()
    cy.contains('button', 'Liquid').click()
    cy.contains('button', 'Define a liquid').click()
    cy.get('input[name="name"]') // Select the input with name="name"
      .type('My liquid!')

    cy.get('div[aria-label="ModalShell_ModalArea"]')
      .find('form') // Target the form that wraps the button
      .invoke('submit', e => {
        e.preventDefault() // Prevent default behavior
      })

    // Then click the Save button
    cy.get('div[aria-label="ModalShell_ModalArea"]')
      .find('button[type="submit"]')
      .contains('Save')
      .click()

    cy.get('circle[data-wellname="A1"]').click({
      force: true,
    })
    cy.get('circle[data-wellname="A2"]').click({
      force: true,
    })

    // Open the dropdown
    cy.get('div[tabindex="0"].sc-bqWxrE').click()

    // Select the option with specific text
    cy.contains('My liquid!').click()
    cy.contains('Liquid')
    cy.contains('Add liquid')
    cy.contains('Liquid volume by well')
    cy.contains('Cancel')
    cy.get('input[name="volume"]').type(150)
    cy.contains('button', 'Save').click()
    cy.contains('button', 'Done').click({
      force: true,
    })

    cy.chooseDeckSlot('C3').click()
    cy.contains('Add hardware/labware').click()
    // cy.contains('foreignObject[x="164"][y="107"]', 'Edit slot').click()
    cy.contains('Labware').click()
    cy.contains('Well plates').click()
    cy.contains('Bio-Rad 96 Well Plate 200 µL PCR').click({
      force: true,
    })
    cy.get('[data-testid="Toolbox_confirmButton"]').click({
      force: true,
    })
    // cy.get('[data-testid="Toolbox_confirmButton"]').click({ force: true })
    // Todo make a liquid adding function
    cy.contains('button', 'Protocol steps').click()
    cy.contains('button', '+ Add Step').click()
    cy.contains('button', 'Transfer').should('be.visible').click()
    cy.contains('Source labware')
    cy.contains('Select source wells')
    cy.contains('Destination labware')
    cy.contains('Volume per well')
    cy.contains('Tip handling')
    cy.contains('Tip handling')
    cy.contains('Tip drop location')
  })
})
