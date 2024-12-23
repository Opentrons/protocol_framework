import { executeUniversalAction, UniversalActions } from './universalActions'
import { isEnumValue } from './utils'
import '../support/commands'
// ToDo Future planning should have Step 5, Step 6, and 7 verification
// Todo ProtocolOverview page. This might change from deck map revamp,
// so let's hold off until then.
// This PR unblocks Sara and I to work on this separately, so I want
// To prioritize its getting pulled into the repo
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
  EditProtocol = 'Blue button edit protocol',
  choseDeckSlot = 'Chose each deck slot',
  ChoseDeckSlotA1 = 'Choose deck slot A1',
  ChoseDeckSlotA2 = 'Choose deck slot A2',
  ChoseDeckSlotA3 = 'Choose deck slot A3',
  ChoseDeckSlotB1 = 'Choose deck slot B1',
  ChoseDeckSlotB2 = 'Choose deck slot B2',
  ChoseDeckSlotB3 = 'Choose deck slot B3',
  ChoseDeckSlotC1 = 'Choose deck slot C1',
  ChoseDeckSlotC2 = 'Choose deck slot C2',
  ChoseDeckSlotC3 = 'Choose deck slot C3',
  ChoseDeckSlotD1 = 'Choose deck slot D1',
  ChoseDeckSlotD2 = 'Choose deck slot D2',
  ChoseDeckSlotD3 = 'Choose deck slot D3',
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
}
// Cypress Command Implementation
Cypress.Commands.add('chooseDeckSlot', (slot: string) => {
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
    A1: () =>
      cy.contains('foreignObject[x="164"][y="107"]', 'Edit slot').click(),
    A2: () =>
      cy.contains('foreignObject[x="164"][y="321"]', 'Edit slot').click(),
    A3: () =>
      cy.contains('foreignObject[x="328"][y="321"]', 'Edit slot').click(),
    B1: () => cy.contains('foreignObject[x="0"][y="214"]', 'Edit slot').click(),
    B2: () =>
      cy.contains('foreignObject[x="164"][y="214"]', 'Edit slot').click(),
    B3: () =>
      cy.contains('foreignObject[x="328"][y="214"]', 'Edit slot').click(),
    C1: () => cy.contains('foreignObject[x="0"][y="107"]', 'Edit slot').click(),
    C2: () =>
      cy.contains('foreignObject[x="164"][y="107"]', 'Edit slot').click(),
    C3: () =>
      cy.contains('foreignObject[x="328"][y="107"]', 'Edit slot').click(),
    D1: () => cy.contains('foreignObject[x="0"][y="0"]', 'Edit slot').click(),
    D2: () => cy.contains('foreignObject[x="0"][y="0"]', 'Edit slot').click(),
    D3: () => cy.contains('foreignObject[x="328"][y="0"]', 'Edit slot').click(),
  }

  const slotAction = deckSlots[slot as keyof typeof deckSlots]

  if (slotAction) {
    slotAction()
  } else {
    throw new Error(`Slot ${slot} not found in deck slots.`)
  }
})

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
    case Actions.EditProtocol:
      cy.contains(Content.EditProtocol).click()
      break
    case Actions.ChoseDeckSlotA1:
      cy.chooseDeckSlot('A1')
      break
    case Actions.ChoseDeckSlotA2:
      cy.chooseDeckSlot('A2')
      break
    case Actions.ChoseDeckSlotA3:
      cy.chooseDeckSlot('A3')
      break
    case Actions.ChoseDeckSlotB1:
      cy.chooseDeckSlot('B1')
      break
    case Actions.ChoseDeckSlotB2:
      cy.chooseDeckSlot('B2')
      break
    case Actions.ChoseDeckSlotB3:
      cy.chooseDeckSlot('B3')
      break
    case Actions.ChoseDeckSlotC1:
      cy.chooseDeckSlot('C1')
      break
    case Actions.ChoseDeckSlotC2:
      cy.chooseDeckSlot('C2')
      break
    case Actions.ChoseDeckSlotC3:
      cy.chooseDeckSlot('C3')
      break
    case Actions.ChoseDeckSlotD1:
      cy.chooseDeckSlot('D1')
      break
    case Actions.ChoseDeckSlotD2:
      cy.chooseDeckSlot('D2')
      break
    case Actions.ChoseDeckSlotD3:
      cy.chooseDeckSlot('D3')
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
      // cy.contains('Filter Tip Rack 50 µL').should('be.visible')
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
