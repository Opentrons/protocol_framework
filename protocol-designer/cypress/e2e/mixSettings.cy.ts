// TODO: refactor to test with new navigation
// const isMacOSX = Cypress.platform === 'darwin'
// const invalidInput = 'abcdefghijklmnopqrstuvwxyz!@#$%^&*()<>?,-'
// const batchEditClickOptions = { [isMacOSX ? 'metaKey' : 'ctrlKey']: true }

// function importProtocol() {
//   cy.fixture('../../fixtures/protocol/5/mixSettings.json').then(fileContent => {
//     cy.get('input[type=file]').upload({
//       fileContent: JSON.stringify(fileContent),
//       fileName: 'fixture.json',
//       mimeType: 'application/json',
//       encoding: 'utf8',
//     })
//     cy.get('div')
//       .contains(
//         'Your protocol will be automatically updated to the latest version.'
//       )
//       .should('exist')
//     cy.get('button').contains('ok', { matchCase: false }).click()
//     // wait until computation is done before proceeding, with generous timeout
//     cy.get('[data-test="ComputingSpinner"]', { timeout: 30000 }).should(
//       'not.exist'
//     )
//   })
// }

// function openDesignTab() {
//   cy.get('button[id=NavTab_design]').click()
//   cy.get('button').contains('ok').click()

//   // Verify the Design Page
//   cy.get('#TitleBar_main > h1').contains('Multi select banner test protocol')
//   cy.get('#TitleBar_main > h2').contains('STARTING DECK STATE')
//   cy.get('button[id=StepCreationButton]').contains('+ Add Step')
// }

// function enterBatchEdit() {
//   cy.get('[data-test="StepItem_1"]').click(batchEditClickOptions)
//   cy.get('button').contains('exit batch edit').should('exist')
// }

describe('Advanced Settings for Mix Form', () => {
  it('content and step 1 flow works', () => {
    // Visit the base URL defined in Cypress configuration
    cy.visit('/')

    // Add additional commands or assertions here as needed
  })
})
