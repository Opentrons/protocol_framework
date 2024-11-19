import 'cypress-file-upload'
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      getByTestId: (testId: string) => Cypress.Chainable<JQuery<HTMLElement>>
      getByAriaLabel: (value: string) => Cypress.Chainable<JQuery<HTMLElement>>
      verifyHeader: () => Cypress.Chainable<void>
      verifyFullHeader: () => Cypress.Chainable<void>
      verifyCreateNewHeader: () => Cypress.Chainable<void>
      clickCreateNew: () => Cypress.Chainable<void>
      closeAnnouncementModal: () => Cypress.Chainable<void>
      verifyHomePage: () => Cypress.Chainable<void>
      importProtocol: (protocolFile: string) => Cypress.Chainable<void>
      verifyImportPageOldProtocol: () => Cypress.Chainable<void>
      openFilePage: () => Cypress.Chainable<void>
      choosePipettes: (
        left_pipette_selector: string,
        right_pipette_selector: string
      ) => Cypress.Chainable<void>
      selectTipRacks: (left: string, right: string) => Cypress.Chainable<void>
      addLiquid: (
        liquidName: string,
        liquidDesc: string,
        serializeLiquid?: boolean
      ) => Cypress.Chainable<void>
      openDesignPage: () => Cypress.Chainable<void>
      addStep: (stepName: string) => Cypress.Chainable<void>
      openSettingsPage: () => Cypress.Chainable<void>
      verifySettingsPage: () => Cypress.Chainable<void>
      verifyCreateNewPage: () => Cypress.Chainable<void>
      togglePreWetTip: () => Cypress.Chainable<void>
      mixaspirate: () => Cypress.Chainable<void>
    }
  }
}

// Only Header, Home, and Settings page actions are here
// due to their simplicity
// Create and Import page actions are in their respective files

export const content = {
  siteTitle: 'Opentrons Protocol Designer',
  opentrons: 'Opentrons',
  charSet: 'UTF-8',
  header: 'Protocol Designer',
  welcome: 'Welcome to Protocol Designer!',
  appSettings: 'App settings',
  privacy: 'Privacy',
  shareSessions: 'Share sessions with Opentrons',
}

export const locators = {
  import: 'Import',
  createNew: 'Create new',
  createProtocol: 'Create a protocol',
  editProtocol: 'Edit existing protocol',
  settingsDataTestid: 'SettingsIconButton',
  settings: 'Settings',
  privacyPolicy: 'a[href="https://opentrons.com/privacy-policy"]',
  eula: 'a[href="https://opentrons.com/eula"]',
  privacyToggle: 'Settings_hotKeys',
  analyticsToggleTestId: 'analyticsToggle',
}

// General Custom Commands
Cypress.Commands.add(
  'getByTestId',
  (testId: string): Cypress.Chainable<JQuery<HTMLElement>> => {
    return cy.get(`[data-testid="${testId}"]`)
  }
)

Cypress.Commands.add(
  'getByAriaLabel',
  (value: string): Cypress.Chainable<JQuery<HTMLElement>> => {
    return cy.get(`[aria-label="${value}"]`)
  }
)

// Header Verifications
const verifyUniversal = (): void => {
  cy.title().should('equal', content.siteTitle)
  cy.document().should('have.property', 'charset').and('eq', content.charSet)
  cy.contains(content.opentrons).should('be.visible')
  cy.contains(content.header).should('be.visible')
  cy.contains(locators.import).should('be.visible')
}

Cypress.Commands.add('verifyFullHeader', () => {
  verifyUniversal()
  cy.contains(locators.createNew).should('be.visible')
  cy.getByTestId(locators.settingsDataTestid).should('be.visible')
})

Cypress.Commands.add('verifyCreateNewHeader', () => {
  verifyUniversal()
})

// Home Page
Cypress.Commands.add('verifyHomePage', () => {
  cy.contains(content.welcome)
  cy.contains('button', locators.createProtocol).should('be.visible')
  cy.contains('label', locators.editProtocol).should('be.visible')
  cy.getByTestId(locators.settingsDataTestid).should('be.visible')
  cy.get(locators.privacyPolicy).should('exist').and('be.visible')
  cy.get(locators.eula).should('exist').and('be.visible')
})

