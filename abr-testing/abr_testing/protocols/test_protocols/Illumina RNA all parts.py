from opentrons import protocol_api
from opentrons import types
from opentrons.protocol_api import COLUMN, ALL
import math

metadata = {'protocolName': 'Illumina RNA Enrichment 96x Part 1-3','author': 'Opentrons <protocols@opentrons.com>','source': 'Protocol Library',}
requirements = {"robotType": "Flex","apiLevel": "2.23",}

def add_parameters(parameters):
    # ======================== RUNTIME PARAMETERS ========================
    parameters.add_bool(
        display_name="Dry Run",
        variable_name="DRYRUN",
        default=False,
        description="Whether to perform a dry run or not.")
    parameters.add_int(
        display_name="PCR Cycles",
        variable_name="PCRCYCLES",
        default=4,minimum=1,maximum=12,
        description="How many PCR Cycles to for amplification.")
    parameters.add_str(
        display_name="Protocol Steps",
        variable_name="PROTOCOL_STEPS",
        default='All Steps',
        description="Protocol Steps",
        choices=[
        {"display_name": 'All Steps',                   "value": 'All Steps'},
        {"display_name": 'cDNA and Library Prep',       "value": 'cDNA and Library Prep'},
        {"display_name": 'Just cDNA',                   "value": 'Just cDNA'},
        {"display_name": 'Just Library Prep',           "value": 'Just Library Prep'},
        {"display_name": 'Pooling and Hybridization',   "value": 'Pooling and Hybridization'},
        {"display_name": 'Just Pooling',                "value": 'Just Pooling'},
        {"display_name": 'Just Hybridization',          "value": 'Just Hybridization'},
        {"display_name": "Just Capture",                "value": "Just Capture"}
        ])

