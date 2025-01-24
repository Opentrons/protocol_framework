import '../support/commands'
// ToDo Future planning should have Step 5, Step 6, and 7 verification
// Todo ProtocolOverview page. This might change from deck map revamp,
// so let's hold off until then.
// This PR unblocks Sara and I to work on this separately, so I want
// To prioritize its getting pulled into the repo
// Some day we should make a way to input variables into actions

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
  OnStep1 = 'On Step 1 page.',
  OnStep2 = 'On Step 2 page.',
  OnStep3 = 'on Step 3 page',
  FlexSelected = 'Opentrons Flex selected.',
  OT2Selected = 'Opentrons OT-2 selected.',
  NinetySixChannel = '96-Channel option is available.',
  NotNinetySixChannel = '96-Channel option is not available.',
  StepTwo50uL = 'Step Two part two',
  StepTwoPart3 = 'Step Two part three',
  Step4Verification = 'Step 4 part 1',
  ThermocyclerImg = 'Thermocycler Module GEN2',
  HeaterShakerImg = 'Heater-Shaker Module GEN1',
  Tempdeck2Img = 'Temperature Module GEN2',
  MagBlockImg = 'Magnetic Block GEN1',
  LiquidPage = 'Liquid page content is visible',
  TransferPopOut = 'Verify Step 1 of the transfer function is present',
  TempeDeckInitialForm = 'Verify that the tempdeck stepform opens correctly',
  Temp4CPauseTextVerification = 'Verify that the pause step has the right information in step preview',
}
export enum ModContent {
  Step1Title = 'Step 1',
  Step2Title = 'Step 2',
  Step3Title = 'Step3',
  Step4Title = 'Step4',
  AddPipette = 'Add a pipette',
  NinetySixChannel = '96-Channel',
  SingleChannel = '1-Channel',
  EightChannel = '8-Channel',
  TipRack = 'Filter Tip Rack 50 µL',
  PipetteType = 'Pipette type',
  PipetteVolume = 'Pipette volume',
  FullP50SingleName = 'Flex 1-Channel 50 μL',
  FullP50TiprackName = 'Opentrons Flex 96 Filter Tip Rack 50 µL',
  GoBack = 'Go back',
  Confirm = 'Confirm',
  OpentronsFlex = 'Opentrons Flex',
  OpentronsOT2 = 'Opentrons OT-2',
  LetsGetStarted = 'Let’s start with the basics',
  WhatKindOfRobot = 'What kind of robot do you have?',
  Volume50 = '50 µL',
  Volume1000 = '1000 µL',
  FilterTiprack50 = 'Filter Tip Rack 50 µL',
  Tiprack50 = 'Tip Rack 50 µL',
  Yes = 'Yes',
  No = 'No',
  Thermocycler = 'Thermocycler Module GEN2',
  HeaterShaker = 'Heater-Shaker Module GEN1',
  Tempdeck2 = 'Temperature Module GEN2',
  MagBlock = 'Magnetic Block GEN1',
  ModulePageH = 'Add your modules',
  ModulePageB = 'Select modules to use in your protocol.',
  EditProtocol = 'Edit protocol',
  EditSlot = 'Edit slot',
  AddLabwareToDeck = 'Add hardware/labware',
  EditHardwareLabwareOnDeck = 'Edit hardware/labware',
  LabwareH = 'Labware',
  WellPlatesCat = 'Well plates',
  Armadillo96WellPlate200uL = 'Armadillo 96 Well Plate 200 µL PCR Full Skirt',
  Biorad96WellPlate200uL = 'Bio-Rad 96 Well Plate 200 µL PCR',
  AddLiquid = 'Add liquid',
  DefineALiquid = 'Define a liquid',
  LiquidButton = 'Liquid',
  SampleLiquidName = 'My liquid!',
  ProtocolSteps = 'Protocol steps',
  AddStep = 'Add Step',
  NestDeepWell = 'NEST 96 Deep Well Plate 2mL',
  ModState = 'Module state',
  DecativeTempDeck = 'Deactivate',
  Temperature = 'Temperature',
  Save = 'Save',
  Temp4CVerification = `Build a pause step to wait until Temperature Module GEN2 reaches 4˚C`,
}

export enum ModLocators {
  Confirm = 'button:contains("Confirm")',
  GoBack = 'button:contains("Go back")',
  Step1Indicator = 'p:contains("Step 1")',
  Step2Indicator = 'p:contains("Step 2")',
  FlexOption = 'button:contains("Opentrons Flex")',
  OT2Option = 'button:contains("Opentrons OT-2")',
  NinetySixChannel = 'div:contains("96-Channel")',
  ThermocyclerImage = 'img[alt="temperatureModuleType"]',
  MagblockImage = 'img[alt="magneticBlockType"]',
  HeaterShakerImage = 'img[alt="heaterShakerModuleType"]',
  TemperatureModuleImage = 'img[alt="temperatureModuleType"]',
  LiquidNameInput = 'input[name="name"]',
  ModalShellArea = 'div[aria-label="ModalShell_ModalArea"]',
  SaveButton = 'button[type="submit"]',
  LiquidsDropdown = 'div[tabindex="0"].sc-bqWxrE', // Add new locator for the dropdown
  LabwareSelectionLocation = '[data-testid="Toolbox_confirmButton"]',
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
