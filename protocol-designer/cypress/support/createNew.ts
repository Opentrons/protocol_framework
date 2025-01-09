import { executeUniversalAction, UniversalActions } from './universalActions'
import { isEnumValue } from './utils'
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
export enum Actions {
  SelectFlex = 'Select Opentrons Flex',
  SelectOT2 = 'Select Opentrons OT-2',
  Confirm = 'Confirm',
  GoBack = 'Go back',
  SingleChannelPipette50 = 'Select 50uL Single-Channel Pipette',
  YesGripper = 'Select Yes to gripper',
  NoGripper = 'Select no to gripper',
  AddThermocycler = 'Thermocycler Module GEN2',
  AddHeaterShaker = 'Heater-Shaker Module GEN1',
  AddTempdeck2 = 'Temperature Module GEN2',
  AddMagBlock = 'Magnetic Block GEN1',
  EditProtocolA = 'Blue button edit protocol',
  choseDeckSlot = 'Chose each deck slot',
  ChoseDeckSlotA1 = 'Choose deck slot A1',
  ChoseDeckSlotA2 = 'Choose deck slot A2',
  ChoseDeckSlotA3 = 'Choose deck slot A3',
  ChoseDeckSlotB1 = 'Choose deck slot B1',
  ChoseDeckSlotB2 = 'Choose deck slot B2',
  ChoseDeckSlotB3 = 'Choose deck slot B3',
  ChoseDeckSlotC1 = 'Choose deck slot C1',
  ChoseDeckSlotC2 = 'Choose deck slot C2',
  ChoseDeckSlotC2Labware = 'Chose labware on deck slot C2',
  ChoseDeckSlotC3 = 'Choose deck slot C3',
  ChoseDeckSlotD1 = 'Choose deck slot D1',
  ChoseDeckSlotD2 = 'Choose deck slot D2',
  ChoseDeckSlotD3 = 'Choose deck slot D3',
  AddHardwareLabware = 'Adds labware to deck slot by chose deck slot',
  ClickLabwareHeader = 'Click Labware',
  ClickWellPlatesSection = 'Click Well plates',
  SelectArmadillo96WellPlate = 'Select Armadillo 96 Well Plate',
  SelectBioRad96WellPlate = 'Select Bio-Rad 96 Well Plate',
  AddLiquid = 'Add liquid',
  DefineLiquid = 'Define a liquid',
  ClickLiquidButton = 'Click Liquid button',
  LiquidSaveWIP = 'Save liquid, is functional but could use a refactor',
  WellSelector = 'Select wells with strings A1, A2, etc. comman separated LIST',
  LiquidDropdown = 'Dropdown for liquids when adding to well',
  SelectLiquidWells = 'Select Liquid Wells',
  SetVolumeAndSaveforWells = 'Set volume and save for wells',
  ProtocolStepsH = 'Select Protocol Steps Header',
  AddStep = 'Use after making sure you are on ProtocolStepsH or have already made a step',
}

export enum Verifications {
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
}
export enum Content {
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
}

export enum Locators {
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
}

