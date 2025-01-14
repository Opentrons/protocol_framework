import { executeUniversalAction, UniversalActions } from './universalActions'
import { isEnumValue } from './utils'

export enum Actions {
  Confirm = 'Confirm',
  GoBack = 'Go back',
  Edit = 'Edit',
  SelectMix = "Select Mix",
  SelectLabware = 'Select on deck labware',
  SelectWells = 'Select wells',
  EnterVolume = 'Enter a valid volume to mix',
  EnterMixReps = 'Enter number of repetions to mix',
  SelectTipHandling = 'Select how/if tips should be picked up for each mix',

}

export enum Verifications {
  MixPopout = 'Verify the the configuration of mix settings',


}

export enum Content {
  Move = 'Move',
  Transfer = 'Transfer',
  Mix = 'Mix',
  Pause = 'Pause',
  HeaterShaker = 'Heater-shaker',
  Thermocyler = 'Thermocycler',
  Pipette = 'Pipette',
  Tiprack = 'Tiprack',
  Labware = 'Labware',
  SelectWells = 'Select wells',
  VolumePerWell = 'Volume per well',
  MixRepetitions = 'Mix repetitions',
  TipHandling = 'Tip handling',
  TipDropLocation = 'Tip drop location',
  ChooseOption = 'Choose option',
  Reservoir = 'Axygen 1 Well Reservoir 90 mL',
  WellPlate = 'Opentrons Tough 96 Well Plate 200 µL PCR Full Skirt',
}

export enum Locators {
  Continue = 'button:contains("Continue")',
  GoBack = 'button:contains("Go back")',
  WellInputField = '[name="wells"]',
  Save = 'button:contains("Save")'
  // Step1Indicator = 'p:contains("Step 1")',
  // Step2Indicator = 'p:contains("Step 2")',
  // FlexOption = 'button:contains("Opentrons Flex")',
  // OT2Option = 'button:contains("Opentrons OT-2")',
  // NinetySixChannel = 'div:contains("96-Channel")',
}

// export const selectWells = (wells: number): void => {
//   cy.get(Locators.WellInputField).click()
// }

const executeAction = (action: Actions | UniversalActions): void => {
  if (isEnumValue([UniversalActions], [action])) {
    executeUniversalAction(action as UniversalActions)
    return
  }



  switch (action) {
    case Actions.SelectMix:
      cy.get('button').contains('Mix').click()
      break
    case Actions.SelectLabware:
      cy.contains(Content.ChooseOption).should('be.visible').click()
      cy.contains(Content.Reservoir).should('be.visible').click()
      break
    case Actions.SelectWells:
      cy.get(Locators.WellInputField).should('be.visible').click()
      cy.get(Locators.Save).click()
      break
    // case Actions.Confirm:
    //   cy.contains(Content.Confirm).should('be.visible').click()
    //   break
    // case Actions.GoBack:
    //   cy.contains(Content.GoBack).should('be.visible').click()
    //   break
    // default:
    //   throw new Error(`Unrecognized action: ${action as string}`)
  }
}

const verifyStep = (verification: Verifications): void => {
  switch (verification) {
    case Verifications.MixPopout:
        cy.contains(Content.Pipette).should('exist').should('be.visible')
        cy.contains(Content.Tiprack).should('exist').should('be.visible')
        cy.contains(Content.Labware).should('exist').should('be.visible')
        cy.contains(Content.SelectWells).should('exist').should('be.visible')
        cy.contains(Content.VolumePerWell).should('exist').should('be.visible')
        cy.contains(Content.MixRepetitions).should('exist').should('be.visible')
        cy.contains(Content.TipHandling).should('exist').should('be.visible')
        cy.contains(Content.TipDropLocation).should('exist').should('be.visible')
        break
    default:
      throw new Error(
        `Unrecognized verification: ${verification as Verifications}`
      )
  }
}

export const runMixSetup = (
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

// export const verifyMixSetup = (): void => {
//   cy.contains(Content.Pipette).should('exist').should('be.visible')
//   cy.contains(Content.Tiprack).should('exist').should('be.visible')
//   cy.contains(Content.Labware).should('exist').should('be.visible')
//   cy.contains(Content.SelectWells).should('exist').should('be.visible')
//   cy.contains(Content.VolumePerWell).should('exist').should('be.visible')
//   cy.contains(Content.MixRepetitions).should('exist').should('be.visible')
//   cy.contains(Content.TipHandling).should('exist').should('be.visible')
//   cy.contains(Content.TipDropLocation).should('exist').should('be.visible')
// }

// export const selectMix = (): void => {
//   cy.get('button').contains('Mix').click()
// }
