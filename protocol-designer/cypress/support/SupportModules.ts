import 'cypress-file-upload'
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
  DecativeTempDeck = 'Deactivate',
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

export const executeModSteps = (action: ModActions): void => {
  switch (action) {
    case ModActions.Done:
      cy.get(ModLocators.DoneButtonLabwareSelection)
        .contains('Done')
        .click({ force: true })
      break
    case ModActions.AddTemperatureStep:
      cy.contains('button', 'Temperature').click()
      break
    case ModActions.ActivateTempdeck:
      cy.contains(ModContent.DecativeTempDeck)
        .closest(ModLocators.Div)
        .find(ModLocators.Button)
        .click()
      break
    case ModActions.InputTempDeck4:
      cy.get(ModLocators.TempdeckTempInput).type('4')
      break
    case ModActions.InputTempDeck95:
      cy.get(ModLocators.TempdeckTempInput).type('95')
      break
    case ModActions.InputTempDeck100:
      cy.get(ModLocators.TempdeckTempInput).type('100')
      break
    case ModActions.ExitTempdeckCommand:
      break
    case ModActions.PauseAfterSettingTempdeck:
      cy.contains(ModLocators.Button, 'Pause protocol')
        .should('exist')
        .and('be.visible')
        .click()
      break
    case ModActions.SaveButtonTempdeck:
      cy.contains(ModContent.Save).click()
      break
    default:
      throw new Error(`Unrecognized action: ${action as string}`)
  }
}

export const executeVerifyModStep = (verification: ModVerifications): void => {
  switch (verification) {
    case ModVerifications.TempeDeckInitialForm:
      cy.contains(ModContent.ModState)
      cy.contains(ModContent.DecativeTempDeck)
      cy.contains(ModContent.Temperature)
      break
    case ModVerifications.Temp4CPauseTextVerification:
      // This takes place
      cy.contains('div', 'Pausing until')
        .should('contain', 'Temperature Module GEN2')
        .and('contain', 'reaches')
        .find('[data-testid="Tag_default"]')
        .should('contain', '4°C')
      break
  }
}