const chooseDeckSlot = (
  slot: string
): Cypress.Chainable<JQuery<HTMLElement>> => {
  const deckSlots: Record<
    | 'A1'
    | 'A2'
    | 'A3'
    | 'B1'
    | 'B2'
    | 'B3'
    | 'C1'
    | 'C2'
    | 'C3'
    | 'D1'
    | 'D2'
    | 'D3',
    () => Cypress.Chainable<JQuery<HTMLElement>>
  > = {
    A1: () => cy.contains('foreignObject[x="0"][y="321"]', Content.EditSlot),
    A2: () => cy.contains('foreignObject[x="164"][y="321"]', Content.EditSlot),
    A3: () => cy.contains('foreignObject[x="328"][y="321"]', Content.EditSlot),
    B1: () => cy.contains('foreignObject[x="0"][y="214"]', Content.EditSlot),
    B2: () => cy.contains('foreignObject[x="164"][y="214"]', Content.EditSlot),
    B3: () => cy.contains('foreignObject[x="328"][y="214"]', Content.EditSlot),
    C1: () => cy.contains('foreignObject[x="0"][y="107"]', Content.EditSlot),
    C2: () => cy.contains('foreignObject[x="164"][y="107"]', Content.EditSlot),
    C3: () => cy.contains('foreignObject[x="328"][y="107"]', Content.EditSlot),
    D1: () => cy.contains('foreignObject[x="0"][y="0"]', Content.EditSlot),
    D2: () => cy.contains('foreignObject[x="164"][y="0"]', Content.EditSlot),
    D3: () => cy.contains('foreignObject[x="328"][y="0"]', Content.EditSlot),
  }

  const slotAction = deckSlots[slot as keyof typeof deckSlots]

  if (typeof slotAction === 'function') {
    return slotAction() // Return the chainable object
  } else {
    throw new Error(`Slot ${slot} not found in deck slots.`)
  }
}
// Well name selection for liquids and in general
const selectWells = (wells: string[]): void => {
  // Define a dictionary of well selectors
  const wellSelectors: Record<
    string,
    () => Cypress.Chainable<JQuery<HTMLElement>>
  > = {}

  // Populate the dictionary dynamically
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  const columns = Array.from({ length: 12 }, (_, i) => (i + 1).toString())

  rows.forEach(row => {
    columns.forEach(column => {
      const wellName = `${row}${column}`
      wellSelectors[wellName] = () =>
        cy.get(`circle[data-wellname="${wellName}"]`).click({ force: true })
    })
  })

  // Iterate over the wells array and click the corresponding wells
  wells.forEach(well => {
    const wellAction = wellSelectors[well]
    if (typeof wellAction === 'function') {
      wellAction() // Click the well
    } else {
      throw new Error(`Well ${well} not found.`)
    }
  })
}

// Example usage
// selectWells(['A1', 'B3', 'H12'])

