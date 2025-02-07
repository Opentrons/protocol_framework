import type { UniversalActions } from './universalActions'

export enum MixActions {
  Confirm = 'Confirm',
  Continue = 'Continue',
  GoBack = 'Go back',
  Back = 'Back',
  Save = 'Save',
  Edit = 'Edit',
  SelectMix = "Select Mix",
  SelectLabware = 'Select on deck labware',
  SelectWellInputField = 'Select wells',
  EnterVolume = 'Enter a valid volume to mix',
  EnterMixReps = 'Enter number of repetions to mix',
  SelectTipHandling = 'Select how/if tips should be picked up for each mix',
  AspirateFlowRate = 'Select aspirate flow rate settings',
  Dispense = 'Select dispnse settings',
  AspWellOrder = 'Open well aspirate well order pop out',
  EditWellOrder = 'Edit well order selects',
  AspMixTipPos = 'Edit tip position for executing mix step',
  Delay = 'Check box for delay and input value',
  DispenseFlowRate = 'Select dispense flow rate settings',
  BlowoutLocation = 'Select blowout settings',
  TouchTip = 'Select touch tip settings',
  BlowoutFlowRate = 'Enter value for blow out flow rate',
  BlowoutPosFromTop = 'Select a blow out position from top of well',
  Rename = "Rename Mix step",
  
  /*
  To Add:
  TipPosSideImageMove = 'Check that the tip position will update when data is enetered'
   */
}

export enum MixVerifications {
  PartOne = 'Verify Part 1, the configuration of mix settings, and check continue button',
  PartTwoAsp = 'Verify Part 2, the configuration of asp settings and check go back and save button',
  PartTwoDisp = 'Verify Part 2, the configuration of disp settings and check go back and save button',
  WellSelectPopout = 'Verify labware image and available wells',
  AspWellOrder = 'Verify pop out for well order during aspirate',
  AspMixTipPos = 'Verify pop out for mix tip position durin aspirate',
  Blowout = 'Verify blow out settings',
  BlowoutPopout = 'Verify blow out position and pop out',
  TouchTipPopout = 'Verify touch tip pop out',
  TouchTip = 'Verify touch tip settings',
  Rename = 'Verify that Mix Step was successfully renamed to "Cypress Test"'
  /*
  To Add:
  FlowRateRangeWarning = 'Verify warning appears when outside flow rate parameters',
  TipPosCollisionCheck = 'Verify banner warning appears when mix tip position is in contact with well wall'
   */
}

export enum MixContent {
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
  PartOne = 'Part 1 / 2',
  PartTwo = 'Part 2 / 2',
  WellSelectTitle = 'Select wells using a Flex 1-Channel 1000 µL',
  ClickAndDragWellSelect = "Click and drag to select wells",
  PipettePreselect = 'Flex 1-Channel 1000 µL',
  TiprackPreselect = 'Opentrons Flex 96 Tip Rack 1000 µL',
  BeforeEveryAsp = 'Before every aspirate',
  OnceAtStartStep = 'Once at the start of step',
  PerSourceWell = 'Per source well',
  PerDestWell = 'Per destination well',
  Never = 'Never',
  WasteChute = 'Waste chute',
  AspFlowRate = 'Aspirate flow rate',
  AspWellOrder = 'Aspirate well order',
  MixTipPosition = 'Mix tip position',
  AdvancedPipSettings = 'Advanced pipetting settings',
  Delay = 'Delay',
  DelayDuration = 'Delay duration',
  DispFlowRate = "Dispense flow rate",
  Blowout = 'Blowout',
  TouchTip = 'Touch tip',
  TopBottomLeRi = 'Top to bottom, Left to right',
  EditWellOrder = 'Edit well order',
  WellOrderDescrip = 'Change how the robot moves from well to well.',
  PrimaryOrder = 'Primary order',
  TopToBottom = 'Top to bottom',
  BottomToTop = 'Bottom to top',
  LeftToRight = 'Left to right',
  RightToLeft = 'Right to left',
  Then = 'then',
  SecondaryOrder = 'Secondary order',
  Cancel = 'Cancel',
  EditMixTipPos = 'Edit mix tip position',
  MixTipPosDescr = 'Change from where in the well the robot aspirates and dispenses during the mix.',
  Xposition = 'X position',
  Yposition = 'Y position',
  Zposition = 'Z position',
  StartingWellPos = 'Well position: X 0 Y 0 Z 1 (mm)',
  TopView = 'Top view',
  SideView = 'Side view',
  BlowoutLocation = 'Blowout location',
  BlowoutPos = 'Blowout position from top',
  DestinationWell = 'Destination Well',
  BlowoutFlowRate = 'Blowout position from top',
  EditBlowoutPos = 'Edit blowout position',
  BlowoutPosDescrip = 'Change where in the well the robot performs the blowout.',
  EditTouchTipPos = 'Edit touch tip position',
  TouchTipDescrip = 'Change from where in the well the robot performs the touch tip.',
  TouchTipPos = 'Touch tip position from bottom',
  NameStep = 'Name step',
  StepName = 'Step Name',
  StepNotes = 'Step Notes',
  CypressTest = 'Cypress Mix Test',
}

