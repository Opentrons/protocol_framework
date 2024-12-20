import { executeUniversalAction, UniversalActions } from './universalActions'
import { isEnumValue } from './utils'
import '../support/commands'
export enum Actions {
  SelectFlex = 'Select Opentrons Flex',
  SelectOT2 = 'Select Opentrons OT-2',
  Confirm = 'Confirm',
  GoBack = 'Go back',
  SingleChannelPipette50 = 'Select 50uL Single-Channel Pipette',
  YesGripper = 'Select Yes to gripper',
}

export enum Verifications {
  OnStep1 = 'On Step 1 page.',
  OnStep2 = 'On Step 2 page.',
  OnStep3 = 'On Step 3 page',
  FlexSelected = 'Opentrons Flex selected.',
  OT2Selected = 'Opentrons OT-2 selected.',
  NinetySixChannel = '96-Channel option is available.',
  NotNinetySixChannel = '96-Channel option is not available.',
  StepTwo50uL = 'Step Two part two',
  StepTwoPart3 = 'Step Two part three',
  Step4VerificationPart1 = 'Step 4 part 1',
}

export enum Content {
  Step1Title = 'Step 1',
  Step2Title = 'Step 2',
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
}

export enum Locators {
  Confirm = 'button:contains("Confirm")',
  GoBack = 'button:contains("Go back")',
  Step1Indicator = 'p:contains("Step 1")',
  Step2Indicator = 'p:contains("Step 2")',
  FlexOption = 'button:contains("Opentrons Flex")',
  OT2Option = 'button:contains("Opentrons OT-2")',
  NinetySixChannel = 'div:contains("96-Channel")',
}

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
    case Actions.YesGripper:
      cy.contains(Content.Yes).click()
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
    case Verifications.Step4VerificationPart1:
      cy.contains(Content.Thermocycler).should('be.visible')

      cy.contains(Content.HeaterShaker).should('be.visible')

      cy.contains(Content.MagBlock).should('be.visible')
      cy.contains(Content.Tempdeck2).should('be.visible')

      cy.get('img[alt="temperatureModuleType"]').should('be.visible')
      cy.get('img[alt="magneticBlockType"]').should('be.visible')
      cy.get('img[alt="heaterShakerModuleType"]').should('be.visible')
      cy.get('img[alt="thermocyclerModuleType"]').should('be.visible')
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