const executeAction = (action: Actions | UniversalActions): void => {
  if (isEnumValue([UniversalActions], [action])) {
    executeUniversalAction(action as UniversalActions)
    return
  }

  switch (action) {
    case Actions.SelectFlex:
      cy.contains(Content.OpentronsFlex).should('be.visible').click()
      break

    case Actions.SelectOT2:
      cy.contains(Content.OpentronsOT2).should('be.visible').click()
      break
    case Actions.Confirm:
      cy.contains(Content.Confirm).should('be.visible').click()
      break
    case Actions.GoBack:
      cy.contains(Content.GoBack).should('be.visible').click()
      break
    case Actions.SingleChannelPipette50:
      cy.contains('label', Content.SingleChannel)
        .should('exist')
        .and('be.visible')
        .click()
      cy.contains(Content.Volume50).click()
      cy.contains(Content.Tiprack50).click()
      // ToDo after PR, why does this click Tiprack50 again
      // instead of clicking the filter tiprack?
      // cy.contains(Content.FilterTiprack50).click()
      break
    case Actions.AddThermocycler:
      cy.contains(Content.Thermocycler).click()
      break
    case Actions.AddHeaterShaker:
      cy.contains(Content.HeaterShaker).click()
      break
    case Actions.AddTempdeck2:
      cy.contains(Content.Tempdeck2).click()
      break
    case Actions.AddMagBlock:
      cy.contains(Content.MagBlock).click()
      break
    case Actions.YesGripper:
      cy.contains(Content.Yes).click()
      break
    case Actions.NoGripper:
      cy.contains(Content.No).click()
      break
    case Actions.EditProtocolA:
      cy.contains(Content.EditProtocol).click()
      break
    case Actions.ChoseDeckSlotA1:
      chooseDeckSlot('A1').click()
      break
    case Actions.ChoseDeckSlotA2:
      chooseDeckSlot('A2').click()
      break
    case Actions.ChoseDeckSlotA3:
      chooseDeckSlot('A3').click()
      break
    case Actions.ChoseDeckSlotB1:
      chooseDeckSlot('B1').click()
      break
    case Actions.ChoseDeckSlotB2:
      chooseDeckSlot('B2').click()
      break
    case Actions.ChoseDeckSlotB3:
      chooseDeckSlot('B3').click()
      break
    case Actions.ChoseDeckSlotC1:
      chooseDeckSlot('C1').click()
      break
    case Actions.ChoseDeckSlotC2:
      chooseDeckSlot('C2').click()
      break
    case Actions.ChoseDeckSlotC3:
      chooseDeckSlot('C3').click()
      break
    case Actions.ChoseDeckSlotD1:
      chooseDeckSlot('D1').click()
      break
    case Actions.ChoseDeckSlotD2:
      chooseDeckSlot('D2').click()
      break
    case Actions.ChoseDeckSlotD3:
      chooseDeckSlot('D3').click()
      break
    case Actions.AddHardwareLabware: // New case
      cy.contains(Content.AddLabwareToDeck).click()
      break
    case Actions.ClickLabwareHeader: // New case
      cy.contains(Content.LabwareH).click()
      break
    case Actions.ClickWellPlatesSection: // New case
      cy.contains(Content.WellPlatesCat).click()
      break
    case Actions.ChoseDeckSlotC2Labware:
      // Todo Investigate making a dictionary of slot editing.
      // Maybe next PR
      chooseDeckSlot('C2')
        .find('.Box-sc-8ozbhb-0.kIDovv')
        .find('a[role="button"]')
        .contains(Content.EditSlot)
        .click({ force: true })
      break
    case Actions.SelectArmadillo96WellPlate: // New case for selecting Armadillo plate
      cy.contains(Content.Armadillo96WellPlate200uL).click({ force: true })
      cy.get(Locators.LabwareSelectionLocation).click({ force: true })
      break
    case Actions.SelectBioRad96WellPlate: // New case for selecting Armadillo plate
      cy.contains(Content.Biorad96WellPlate200uL).click({ force: true })
      cy.get(Locators.LabwareSelectionLocation).click({ force: true })
      break

    case Actions.AddLiquid: // New case for "Add liquid"
      cy.contains('button', Content.AddLiquid).click()
      break
    case Actions.ClickLiquidButton: // New case for "Liquid button"
      cy.contains('button', Content.LiquidButton).click()
      break
    case Actions.DefineLiquid: // New case for "Define a liquid"
      cy.contains('button', Content.DefineALiquid).click()
      break
    case Actions.LiquidSaveWIP:
      cy.get(Locators.LiquidNameInput) // Locate the input with name="name"
        .type(Content.SampleLiquidName)

      cy.get(Locators.ModalShellArea)
        .find('form') // Target the form inside the modal
        .invoke('submit', (e: SubmitEvent) => {
          e.preventDefault() // Prevent default form submission
        })

      cy.get(Locators.ModalShellArea)
        .find(Locators.SaveButton) // Locate the Save button
        .contains('Save')
        .click({ force: true }) // Trigger the Save button
      break
    case Actions.WellSelector:
      selectWells(['A1', 'A2'])
      break
    case Actions.LiquidDropdown: // New case for dropdown
      cy.get(Locators.LiquidsDropdown)
        .should('be.visible') // Ensure the dropdown is visible
        .click() // Click the dropdown
      break
    case Actions.SelectLiquidWells:
      cy.contains('My liquid!').click() // Action for clicking 'My liquid!'
      break
    case Actions.SetVolumeAndSaveforWells:
      cy.get('input[name="volume"]').type(`150`) // Set volume
      cy.contains('button', 'Save').click() // Click Save button
      cy.contains('button', 'Done').click({ force: true }) // Click Done button, forcing click if necessary
      break
    case Actions.ProtocolStepsH:
      cy.contains('button', Content.ProtocolSteps).click()
      break
    case Actions.AddStep:
      cy.contains('button', Content.AddStep).click()
      break
    default:
      throw new Error(`Unrecognized action: ${action as string}`)
  }
}