export enum MixLocators {
  Continue = 'button:contains("Continue")',
  GoBack = 'button:contains("Go back")',
  Back = 'button:contains("Back")',
  WellInputField = '[name="wells"]',
  Save = 'button:contains("Save")',
  OneWellReservoirImg = '[data-wellname="A1"]',
  Volume = '[name="volume"]',
  MixReps = '[name="times"]',
  Aspirate = 'button:contains("Aspirate")',
  Dispense = 'button:contains("Dispense")',
  AspFlowRateInput = '[name="aspirate_flowRate"]',
  AspWellOrder = '[class="Flex-sc-1qhp8l7-0 ListButton___StyledFlex-sc-1lmhs3v-0 bToGfF bdMeyp"]',
  ResetToDefault = 'button:contains("Reset to default")',
  PrimaryOrderDropdown = 'div[tabindex="0"].sc-bqWxrE jKLbYH iFjNDq',
  CancelAspSettings = '[class="SecondaryButton-sc-1opt1t9-0 kjpcRL"]',
  MixTipPos = '[class="Flex-sc-1qhp8l7-0 ListButton___StyledFlex-sc-1lmhs3v-0 gSONWG bdMeyp"]',
  XpositionInput = '[id="TipPositionModal_x_custom_input"]',
  YpositionInput = '[id="TipPositionModal_y_custom_input"]',
  ZpositionInput = '[id="TipPositionModal_z_custom_input"]',
  SwapView = 'button:contains("Swap view")',
  Checkbox = '[class="Flex-sc-1qhp8l7-0 Checkbox___StyledFlex3-sc-1mvp7vt-0 gZwGCw btdgeU"]',
  DelaySecondsInput = '[class="InputField__StyledInput-sc-1gyyvht-0 cLVzBl"]',
  // SideViewTipPos = '[src="/src/assets/images/tip_side_mid_layer.svg"]',
  DispFlowRate = '[name="dispense_flowRate"]',
  // Blowout = '[class="Flex-sc-1qhp8l7-0 Checkbox___StyledFlex3-sc-1mvp7vt-0 gZwGCw btdgeU"]',
  BlowoutLtnDropdown = '[class="Svg-sc-1lpozsw-0 Icon___StyledSvg-sc-1gt4gyz-0 csSXbR cJpxat"]',
  BlowoutFlowRate = '[name="blowout_flowRate"]',
  BlowoutPos = '[id="TipPositionField_blowout_z_offset"]',
  BlowoutZPosition = '[data-testid="TipPositionModal_custom_input"]',
  PosFromBottom = '[id="TipPositionField_mix_touchTip_mmFromBottom"]',
  RenameBtn = '[class="Btn-sc-o3dtr1-0 sc-hOzowv evqcJP dFLkGR"]',
  StepNameInput = '[class="InputField__StyledInput-sc-1gyyvht-0 cLVzBl"]',
  StepNotesInput = '[class="RenameStepModal__DescriptionField-sc-1k5vjxe-0 lkzOSf"]'

}