Cypress.Commands.add('clickCreateNew', () => {
  cy.contains(locators.createProtocol).click()
})

// Header Import
Cypress.Commands.add('importProtocol', (protocolFilePath: string) => {
  cy.contains(locators.import).click()
  cy.get('[data-cy="landing-page"]')
    .find('input[type=file]')
    .selectFile(protocolFilePath, { force: true })
})

// Settings Page Actions
Cypress.Commands.add('openSettingsPage', () => {
  cy.getByTestId(locators.settingsDataTestid).click()
})

Cypress.Commands.add('verifySettingsPage', () => {
  cy.verifyFullHeader()
  cy.contains(locators.settings).should('exist').should('be.visible')
  cy.contains(content.appSettings).should('exist').should('be.visible')
  cy.contains(content.privacy).should('exist').should('be.visible')
  cy.contains(content.shareSessions).should('exist').should('be.visible')
  cy.getByAriaLabel(locators.privacyToggle).should('exist').should('be.visible')
  cy.getByTestId(locators.analyticsToggleTestId)
    .should('exist')
    .should('be.visible')
})

/// /////////////////////////////////////////////////////////////////
// Legacy Code Section
// This code is deprecated and should be removed
// as soon as possible once it's no longer needed
// as a reference during test migration.
/// /////////////////////////////////////////////////////////////////

Cypress.Commands.add('closeAnnouncementModal', () => {
  // ComputingSpinner sometimes covers the announcement modal button and prevents the button click
  // this will retry until the ComputingSpinner does not exist
  cy.get('[data-test="ComputingSpinner"]', { timeout: 30000 }).should(
    'not.exist'
  )
  cy.get('button')
    .contains('Got It!')
    .should('be.visible')
    .click({ force: true })
})

//
// File Page Actions
//

Cypress.Commands.add('openFilePage', () => {
  cy.get('button[id="NavTab_file"]').contains('FILE').click()
})

//
// Pipette Page Actions
//

Cypress.Commands.add(
  'choosePipettes',
  (leftPipetteSelector, rightPipetteSelector) => {
    cy.get('[id="PipetteSelect_left"]').click()
    cy.get(leftPipetteSelector).click()
    cy.get('[id="PipetteSelect_right"]').click()
    cy.get(rightPipetteSelector).click()
  }
)

Cypress.Commands.add('selectTipRacks', (left, right) => {
  if (left.length > 0) {
    cy.get("select[name*='left.tiprack']").select(left)
  }
  if (right.length > 0) {
    cy.get("select[name*='right.tiprack']").select(right)
  }
})

//
// Liquid Page Actions
//
Cypress.Commands.add(
  'addLiquid',
  (liquidName, liquidDesc, serializeLiquid = false) => {
    cy.get('button').contains('New Liquid').click()
    cy.get("input[name='name']").type(liquidName)
    cy.get("input[name='description']").type(liquidDesc)
    if (serializeLiquid) {
      // force option used because checkbox is hidden
      cy.get("input[name='serialize']").check({ force: true })
    }
    cy.get('button').contains('save').click()
  }
)

//
// Design Page Actions
//

Cypress.Commands.add('openDesignPage', () => {
  cy.get('button[id="NavTab_design"]').contains('DESIGN').parent().click()
})
Cypress.Commands.add('addStep', stepName => {
  cy.get('button').contains('Add Step').click()
  cy.get('button').contains(stepName, { matchCase: false }).click()
})

// Advance Settings for Transfer Steps

// Pre-wet tip enable/disable
Cypress.Commands.add('togglePreWetTip', () => {
  cy.get('input[name="preWetTip"]').click({ force: true })
})

// Mix settings select/deselect
Cypress.Commands.add('mixaspirate', () => {
  cy.get('input[name="aspirate_mix_checkbox"]').click({ force: true })
})