def run(protocol: protocol_api.ProtocolContext):
    # ======================== DOWNLOADED PARAMETERS ========================
    global USE_GRIPPER              # T/F Whether or not Using the Gripper
    global STP_50_TIPS              # T/F Whether or not there are p50 Single Tip Pickups
    global STP_200_TIPS             # T/F Whether or not there are p200 Single Tip Pickups 
    global REUSE_ANY_50_TIPS        # T/F Whether or not Reusing any p50
    global REUSE_ANY_200_TIPS       # T/F Whether or not Reusing any p200
    global TIP_TRASH                # T/F whether or not the Tips are Returned
    global COLUMNS                  # Number of Columns of Samples
    global PLATE_STACKED            # Number of Plates Stacked in Stacked Position
    global p50_TIPS                 # Number of p50 tips currently available
    global p200_TIPS                # Number of p200 tips currently available
    global p50_RACK_COUNT           # Number of current total p50 racks
    global p200_RACK_COUNT          # Number of current total p200 racks
    global tiprack_200_STP          # Tiprack for p200 Single Tip Pickup
    global tiprack_200_STR          # Tiprack for p200 Single Tip Return
    global tiprack_50_STP           # Tiprack for p50 Single Tip Pickup
    global tiprack_50_STR           # Tiprack for p50 Single Tip Return
    global tiprack_50_R             # Tiprack for p50 Reuse
    global tiprack_200_R1           # Tiprack for p200 Reuse #1
    global tiprack_200_R2           # Tiprack for p200 Reuse #2
    global WASTEVOL                 # Number - Total volume of Discarded Liquid Waste
    global ETOHVOL                  # Number - Total volume of Available EtOH
    # =================== LOADING THE RUNTIME PARAMETERS ====================

    '''
    DRYRUN              = protocol.params.DRYRUN
    COLUMNS             = protocol.params.COLUMNS
    PCRCYCLES           = protocol.params.PCRCYCLES
    '''

    # =================================================================================================
    # ====================================== INSTRUCTION FOR USE ======================================
    # =================================================================================================
    # Change the PROTOCOL_STEPS to the appropriate sections to be tested, or 'All Steps'
    # Practically speaking it can be broken down to:
    # 'cDNA and Library Prep'
    # 'Pooling and Hybridization'
    # "Just Capture"
    # The Runtime parameters are inactivated and Parameters are instead set by these testing parameters:
    # Set thye MODESPEED to "QUICK" if you want to skip the single column pipetting across the 96well plate, it will assume it did the step and throw out the tiprack, do this for troubleshooting
    # Otherwise it'll do it and take a long time, but that's for ABR
    # Set the MODETRASH to "MANUAL" if you want to instead have the gripper place the labware to be thrown out instead into a deck slot on D3 and pause to manually remove it.
    # Otherwise there's about 20 tipracks dropping into the chute, they can get banged up and not reusable
    # SCP_Position means Single Column Pickup Position, this is the quick reference to a deck slot where the 96 channel can access single columns
    # =================================================================================================
    # =================================================================================================
    # =================================================================================================

    DRYRUN              = True
    PCRCYCLES           = 4
    PROTOCOL_STEPS      = 'All Steps'
    MODESPEED           = 'NORMAL'                  # QUICK or NORMAL
    MODETRASH           = 'CHUTE'                   # MANUAL or CHUTE
    SCP_Position        = 'C2'
    if DRYRUN == True:
        HYBRIDTIME = 18
    else: 
        HYBRIDTIME = 0.1
    HYBRID_PAUSE = False
    #   'All Steps'
    #   'cDNA and Library Prep'
    #   'Just cDNA'
    #   'Just Library Prep'
    #   'Pooling and Hybridization'
    #   'Pooling, Hybridization and Capture'
    #   'Just Pooling'
    #   'Just Hybridization'
    #   'Just Capture' 

    # =================================================================================================
    # ====================================== ADVANCED PARAMETERS ======================================
    # =================================================================================================

    #-------PROTOCOL STEP-------
    if PROTOCOL_STEPS == 'All Steps' or PROTOCOL_STEPS == 'Just cDNA' or PROTOCOL_STEPS == 'cDNA and Library Prep':
        STEP_RNA            = True      # Set to 0 to skip block of commands
        STEP_POSTRNA        = True      # Set to 0 to skip block of commands
    else:
        STEP_RNA            = False
        STEP_POSTRNA        = False
    #---------------------------
    if PROTOCOL_STEPS == 'All Steps' or PROTOCOL_STEPS == 'Just Library Prep' or PROTOCOL_STEPS == 'cDNA and Library Prep':
        STEP_TAG            = True      # Set to 0 to skip block of commands
        STEP_WASH           = True      # Set to 0 to skip block of commands
        STEP_CLEANUP_1      = True      # Set to 0 to skip block of commands
    else:
        STEP_TAG            = False
        STEP_WASH           = False
        STEP_CLEANUP_1      = False
    #---------------------------
    if PROTOCOL_STEPS == 'All Steps' or PROTOCOL_STEPS == 'Just Pooling' or PROTOCOL_STEPS == 'Pooling and Hybridization' or PROTOCOL_STEPS == 'Pooling, Hybridization and Capture':
        STEP_POOL           = True      # Set to 0 to skip block of commands
    else:
        STEP_POOL           = False
    #---------------------------
    if PROTOCOL_STEPS == 'All Steps' or PROTOCOL_STEPS == 'Just Hybridization' or PROTOCOL_STEPS == 'Pooling and Hybridization' or PROTOCOL_STEPS == 'Pooling, Hybridization and Capture':
        STEP_HYB            = True      # Set to 0 to skip block of commands
    else:
        STEP_HYB            = False
    #---------------------------
    if PROTOCOL_STEPS == 'All Steps' or PROTOCOL_STEPS == 'Just Capture' or PROTOCOL_STEPS == 'Pooling, Hybridization and Capture':
        STEP_CAPTURE        = True      # Set to 0 to skip block of commands
        STEP_PCR            = True      # Set to 0 to skip block of commands
        STEP_CLEANUP_2      = True      # Set to 0 to skip block of commands
    else:
        STEP_CAPTURE        = False
        STEP_PCR            = False
        STEP_CLEANUP_2      = False
    #---------------------------

    # This notifies the user that for 5-6 columns (from more than 32 samples up to 48 samples) it requires Tip reusing in order to remain walkaway.
    # This setting will override any Runtime parameter, and also pauses to notify the user.  So if the user enters 6 columns with Single Tip Use, it will pause and warn that it has to change to Reusing tips in order to remain walkaway.
    # Note that if omitting steps (i.e. skipping the last cleanup step) it is possible to do single use tips, but may vary on case by case basis.
    # Note that it is also possible to use advanced settings to include pauses that requires user intervention to replenish tipracks, making allowing a run of single Use Tips.
    TIP_SETTING           = 'Single Tip Use' 
    TIP_TRASH             = True      # Default True    | True = Used tips go in Trash, False = Used tips go back into rack
    DEACTIVATE_TEMP       = True      # Default True    | True = Temp and / or Thermocycler deactivate at end of run, False = remain on, such as leaving at 4 degrees 
    TRASH_POSITION        = 'CHUTE'   # Default 'CHUTE' | 'BIN' or 'CHUTE'
    TIP_MIX               = False
    ONDECK_THERMO         = True
    ONDECK_HEATERSHAKER   = False     # Default True    | True = On Deck Heater Shaker, False = No heatershaker and increased tip mixing reps.
    ONDECK_TEMP           = False     # Default True    | True = On Deck Temperature module, False = No Temperature Module
    USE_GRIPPER           = True      # Default True    | True = Uses the FLEX Gripper, False = No Gripper Movement, protocol pauses and requires manual intervention.
    HOTSWAP               = False     # Default False   | True = Allows replenishing tipracks on the off deck positions so the protocol can continue, False = Won't, protocol will most likely have out of tip error message.
    HOTSWAP_PAUSE         = False     # Default False   | True = Protocol pauses for replenishing the offdeck tip racks or to continue, False = Protocol won't cause, user must add tipracks at their discretion.
    SWAPOFFDECK           = False     # Default False   | True = Protocol will use an empty deck position as a temprorary place to swap new and used tip racks between on and off deck, instead of discarding in the chute, False = won't, and used tipracks will go into the chute.  Use True if there is deck space to spare and when doing troubleshooting so tips aren't being discarded with the tip racks.
    CUSTOM_OFFSETS        = False     # Default False   | True = use per instrument specific offsets, False = Don't use any offsets.  This is for per instrument, per module gripper alignment adjustments that need fine tuning without gripper recalibration.
    RES_TYPE_96x          = False     # Default False   | True = use a 96x2ml deepwell for the Reagent Reservoir to keep tips compartmentalized, False = 12x15ml Reservoir.
    WASH_AirMultiDis      = False     # Default False   | When adding WASH to multiple columns, dispense above the wells and reuse tips (Tip Saving)
    ETOH_1_AirMultiDis    = False     # Default False   | When adding EtOH to multiple columns, dispense above the wells and reuse tips (Tip Saving)
    NWASH_AirMultiDis     = False     # Default False   | When adding EtOH to multiple columns, dispense above the wells and reuse tips (Tip Saving)     
    REUSE_50_TIPS_RSB_1   = False     # Default False   | Reusing p50 tips
    REUSE_50_TIPS_RSB_2   = False     # Default False   | Reusing p50 tips
    REUSE_200_TIPS_ETOH_1 = False     # Default False   | Reusing p200 tips
    STP_200_TIPS          = False     # Default False   | Single Tip Pickup p200 tips
    STP_50_TIPS           = False     # Default False   | Single tip Pickup p50 tips
    NOLABEL               = False     # Default False   | True = Do no include Liquid Labeling, False = Liquid Labeling is included, adds additional lines to Protocol Step Preview at end of protocol.
    REPORT                = False     # Default False   | True = Include Extra Comments in the Protocol Step Preview for troubleshooting, False = Do Not Include
    
    # ============================== SETTINGS ===============================
    if TRASH_POSITION == 'BIN': 
        SWAPOFFDECK           = True      # Setting to Swap empty Tipracks to empty positions instead of dumping them
    if TRASH_POSITION == 'CHUTE': 
        SWAPOFFDECK           = False     # Setting to Swap empty Tipracks to empty positions instead of dumping them
    if TIP_MIX == True:
        ONDECK_HEATERSHAKER = False       # On Deck Heater Shaker
    if TIP_MIX == False:
        ONDECK_HEATERSHAKER = True        # On Deck Heater Shaker
    if DRYRUN == True: 
        TIP_TRASH             = False     # True = Used tips go in Trash, False = Used tips go back into rack
        DEACTIVATE_TEMP       = True      # Whether or not to deactivate the heating and cooling modules after a run
        REPORT                = True      # Whether or not to include Extra Comments for Debugging
    if TIP_SETTING == 'Reusing Tips':
        RES_TYPE_96x        = True      # Type of Reservoir, if reusing tips or omitting rows, set True to use a 96x2ml deepwell
        WASH_AirMultiDis    = True      # When adding WASH to multiple columns, dispense above the wells and reuse tips (Tip Saving)
        ETOH_1_AirMultiDis  = True      # When adding EtOH to multiple columns, dispense above the wells and reuse tips (Tip Saving)
        RSB_1_AirMultiDis   = True      # When adding RSB to multiple columns, dispense above the wells and reuse tips (Tip Saving)
        REUSE_50_TIPS_RSB   = True      # Reusing p50 tips
        REUSE_200_TIPS_WASH = True      # Reusing p200 tips
        REUSE_200_TIPS_ETOH = True      # Reusing p200 tips
        STP_200_TIPS        = True      # Default False   | Single Tip Pickup p200 tips
        STP_50_TIPS         = True      # Default False   | Single tip Pickup p50 tips

    if TIP_SETTING == 'Single Tip Use':
        RES_TYPE_96x        = False     # Type of Reservoir, if reusing tips or omitting rows, set True to use a 96x2ml deepwell
        WASH_AirMultiDis    = False     # When adding WASH to multiple columns, dispense above the wells and reuse tips (Tip Saving)
        ETOH_1_AirMultiDis  = False     # When adding EtOH to multiple columns, dispense above the wells and reuse tips (Tip Saving)
        RSB_1_AirMultiDis   = False     # When adding RSB to multiple columns, dispense above the wells and reuse tips (Tip Saving)
        REUSE_50_TIPS_RSB   = False     # Reusing p50 tips
        REUSE_200_TIPS_WASH = False     # Reusing p200 tips
        REUSE_200_TIPS_ETOH = False     # Reusing p200 tips
        STP_200_TIPS        = True      # Default False   | Single Tip Pickup p200 tips
        STP_50_TIPS         = True      # Default False   | Single tip Pickup p50 tips

    # ======================== BACKGROUND PARAMETERS ========================

    # =============================== PIPETTE ===============================
    p1000 = protocol.load_instrument("flex_96channel_1000", "left")
    p1000_flow_rate_aspirate_default = 200
    p1000_flow_rate_dispense_default = 200
    p1000_flow_rate_blow_out_default = 400
    p50_flow_rate_aspirate_default = 50
    p50_flow_rate_dispense_default = 50
    p50_flow_rate_blow_out_default = 100

    # ================================ LISTS ================================

    def nozzlecheck(nozzletype):
        if nozzletype == 'R8':
            p1000.configure_nozzle_layout(
                style=COLUMN,
                start="A12"
            )
        if nozzletype == 'L8':
            p1000.configure_nozzle_layout(
                style=COLUMN,
                start="A1"
            )
        if nozzletype == '96':
            p1000.configure_nozzle_layout(
                style=ALL
            )

    # ========== FIRST ROW ===========
    if ONDECK_THERMO == True:
        thermocycler = protocol.load_module('thermocycler module gen2')
        sample_plate_1 = thermocycler.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', 'Sample Plate 1')
    else:
        sample_plate_1 = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', 'A1', 'Sample Plate 1')
    # SAMPLE PLATE STACK
    # ================ Add the first labware in the position ================ 
    sample_plate_2 = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt','A2','Sample Plate 2')
    # sample_plate_3 = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt','A2','Sample Plate 3')
    # sample_plate_4 = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt','A2','Sample Plate 4')
    # ======================================================================= 
    stacker_200_1 = protocol.load_module("flexStackerModuleV1", "A4")
    stacker_200_1.load_labware_to_hopper("opentrons_flex_96_tiprack_200ul", quantity = 6, lid = "opentrons_flex_tiprack_lid")
    tiprack_A3_adapter = protocol.load_adapter('opentrons_flex_96_tiprack_adapter', 'A3')
    tiprack_200_1 = tiprack_A3_adapter.load_labware('opentrons_flex_96_tiprack_200ul')
    #A2: tiprack_200_3      = protocol.load_labware('opentrons_flex_96_tiprack_200ul','A4')
    #A3: tiprack_200_4      = protocol.load_labware('opentrons_flex_96_tiprack_200ul','A4')
    #A4: tiprack_200_5     = protocol.load_labware('opentrons_flex_96_tiprack_200ul','A4')
    #A5: tiprack_200_6     = protocol.load_labware('opentrons_flex_96_tiprack_200ul','A4')
    #A6: tiprack_200_7     = protocol.load_labware('opentrons_flex_96_tiprack_200ul','A4')
    # ========== SECOND ROW ==========

    # REAGENT PLATE STACK
    reagent_plate_2 = protocol.load_labware('greiner_384_wellplate_240ul','B2', 'Reagent Plate 2')
    # ================ Add the first labware in the position ================ 
    stacker_200_2 = protocol.load_module("flexStackerModuleV1", "B4")
    stacker_200_2.load_labware_to_hopper("opentrons_flex_96_tiprack_200ul", quantity = 6, lid = "opentrons_flex_tiprack_lid")
    lids = protocol.load_lid_stack("opentrons_tough_pcr_auto_sealing_lid", "B3", 5)
    #B2 tiprack_200_8       = protocol.load_labware('opentrons_flex_96_tiprack_200ul','B4')
    #B3 tiprack_200_9       = protocol.load_labware('opentrons_flex_96_tiprack_200ul','B4')
    #B4 tiprack_200_10       = protocol.load_labware('opentrons_flex_96_tiprack_200ul','B4')
    #B5 tiprack_200_11       = protocol.load_labware('opentrons_flex_96_tiprack_200ul','B4')
    #B6 tiprack_200_XX       = protocol.load_labware('opentrons_flex_96_tiprack_200ul','B4')
    # ======================================================================= 

    # ========== THIRD ROW ===========
    stacker_50_1 = protocol.load_module("flexStackerModuleV1", "C4")
    stacker_50_1.load_labware_to_hopper("opentrons_flex_96_tiprack_50ul", quantity = 10, lid ="opentrons_flex_tiprack_lid")
    stacker_50_1.enter_static_mode()
    CleanupPlate_2 = protocol.load_labware('nest_96_wellplate_2ml_deep', 'C4', 'Cleanup Plate 1')
    if ONDECK_TEMP == True:
        temp_block = protocol.load_module('temperature module gen2', 'C1')
        reagent_plate_1 = temp_block.load_labware('greiner_384_wellplate_240ul', 'Reagent Plate 1')
    else:
        reagent_plate_1 = protocol.load_labware('greiner_384_wellplate_240ul', 'C1', 'Reagent Plate 1')
    tiprack_50_SCP_1 = protocol.load_labware('opentrons_flex_96_tiprack_50ul',SCP_Position)
    ETOH_reservoir = protocol.load_labware('nest_96_wellplate_2ml_deep','C3','ETOH Reservoir')
    #C2 tiprack_50_8        = protocol.load_labware('opentrons_flex_96_tiprack_50ul','C4')
    #C3 tiprack_50_SCP_9    = protocol.load_labware('opentrons_flex_96_tiprack_50ul','C4')
    #C4 tiprack_50_SCP_10   = protocol.load_labware('opentrons_flex_96_tiprack_50ul','C4')
    #C5 tiprack_50_X        = protocol.load_labware('opentrons_flex_96_tiprack_50ul','C4')
    
    # ========== FOURTH ROW ==========
    # stacker_50_2 = protocol.load_module("flexStackerModuleV1", "D4")
    # stacker_50_2.load_labware_to_hopper("opentrons_flex_96_tiprack_50ul", quantity = 6)
    TRASH = protocol.load_waste_chute()
    LW_reservoir = protocol.load_labware('nest_96_wellplate_2ml_deep','D1','Liquid Waste Reservoir')
    mag_block = protocol.load_module('magneticBlockV1', 'D2')
    CleanupPlate_1 = mag_block.load_labware('nest_96_wellplate_2ml_deep','Cleanup Plate 1')
    # CleanupPlate_2 = protocol.load_labware('nest_96_wellplate_2ml_deep', 'D4', 'Cleanup Plate 1')

    # ============ TRASH =============
    
    #D2: tiprack_50_SCP_3   = protocol.load_labware('opentrons_flex_96_tiprack_50ul','D4')
    #D3: tiprack_50_SCP_4   = protocol.load_labware('opentrons_flex_96_tiprack_50ul','D4')
    #D4: tiprack_50_5       = protocol.load_labware('opentrons_flex_96_tiprack_50ul','D4')
    #D5: tiprack_50_SCP_6   = protocol.load_labware('opentrons_flex_96_tiprack_50ul','D4')
    #D6: tiprack_50_7       = protocol.load_labware('opentrons_flex_96_tiprack_50ul','D4')

    # ========================== REAGENT PLATE_1 ============================
    TAGMIX              = reagent_plate_1['B1'] # 96 Wells
    EPM_1               = reagent_plate_1['B2'] # 96 Wells
    EPH3                = reagent_plate_1['A1'] # 8 Wells
    FSMM                = reagent_plate_1['A2'] # 8 Wells
    #SSMM_1             = reagent_plate_1['A3'] # 8 Wells
    #SSMM_2             = reagent_plate_1['A4'] # 8 Wells
    TAGSTOP             = reagent_plate_1['A5'] # 8 Wells
    RSB_1               = reagent_plate_1['A6'] # 8 Wells
    #RSB_2              = reagent_plate_1['A7'] # 8 Wells
    #RSB_3              = reagent_plate_1['A8'] # 8 Wells
    #RSB_4              = reagent_plate_1['A9'] # 8 Wells
    #                   = reagent_plate_1['A10'] # 8 Wells
    #                   = reagent_plate_1['A11'] # 8 Wells
    #                   = reagent_plate_1['A12'] # 8 Wells
    #                   = reagent_plate_1['A13'] # 8 Wells
    SMB_1               = reagent_plate_1['A14'] # 8 Wells
    SMB_2               = reagent_plate_1['A15'] # 8 Wells
    EEW_1               = reagent_plate_1['A16'] # 8 Wells
    EEW_2               = reagent_plate_1['A17'] # 8 Wells
    NHB2                = reagent_plate_1['A18'] # 8 Wells
    Panel               = reagent_plate_1['A19'] # 8 Wells
    ET2                 = reagent_plate_1['A20'] # 8 Wells
    EHB2                = reagent_plate_1['A21'] # 8 Wells
    Elute               = reagent_plate_1['A22'] # 8 Wells
    PPC                 = reagent_plate_1['A23'] # 8 Wells
    EPM_2               = reagent_plate_1['A24'] # 8 Wells

    # ========================== REAGENT PLATE_2 ============================
    AMPure              = reagent_plate_2['A1'] # 96 Wells
    #TWB_1              = reagent_plate_2['A2'] # 96 Wells
    Barcodes            = reagent_plate_2['B1'] # 96 Wells
    #TWB_2              = reagent_plate_2['B2'] # 96 Wells

    # ======================= TIP AND SAMPLE TRACKING =======================
    column_list_1 = ['A1','A2','A3','A4','A5','A6','A7','A8','A9','A10','A11','A12']
    column_list_2 = ['A2','A3','A4','A5','A6','A7','A8','A9','A10','A11','A12']
    
    reverse_list = ['A12','A11','A10','A9','A8','A7','A6','A5','A4','A3','A2','A1']
    pooled_1_list = 'A12'   
    pooled_2_list = 'A1'
    pooled_3_list = 'A3'
    pooled_4_list = 'A4'
    pooled_5_list = 'A5'
    pooled_6_list = 'A6'

    SSMM_list = ['A3','A4','A3','A4','A3','A4','A3','A4','A3','A4','A3','A4']
    RSB_list = ['A6','A7','A8','A6','A7','A8','A6','A7','A8','A6','A7','A8']
    TWB_list = ['A2','B2','A2','B2','A2','B2','A2','B2','A2','B2','A2','B2']
    EEW_list = ['A2','B2','A2','B2','A2','B2','A2','B2','A2','B2','A2','B2']

    # ============================ CUSTOM OFFSETS ===========================
    # These are Custom Offsets which are a PER INSTRUMENT Setting, to account for slight adjustments of the gripper calibration or labware.
    p200_in_Deep384_Z_offset = 9

    deck_2_drop_offset={'x':0,'y':0,'z':13}
    deck_2_pick_up_offset={'x':0,'y':0,'z':13}
    deck_3_drop_offset={'x':0,'y':0,'z':26}
    deck_3_pick_up_offset={'x':0,'y':0,'z':26}
    deck_4_drop_offset={'x':0,'y':0,'z':39}
    deck_4_pick_up_offset={'x':0,'y':0,'z':39}

    if CUSTOM_OFFSETS == True:
        PCRPlate_Z_offset = 0
        Deepwell_Z_offset = 0
        Deep384_Z_offset = 0
        # HEATERSHAKER OFFSETS
        hs_drop_offset={'x':0,'y':0,'z':0}
        hs_pick_up_offset={'x':0,'y':0,'z':0}
        # MAG BLOCK OFFSETS
        mb_drop_offset={'x':0,'y':0.,'z':0}
        mb_pick_up_offset={'x':0,'y':0,'z':0}
        # THERMOCYCLER OFFSETS
        tc_drop_offset={'x':0,'y':0,'z':0}
        tc_pick_up_offset={'x':0,'y':0,'z':0}
        # DECK OFFSETS
        deck_drop_offset={'x':0,'y':0,'z':0}
        deck_pick_up_offset={'x':0,'y':0,'z':0}
        deck_2_drop_offset={'x':0,'y':0,'z':13}
        deck_2_pick_up_offset={'x':0,'y':0,'z':13}
        deck_3_drop_offset={'x':0,'y':0,'z':26}
        deck_3_pick_up_offset={'x':0,'y':0,'z':26}
        deck_4_drop_offset={'x':0,'y':0,'z':39}
        deck_4_pick_up_offset={'x':0,'y':0,'z':39}
    else:
        PCRPlate_Z_offset = 0
        Deepwell_Z_offset = 0
        Deep384_Z_offset = 0
        # HEATERSHAKER OFFSETS
        hs_drop_offset={'x':0,'y':0,'z':0}
        hs_pick_up_offset={'x':0,'y':0,'z':0}
        # MAG BLOCK OFFSETS
        mb_drop_offset={'x':0,'y':0.,'z':0}
        mb_pick_up_offset={'x':0,'y':0,'z':0}
        # THERMOCYCLER OFFSETS
        tc_drop_offset={'x':0,'y':0,'z':0}
        tc_pick_up_offset={'x':0,'y':0,'z':0}
        # DECK OFFSETS
        deck_drop_offset={'x':0,'y':0,'z':0}
        deck_pick_up_offset={'x':0,'y':0,'z':0}
        deck_2_drop_offset={'x':0,'y':0,'z':13}
        deck_2_pick_up_offset={'x':0,'y':0,'z':13}
        deck_3_drop_offset={'x':0,'y':0,'z':26}
        deck_3_pick_up_offset={'x':0,'y':0,'z':26}
        deck_4_drop_offset={'x':0,'y':0,'z':39}
        deck_4_pick_up_offset={'x':0,'y':0,'z':39}

    # =================================================================================================
    # ========================================= PROTOCOL START ========================================
    # =================================================================================================
    if ONDECK_THERMO == True: thermocycler.open_lid()
    protocol.pause("Ready")
    # =================================================================================================
    # ========================================= PROTOCOL START ========================================
    # =================================================================================================

    if STEP_RNA == True:
        protocol.comment('==============================================')
        protocol.comment('--> Aliquoting EPH3')
        protocol.comment('==============================================')

        if MODESPEED != "QUICK":
            protocol.comment('--> Adding EPH3')
            EPH3Vol    = 8.5
            EPH3MixRep = 5 if DRYRUN == 'NO' else 1
            EPH3MixVol = 20
            p1000.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
            p1000.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
            p1000.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
            nozzlecheck('L8')
            #===============================================
            for loop, X in enumerate(column_list_1):
                p1000.pick_up_tip(tiprack_50_SCP_1[reverse_list[loop]])
                p1000.aspirate(EPH3Vol, EPH3.bottom(z=Deep384_Z_offset+1))
                p1000.dispense(EPH3Vol, sample_plate_1[X].bottom(z=PCRPlate_Z_offset))
                p1000.move_to(sample_plate_1[X].bottom(z=1))
                p1000.mix(EPH3MixRep,EPH3MixVol)
                p1000.blow_out(sample_plate_1[X].top(z=-5))
                p1000.drop_tip()
            #===============================================

        ############################################################################################################################################
        protocol.comment('MOVING: Plate Lid #1 = Plate Lid Stack --> sample_plate_1')
        protocol.move_lid(lids, sample_plate_1, use_gripper = True)

        if ONDECK_THERMO == True: thermocycler.close_lid()
        if ONDECK_THERMO == True: thermocycler.open_lid()
        protocol.comment('MOVING: Plate Lid #1 = sample_plate_1 --> lids[1]')
        protocol.move_lid(sample_plate_1, lids, use_gripper = True)
        ############################################################################################################################################

        protocol.comment('==============================================')
        protocol.comment('--> Aliquoting FSMM')
        protocol.comment('==============================================')

        #============================================================================================
        if MODETRASH == 'CHUTE':
            protocol.comment('MOVING: tiprack_50_SCP_1 = SCP_Position --> TRASH')
            protocol.move_labware(labware=tiprack_50_SCP_1,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
        else:
            protocol.comment('MOVING: tiprack_50_SCP_1 = SCP_Position --> B3')
            protocol.move_labware(labware=tiprack_50_SCP_1,new_location='B3',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
            protocol.move_labware(labware=tiprack_50_SCP_1,new_location=protocol_api.OFF_DECK,use_gripper=False)
        protocol.comment('MOVING: tiprack_50_SCP_2 = D4 --> SCP_Position')
        stacker_50_1.exit_static_mode()
        tiprack_50_SCP_2 = stacker_50_1.retrieve()
        protocol.move_lid(tiprack_50_SCP_2, TRASH, use_gripper = True)
        # tiprack_50_SCP_2 = stacker_50_2.retrieve()
        protocol.move_labware(labware=tiprack_50_SCP_2,new_location=SCP_Position,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
        #============================================================================================

        if MODESPEED != "QUICK":
            protocol.comment('--> Adding FSMM')
            FSMMVol    = 8
            FSMMMixRep = 5 if DRYRUN == 'NO' else 1
            FSMMMixVol = 20
            p1000.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
            p1000.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
            p1000.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
            nozzlecheck('L8')
            #===============================================
            for loop, X in enumerate(column_list_1):
                p1000.pick_up_tip(tiprack_50_SCP_2[reverse_list[loop]])
                p1000.aspirate(FSMMVol, FSMM.bottom(z=Deep384_Z_offset))
                p1000.dispense(FSMMVol, sample_plate_1[X].bottom(z=PCRPlate_Z_offset+1))
                p1000.move_to(sample_plate_1[X].bottom(z=PCRPlate_Z_offset+1))
                p1000.mix(FSMMMixRep,FSMMMixVol)
                p1000.blow_out(sample_plate_1[X].top(z=-5))
                p1000.drop_tip()
            #===============================================

        ############################################################################################################################################
        protocol.comment('MOVING: Plate Lid #1 = lids[1] --> sample_plate_1')
        protocol.move_lid(lids, sample_plate_1, use_gripper = True)
        if ONDECK_THERMO == True: thermocycler.close_lid()
        #
        if ONDECK_THERMO == True: thermocycler.open_lid()
        protocol.comment('MOVING: Plate Lid #1 = sample_plate_1 --> lids[1]')
        protocol.move_lid(sample_plate_1, lids, use_gripper = True)
        ############################################################################################################################################

        protocol.comment('==============================================')
        protocol.comment('--> Aliquoting SSMM')
        protocol.comment('==============================================')

        #============================================================================================
        if MODETRASH == 'CHUTE':
            protocol.comment('MOVING: tiprack_50_SCP_2 = SCP_Position --> TRASH')
            protocol.move_labware(labware=tiprack_50_SCP_2,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
        else:
            protocol.comment('MOVING: tiprack_50_SCP_2 = SCP_Position --> B3')
            protocol.move_labware(labware=tiprack_50_SCP_2,new_location='B3',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
            protocol.move_labware(labware=tiprack_50_SCP_2,new_location=protocol_api.OFF_DECK,use_gripper=False)
        protocol.comment('DISPENSING: tiprack_50_SCP_3 = #1--> D4')
        tiprack_50_SCP_3 = stacker_50_1.retrieve()
        # tiprack_50_SCP_3 = stacker_50_2.retrieve()
        protocol.move_lid(tiprack_50_SCP_3, TRASH, use_gripper = True)
        protocol.comment('MOVING: tiprack_50_SCP_3 = D4 --> SCP_Position')
        protocol.move_labware(labware=tiprack_50_SCP_3,new_location=SCP_Position,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
        #============================================================================================

        if MODESPEED != 'QUICK':
            protocol.comment('--> Adding SSMM')
            SSMMVol    = 25
            SSMMMixRep = 5 if DRYRUN == 'NO' else 1
            SSMMMixVol = 50
            p1000.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
            p1000.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
            p1000.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
            nozzlecheck('L8')
            #===============================================
            for loop, X in enumerate(column_list_1):
                p1000.pick_up_tip(tiprack_50_SCP_3[reverse_list[loop]])
                p1000.aspirate(SSMMVol, reagent_plate_1.wells_by_name()[SSMM_list[loop]].bottom(z=Deep384_Z_offset+1))
                p1000.dispense(SSMMVol, sample_plate_1[X].bottom(z=PCRPlate_Z_offset+1))
                p1000.move_to(sample_plate_1[X].bottom(z=PCRPlate_Z_offset+1))
                p1000.mix(SSMMMixRep,SSMMMixVol)
                p1000.blow_out(sample_plate_1[X].top(z=-5))
                p1000.drop_tip()
            #===============================================

        ############################################################################################################################################
        protocol.comment('MOVING: Plate Lid #1 = lids[1] --> sample_plate_1')
        protocol.move_lid(lids, sample_plate_1, use_gripper = True)
        if ONDECK_THERMO == True: thermocycler.close_lid()
        #
        if ONDECK_THERMO == True: thermocycler.open_lid()
        protocol.comment('MOVING: Plate Lid #1 = sample_plate_1 --> TRASH')
        protocol.move_lid(sample_plate_1, TRASH, use_gripper = True)
        ############################################################################################################################################

    if STEP_POSTRNA == True:
        protocol.comment('==============================================')
        protocol.comment('--> Post RNA Cleanup')
        protocol.comment('==============================================')

        #=========================================CleanupPlate_1===================================================
        if MODETRASH == 'CHUTE':
            protocol.comment('MOVING: tiprack_50_SCP_3 = SCP_Position --> TRASH')
            protocol.move_labware(labware=tiprack_50_SCP_3,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
        else:
            protocol.comment('MOVING: tiprack_50_SCP_3 = SCP_Position --> B3')
            protocol.move_labware(labware=tiprack_50_SCP_3,new_location='B3',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
            protocol.move_labware(labware=tiprack_50_SCP_3,new_location=protocol_api.OFF_DECK,use_gripper=False)
        protocol.comment('MOVING: CleanupPlate_1 = mag_block --> D4')
        # stacker_50_2.enter_static_mode()
        protocol.move_labware(labware=CleanupPlate_1,new_location='D4',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
        #============================================================================================

        #============================================================================================
        protocol.comment('--> ADDING AMPure (0.8x)')
        AMPureVol = 45
        SampleVol = 45
        AMPureMixRPM = 1800
        AMPureMixTime = 5*60 if DRYRUN == False else 0.1*60
        AMPurePremix = 3 if DRYRUN == False else 1
        p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
        nozzlecheck('96')
        #===============================================
        p1000.pick_up_tip(tiprack_200_1['A1'])
        p1000.move_to(AMPure.bottom(z=Deep384_Z_offset+p200_in_Deep384_Z_offset))
        p1000.mix(3,AMPureVol)
        p1000.aspirate(AMPureVol, AMPure.bottom(z=Deep384_Z_offset+p200_in_Deep384_Z_offset))
        p1000.dispense(AMPureVol, sample_plate_1['A1'].bottom(z=PCRPlate_Z_offset+0.75))
        #========PIPETTE MIXING==========
        p1000.move_to(sample_plate_1['A1'].bottom(z=PCRPlate_Z_offset+0.75))
        p1000.mix(10,AMPureVol)
        #================================
        protocol.delay(seconds=0.2)
        p1000.blow_out(sample_plate_1['A1'].top(z=-2))
        p1000.return_tip()
        #===============================================

        #============================================================================================
        protocol.comment('MOVING: sample_plate_1 = thermocycler --> mag_block')
        protocol.move_labware(labware=sample_plate_1,new_location=mag_block,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
        if MODETRASH == 'CHUTE':
            protocol.comment('MOVING: tiprack_200_1 = tiprack_A3_adapter --> TRASH')
            protocol.move_labware(labware=tiprack_200_1,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
        else:
            protocol.comment('MOVING: tiprack_200_1 = tiprack_A3_adapter --> B3')
            protocol.move_labware(labware=tiprack_200_1,new_location='B3',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
            protocol.move_labware(labware=tiprack_200_1,new_location=protocol_api.OFF_DECK,use_gripper=False)
        protocol.comment('MOVING: tiprack_200_2 = A4 --> tiprack_A3_adapter')
        tiprack_200_2 = stacker_200_1.retrieve()
        protocol.move_lid(tiprack_200_2, use_gripper = True)
        protocol.move_labware(labware=tiprack_200_2,new_location=tiprack_A3_adapter,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
        #============================================================================================
        
        protocol.comment('--> Removing Supernatant 1A')
        RemoveSup = 200
        ActualRemoveSup = 200
        p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
        nozzlecheck('96')
        #===============================================
        p1000.pick_up_tip(tiprack_200_2['A1'])
        p1000.aspirate(RemoveSup-100, sample_plate_1['A1'].bottom(z=PCRPlate_Z_offset+2))
        protocol.delay(minutes=0.1)
        p1000.aspirate(100, sample_plate_1['A1'].bottom(z=PCRPlate_Z_offset))
        p1000.default_speed = 5
        p1000.move_to(sample_plate_1['A1'].top(z=2))
        p1000.default_speed = 200
        p1000.dispense(RemoveSup, LW_reservoir['A1'].top(z=Deepwell_Z_offset))
        protocol.delay(minutes=0.1)
        p1000.blow_out()
        p1000.default_speed = 400
        p1000.move_to(LW_reservoir['A1'].top(z=-5))
        p1000.move_to(LW_reservoir['A1'].top(z=0))
        p1000.return_tip()
        #===============================================

        #============================================================================================
        if MODETRASH == 'CHUTE':
            protocol.comment('MOVING: tiprack_200_2 = tiprack_A3_adapter --> TRASH')
            protocol.move_labware(labware=tiprack_200_2,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
        else:
            protocol.comment('MOVING: tiprack_200_2 = tiprack_A3_adapter --> B3')
            protocol.move_labware(labware=tiprack_200_2,new_location='B3',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
            protocol.move_labware(labware=tiprack_200_2,new_location=protocol_api.OFF_DECK,use_gripper=False)
        protocol.comment('MOVING: tiprack_200_X = B4 --> SCP_Position')
        tiprack_200_X = stacker_200_2.retrieve()
        protocol.move_lid(tiprack_200_X, use_gripper = True)
        protocol.move_labware(labware=tiprack_200_X,new_location=SCP_Position,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
        #============================================================================================

        protocol.comment('--> ETOH Wash 1A')
        ETOHMaxVol = 150
        p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default
        p1000.flow_rate.dispense = p1000_flow_rate_dispense_default
        p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default
        nozzlecheck('R8')
        #===============================================
        p1000.pick_up_tip(tiprack_200_X['A1'])
        for loop, X in enumerate(column_list_1):
            p1000.aspirate(ETOHMaxVol, ETOH_reservoir['A12'].bottom(z=Deepwell_Z_offset+1))
            p1000.move_to(ETOH_reservoir['A12'].top(z=0))
            p1000.move_to(ETOH_reservoir['A12'].top(z=-5))
            p1000.move_to(ETOH_reservoir['A12'].top(z=0))
            p1000.move_to(sample_plate_1[X].top(z=-2))
            p1000.dispense(ETOHMaxVol, rate=1)
            protocol.delay(minutes=0.1)
            p1000.blow_out()
            p1000.move_to(sample_plate_1[X].top(z=5))
            p1000.move_to(sample_plate_1[X].top(z=0))
            p1000.move_to(sample_plate_1[X].top(z=5))
        p1000.drop_tip()
        #===============================================

        #============================================================================================
        protocol.comment('DISPENSING: tiprack_200_3 = #2--> A4')
        protocol.comment('MOVING: tiprack_200_3 = A4 --> tiprack_A3_adapter')
        tiprack_200_3 = stacker_200_1.retrieve()
        protocol.move_lid(tiprack_200_3, TRASH, use_gripper = True)
        protocol.move_labware(labware=tiprack_200_3,new_location=tiprack_A3_adapter,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
        #============================================================================================

        protocol.comment('--> Removing Supernatant 1B')
        RemoveSup = 200
        ActualRemoveSup = 200
        p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
        nozzlecheck('96')
        #===============================================
        p1000.pick_up_tip(tiprack_200_3['A1'])
        p1000.aspirate(RemoveSup-100, sample_plate_1['A1'].bottom(z=PCRPlate_Z_offset+2))
        protocol.delay(minutes=0.1)
        p1000.aspirate(100, sample_plate_1['A1'].bottom(z=PCRPlate_Z_offset))
        p1000.default_speed = 5
        p1000.move_to(sample_plate_1['A1'].top(z=2))
        p1000.default_speed = 200
        p1000.dispense(RemoveSup, LW_reservoir['A1'].top(z=Deepwell_Z_offset))
        protocol.delay(minutes=0.1)
        p1000.blow_out()
        p1000.default_speed = 400
        p1000.move_to(LW_reservoir['A1'].top(z=-5))
        p1000.move_to(LW_reservoir['A1'].top(z=0))
        p1000.return_tip()
        #===============================================

        protocol.comment('--> ETOH Wash 1B')
        ETOHMaxVol = 150
        p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
        nozzlecheck('R8')
        #===============================================
        p1000.pick_up_tip(tiprack_200_X['A2'])
        for loop, X in enumerate(column_list_1):
            p1000.aspirate(ETOHMaxVol, ETOH_reservoir['A12'].bottom(z=Deepwell_Z_offset+1))
            p1000.move_to(ETOH_reservoir['A12'].top(z=0))
            p1000.move_to(ETOH_reservoir['A12'].top(z=-5))
            p1000.move_to(ETOH_reservoir['A12'].top(z=0))
            p1000.move_to(sample_plate_1[X].top(z=-2))
            p1000.dispense(ETOHMaxVol, rate=1)
            protocol.delay(minutes=0.1)
            p1000.blow_out()
            p1000.move_to(sample_plate_1[X].top(z=5))
            p1000.move_to(sample_plate_1[X].top(z=0))
            p1000.move_to(sample_plate_1[X].top(z=5))
        p1000.drop_tip()
        #===============================================

        #============================================================================================
        if MODETRASH == 'CHUTE':
            protocol.comment('MOVING: tiprack_200_3 = tiprack_A3_adapter --> TRASH')
            protocol.move_labware(labware=tiprack_200_3,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
        else:
            protocol.comment('MOVING: tiprack_200_3 = tiprack_A3_adapter --> B3')
            protocol.move_labware(labware=tiprack_200_3,new_location='B3',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
        protocol.comment('DISPENSING: tiprack_200_4 = #3--> A4')
        tiprack_200_4   = stacker_200_1.retrieve() 
        protocol.move_lid(tiprack_200_4, TRASH, use_gripper = True)
        protocol.comment('MOVING: tiprack_200_4 = A4 --> tiprack_A3_adapter')
        protocol.move_labware(labware=tiprack_200_4,new_location=tiprack_A3_adapter,use_gripper=USE_GRIPPER)
        #============================================================================================

        protocol.comment('--> Removing Supernatant 1C')
        RemoveSup = 200
        ActualRemoveSup = 200
        p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default
        p1000.flow_rate.dispense = p1000_flow_rate_dispense_default
        p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default
        nozzlecheck('96')
        #===============================================
        p1000.pick_up_tip(tiprack_200_4['A1'])
        p1000.aspirate(RemoveSup-100, sample_plate_1['A1'].bottom(z=PCRPlate_Z_offset+2))
        protocol.delay(minutes=0.1)
        p1000.aspirate(100, sample_plate_1['A1'].bottom(z=PCRPlate_Z_offset))
        p1000.default_speed = 5
        p1000.move_to(sample_plate_1['A1'].top(z=2))
        p1000.default_speed = 200
        p1000.dispense(RemoveSup, LW_reservoir['A1'].top(z=Deepwell_Z_offset))
        protocol.delay(minutes=0.1)
        p1000.blow_out()
        p1000.default_speed = 400
        p1000.move_to(LW_reservoir['A1'].top(z=-5))
        p1000.move_to(LW_reservoir['A1'].top(z=0))
        p1000.return_tip()
        #===============================================

        #============================================================================================
        if MODETRASH == 'CHUTE':
            protocol.comment('MOVING: tiprack_200_4 = tiprack_A3_adapter --> TRASH')
            protocol.move_labware(labware=tiprack_200_4,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
        else:
            protocol.comment('MOVING: tiprack_200_4 = tiprack_A3_adapter --> B3')
            protocol.move_labware(labware=tiprack_200_4,new_location='B3',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
            protocol.move_labware(labware=tiprack_200_4,new_location=protocol_api.OFF_DECK,use_gripper=False)
        protocol.comment('MOVING: CleanupPlate_1 = D4 --> A4')
        stacker_200_1.enter_static_mode()
        protocol.move_labware(labware=CleanupPlate_1,new_location='A4',use_gripper=USE_GRIPPER)
        protocol.comment('MOVING: tiprack_200_X = SCP_Position --> B4')
        stacker_200_2.enter_static_mode()
        protocol.move_labware(labware=tiprack_200_X,new_location='B4',use_gripper=USE_GRIPPER)
        
        protocol.comment('DISPENSING: tiprack_50_SCP_4 = #3--> D4')
        tiprack_50_SCP_4   = stacker_50_1.retrieve()
        protocol.move_lid(tiprack_50_SCP_4, TRASH, use_gripper = True)
        # tiprack_50_SCP_4   = stacker_50_2.retrieve()
        protocol.comment('MOVING: tiprack_50_SCP_4 = D4 --> tiprack_A3_adapter')
        protocol.move_labware(labware=tiprack_50_SCP_4,new_location=SCP_Position,use_gripper=USE_GRIPPER)
        #============================================================================================

        if MODESPEED != 'QUICK':
            protocol.comment('--> Adding RSB')
            RSBVol = 32
            RSBMix = 10 if DRYRUN == False else 1
            p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default
            p1000.flow_rate.dispense = p1000_flow_rate_dispense_default
            p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default
            nozzlecheck('R8')
            #===============================================
            for loop, X in enumerate(column_list_1):
                p1000.pick_up_tip(tiprack_50_SCP_4[column_list_1[loop]])
                p1000.aspirate(RSBVol, reagent_plate_1.wells_by_name()[RSB_list[loop]].bottom(z=Deep384_Z_offset))
                p1000.dispense(RSBVol, sample_plate_1['A1'].bottom(z=PCRPlate_Z_offset))
                #========PIPETTE MIXING==========
                p1000.move_to(sample_plate_1['A1'].bottom(z=PCRPlate_Z_offset+0.75))
                p1000.mix(10,AMPureVol)
                #================================
                p1000.drop_tip()
            #===============================================

        #============================================================================================
        if MODETRASH == 'CHUTE':
            protocol.comment('MOVING: tiprack_50_SCP_4 = tiprack_A3_adapter --> TRASH')
            protocol.move_labware(labware=tiprack_50_SCP_4,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
        else:
            protocol.comment('MOVING: tiprack_50_SCP_4 = tiprack_A3_adapter --> B3')
            protocol.move_labware(labware=tiprack_50_SCP_4,new_location='B3',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
        protocol.comment('MOVING: tiprack_200_X = B4 --> SCP_Position')
        protocol.move_labware(labware=tiprack_200_X,new_location=SCP_Position,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
        protocol.comment('DISPENSING: tiprack_50_5 = #4--> D4')
        tiprack_50_5   = stacker_50_1.retrieve()
        protocol.move_lid(tiprack_50_5, TRASH, use_gripper = True)
        # tiprack_50_5   = stacker_50_2.retrieve()
        protocol.comment('MOVING: tiprack_50_5 = D4 --> tiprack_A3_adapter')
        protocol.move_labware(labware=tiprack_50_5,new_location=tiprack_A3_adapter,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
        protocol.comment('UNSTACKING: sample_plate_2 = --> A2')
        protocol.comment('MOVING: sample_plate_2 = A2 --> thermocycler')
        if ONDECK_THERMO == True:
            protocol.move_labware(labware=sample_plate_2,new_location=thermocycler,use_gripper=USE_GRIPPER,pick_up_offset=deck_3_pick_up_offset,drop_offset=tc_drop_offset)
        else:
            protocol.move_labware(labware=sample_plate_2,new_location='B1',use_gripper=USE_GRIPPER,pick_up_offset=deck_3_pick_up_offset,drop_offset=deck_drop_offset)
        #============================================================================================

    if STEP_TAG == True:
        protocol.comment('==============================================')
        protocol.comment('--> Tagment')
        protocol.comment('==============================================')

        protocol.comment('--> ADDING TAGMIX')
        TagVol = 20
        TransferSup = 30
        p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default
        p1000.flow_rate.dispense = p1000_flow_rate_dispense_default
        p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default
        nozzlecheck('96')
        #===============================================
        p1000.pick_up_tip(tiprack_50_5['A1'])
        p1000.aspirate(TagVol, TAGMIX.bottom(z=Deep384_Z_offset))
        p1000.dispense(TagVol, sample_plate_2['A1'].bottom(z=PCRPlate_Z_offset))
        p1000.aspirate(TransferSup, sample_plate_1['A1'].bottom(z=PCRPlate_Z_offset))
        p1000.dispense(TransferSup, sample_plate_2['A1'].bottom(z=PCRPlate_Z_offset))
        p1000.return_tip()
        #===============================================

        ############################################################################################################################################
        protocol.comment('MOVING: Plate Lid #1 = Plate Lid Stack --> sample_plate_1')
        protocol.move_lid(lids, sample_plate_2, use_gripper = True)
        if ONDECK_THERMO == True: thermocycler.close_lid()
        #
        if ONDECK_THERMO == True: thermocycler.open_lid()
        protocol.comment('MOVING: Plate Lid #1 = sample_plate_1 --> lids[2]')
        protocol.move_lid(sample_plate_2, lids, use_gripper = True)
        
        ############################################################################################################################################

        #============================================================================================
        if MODETRASH == 'CHUTE':
            protocol.comment('MOVING: sample_plate_1 = mag_block --> TRASH')
            protocol.move_labware(labware=sample_plate_1,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
        else:
            protocol.comment('MOVING: sample_plate_1 = mag_block --> B3')
            protocol.move_labware(labware=sample_plate_1,new_location='B3',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
            protocol.move_labware(labware=sample_plate_1,new_location=protocol_api.OFF_DECK,use_gripper=False)
        if MODETRASH == 'CHUTE':
            protocol.comment('MOVING: tiprack_50_5 = tiprack_A3_adapter --> TRASH')
            protocol.move_labware(labware=tiprack_50_5,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
        else:
            protocol.comment('MOVING: tiprack_50_5 = tiprack_A3_adapter --> B3')
            protocol.move_labware(labware=tiprack_50_5,new_location='B3',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
        protocol.comment('MOVING: tiprack_200_X = SCP_Position --> tiprack_A3_adapter')
        
        protocol.move_labware(labware=tiprack_200_X,new_location=tiprack_A3_adapter,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
        protocol.comment('DISPENSING: tiprack_50_SCP_6 = #4--> D4')
        tiprack_50_SCP_6 = stacker_50_1.retrieve()
        protocol.move_lid(tiprack_50_SCP_6, TRASH, use_gripper = True)
        # tiprack_50_SCP_6   = stacker_50_2.retrieve()
        protocol.comment('MOVING: tiprack_50_SCP_6 = D4 --> SCP_Position')
        protocol.move_labware(labware=tiprack_50_SCP_6,new_location=SCP_Position,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
        #============================================================================================

        if MODESPEED != 'QUICK':
            protocol.comment('--> Adding TAGSTOP')
            TAGSTOPVol    = 10
            TAGSTOPMixRep = 10 if DRYRUN == False else 1
            TAGSTOPMixVol = 20
            p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
            p1000.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
            p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
            nozzlecheck('L8')
            #===============================================
            for loop, X in enumerate(column_list_1):
                p1000.pick_up_tip(tiprack_50_SCP_6[reverse_list[loop]])
                p1000.aspirate(TAGSTOPVol, TAGSTOP.bottom(z=PCRPlate_Z_offset))
                p1000.dispense(TAGSTOPVol, sample_plate_2[X].bottom(z=PCRPlate_Z_offset))
                p1000.drop_tip()
            #===============================================

        ############################################################################################################################################
        protocol.comment('MOVING: Plate Lid #1 = Plate Lid Stack --> sample_plate_2')
        protocol.move_lid(lids, sample_plate_2, use_gripper = True)
        if ONDECK_THERMO == True: thermocycler.close_lid()
        #
        if ONDECK_THERMO == True: thermocycler.open_lid()
        protocol.comment('MOVING: Plate Lid #1 = sample_plate_2 --> lids[2]')
        protocol.move_lid(sample_plate_2, lids, use_gripper = True)
        ############################################################################################################################################

    if STEP_WASH == True:
        protocol.comment('==============================================')
        protocol.comment('--> Wash')
        protocol.comment('==============================================')

        #============================================================================================
        protocol.comment('MOVING: sample_plate_2 = thermocycler --> mag_block')
        protocol.move_labware(labware=sample_plate_2,new_location=mag_block,use_gripper=USE_GRIPPER,pick_up_offset=tc_pick_up_offset,drop_offset=mb_drop_offset)
        if MODETRASH == 'CHUTE':
            protocol.comment('MOVING: tiprack_50_SCP_6 = SCP_Position --> TRASH')
            protocol.move_labware(labware=tiprack_50_SCP_6,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
        else:
            protocol.comment('MOVING: tiprack_50_SCP_6 = SCP_Position --> B3')
            protocol.move_labware(labware=tiprack_50_SCP_6,new_location='B3',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
            protocol.move_labware(labware=tiprack_50_SCP_6,new_location=protocol_api.OFF_DECK,use_gripper=False)
        protocol.comment('MOVING: tiprack_200_X = tiprack_A3_adapter --> SCP_Position')
        protocol.move_labware(labware=tiprack_200_X,new_location=SCP_Position,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
        protocol.comment('MOVING: CleanupPlate_1 = A4 --> D4')
        # stacker_50_2.enter_static_mode()
        protocol.move_labware(labware=CleanupPlate_1,new_location='D4',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
        stacker_200_2.exit_static_mode()
        protocol.comment('DISPENSING: tiprack_200_5 = #3--> A4')
        tiprack_200_5 = stacker_200_2.retrieve()
        protocol.move_lid(tiprack_200_5, TRASH, use_gripper =  True)
        protocol.move_labware(labware=tiprack_200_5,new_location=tiprack_A3_adapter,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
        #============================================================================================

        protocol.comment('--> Removing Supernatant')
        RemoveSup = 200
        ActualRemoveSup = 200
        p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
        nozzlecheck('96')
        #===============================================
        p1000.pick_up_tip(tiprack_200_5['A1'])
        p1000.aspirate(RemoveSup, sample_plate_2['A1'].bottom(z=PCRPlate_Z_offset))
        p1000.dispense(RemoveSup, LW_reservoir['A1'].top(z=Deepwell_Z_offset))
        p1000.return_tip()
        #===============================================

        protocol.comment('--> Wash 1')
        TWBMaxVol = 100
        p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default
        p1000.flow_rate.dispense = p1000_flow_rate_dispense_default
        p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default
        nozzlecheck('R8')
        #===============================================
        p1000.pick_up_tip(tiprack_200_X['A3'])
        for loop, X in enumerate(column_list_1):
            p1000.aspirate(TWBMaxVol, reagent_plate_2.wells_by_name()[TWB_list[loop]].bottom(z=Deep384_Z_offset+p200_in_Deep384_Z_offset))
            p1000.dispense(TWBMaxVol, sample_plate_2[X].bottom(z=PCRPlate_Z_offset))
        p1000.drop_tip()
        #===============================================

        #============================================================================================
        if MODETRASH == 'CHUTE':
            protocol.comment('MOVING: tiprack_200_5 = tiprack_A3_adapter --> TRASH')
            protocol.move_labware(labware=tiprack_200_5,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
        else:
            protocol.comment('MOVING: tiprack_200_5 = tiprack_A3_adapter --> B3')
            protocol.move_labware(labware=tiprack_200_5,new_location='B3',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
            protocol.move_labware(labware=tiprack_200_5,new_location=protocol_api.OFF_DECK,use_gripper=False)
        protocol.comment('DISPENSING: tiprack_200_6 = #4--> A4')
        stacker_200_1.exit_static_mode()
        tiprack_200_6 = stacker_200_1.retrieve()
        protocol.move_lid(tiprack_200_6, TRASH, use_gripper = True)
        protocol.move_labware(labware=tiprack_200_6,new_location=tiprack_A3_adapter,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
        #============================================================================================

        protocol.comment('--> Removing Supernatant')
        RemoveSup = 200
        ActualRemoveSup = 200
        p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
        nozzlecheck('96')
        #===============================================
        p1000.pick_up_tip(tiprack_200_6['A1'])
        p1000.aspirate(RemoveSup, sample_plate_2['A1'].bottom(z=PCRPlate_Z_offset))
        p1000.dispense(RemoveSup, LW_reservoir['A1'].top(z=Deepwell_Z_offset))
        p1000.return_tip()
        #===============================================

        protocol.comment('--> Wash 2')
        TWBMaxVol = 100
        p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default
        p1000.flow_rate.dispense = p1000_flow_rate_dispense_default
        p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default
        nozzlecheck('R8')
        #===============================================
        p1000.pick_up_tip(tiprack_200_X['A4'])
        for loop, X in enumerate(column_list_1):
            p1000.aspirate(TWBMaxVol, reagent_plate_2.wells_by_name()[TWB_list[loop]].bottom(z=Deep384_Z_offset+p200_in_Deep384_Z_offset))
            p1000.dispense(TWBMaxVol, sample_plate_2[X].bottom(z=PCRPlate_Z_offset))
        p1000.drop_tip()
        #===============================================

        #============================================================================================
        if MODETRASH == 'CHUTE':
            protocol.comment('MOVING: tiprack_200_6 = tiprack_A3_adapter --> TRASH')
            protocol.move_labware(labware=tiprack_200_6,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
        else:
            protocol.comment('MOVING: tiprack_200_6 = tiprack_A3_adapter --> B3')
            protocol.move_labware(labware=tiprack_200_6,new_location='B3',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
            protocol.move_labware(labware=tiprack_200_6,new_location=protocol_api.OFF_DECK,use_gripper=False)
        protocol.comment('DISPENSING: tiprack_200_7 = #5--> A4')
        tiprack_200_7 = stacker_200_1.retrieve()
        protocol.move_lid(tiprack_200_7, TRASH, use_gripper = True)
        protocol.move_labware(labware=tiprack_200_7,new_location=tiprack_A3_adapter,use_gripper=USE_GRIPPER)
        #============================================================================================

        protocol.comment('--> Removing Supernatant')
        RemoveSup = 200
        ActualRemoveSup = 200
        p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
        nozzlecheck('96')
        #===============================================
        p1000.pick_up_tip(tiprack_200_7['A1'])
        p1000.aspirate(RemoveSup, sample_plate_2['A1'].bottom(z=PCRPlate_Z_offset))
        p1000.dispense(RemoveSup, LW_reservoir['A1'].top(z=Deepwell_Z_offset))
        p1000.return_tip()
        #===============================================

        protocol.comment('--> Wash 3')
        TWBMaxVol = 100
        p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default
        p1000.flow_rate.dispense = p1000_flow_rate_dispense_default
        p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default
        nozzlecheck('R8')
        #===============================================
        p1000.pick_up_tip(tiprack_200_X['A5'])
        for loop, X in enumerate(column_list_1):
            p1000.aspirate(TWBMaxVol, reagent_plate_2.wells_by_name()[TWB_list[loop]].bottom(z=Deep384_Z_offset+p200_in_Deep384_Z_offset))
            p1000.dispense(TWBMaxVol, sample_plate_2[X].bottom(z=PCRPlate_Z_offset))
        p1000.drop_tip()
        #===============================================

        #============================================================================================
        if MODETRASH == 'CHUTE':
            protocol.comment('MOVING: tiprack_200_7 = tiprack_A3_adapter --> TRASH')
            protocol.move_labware(labware=tiprack_200_7,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
        else:
            protocol.comment('MOVING: tiprack_200_7 = tiprack_A3_adapter --> B3')
            protocol.move_labware(labware=tiprack_200_7,new_location='B3',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
            protocol.move_labware(labware=tiprack_200_7,new_location=protocol_api.OFF_DECK,use_gripper=False)
        protocol.comment('DISPENSING: tiprack_200_8 = #6--> A4')
        tiprack_200_8 = stacker_200_1.retrieve()
        protocol.move_lid(tiprack_200_8, TRASH, use_gripper = True)
        protocol.move_labware(labware=tiprack_200_8,new_location=tiprack_A3_adapter,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
        protocol.comment('DISPENSING: STACK A4 now EMPTY')
        #============================================================================================

        protocol.comment('--> Removing Supernatant')
        RemoveSup = 200
        ActualRemoveSup = 200
        p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
        nozzlecheck('96')
        #===============================================
        p1000.pick_up_tip(tiprack_200_8['A1'])
        p1000.aspirate(RemoveSup, sample_plate_2['A1'].bottom(z=PCRPlate_Z_offset))
        p1000.dispense(RemoveSup, LW_reservoir['A1'].top(z=Deepwell_Z_offset))
        p1000.return_tip()
        #===============================================

        #============================================================================================
        if MODETRASH == 'CHUTE':
            protocol.comment('MOVING: tiprack_200_8 = tiprack_A3_adapter --> TRASH')
            protocol.move_labware(labware=tiprack_200_8,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
        else:
            protocol.comment('MOVING: tiprack_200_8 = tiprack_A3_adapter --> B3')
            protocol.move_labware(labware=tiprack_200_8,new_location='B3',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
            protocol.move_labware(labware=tiprack_200_8,new_location=protocol_api.OFF_DECK,use_gripper=False)
        protocol.comment('MOVING: CleanupPlate_1 = D4 --> A4')
        stacker_200_1.enter_static_mode()
        protocol.move_labware(labware=CleanupPlate_1,new_location='A4',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
        protocol.comment('DISPENSING: tiprack_50_7 = #6--> D4')
        # stacker_50_2.exit_static_mode()
        # tiprack_50_7   = stacker_50_2.retrieve()
        tiprack_50_7 = stacker_50_1.retrieve()
        protocol.move_lid(tiprack_50_7, TRASH, use_gripper = True)
        protocol.comment('MOVING: tiprack_50_7 = D4 --> tiprack_A3_adapter')
        protocol.move_labware(labware=tiprack_50_7,new_location=tiprack_A3_adapter,use_gripper=USE_GRIPPER)
        protocol.comment('MOVING: sample_plate_2 = mag_block --> thermocycler')
        if ONDECK_THERMO == True:
            protocol.move_labware(labware=sample_plate_2,new_location=thermocycler,use_gripper=USE_GRIPPER,pick_up_offset=mb_pick_up_offset,drop_offset=tc_drop_offset)
        else:
            protocol.move_labware(labware=sample_plate_2,new_location='B1',use_gripper=USE_GRIPPER,pick_up_offset=mb_pick_up_offset,drop_offset=deck_drop_offset)
        #============================================================================================

        protocol.comment('--> Adding EPM and Barcode')
        EPMVol = 40 
        EPMMixTime = 3*60 if DRYRUN == False else 0.1*60
        EPMMixRPM = 2000
        EPMMixVol = 35
        EPMVolCount = 0
        BarcodeVol    = 10
        BarcodeMixRep = 3 if DRYRUN == False else 1
        BarcodeMixVol = 10
        TransferSup = 50
        p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default
        p1000.flow_rate.dispense = p1000_flow_rate_dispense_default
        p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default
        nozzlecheck('96')
        #===============================================
        p1000.pick_up_tip(tiprack_50_7['A1'])
        protocol.comment('--> Adding Barcodes')
        p1000.aspirate(BarcodeVol, Barcodes.bottom(z=Deep384_Z_offset))
        p1000.dispense(BarcodeVol, sample_plate_2['A1'].bottom(z=PCRPlate_Z_offset))
        protocol.comment('--> Adding EPM')
        p1000.aspirate(EPMVol, EPM_1.bottom(z=Deep384_Z_offset))
        p1000.dispense(EPMVol, sample_plate_2['A1'].bottom(z=PCRPlate_Z_offset))
        p1000.return_tip()
        #===============================================

        ############################################################################################################################################
        protocol.comment('MOVING: Plate Lid #1 = Plate Lid Stack --> sample_plate_2')
        protocol.move_lid(lids, sample_plate_2, use_gripper = True)
        if ONDECK_THERMO == True: thermocycler.close_lid()
        #
        if ONDECK_THERMO == True: thermocycler.open_lid()
        protocol.comment('MOVING: Plate Lid #1 = sample_plate_2 --> TRASH')
        protocol.move_lid(sample_plate_2, TRASH, use_gripper = True)
        ############################################################################################################################################

    if STEP_CLEANUP_1 == True:
        protocol.comment('==============================================')
        protocol.comment('--> Cleanup 1')
        protocol.comment('==============================================')

        #============================================================================================
        if MODETRASH == 'CHUTE':
            protocol.comment('MOVING: tiprack_50_7 = tiprack_A3_adapter --> TRASH')
            protocol.move_labware(labware=tiprack_50_7,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
        else:
            protocol.comment('MOVING: tiprack_50_7 = tiprack_A3_adapter --> B3')
            protocol.move_labware(labware=tiprack_50_7,new_location='B3',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
            protocol.move_labware(labware=tiprack_50_7,new_location=protocol_api.OFF_DECK,use_gripper=False)
        protocol.comment('MOVING: CleanupPlate_1 = A4 --> mag_block')
        protocol.move_labware(labware=CleanupPlate_1,new_location=mag_block,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=mb_drop_offset)
        # stacker_50_2.exit_static_mode()
        protocol.comment('DISPENSING: tiprack_50_8 = #1--> B4')
        tiprack_50_8 = stacker_50_1.retrieve()
        # tiprack_50_8   = stacker_50_2.retrieve()
        protocol.move_lid(tiprack_50_8, TRASH, use_gripper = True)

        protocol.comment('MOVING: tiprack_50_8 = B4 --> tiprack_A3_adapter')
        protocol.move_labware(labware=tiprack_50_8,new_location=tiprack_A3_adapter,use_gripper=USE_GRIPPER)
        #============================================================================================

        protocol.comment('--> TRANSFERRING AND ADDING AMPure (0.8x)')
        H20Vol    = 40
        AMPureVol = 45
        SampleVol = 45
        AMPureMixRPM = 1800
        AMPureMixTime = 5*60 if DRYRUN == False else 0.1*60
        AMPurePremix = 3 if DRYRUN == False else 1
        p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default
        p1000.flow_rate.dispense = p1000_flow_rate_dispense_default
        p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default
        nozzlecheck('96')
        #===============================================
        p1000.pick_up_tip(tiprack_50_8['A1'])
        protocol.comment('--> ADDING AMPure (0.8x)')
        p1000.aspirate(AMPureVol, AMPure.bottom(z=Deepwell_Z_offset))
        p1000.dispense(AMPureVol, CleanupPlate_1['A1'].bottom(z=Deepwell_Z_offset))
        protocol.comment('--> Adding SAMPLE')
        p1000.aspirate(SampleVol, sample_plate_2['A1'].bottom(z=PCRPlate_Z_offset))
        p1000.dispense(SampleVol, CleanupPlate_1['A1'].bottom(z=Deepwell_Z_offset))
        p1000.return_tip()
        #===============================================

        #============================================================================================
        if MODETRASH == 'CHUTE':
            protocol.comment('MOVING: tiprack_50_8 = tiprack_A3_adapter --> TRASH')
            protocol.move_labware(labware=tiprack_50_8,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
        else:
            protocol.comment('MOVING: tiprack_50_8 = tiprack_A3_adapter --> B3')
            protocol.move_labware(labware=tiprack_50_8,new_location='B3',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
            protocol.move_labware(labware=tiprack_50_8,new_location=protocol_api.OFF_DECK,use_gripper=False)
        protocol.comment('DISPENSING: tiprack_200_9 = #2--> B4')
        tiprack_200_9 = stacker_200_2.retrieve()
        protocol.move_lid(tiprack_200_9, TRASH, use_gripper = True)
        protocol.comment('MOVING: tiprack_200_9 = B4 --> tiprack_A3_adapter')
        protocol.move_labware(labware=tiprack_200_9,new_location=tiprack_A3_adapter,use_gripper=USE_GRIPPER)
        #============================================================================================

        protocol.comment('--> Removing Supernatant 2A')
        RemoveSup = 200
        ActualRemoveSup = 200
        p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default
        p1000.flow_rate.dispense = p1000_flow_rate_dispense_default
        p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default
        nozzlecheck('96')
        #===============================================
        p1000.pick_up_tip(tiprack_200_9['A1'])
        p1000.aspirate(RemoveSup, CleanupPlate_1['A1'].bottom(z=Deepwell_Z_offset))
        p1000.dispense(RemoveSup, LW_reservoir['A1'].top(z=Deepwell_Z_offset))
        p1000.return_tip()
        #===============================================

        protocol.comment('--> ETOH Wash 1A')
        ETOHMaxVol = 150
        p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default
        p1000.flow_rate.dispense = p1000_flow_rate_dispense_default
        p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default
        nozzlecheck('R8')
        #===============================================
        p1000.pick_up_tip(tiprack_200_X['A6'])
        for loop, X in enumerate(column_list_1):
            p1000.aspirate(ETOHMaxVol, ETOH_reservoir['A12'].bottom(z=Deepwell_Z_offset))
            p1000.dispense(ETOHMaxVol, CleanupPlate_1[X].bottom(z=Deepwell_Z_offset))
        p1000.drop_tip()
        #===============================================

        #============================================================================================
        if MODETRASH == 'CHUTE':
            protocol.comment('MOVING: tiprack_200_9 = tiprack_A3_adapter --> TRASH')
            protocol.move_labware(labware=tiprack_200_9,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
        else:
            protocol.comment('MOVING: tiprack_200_9 = tiprack_A3_adapter --> B3')
            protocol.move_labware(labware=tiprack_200_9,new_location='B3',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
            protocol.move_labware(labware=tiprack_200_9,new_location=protocol_api.OFF_DECK,use_gripper=False)
        protocol.comment('DISPENSING: tiprack_200_10 = #3--> B4')
        tiprack_200_10 = stacker_200_2.retrieve()
        protocol.move_lid(tiprack_200_10, TRASH, use_gripper = True)
        protocol.comment('MOVING: tiprack_200_10 = B4 --> tiprack_A3_adapter')
        protocol.move_labware(labware=tiprack_200_10,new_location=tiprack_A3_adapter,use_gripper=USE_GRIPPER)
        #============================================================================================

        protocol.comment('--> Removing Supernatant 2B')
        RemoveSup = 200
        ActualRemoveSup = 200
        p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default
        p1000.flow_rate.dispense = p1000_flow_rate_dispense_default
        p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default
        nozzlecheck('96')
        #===============================================
        p1000.pick_up_tip(tiprack_200_10['A1'])
        p1000.aspirate(RemoveSup, CleanupPlate_1['A1'].bottom(z=Deepwell_Z_offset))
        p1000.dispense(RemoveSup, LW_reservoir['A1'].top(z=Deepwell_Z_offset))
        p1000.return_tip()
        #===============================================

        protocol.comment('--> ETOH Wash 1B')
        ETOHMaxVol = 150
        p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default
        p1000.flow_rate.dispense = p1000_flow_rate_dispense_default
        p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default
        nozzlecheck('R8')
        #===============================================
        p1000.pick_up_tip(tiprack_200_X['A7'])
        for loop, X in enumerate(column_list_1):
            p1000.aspirate(ETOHMaxVol, ETOH_reservoir['A12'].bottom(z=Deepwell_Z_offset))
            p1000.dispense(ETOHMaxVol, CleanupPlate_1[X].bottom(z=Deepwell_Z_offset))
        p1000.drop_tip()
        #===============================================

        #============================================================================================
        if MODETRASH == 'CHUTE':
            protocol.comment('MOVING: tiprack_200_10 = tiprack_A3_adapter --> TRASH')
            protocol.move_labware(labware=tiprack_200_10,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
        else:
            protocol.comment('MOVING: tiprack_200_10 = tiprack_A3_adapter --> B3')
            protocol.move_labware(labware=tiprack_200_10,new_location='B3',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
            protocol.move_labware(labware=tiprack_200_10,new_location=protocol_api.OFF_DECK,use_gripper=False)
        protocol.comment('DISPENSING: tiprack_200_11 = #4--> B4')
        tiprack_200_11 = stacker_200_2.retrieve()
        protocol.move_lid(tiprack_200_11, TRASH, use_gripper = True)
        protocol.comment('MOVING: tiprack_200_11 = B4 --> tiprack_A3_adapter')
        protocol.move_labware(labware=tiprack_200_11,new_location=tiprack_A3_adapter,use_gripper=USE_GRIPPER)
        #============================================================================================

        protocol.comment('--> Removing Supernatant 1C')
        RemoveSup = 200
        ActualRemoveSup = 200
        p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default
        p1000.flow_rate.dispense = p1000_flow_rate_dispense_default
        p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default
        nozzlecheck('96')
        #===============================================
        p1000.pick_up_tip(tiprack_200_11['A1'])
        p1000.aspirate(RemoveSup, CleanupPlate_1['A1'].bottom(z=Deepwell_Z_offset))
        p1000.dispense(RemoveSup, LW_reservoir['A1'].top(z=Deepwell_Z_offset))
        p1000.return_tip()
        #===============================================

        #============================================================================================
        if MODETRASH == 'CHUTE':
            protocol.comment('MOVING: tiprack_200_11 = tiprack_A3_adapter --> TRASH')
            protocol.move_labware(labware=tiprack_200_11,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
        else:
            protocol.comment('MOVING: tiprack_200_11 = tiprack_A3_adapter --> B3')
            protocol.move_labware(labware=tiprack_200_11,new_location='B3',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
            protocol.move_labware(labware=tiprack_200_11,new_location=protocol_api.OFF_DECK,use_gripper=False)
        protocol.comment('MOVING: tiprack_200_X = SCP_Position --> B4')
        protocol.move_labware(labware=tiprack_200_X,new_location='B4',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)

        protocol.comment('MOVING: CleanupPlate_2 = C4 --> A4')
        stacker_200_1.enter_static_mode()
        protocol.move_labware(labware=CleanupPlate_2,new_location='A4',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
        stacker_50_1.exit_static_mode()
        protocol.comment('DISPENSING: tiprack_50_SCP_9 = #3--> C4')
        tiprack_50_SCP_9   = stacker_50_1.retrieve()
        protocol.move_lid(tiprack_50_SCP_9, TRASH, use_gripper = True)
        protocol.comment('MOVING: tiprack_50_SCP_9 = C4 --> SCP_Position')
        protocol.move_labware(labware=tiprack_50_SCP_9,new_location=SCP_Position,use_gripper=USE_GRIPPER)
        #============================================================================================

        if MODESPEED != 'QUICK':
            protocol.comment('--> Adding RSB')
            RSBVol = 32
            RSBMix = 10 if DRYRUN == False else 1
            p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default
            p1000.flow_rate.dispense = p1000_flow_rate_dispense_default
            p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default
            nozzlecheck('R8')
            #===============================================
            for loop, X in enumerate(column_list_1):
                p1000.pick_up_tip(tiprack_50_SCP_9[column_list_1[loop]])
                p1000.aspirate(RSBVol, reagent_plate_1.wells_by_name()[RSB_list[loop]].bottom(z=Deep384_Z_offset))
                p1000.dispense(RSBVol, CleanupPlate_1[X].bottom(z=Deepwell_Z_offset))
                p1000.drop_tip()
            #===============================================

        #============================================================================================
        if MODETRASH == 'CHUTE':
            protocol.comment('MOVING: tiprack_50_SCP_9 = SCP_Position --> TRASH')
            protocol.move_labware(labware=tiprack_50_SCP_9,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
        else:
            protocol.comment('MOVING: tiprack_50_SCP_9 = SCP_Position --> B3')
            protocol.move_labware(labware=tiprack_50_SCP_9,new_location='B3',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
            protocol.move_labware(labware=tiprack_50_SCP_9,new_location=protocol_api.OFF_DECK,use_gripper=False)
        protocol.comment('DISPENSING: tiprack_50_SCP_10 = #4--> C4')
        tiprack_50_SCP_10   = stacker_50_1.retrieve()
        protocol.move_lid(tiprack_50_SCP_10, TRASH, use_gripper = True)
        protocol.comment('MOVING: tiprack_50_SCP_10 = C4 --> SCP_Position')
        protocol.move_labware(labware=tiprack_50_SCP_10,new_location=SCP_Position,use_gripper=USE_GRIPPER)
        if MODETRASH == 'CHUTE':
            protocol.comment('MOVING: sample_plate_2 = thermocycler --> TRASH')
            protocol.move_labware(labware=sample_plate_2,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
        else:
            protocol.comment('MOVING: sample_plate_2 = thermocycler --> B3')
            protocol.move_labware(labware=sample_plate_2,new_location='B3',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
            protocol.move_labware(labware=sample_plate_2,new_location=protocol_api.OFF_DECK,use_gripper=False)
        # =======================
        # =======================
        #protocol.pause('Add sample_plate_3 to A2')
        protocol.comment('UNSTACKING: sample_plate_3 = --> A2')
        sample_plate_3   = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt','A2','Sample Plate 3')
        protocol.comment('MOVING: sample_plate_3 = A2 --> thermocycler')
        if ONDECK_THERMO == True:
            protocol.move_labware(labware=sample_plate_3,new_location=thermocycler,use_gripper=USE_GRIPPER,pick_up_offset=deck_2_pick_up_offset,drop_offset=tc_drop_offset)
        else:
            protocol.move_labware(labware=sample_plate_3,new_location='B1',use_gripper=USE_GRIPPER,pick_up_offset=deck_2_pick_up_offset,drop_offset=deck_drop_offset)
        # =======================
        # =======================
        #protocol.pause('Add sample_plate_4 to A2')
        protocol.comment('UNSTACKING: sample_plate_4 = --> A2')
        sample_plate_4   = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt','A2','Sample Plate 4')
        #============================================================================================

    if STEP_POOL == True:

        protocol.comment('--> Pooling')
        '''
        PoolVol = 20
        p1000.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        nozzlecheck('L8')
        #===============================================
        for loop, X in enumerate(column_list_1):
            p1000.pick_up_tip(tiprack_50_SCP_10[reverse_list[loop]])
            p1000.aspirate(PoolVol, sample_plate_3[X].bottom(z=1))
            p1000.dispense(PoolVol, sample_plate_4[pooled_1_list].bottom(z=1))
            p1000.blow_out(sample_plate_4[pooled_1_list].top(z=-5))
            p1000.drop_tip()
        #===============================================
        '''
        
        #============================================================================================
        if MODETRASH == 'CHUTE':
            protocol.comment('MOVING: tiprack_50_SCP_10 = SCP_Position --> TRASH')
            protocol.move_labware(labware=tiprack_50_SCP_10,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
        else:
            protocol.comment('MOVING: tiprack_50_SCP_10 = SCP_Position --> B3')
            protocol.move_labware(labware=tiprack_50_SCP_10,new_location='B3',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
            protocol.move_labware(labware=tiprack_50_SCP_10,new_location=protocol_api.OFF_DECK,use_gripper=False)
        protocol.comment('DISPENSING: tiprack_50_SCP_10 = #5--> C4')
        tiprack_50_X   = stacker_50_1.retrieve()
        protocol.move_lid(tiprack_50_X, TRASH, use_gripper = True)
        protocol.comment('MOVING: tiprack_50_X = C4 --> SCP_Position')
        protocol.move_labware(labware=tiprack_50_X,new_location=SCP_Position,use_gripper=USE_GRIPPER)
        #============================================================================================

    if STEP_HYB == True:
        protocol.comment('==============================================')
        protocol.comment('--> HYB')
        protocol.comment('==============================================')

        protocol.comment('--> add NHB2')
        NHB2Vol    = 50
        p1000.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        nozzlecheck('R8')
        #===============================================
        for loop, X in enumerate(pooled_1_list):
            p1000.pick_up_tip(tiprack_50_X['A1'])
            p1000.aspirate(NHB2Vol, NHB2.bottom(z=0.3))
            p1000.dispense(NHB2Vol, sample_plate_3[pooled_1_list].bottom(z=1))
            p1000.blow_out(sample_plate_3[pooled_1_list].bottom(z=1))
            p1000.drop_tip()
        #===============================================

        protocol.comment('--> Adding Panel')
        PanelVol    = 10
        p1000.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        nozzlecheck('R8')
        #===============================================
        for loop, X in enumerate(pooled_1_list):
            p1000.pick_up_tip(tiprack_50_X['A2'])
            p1000.aspirate(PanelVol, Panel.bottom(z=0.3))
            p1000.dispense(PanelVol, sample_plate_3[pooled_1_list].bottom(z=1))
            p1000.blow_out(sample_plate_3[pooled_1_list].bottom(z=1))
            p1000.drop_tip()
        #===============================================

        protocol.comment('--> Adding EHB2')
        EHB2Vol    = 10
        EHB2MixRep = 10 if DRYRUN == False else 1
        EHB2MixVol = 90
        p1000.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        nozzlecheck('R8')
        #===============================================
        for loop, X in enumerate(pooled_1_list):
            p1000.pick_up_tip(tiprack_50_X['A3'])
            p1000.aspirate(EHB2Vol, EHB2.bottom(z=0.3))
            p1000.dispense(EHB2Vol, sample_plate_3[pooled_1_list].bottom(z=1))
            p1000.blow_out(sample_plate_3[pooled_1_list].bottom(z=1))
            p1000.drop_tip()
        #===============================================

        if ONDECK_THERMO == True:
            protocol.comment('Hybridize on Deck')
            ############################################################################################################################################
            thermocycler.close_lid()
            if DRYRUN == False:
                profile_TAGSTOP = [
                    {'temperature':98, 'hold_time_minutes': 5},
                    {'temperature':97, 'hold_time_minutes': 1},
                    {'temperature':95, 'hold_time_minutes': 1},
                    {'temperature':93, 'hold_time_minutes': 1},
                    {'temperature':91, 'hold_time_minutes': 1},
                    {'temperature':89, 'hold_time_minutes': 1},
                    {'temperature':87, 'hold_time_minutes': 1},
                    {'temperature':85, 'hold_time_minutes': 1},
                    {'temperature':83, 'hold_time_minutes': 1},
                    {'temperature':81, 'hold_time_minutes': 1},
                    {'temperature':79, 'hold_time_minutes': 1},
                    {'temperature':77, 'hold_time_minutes': 1},
                    {'temperature':75, 'hold_time_minutes': 1},
                    {'temperature':73, 'hold_time_minutes': 1},
                    {'temperature':71, 'hold_time_minutes': 1},
                    {'temperature':69, 'hold_time_minutes': 1},
                    {'temperature':67, 'hold_time_minutes': 1},
                    {'temperature':65, 'hold_time_minutes': 1},
                    {'temperature':63, 'hold_time_minutes': 1},
                    {'temperature':62, 'hold_time_minutes': HYBRIDTIME*60}
                    ]
                thermocycler.execute_profile(steps=profile_TAGSTOP, repetitions=1, block_max_volume=100)
                thermocycler.set_block_temperature(62)
                if HYBRID_PAUSE == True:
                    protocol.comment('HYBRIDIZATION PAUSED')
                thermocycler.set_block_temperature(10)
            thermocycler.open_lid()
        else:
            protocol.comment('Pausing to run Tagmentation on an off deck Thermocycler ~15min')
        ############################################################################################################################################

    if STEP_CAPTURE == True:
        protocol.comment('==============================================')
        protocol.comment('--> Capture')
        protocol.comment('==============================================')

        if DRYRUN == False:
            protocol.comment("SETTING THERMO and TEMP BLOCK Temperature")
            if ONDECK_THERMO == True:
                thermocycler.set_block_temperature(58)
                thermocycler.set_lid_temperature(58)  

        #============================================================================================
        protocol.comment('MOVING: tiprack_50_X = SCP_Position --> C4')
        stacker_50_1.enter_static_mode()
        protocol.move_labware(labware=tiprack_50_X,new_location='C4',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
        protocol.comment('MOVING: tiprack_200_X = B4 --> SCP_Position')
        protocol.move_labware(labware=tiprack_200_X,new_location=SCP_Position,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
        if MODETRASH == 'CHUTE':
            protocol.comment('MOVING: CleanupPlate_1 = mag_block --> TRASH')
            protocol.move_labware(labware=CleanupPlate_1,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=mb_pick_up_offset)
        else:
            protocol.comment('MOVING: CleanupPlate_1 = mag_block --> B3')
            protocol.move_labware(labware=CleanupPlate_1,new_location='B3',use_gripper=USE_GRIPPER,pick_up_offset=mb_pick_up_offset)
            protocol.move_labware(labware=CleanupPlate_1,new_location=protocol_api.OFF_DECK,use_gripper=False)
        protocol.comment('MOVING: CleanupPlate_2 = A4 --> mag_block')
        protocol.move_labware(labware=CleanupPlate_2,new_location=mag_block,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=mb_drop_offset)
        #============================================================================================

        protocol.comment('--> Transfer Hybridization')
        TransferSup = 100
        p1000.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        nozzlecheck('R8')
        #===============================================
        p1000.pick_up_tip(tiprack_200_X['A8'])
        p1000.move_to(sample_plate_3[pooled_1_list].bottom(z=0.3))
        p1000.aspirate(TransferSup+1, rate=0.25)
        p1000.dispense(TransferSup+1, CleanupPlate_2['A1'].bottom(z=1))
        p1000.drop_tip()
        #===============================================
        if ONDECK_THERMO == True:
            thermocycler.close_lid()

        protocol.comment('--> ADDING SMB')
        SMBVol = 250
        SampleVol = 100
        SMBMixRPM = 2000
        SMBMixRep = 5*60 if DRYRUN == False else 0.1*60
        SMBPremix = 3 if DRYRUN == False else 1
        p1000.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        nozzlecheck('R8')
        #===============================================
        p1000.pick_up_tip(tiprack_200_X['A9'])
        p1000.mix(SMBPremix,200, SMB_1.bottom(z=1))
        p1000.aspirate(SMBVol/2, SMB_1.bottom(z=1), rate=0.25)
        p1000.dispense(SMBVol/2, CleanupPlate_2['A1'].top(z=-7), rate=0.25)
        p1000.aspirate(SMBVol/2, SMB_1.bottom(z=1), rate=0.25)
        p1000.dispense(SMBVol/2, CleanupPlate_2['A1'].bottom(z=1), rate=0.25)
        p1000.default_speed = 5
        p1000.move_to(CleanupPlate_2['A1'].bottom(z=5))
        for Mix in range(2):
            p1000.aspirate(100, rate=0.5)
            p1000.move_to(CleanupPlate_2['A1'].bottom(z=1))
            p1000.aspirate(80, rate=0.5)
            p1000.dispense(80, rate=0.5)
            p1000.move_to(CleanupPlate_2['A1'].bottom(z=5))
            p1000.dispense(100,rate=0.5)
            Mix += 1
        p1000.blow_out(CleanupPlate_2['A1'].top(z=-7))
        p1000.default_speed = 400
        p1000.move_to(CleanupPlate_2['A1'].top(z=5))
        p1000.move_to(CleanupPlate_2['A1'].top(z=0))
        p1000.move_to(CleanupPlate_2['A1'].top(z=5))
        p1000.drop_tip()
        #===============================================

        if ONDECK_THERMO == True:
            thermocycler.open_lid()

        if DRYRUN == False:
            protocol.delay(minutes=2)

        protocol.comment('==============================================')
        protocol.comment('--> WASH')
        protocol.comment('==============================================')

        protocol.comment('--> Remove SUPERNATANT')
        p1000.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        nozzlecheck('R8')
        #===============================================
        p1000.pick_up_tip(tiprack_200_X['A10'])
        p1000.move_to(CleanupPlate_2['A1'].bottom(4))
        p1000.aspirate(200, rate=0.25)
        p1000.dispense(200, LW_reservoir['A1'].top(z=-7))
        p1000.move_to(CleanupPlate_2['A1'].bottom(0.5))
        p1000.aspirate(200, rate=0.25)
        p1000.dispense(200, LW_reservoir['A1'].top(z=-7))
        p1000.move_to(LW_reservoir['A1'].top(z=-7))
        protocol.delay(minutes=0.1)
        p1000.blow_out(LW_reservoir['A1'].top(z=-7))
        p1000.aspirate(20)
        p1000.drop_tip()
        #===============================================
        
        protocol.comment('--> Adding EEW')
        EEWVol    = 200
        p1000.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        nozzlecheck('R8')
        #===============================================
        p1000.pick_up_tip(tiprack_200_X['A11'])
        p1000.aspirate(EEWVol, reagent_plate_1[EEW_list[0]].bottom())
        p1000.dispense(EEWVol, CleanupPlate_2['A1'].bottom())
        p1000.drop_tip()
        #===============================================

        if DRYRUN == False:
            protocol.delay(seconds=5*60)

        if DRYRUN == False:
            protocol.delay(seconds=1*60)            

        protocol.comment('--> Removing Supernatant')
        RemoveSup = 200
        p1000.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        nozzlecheck('R8')
        #===============================================
        p1000.pick_up_tip(tiprack_200_X['A12'])
        p1000.move_to(CleanupPlate_2['A1'].bottom(z=3.5))
        p1000.aspirate(RemoveSup-100, rate=0.25)
        protocol.delay(minutes=0.1)
        p1000.move_to(CleanupPlate_2['A1'].bottom(z=0.5))
        p1000.aspirate(100, rate=0.25)
        p1000.move_to(CleanupPlate_2['A1'].top(z=0.5))
        p1000.dispense(200, LW_reservoir['A1'].top(z=-7))
        protocol.delay(minutes=0.1)
        p1000.blow_out(LW_reservoir['A1'].top(z=-7))
        p1000.aspirate(20)
        p1000.drop_tip()
        #===============================================

        #============================================================================================
        if MODETRASH == 'CHUTE':
            protocol.comment('MOVING: tiprack_200_X = SCP_Position --> TRASH')
            protocol.move_labware(labware=tiprack_200_X,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
        else:
            protocol.comment('MOVING: tiprack_200_X = SCP_Position --> B3')
            protocol.move_labware(labware=tiprack_200_X,new_location='B3',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
            protocol.move_labware(labware=tiprack_200_X,new_location=protocol_api.OFF_DECK,use_gripper=False)
        protocol.comment('DISPENSING: tiprack_200_XX = #5--> B4')
        tiprack_200_XX = stacker_200_2.retrieve()
        protocol.move_lid(tiprack_200_XX, TRASH, use_gripper = True)
        protocol.comment('MOVING: tiprack_200_XX = B4 --> SCP_Position')
        protocol.move_labware(labware=tiprack_200_XX,new_location=SCP_Position,use_gripper=USE_GRIPPER)
        #============================================================================================

        protocol.comment('--> Adding EEW')
        EEWVol    = 200
        p1000.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        nozzlecheck('R8')
        #===============================================
        p1000.pick_up_tip(tiprack_200_XX['A1'])
        p1000.aspirate(EEWVol, reagent_plate_1[EEW_list[1]].bottom())
        p1000.dispense(EEWVol, CleanupPlate_2['A1'].bottom())
        p1000.drop_tip()
        #===============================================

        if DRYRUN == False:
            protocol.delay(seconds=5*60)

        if DRYRUN == False:
            protocol.delay(seconds=1*60)            

        protocol.comment('--> Removing Supernatant')
        RemoveSup = 200
        p1000.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        nozzlecheck('R8')
        #===============================================
        p1000.pick_up_tip(tiprack_200_XX['A2'])
        p1000.move_to(CleanupPlate_2['A1'].bottom(z=3.5))
        p1000.aspirate(RemoveSup-100, rate=0.25)
        protocol.delay(minutes=0.1)
        p1000.move_to(CleanupPlate_2['A1'].bottom(z=0.5))
        p1000.aspirate(100, rate=0.25)
        p1000.move_to(CleanupPlate_2['A1'].top(z=0.5))
        p1000.dispense(200, LW_reservoir['A1'].top(z=-7))
        protocol.delay(minutes=0.1)
        p1000.blow_out(LW_reservoir['A1'].top(z=-7))
        p1000.aspirate(20)
        p1000.drop_tip()
        #===============================================
        
        protocol.comment('--> Adding EEW')
        EEWVol    = 200
        p1000.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        nozzlecheck('R8')
        #===============================================
        p1000.pick_up_tip(tiprack_200_XX['A3'])
        p1000.aspirate(EEWVol, reagent_plate_1[EEW_list[2]].bottom())
        p1000.dispense(EEWVol, CleanupPlate_2['A1'].bottom())
        p1000.drop_tip()
        #===============================================

        if DRYRUN == False:
            protocol.delay(seconds=5*60)

        if DRYRUN == False:
            protocol.delay(seconds=1*60)            

        protocol.comment('--> Removing Supernatant')
        RemoveSup = 200
        p1000.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        nozzlecheck('R8')
        #===============================================
        p1000.pick_up_tip(tiprack_200_XX['A4'])
        p1000.move_to(CleanupPlate_2['A1'].bottom(z=3.5))
        p1000.aspirate(RemoveSup-100, rate=0.25)
        protocol.delay(minutes=0.1)
        p1000.move_to(CleanupPlate_2['A1'].bottom(z=0.5))
        p1000.aspirate(100, rate=0.25)
        p1000.move_to(CleanupPlate_2['A1'].top(z=0.5))
        p1000.dispense(200, LW_reservoir['A1'].top(z=-7))
        protocol.delay(minutes=0.1)
        p1000.blow_out(LW_reservoir['A1'].top(z=-7))
        p1000.aspirate(20)
        p1000.drop_tip()
        #===============================================

        protocol.comment('--> Adding EEW')
        EEWVol    = 200
        p1000.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        nozzlecheck('R8')
        #===============================================
        p1000.pick_up_tip(tiprack_200_XX['A5'])
        p1000.aspirate(EEWVol, reagent_plate_1[EEW_list[3]].bottom())
        p1000.dispense(EEWVol, CleanupPlate_2['A1'].bottom())
        p1000.drop_tip()
        #===============================================

        if DRYRUN == False:
            protocol.delay(seconds=1*60)

        protocol.comment('--> Transfer Hybridization')
        TransferSup = 200
        p1000.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        nozzlecheck('R8')
        #===============================================
        p1000.pick_up_tip(tiprack_200_XX['A5'])
        p1000.move_to(CleanupPlate_2['A1'].bottom(z=0.25))
        p1000.aspirate(TransferSup, rate=0.25)
        p1000.dispense(TransferSup, CleanupPlate_2['A2'].bottom(z=1))
        p1000.drop_tip()
        #===============================================

        if DRYRUN == False:
            protocol.delay(seconds=5*60)
        
        if DRYRUN == False:
            protocol.delay(seconds=1*60)

        protocol.comment('--> Removing Supernatant')
        RemoveSup = 200
        p1000.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        nozzlecheck('R8')
        #===============================================
        p1000.pick_up_tip(tiprack_200_XX['A6'])
        p1000.move_to(CleanupPlate_2['A2'].bottom(z=3.5))
        p1000.aspirate(RemoveSup-100, rate=0.25)
        protocol.delay(minutes=0.1)
        p1000.move_to(CleanupPlate_2['A2'].bottom(z=0.5))
        p1000.aspirate(100, rate=0.25)
        p1000.move_to(CleanupPlate_2['A2'].top(z=0.5))
        p1000.dispense(200, LW_reservoir['A1'].top(z=-7))
        protocol.delay(minutes=0.1)
        p1000.blow_out(LW_reservoir['A1'].top(z=-7))
        p1000.aspirate(20)
        p1000.drop_tip()
        #===============================================

        protocol.comment('--> Removing Residual')
        p1000.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        nozzlecheck('R8')
        #===============================================
        p1000.pick_up_tip(tiprack_200_XX['A7'])
        p1000.move_to(CleanupPlate_2['A2'].bottom(z=0.3))
        p1000.aspirate(50, rate=0.25)
        p1000.default_speed = 200
        p1000.dispense(50, LW_reservoir['A1'].top(z=-7))
        protocol.delay(minutes=0.1)
        p1000.blow_out()
        p1000.default_speed = 400
        p1000.move_to(LW_reservoir['A1'].top(z=-7))
        p1000.move_to(LW_reservoir['A1'].top(z=0))
        p1000.drop_tip()
        #===============================================

        protocol.comment('==============================================')
        protocol.comment('--> ELUTE')
        protocol.comment('==============================================')

        #============================================================================================
        protocol.comment('MOVING: tiprack_200_XX = SCP_Position --> A4')
        stacker_200_1.enter_static_mode()
        protocol.move_labware(labware=tiprack_200_XX,new_location='A4',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
        protocol.comment('MOVING: tiprack_50_X = C4 --> SCP_Position')
        protocol.move_labware(labware=tiprack_50_X,new_location=SCP_Position,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
        #============================================================================================

        protocol.comment('--> Adding Elute')
        EluteVol    = 23
        p1000.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        nozzlecheck('R8')
        #===============================================
        p1000.pick_up_tip(tiprack_50_X['A4'])
        p1000.aspirate(EluteVol, Elute.bottom(z=0.3))
        p1000.dispense(EluteVol, CleanupPlate_2[pooled_1_list].bottom(z=0.3))
        p1000.drop_tip()
        #===============================================
        
        protocol.comment('--> Transfer Elution')
        TransferSup = 21
        p1000.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        nozzlecheck('R8')
        #===============================================
        p1000.pick_up_tip(tiprack_50_X['A5'])
        p1000.move_to(CleanupPlate_2[pooled_1_list].bottom(z=0.3))
        p1000.aspirate(TransferSup+1, rate=0.25)
        p1000.dispense(TransferSup+1, sample_plate_3[pooled_3_list].bottom(z=1))
        p1000.drop_tip()
        #===============================================
        
        protocol.comment('--> Adding ET2')
        ET2Vol    = 4
        ET2MixRep = 10 if DRYRUN == False else 1
        ET2MixVol = 20
        p1000.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        nozzlecheck('R8')
        #===============================================
        p1000.pick_up_tip(tiprack_50_X['A6'])
        p1000.aspirate(ET2Vol, ET2.bottom())
        p1000.dispense(ET2Vol, sample_plate_3[pooled_3_list].bottom())
        p1000.move_to(sample_plate_3[pooled_3_list].bottom())
        p1000.mix(ET2MixRep,ET2MixVol)
        p1000.drop_tip()
        #===============================================

    if STEP_PCR == True:
        protocol.comment('==============================================')
        protocol.comment('--> AMPLIFICATION')
        protocol.comment('==============================================')

        protocol.comment('--> Adding PPC')
        PPCVol    = 5
        p1000.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        nozzlecheck('R8')
        #===============================================
        p1000.pick_up_tip(tiprack_50_X['A7'])
        p1000.aspirate(PPCVol, PPC.bottom(z=0.5))
        p1000.dispense(PPCVol, sample_plate_3[pooled_3_list].bottom(z=0.5))
        p1000.drop_tip()
        #===============================================

        protocol.comment('--> Adding EPM')
        EPMVol    = 20
        EPMMixRep = 10 if DRYRUN == False else 1
        EPMMixVol = 45
        p1000.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        nozzlecheck('R8')
        #===============================================
        p1000.pick_up_tip(tiprack_50_X['A8'])
        p1000.aspirate(EPMVol, EPM_2.bottom(z=0.5))
        p1000.dispense(EPMVol, sample_plate_3[pooled_3_list].bottom(z=0.5))
        p1000.move_to(sample_plate_3[pooled_3_list].bottom(z=0.5))
        p1000.mix(EPMMixRep,EPMMixVol)
        p1000.drop_tip()
        #===============================================

        ############################################################################################################################################
        if ONDECK_THERMO == True:
            if DRYRUN == False:
                protocol.comment("SETTING THERMO to Room Temp")
                thermocycler.set_block_temperature(4)
                thermocycler.set_lid_temperature(100) 
            thermocycler.close_lid()
            if DRYRUN == False:
                profile_PCR_1 = [
                    {'temperature': 98, 'hold_time_seconds': 45}
                    ]
                thermocycler.execute_profile(steps=profile_PCR_1, repetitions=1, block_max_volume=50)
                profile_PCR_2 = [
                    {'temperature': 98, 'hold_time_seconds': 30},
                    {'temperature': 60, 'hold_time_seconds': 30},
                    {'temperature': 72, 'hold_time_seconds': 30}
                    ]
                thermocycler.execute_profile(steps=profile_PCR_2, repetitions=12, block_max_volume=50)
                profile_PCR_3 = [
                    {'temperature': 72, 'hold_time_minutes': 1}
                    ]
                thermocycler.execute_profile(steps=profile_PCR_3, repetitions=1, block_max_volume=50)
                thermocycler.set_block_temperature(10)
            thermocycler.open_lid()
        else:
            if DRYRUN == False:
                protocol.pause('Pausing to run PCR on an off deck Thermocycler ~25min')
            else:
                protocol.comment('Pausing to run PCR on an off deck Thermocycler ~25min')
        ############################################################################################################################################    

    if STEP_CLEANUP_2 == True:
        protocol.comment('==============================================')
        protocol.comment('--> Cleanup 2')
        protocol.comment('==============================================')
        
        protocol.comment('--> Transfer Elution')
        TransferSup = 45
        p1000.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        nozzlecheck('L8')
        #===============================================
        p1000.pick_up_tip(tiprack_50_X['A9'])
        p1000.move_to(sample_plate_3['A1'].bottom(z=0.5)) 
        p1000.aspirate(TransferSup+1, rate=0.25)
        p1000.dispense(TransferSup+1, CleanupPlate_2['A2'].bottom(z=1))
        p1000.drop_tip()
        #===============================================

        protocol.comment('--> ADDING AMPure (0.8x)')
        AMPureVol = 40.5
        SampleVol = 45
        AMPureMixRep = 5*60 if DRYRUN == False else 0.1*60
        AMPurePremix = 3 if DRYRUN == False else 1
        p1000.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        nozzlecheck('R8')
        #===============================================
        p1000.pick_up_tip(tiprack_50_X['A10'])
        p1000.mix(AMPurePremix,AMPureVol, AMPure.bottom(z=1))
        p1000.aspirate(AMPureVol, AMPure.bottom(z=1), rate=0.25)
        p1000.dispense(AMPureVol, CleanupPlate_2['A2'].bottom(z=1))
        p1000.default_speed = 5
        p1000.move_to(CleanupPlate_2['A2'].bottom(z=5))
        for Mix in range(2):
            p1000.aspirate(20)
            p1000.move_to(CleanupPlate_2['A2'].bottom(z=1))
            p1000.aspirate(20)
            p1000.dispense(20)
            p1000.move_to(CleanupPlate_2['A2'].bottom(z=5))
            p1000.dispense(20)
            Mix += 1
        p1000.blow_out(CleanupPlate_2['A2'].top(z=2))
        p1000.default_speed = 400
        p1000.move_to(CleanupPlate_2['A2'].top(z=5))
        p1000.move_to(CleanupPlate_2['A2'].top(z=0))
        p1000.move_to(CleanupPlate_2['A2'].top(z=5))
        p1000.drop_tip()
        #===============================================

        #============================================================================================
        protocol.comment('MOVING: tiprack_50_X = SCP_Position --> B4')
        stacker_200_2.enter_static_mode()
        protocol.move_labware(labware=tiprack_50_X,new_location='B4',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
        protocol.comment('MOVING: tiprack_200_XX = B4 --> SCP_Position')
        protocol.move_labware(labware=tiprack_200_XX,new_location=SCP_Position,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
        #============================================================================================

        if DRYRUN == False:
            protocol.delay(minutes=4)

        protocol.comment('--> Removing Supernatant')
        RemoveSup = 200
        p1000.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        nozzlecheck('R8')
        #===============================================
        p1000.pick_up_tip(tiprack_200_XX['A8'])
        p1000.move_to(CleanupPlate_2['A2'].bottom(z=3.5))
        p1000.aspirate(RemoveSup-100, rate=0.25)
        protocol.delay(minutes=0.1)
        p1000.move_to(CleanupPlate_2['A2'].bottom(z=0.5))
        p1000.aspirate(100, rate=0.25)
        p1000.default_speed = 5
        p1000.move_to(CleanupPlate_2['A2'].top(z=2))
        p1000.default_speed = 200
        p1000.dispense(200, LW_reservoir['A1'].top(z=-7))
        protocol.delay(minutes=0.1)
        p1000.blow_out()
        p1000.default_speed = 400
        p1000.move_to(LW_reservoir['A1'].top(z=-7))
        p1000.move_to(LW_reservoir['A1'].top(z=0))
        p1000.drop_tip()
        #===============================================

        protocol.comment('--> ETOH Wash')
        ETOHMaxVol = 150
        p1000.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        nozzlecheck('R8')
        #===============================================
        p1000.pick_up_tip(tiprack_200_XX['A9'])
        p1000.aspirate(ETOHMaxVol, ETOH_reservoir['A12'].bottom(z=1))
        p1000.move_to(ETOH_reservoir['A12'].top(z=0))
        p1000.move_to(ETOH_reservoir['A12'].top(z=-5))
        p1000.move_to(ETOH_reservoir['A12'].top(z=0))
        p1000.move_to(CleanupPlate_2['A2'].top(z=-2))
        p1000.dispense(ETOHMaxVol, rate=1)
        protocol.delay(minutes=0.1)
        p1000.blow_out()
        p1000.move_to(CleanupPlate_2['A2'].top(z=5))
        p1000.move_to(CleanupPlate_2['A2'].top(z=0))
        p1000.move_to(CleanupPlate_2['A2'].top(z=5))
        p1000.drop_tip()
        #================================================

        if DRYRUN == False:
            protocol.delay(minutes=0.5)
        
        protocol.comment('--> Remove ETOH Wash')
        RemoveSup = 200
        p1000.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        nozzlecheck('R8')
        #===============================================
        p1000.pick_up_tip(tiprack_200_XX['A10'])
        p1000.move_to(CleanupPlate_2['A2'].bottom(z=3.5))
        p1000.aspirate(RemoveSup-100, rate=0.25)
        protocol.delay(minutes=0.1)
        p1000.move_to(CleanupPlate_2['A2'].bottom(z=0.5)) 
        p1000.aspirate(100, rate=0.25)
        p1000.default_speed = 5
        p1000.move_to(CleanupPlate_2['A2'].top(z=2))
        p1000.default_speed = 200
        p1000.dispense(200, LW_reservoir['A1'].top(z=-7))
        protocol.delay(minutes=0.1)
        p1000.blow_out()
        p1000.default_speed = 400
        p1000.move_to(LW_reservoir['A1'].top(z=-7))
        p1000.move_to(LW_reservoir['A1'].top(z=0))
        p1000.drop_tip()
        #===============================================

        protocol.comment('--> ETOH Wash')
        ETOHMaxVol = 150
        p1000.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        nozzlecheck('R8')
        #===============================================
        p1000.pick_up_tip(tiprack_200_XX['A11'])
        p1000.aspirate(ETOHMaxVol, ETOH_reservoir['A12'].bottom(z=1))
        p1000.move_to(ETOH_reservoir['A12'].top(z=0))
        p1000.move_to(ETOH_reservoir['A12'].top(z=-5))
        p1000.move_to(ETOH_reservoir['A12'].top(z=0))
        p1000.move_to(CleanupPlate_2['A2'].top(z=-2))
        p1000.dispense(ETOHMaxVol, rate=1)
        protocol.delay(minutes=0.1)
        p1000.blow_out()
        p1000.move_to(CleanupPlate_2['A2'].top(z=5))
        p1000.move_to(CleanupPlate_2['A2'].top(z=0))
        p1000.move_to(CleanupPlate_2['A2'].top(z=5))
        p1000.drop_tip()
        #================================================

        if DRYRUN == False:
            protocol.delay(minutes=0.5)
        
        protocol.comment('--> Remove ETOH Wash')
        RemoveSup = 200
        p1000.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        nozzlecheck('R8')
        #===============================================
        p1000.pick_up_tip(tiprack_200_XX['A12'])
        p1000.move_to(CleanupPlate_2['A2'].bottom(z=3.5))
        p1000.aspirate(RemoveSup-100, rate=0.25)
        protocol.delay(minutes=0.1)
        p1000.move_to(CleanupPlate_2['A2'].bottom(z=0.5)) 
        p1000.aspirate(100, rate=0.25)
        p1000.default_speed = 5
        p1000.move_to(CleanupPlate_2['A2'].top(z=2))
        p1000.default_speed = 200
        p1000.dispense(200, LW_reservoir['A1'].top(z=-7))
        protocol.delay(minutes=0.1)
        p1000.blow_out()
        p1000.default_speed = 400
        p1000.move_to(LW_reservoir['A1'].top(z=-7))
        p1000.move_to(LW_reservoir['A1'].top(z=0))
        p1000.drop_tip()
        #===============================================
        
        if DRYRUN == False:
            protocol.delay(minutes=1)

        #============================================================================================
        protocol.comment('MOVING: tiprack_200_XX = SCP_Position --> A4')
        stacker_200_1.enter_static_mode()
        protocol.move_labware(labware=tiprack_200_XX,new_location='A4',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
        protocol.comment('MOVING: tiprack_50_X = C4 --> SCP_Position')
        protocol.move_labware(labware=tiprack_50_X,new_location=SCP_Position,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
        #============================================================================================

        protocol.comment('--> Adding RSB')
        RSBVol = 32
        RSBMixRep = 1*60 if DRYRUN == False else 0.1*60
        p1000.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        nozzlecheck('R8')
        #===============================================
        p1000.pick_up_tip(tiprack_50_X['A11'])
        p1000.aspirate(RSBVol, RSB_1.bottom(z=1))
        p1000.move_to((CleanupPlate_2.wells_by_name()['A2'].center().move(types.Point(x=1.3*0.8,y=0,z=-4))))
        p1000.dispense(RSBVol)
        p1000.move_to(CleanupPlate_2.wells_by_name()['A2'].bottom(z=1))
        p1000.aspirate(RSBVol)
        p1000.move_to((CleanupPlate_2.wells_by_name()['A2'].center().move(types.Point(x=0,y=1.3*0.8,z=-4))))
        p1000.dispense(RSBVol)
        p1000.move_to(CleanupPlate_2.wells_by_name()['A2'].bottom(z=1))
        p1000.aspirate(RSBVol)
        p1000.move_to((CleanupPlate_2.wells_by_name()['A2'].center().move(types.Point(x=1.3*-0.8,y=0,z=-4))))
        p1000.dispense(RSBVol)
        p1000.move_to(CleanupPlate_2.wells_by_name()['A2'].bottom(z=1))
        p1000.aspirate(RSBVol)
        p1000.move_to((CleanupPlate_2.wells_by_name()['A2'].center().move(types.Point(x=0,y=1.3*-0.8,z=-4))))
        p1000.dispense(RSBVol)
        p1000.move_to(CleanupPlate_2.wells_by_name()['A2'].bottom(z=1))
        p1000.aspirate(RSBVol)
        p1000.dispense(RSBVol)
        p1000.blow_out(CleanupPlate_2.wells_by_name()['A2'].center())
        p1000.move_to(CleanupPlate_2.wells_by_name()['A2'].top(z=5))
        p1000.move_to(CleanupPlate_2.wells_by_name()['A2'].top(z=0))
        p1000.move_to(CleanupPlate_2.wells_by_name()['A2'].top(z=5))
        p1000.drop_tip()
        #===============================================

        if DRYRUN == False:
            protocol.delay(minutes=3)

        protocol.comment('--> Transferring Supernatant')
        TransferSup = 30
        p1000.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        nozzlecheck('R8')
        #===============================================
        p1000.pick_up_tip(tiprack_50_X['A12'])
        p1000.move_to(CleanupPlate_2['A2'].bottom(z=0.5)) 
        p1000.aspirate(TransferSup+1, rate=0.25)
        p1000.dispense(TransferSup+1, sample_plate_3['A3'].bottom(z=1))
        p1000.drop_tip()
        #===============================================
    