export const executeMixAction = (action: MixActions | UniversalActions): void => {
  switch (action) {
    case MixActions.SelectMix:
      cy.get('button').contains('Mix').click()
      break
    case MixActions.SelectLabware:
      cy.contains(MixContent.ChooseOption).should('be.visible').click()
      cy.contains(MixContent.Reservoir).should('be.visible').click()
      break
    case MixActions.SelectWellInputField:
      cy.get(MixLocators.WellInputField).should('be.visible').click()
      break
    case MixActions.EnterVolume:
      cy.get(MixLocators.Volume).should('exist').type('100')
      break
    case MixActions.EnterMixReps:
      cy.get(MixLocators.MixReps).should('exist').type('5')
      break
    case MixActions.SelectTipHandling:
      cy.contains(MixContent.BeforeEveryAsp).should('exist').should('be.visible').click()
      cy.contains(MixContent.OnceAtStartStep).should('exist').should('be.visible')
      cy.contains(MixContent.PerSourceWell).should('exist').should('be.visible')
      cy.contains(MixContent.PerDestWell).should('exist').should('be.visible')
      cy.contains(MixContent.Never).should('exist').should('be.visible')
      cy.contains(MixContent.OnceAtStartStep).click()
      break
    case MixActions.AspirateFlowRate:
      cy.get(MixLocators.Aspirate).should('exist').should('be.visible').click()
      cy.get(MixLocators.AspFlowRateInput).should('exist')
      cy.get(MixLocators.AspFlowRateInput).type('{selectAll}, {backspace}, 100')
      break
    case MixActions.AspWellOrder:
      cy.contains(MixContent.TopBottomLeRi).should('exist').should('be.visible')
      cy.get(MixLocators.AspWellOrder).click()
      break
    case MixActions.AspMixTipPos:
      cy.contains(MixContent.StartingWellPos).should('exist').should('be.visible')
      cy.get(MixLocators.MixTipPos).click()
      cy.get(MixLocators.XpositionInput).type('{selectAll}, {backspace}, 2')
      cy.get(MixLocators.YpositionInput).type('{selectAll}, {backspace}, 3')
      cy.get(MixLocators.ZpositionInput).should('have.prop', "value")
      cy.get(MixLocators.ZpositionInput).type('{selectAll}, {backspace}, 4')
      cy.get(MixLocators.ResetToDefault).should('exist').should('be.visible').click()
      cy.get(MixLocators.XpositionInput).type('{selectAll}, {backspace}, 3')
      cy.get(MixLocators.YpositionInput).type('{selectAll}, {backspace}, 2')
      cy.get(MixLocators.ZpositionInput).should('have.prop', "value")
      cy.get(MixLocators.ZpositionInput).type('{selectAll}, {backspace}, 5')
      cy.contains(MixContent.Cancel).should('exist').should('be.visible')
      break
    case MixActions.Delay:
      cy.contains(MixContent.Delay).should('exist').should('be.visible')
      cy.get(MixLocators.Checkbox).should('exist').should('be.visible').eq(0).click()
      cy.contains(MixContent.DelayDuration).should('exist').should('be.visible')
      cy.get(MixLocators.DelaySecondsInput).should('exist').should('be.visible').should('have.prop', "value")
      cy.get(MixLocators.DelaySecondsInput).eq(1).type('{selectAll}, {backspace}, 5')
      break
    case MixActions.Dispense:
      cy.get(MixLocators.Dispense).should('exist').should('be.visible').click()
      break
    case MixActions.DispenseFlowRate:
      cy.get(MixLocators.Dispense).should('exist').should('be.visible').click()
      cy.get(MixLocators.DispFlowRate).should('exist')
      cy.get(MixLocators.DispFlowRate).type('{selectAll}, {backspace}, 300')
      break
    case MixActions.BlowoutLocation:
      cy.contains(MixContent.Blowout).should('exist').should('be.visible')
      cy.get(MixLocators.Checkbox).should('exist').should('be.visible').eq(0).click()
      cy.contains(MixContent.ChooseOption).should('exist').should('be.visible')
      cy.get(MixLocators.BlowoutLtnDropdown).should('exist').should('be.visible').click()
      cy.contains(MixContent.WasteChute).should('exist').should('be.visible')
      cy.contains(MixContent.DestinationWell).should('exist').should('be.visible').click()
      break
    case MixActions.BlowoutFlowRate:
      cy.get(MixLocators.BlowoutFlowRate).should('exist').should('be.visible').should('have.prop', "value")
      cy.get(MixLocators.BlowoutFlowRate).click()
      cy.get(MixLocators.BlowoutFlowRate).type('{selectAll}, {backspace}, 300')
      break
    case MixActions.BlowoutPosFromTop:
      cy.get(MixLocators.BlowoutPos).should('exist').should('be.visible').should('have.prop', "value")
      cy.get(MixLocators.BlowoutPos).click()
      cy.get(MixLocators.BlowoutZPosition).type('{selectAll}, {backspace}, 4')
      cy.get(MixLocators.ResetToDefault).click()
      cy.get(MixLocators.BlowoutZPosition).type('{selectAll}, {backspace}, -3')
      break
    case MixActions.TouchTip:
      cy.get(MixLocators.Checkbox).should('exist').should('be.visible').eq(0).click()
      cy.get(MixLocators.PosFromBottom).should('have.prop', "value")
      cy.get(MixLocators.PosFromBottom).click()
      cy.get(MixLocators.BlowoutZPosition).type('{selectAll}, {backspace}, 2')
      cy.get(MixLocators.ResetToDefault).click()
      cy.get(MixLocators.BlowoutZPosition).type('{selectAll}, {backspace}, 7')
      break
    case MixActions.Save:
      cy.get(MixLocators.Save).should('exist').should('be.visible').first().click(({force : true}))
      break
    case MixActions.Back:
      cy.get(MixLocators.Back).should('exist').should('be.visible').click()
      break
    case MixActions.Continue:
      cy.get(MixLocators.Continue).should('exist').should('be.visible').click({force: true})
      break
    case MixActions.Rename:
      cy.get(MixLocators.RenameBtn).should('exist').should('be.visible').click()
      cy.contains(MixContent.NameStep).should('exist').should('be.visible')
      cy.contains(MixContent.StepName).should('exist').should('be.visible')
      cy.get(MixLocators.StepNameInput).should('have.value', "Mix")
      cy.contains(MixContent.StepNotes).should('exist').should('be.visible')
      cy.get(MixLocators.StepNameInput).first().type('{selectAll} {backspace} Cypress Mix Test')
      cy.get(MixLocators.StepNotesInput).type('This is testing cypress automation in PD')
      cy.contains(MixContent.Cancel).should('exist').should('be.visible')
      break

    /*
    To Add:
    case MixActions.TipPosSideImageMove:
      cy.get(MixLocators.SideViewTipPos).should('have.css','transform', '0px')
      break
    case MixAction.TipPosTopImageMove:
      break
    case Actions.FlowRateWarning:
      break
    */
    default:
      throw new Error(`Unrecognized action: ${action as string}`)
  }
}