const verifyStep = (verification: Verifications): void => {
  switch (verification) {
    case Verifications.OnStep1:
      cy.contains(Content.Step1Title).should('be.visible')
      break
    case Verifications.OnStep2:
      cy.contains(Content.Step2Title).should('be.visible')
      cy.contains(Content.AddPipette).should('be.visible')
      break
    case Verifications.FlexSelected:
      cy.contains(Content.OpentronsFlex).should(
        'have.css',
        'background-color',
        'rgb(0, 108, 250)'
      )
      break
    case Verifications.OT2Selected:
      cy.contains(Content.OpentronsOT2).should(
        'have.css',
        'background-color',
        'rgb(0, 108, 250)'
      )
      break
    case Verifications.NinetySixChannel:
      cy.contains(Content.NinetySixChannel).should('be.visible')
      break
    case Verifications.NotNinetySixChannel:
      cy.contains(Content.NinetySixChannel).should('not.exist')
      break
    case Verifications.StepTwo50uL:
      // This function should get used after you select 50uL fully
      cy.contains(Content.PipetteVolume)
      cy.contains(Content.Volume50).should('be.visible')
      cy.contains(Content.Volume1000).should('be.visible')
      cy.contains(Content.Tiprack50).should('be.visible')
      cy.contains(Content.FilterTiprack50).should('be.visible')
      // cy.contains('Filter Tip Rack 50 µL').should('be.visible')
      break
    case Verifications.StepTwoPart3:
      // This function should get used after you select 50uL fully
      cy.contains(Content.FullP50SingleName).should('be.visible')
      cy.contains(Content.FullP50TiprackName).should('be.visible')
      cy.contains('Left Mount').should('be.visible')
      cy.contains(Content.Step2Title)
      cy.contains('Robot pipettes')
      cy.contains(Content.AddPipette)
      break
    case Verifications.OnStep3:
      cy.contains('Add a gripper').should('be.visible')
      cy.contains(
        'Do you want to move labware automatically with the gripper?'
      ).should('be.visible')
      cy.contains(Content.Yes).should('be.visible')
      cy.contains(Content.No).should('be.visible')
      break
    case Verifications.Step4Verification:
      cy.contains(Content.ModulePageH).should('be.visible')
      cy.contains(Content.ModulePageB).should('be.visible')
      cy.contains(Content.Thermocycler).should('be.visible')
      cy.contains(Content.HeaterShaker).should('be.visible')
      cy.contains(Content.MagBlock).should('be.visible')
      cy.contains(Content.Tempdeck2).should('be.visible')
      break
    case Verifications.ThermocyclerImg:
      cy.get(Locators.TemperatureModuleImage).should('be.visible')
      break
    case Verifications.HeaterShakerImg:
      cy.get(Locators.HeaterShakerImage).should('be.visible')
      break
    case Verifications.Tempdeck2Img:
      cy.contains(Content.Tempdeck2).should('be.visible')
      break
    case Verifications.LiquidPage:
      cy.contains('Liquid').should('be.visible')
      cy.contains('Add liquid').should('be.visible')
      cy.contains('Liquid volume by well').should('be.visible')
      cy.contains('Cancel').should('be.visible')
      break
    case Verifications.TransferPopOut:
      cy.contains('button', 'Transfer').should('be.visible').click()
      cy.contains('Source labware')
      cy.contains('Select source wells')
      cy.contains('Destination labware')
      cy.contains('Volume per well')
      cy.contains('Tip handling')
      cy.contains('Tip handling')
      cy.contains('Tip drop location')
      break

    default:
      throw new Error(
        `Unrecognized verification: ${verification as Verifications}`
      )
  }
}

export const runCreateTest = (
  steps: Array<Actions | Verifications | UniversalActions>
): void => {
  const enumsToCheck = [Actions, Verifications, UniversalActions]

  if (!isEnumValue(enumsToCheck, steps)) {
    throw new Error('One or more steps are unrecognized.')
  }

  steps.forEach(step => {
    if (isEnumValue([Actions], step)) {
      executeAction(step as Actions)
    } else if (isEnumValue([Verifications], step)) {
      verifyStep(step as Verifications)
    } else if (isEnumValue([UniversalActions], step)) {
      executeAction(step as UniversalActions)
    }
  })
}

export const verifyCreateProtocolPage = (): void => {
  // Verify step 1 and page content
  cy.contains(Content.Step1Title).should('exist').should('be.visible')
  cy.contains(Content.LetsGetStarted).should('exist').should('be.visible')
  cy.contains(Content.WhatKindOfRobot).should('exist').should('be.visible')
  cy.contains(Content.OpentronsFlex).should('exist').should('be.visible')
  cy.contains(Content.OpentronsOT2).should('exist').should('be.visible')
  cy.contains(Content.Confirm).should('exist').should('be.visible')
}
