declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      chooseDeckSlot: (slot: string) => Cypress.Chainable<void>
    }
  }
}
export enum ModActions {
  Done = 'Select Done on a step form',
  AddTemperatureStep = 'Selects Temperature Module step',
  ActivateTempdeck = 'Activates Temperature Module when you first use it',
  InputTempDeck4 = 'Inputs 4C into tempdeck',
  InputTempDeck95 = 'Inputs 96C into tempdeck',
  InputTempDeck100 = 'Inputs 100C into tempdeck. Expect an error then exit',
  ExitTempdeckCommand = 'Exits a tempdeck command',
  PauseAfterSettingTempdeck = 'Allows you to puase protocol until reached',
  SaveButtonTempdeck = 'Saves a temperature set',
}

export enum ModVerifications {
  TempeDeckInitialForm = 'Verify that the tempdeck stepform opens correctly',
  Temp4CPauseTextVerification = 'Verify that the pause step has the right information in step preview',
}
export enum ModContent {
  ModState = 'Module state',
  DeactivateTempDeck = 'Deactivate',
  Temperature = 'Temperature',
  Save = 'Save',
  Temp4CVerification = `Build a pause step to wait until Temperature Module GEN2 reaches 4˚C`,
}

export enum ModLocators {
  DoneButtonLabwareSelection = '[data-testid="Toolbox_confirmButton"]',
  Div = 'div',
  Button = 'button',
  TempdeckTempInput = 'input[name="targetTemperature"]',
}

export const modStepHandlers = {
  [ModActions.Done]: {
    handler: (): void => {
      cy.get(ModLocators.DoneButtonLabwareSelection)
        .contains('Done')
        .click({ force: true })
    },
    paramType: undefined,
  },
  [ModActions.AddTemperatureStep]: {
    handler: (): void => {
      cy.contains('button', 'Temperature').click({ force: true })
    },
    paramType: undefined,
  },
  [ModActions.ActivateTempdeck]: {
    handler: (): void => {
      cy.contains(ModContent.DeactivateTempDeck)
        .closest(ModLocators.Div)
        .find(ModLocators.Button)
        .click()
    },
    paramType: undefined,
  },
  [ModActions.InputTempDeck4]: {
    handler: (): void => {
      cy.get(ModLocators.TempdeckTempInput).type('4')
    },
    paramType: undefined,
  },
  [ModActions.InputTempDeck95]: {
    handler: (): void => {
      cy.get(ModLocators.TempdeckTempInput).type('95')
    },
    paramType: undefined,
  },
  [ModActions.InputTempDeck100]: {
    handler: (): void => {
      cy.get(ModLocators.TempdeckTempInput).type('100')
    },
    paramType: undefined,
  },
  [ModActions.ExitTempdeckCommand]: {
    handler: (): void => {
      // No operation required
    },
    paramType: undefined,
  },
  [ModActions.PauseAfterSettingTempdeck]: {
    handler: (): void => {
      cy.contains(ModLocators.Button, 'Pause protocol')
        .should('exist')
        .and('be.visible')
        .click()
    },
    paramType: undefined,
  },
  [ModActions.SaveButtonTempdeck]: {
    handler: (): void => {
      cy.contains(ModContent.Save).click({ force: true })
    },
    paramType: undefined,
  },
} as const

export const modVerificationHandlers = {
  [ModVerifications.TempeDeckInitialForm]: {
    handler: (): void => {
      cy.contains(ModContent.ModState)
      cy.contains(ModContent.DeactivateTempDeck)
      cy.contains(ModContent.Temperature)
    },
    paramType: undefined,
  },
  [ModVerifications.Temp4CPauseTextVerification]: {
    handler: (): void => {
      cy.contains('div', 'Pausing until')
        .should('contain', 'Temperature Module GEN2')
        .and('contain', 'reaches')
        .find('[data-testid="Tag_default"]')
        .should('contain', '4°C')
    },
    paramType: undefined,
  },
} as const