export const executeVerifyMixStep = (verification: MixVerifications): void => {
  switch (verification) {
    case MixVerifications.PartOne:
      cy.contains(MixContent.PartOne).should('exist').should('be.visible')
      cy.contains(MixContent.Mix).should('exist').should('be.visible')
      cy.contains(MixContent.Pipette).should('exist').should('be.visible')
      cy.contains(MixContent.PipettePreselect).should('exist').should('be.visible')
      cy.contains(MixContent.Tiprack).should('exist').should('be.visible')
      cy.contains(MixContent.TiprackPreselect).should('exist').should('be.visible')
      cy.contains(MixContent.Labware).should('exist').should('be.visible')
      cy.contains(MixContent.SelectWells).should('exist').should('be.visible')
      cy.contains(MixContent.VolumePerWell).should('exist').should('be.visible')
      cy.contains(MixContent.MixRepetitions).should('exist').should('be.visible')
      cy.contains(MixContent.TipHandling).should('exist').should('be.visible')
      cy.contains(MixContent.TipDropLocation).should('exist').should('be.visible')
      cy.contains(MixContent.WasteChute).should('exist').should('be.visible')
      cy.get(MixLocators.Continue).should('exist').should('be.visible')
      break
    case MixVerifications.WellSelectPopout:
      cy.contains(MixContent.WellSelectTitle).should('exist').should('be.visible')
      cy.contains(MixContent.ClickAndDragWellSelect).should('exist').should('be.visible')
      cy.get(MixLocators.OneWellReservoirImg).should('exist').should('be.visible')
      cy.get(MixLocators.Save).should('exist').should('be.visible')
      cy.get(MixLocators.Back).should('exist').should('be.visible')
      break
    case MixVerifications.PartTwoAsp:
      cy.contains(MixContent.PartTwo).should('exist').should('be.visible')
      cy.contains(MixContent.Mix).should('exist').should('be.visible')
      cy.get(MixLocators.Aspirate).should('exist').should('be.visible')
      cy.contains(MixContent.AspFlowRate).should('exist').should('be.visible')
      cy.contains(MixContent.AspWellOrder).should('exist').should('be.visible')
      cy.contains(MixContent.MixTipPosition).should('exist').should('be.visible')
      cy.contains(MixContent.AdvancedPipSettings).should('exist').should('be.visible')
      cy.contains(MixContent.Delay).should('exist').should('be.visible')
      cy.get(MixLocators.Back).should('exist').should('be.visible')
      cy.get(MixLocators.Save).should('exist').should('be.visible')
      break
    case MixVerifications.AspWellOrder:
      cy.contains(MixContent.EditWellOrder).should('exist').should('be.visible')
      cy.contains(MixContent.WellOrderDescrip).should('exist').should('be.visible')
      cy.contains(MixContent.PrimaryOrder).should('exist').should('be.visible')
      cy.contains(MixContent.TopToBottom).should('exist').should('be.visible').click()
      cy.contains(MixContent.BottomToTop).should('exist').should('be.visible')
      cy.contains(MixContent.LeftToRight).should('exist').should('be.visible')
      cy.contains(MixContent.RightToLeft).should('exist').should('be.visible')
      cy.contains(MixContent.BottomToTop).should('exist').should('be.visible').click()
      cy.contains(MixContent.Then).should('exist').should('be.visible')
      cy.contains(MixContent.SecondaryOrder).should('exist').should('be.visible')
      cy.contains(MixContent.LeftToRight).should('exist').should('be.visible').click()
      cy.contains(MixContent.RightToLeft).should('exist').should('be.visible').click() 
      cy.get(MixLocators.ResetToDefault).click()
      cy.contains(MixContent.TopToBottom).should('exist').should('be.visible')
      cy.contains(MixContent.LeftToRight).should('exist').should('be.visible')
      cy.get(MixLocators.CancelAspSettings).should('exist').should('be.visible')
      cy.get(MixLocators.Save).should('exist').should('be.visible')
      break
    case MixVerifications.AspMixTipPos:
      cy.contains(MixContent.EditMixTipPos).should('exist').should('be.visible')
      cy.contains(MixContent.MixTipPosDescr).should('exist').should('be.visible')
      cy.contains(MixContent.SideView).should('exist').should('be.visible')
      cy.get(MixLocators.SwapView).should('exist').should('be.visible').click()
      cy.contains(MixContent.TopView).should('exist').should('be.visible')
      cy.contains(MixContent.Xposition).should('exist').should('be.visible')
      cy.get(MixLocators.XpositionInput).should('exist').should('be.visible')
      cy.get(MixLocators.XpositionInput).should('have.prop', "value")
      cy.contains(MixContent.Yposition).should('exist').should('be.visible')
      cy.get(MixLocators.YpositionInput).should('exist').should('be.visible')
      cy.get(MixLocators.YpositionInput).should('have.prop', "value")
      cy.contains(MixContent.Zposition).should('exist').should('be.visible')
      cy.get(MixLocators.ZpositionInput).should('exist').should('be.visible')
      cy.get(MixLocators.ZpositionInput).should('have.prop', "value")
      cy.get(MixLocators.ResetToDefault).should('exist').should('be.visible')
      cy.get(MixLocators.CancelAspSettings).should('exist').should('be.visible')
      cy.get(MixLocators.Save).should('exist').should('be.visible').first().click()
      break
    case MixVerifications.PartTwoDisp:
      cy.contains(MixContent.PartTwo).should('exist').should('be.visible')
      cy.contains(MixContent.Mix).should('exist').should('be.visible')
      cy.get(MixLocators.Aspirate).should('exist').should('be.visible')
      cy.get(MixLocators.Dispense).should('exist').should('be.visible')
      cy.contains(MixContent.DispFlowRate).should('exist').should('be.visible')
      cy.get(MixLocators.DispFlowRate).should('have.prop', "value")
      cy.contains(MixContent.AdvancedPipSettings).should('exist').should('be.visible')
      cy.contains(MixContent.Delay).should('exist').should('be.visible')
      cy.contains(MixContent.Blowout).should('exist').should('be.visible')
      cy.contains(MixContent.TouchTip).should('exist').should('be.visible')
      break
    case MixVerifications.Blowout:
      cy.contains(MixContent.Blowout).should('exist').should('be.visible')
      cy.contains(MixContent.BlowoutLocation).should('exist').should('be.visible')
      cy.contains(MixContent.BlowoutFlowRate).should('exist').should('be.visible')
      cy.get(MixLocators.BlowoutFlowRate).should('have.prop', "value")
      cy.contains(MixContent.BlowoutPos).should('exist').should('be.visible')
      cy.get(MixLocators.BlowoutPos).should('have.prop', "value")
      break
    case MixVerifications.BlowoutPopout:
      cy.contains(MixContent.EditBlowoutPos).should('exist').should('be.visible')
      cy.contains(MixContent.BlowoutPosDescrip).should('exist').should('be.visible')
      cy.contains(MixContent.Zposition).should('exist').should('be.visible')
      cy.get(MixLocators.BlowoutZPosition).should('have.prop', "value")
      cy.contains(MixContent.Cancel).should('exist').should('be.visible')
      cy.get(MixLocators.ResetToDefault).should('exist').should('be.visible')
      cy.get(MixLocators.Save).should('exist').should('be.visible')
      break
    case MixVerifications.TouchTip:
      cy.contains(MixContent.TouchTip).should('exist').should('be.visible')
      cy.contains(MixContent.TouchTipPos).should('exist').should('be.visible')
      cy.get(MixLocators.PosFromBottom).should('have.prop', "value")
      break
    case MixVerifications.TouchTipPopout:
      cy.contains(MixContent.EditTouchTipPos).should('exist').should('be.visible')
      cy.contains(MixContent.TouchTipDescrip).should('exist').should('be.visible')
      cy.contains(MixContent.Zposition).should('exist').should('be.visible')
      cy.get(MixLocators.BlowoutZPosition).should('have.prop', "value")
      cy.contains(MixContent.Cancel).should('exist').should('be.visible')
      cy.get(MixLocators.ResetToDefault).should('exist').should('be.visible')
      cy.get(MixLocators.Save).should('exist').should('be.visible')
      break
    case MixVerifications.Rename:
      cy.contains(MixContent.CypressTest).should('exist').should('be.visible')
      break

    default:
      throw new Error(
        `Unrecognized verification: ${verification as MixVerifications}`
      )
  }
}


