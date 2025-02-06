metadata = { 
    'protocolName': 'QUiCKR V2 kit - part 2 ',
    'author': 'Opentrons'
}
requirements = {
    'robotType': 'Flex',
    'apiLevel': '2.20'
}


def add_parameters(parameters):

    parameters.add_int(
    variable_name="num_plate_pairs",
    display_name="Number of 96-384 pairs",
    description="Number of 96-384 pairs",
    default=2,
    choices=[
        {"display_name": "1", "value": 1},
        {"display_name": "2", "value": 2},
        {"display_name": "3", "value": 3}
    ]
)


def run(ctx):

    num_plate_pairs = ctx.params.num_plate_pairs

    # deck layout
    plate_384_slots = ['C1', 'B1', 'A1']
    plate_384_name = ['Assay Plate #1', 'Assay Plate #2', 'Assay Plate #3']
    plate_96_slots = ['C2', 'B2', 'A2']
    plate_96_name = ['Sample Plate #1', 'Sample Plate #2', 'Sample Plate #3']

    plate_384 = [ctx.load_labware('biorad_384_wellplate_50ul', slot, name) 
                 for slot, name in zip(plate_384_slots[:num_plate_pairs], plate_384_name[:num_plate_pairs])]
    plate_96 = [ctx.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', slot, name) 
                for slot, name in zip(plate_96_slots[:num_plate_pairs], plate_96_name[:num_plate_pairs])]
    
    if num_plate_pairs == 1:
        deck_slots_50 = ['C3', 'B3']
        tiprack_adapter = [ctx.load_adapter('opentrons_flex_96_tiprack_adapter', slot) 
                        for slot in deck_slots_50]
        
        tiprack_50 = [tiprack_adapter[i].load_labware('opentrons_flex_96_tiprack_50ul',  slot) 
                    for i, slot in enumerate(deck_slots_50)]
        
        tips = [tiprack_50[0], tiprack_50[1]]
        
    elif num_plate_pairs == 2:
        deck_slots_50 = ['C3', 'B3', 'A3']
        tiprack_adapter = [ctx.load_adapter('opentrons_flex_96_tiprack_adapter', slot) 
                        for slot in deck_slots_50]
        
        tiprack_50 = [tiprack_adapter[i].load_labware('opentrons_flex_96_tiprack_50ul',  slot) 
                    for i, slot in enumerate(deck_slots_50)]        
        
        extra_50 = ['C4']
        tiprack_50_refill = [ctx.load_labware('opentrons_flex_96_tiprack_50ul',  slot) 
                            for slot in extra_50]

        tips = [tiprack_50[0], tiprack_50[1], tiprack_50[2], tiprack_50_refill[0]]

    elif num_plate_pairs == 3:    
        deck_slots_50 = ['C3', 'B3', 'A3']
        tiprack_adapter = [ctx.load_adapter('opentrons_flex_96_tiprack_adapter', slot) 
                        for slot in deck_slots_50]
        
        tiprack_50 = [tiprack_adapter[i].load_labware('opentrons_flex_96_tiprack_50ul',  slot) 
                    for i, slot in enumerate(deck_slots_50)] 
        
        extra_50 = ['C4', 'B4', 'A4']
        tiprack_50_refill = [ctx.load_labware('opentrons_flex_96_tiprack_50ul',  slot) 
                            for slot in extra_50]
        
        tips = [tiprack_50[0], tiprack_50[1], tiprack_50[2], tiprack_50_refill[0], tiprack_50_refill[1], tiprack_50_refill[2]]

    # pipette setting
    p = ctx.load_instrument("flex_96channel_200", tip_racks=tiprack_50[:3])
    p.flow_rate.aspirate = 7
    p.flow_rate.dispense = 7 * 2


    # liquid info
    sample_liq = ctx.define_liquid(name="Samples", description="Samples (diluted)", display_color="#7EFF42")
    for plate in plate_96:
        for col in [0, 4]:
            [plate.rows()[row][col].load_liquid(liquid=sample_liq, volume=40)
             for row in range(8)]
        [plate.rows()[row][8].load_liquid(liquid=sample_liq, volume=40)
             for row in range(7)]
        for col in [1,2,5,6]:
            [plate.rows()[row][col].load_liquid(liquid=sample_liq, volume=40)
             for row in range(8)]
        for col in [3,7]:
            [plate.rows()[row][col].load_liquid(liquid=sample_liq, volume=60)
             for row in range(8)]
        for col in [9,10]:
            [plate.rows()[row][col].load_liquid(liquid=sample_liq, volume=40)
             for row in range(7)]
        [plate.rows()[row][11].load_liquid(liquid=sample_liq, volume=60)
             for row in range(7)]
            
    control_liq = ctx.define_liquid(name="Controls", description="Controls", display_color="#FF4F4F")
    for plate in plate_96:
            [plate.wells()[well].load_liquid(liquid=control_liq, volume=40)
             for well in [71, 79, 87, 95]]


    for i in range(num_plate_pairs):

        if i == 1:
            ctx.move_labware(labware = tiprack_50[0],
                            new_location = "D4",
                            use_gripper=True,
                            ) 
            ctx.move_labware(labware = tiprack_50_refill[0],
                            new_location = tiprack_adapter[0],
                            use_gripper=True,
                            )
        elif i == 2:
            ctx.move_labware(labware = tiprack_50[1],
                            new_location = "A1",
                            use_gripper=True,
                            ) 
            ctx.move_labware(labware = tiprack_50_refill[1],
                            new_location = tiprack_adapter[1],
                            use_gripper=True,
                            )
            ctx.move_labware(labware = tiprack_50[2],
                            new_location = "A2",
                            use_gripper=True,
                            ) 
            ctx.move_labware(labware = tiprack_50_refill[2],
                            new_location = tiprack_adapter[2],
                            use_gripper=True,
                            )
        for n in range(12):
            p.tip_racks = [tips[i*2]]
            p.pick_up_tip()
            p.aspirate(7*2, plate_96[i]['A1'].bottom(z=2))
            ctx.delay(seconds=1)  
            p.dispense(7, plate_384[i]['A1'].bottom(z=2))   
            ctx.delay(seconds=1)  
            p.dispense(7, plate_384[i]['A2'].bottom(z=2))      
            ctx.delay(seconds=1)  
            p.mix(5, 7, plate_384[i]['A2'].bottom(z=2))
            p.blow_out(plate_384[i]['A2'].top())
            p.mix(5, 7, plate_384[i]['A1'].bottom(z=2))        
            p.blow_out(plate_384[i]['A1'].top())
            p.return_tip() 
            p.reset_tipracks()
            p.tip_racks = [tips[i*2+1]]
            p.pick_up_tip()
            p.aspirate(7*2, plate_96[i]['A1'].bottom(z=2))
            ctx.delay(seconds=1)  
            p.dispense(7, plate_384[i]['B1'].bottom(z=2))  
            ctx.delay(seconds=1)         
            p.dispense(7, plate_384[i]['B2'].bottom(z=2)) 
            ctx.delay(seconds=1)      
            p.mix(5, 7, plate_384[i]['B2'].bottom(z=2))
            p.blow_out(plate_384[i]['B2'].top())
            p.mix(5, 7, plate_384[i]['B1'].bottom(z=2))        
            p.blow_out(plate_384[i]['B1'].top())
            p.return_tip()
            p.reset_tipracks()

