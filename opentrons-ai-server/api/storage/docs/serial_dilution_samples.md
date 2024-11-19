# Serial dilution examples

## 1. Serial dilution example

<description>
Write a protocol using the Opentrons Python Protocol API v2 for Flex robot for the following description:

Metadata:

- Author: New API User
- ProtocolName: Serial Dilution Tutorial – Flex 1-channel
- Description: serial dilution

Requirements:

- requirements = {"robotType": "Flex", "apiLevel": "2.16"}

Labware:

- Tiprack: `Opentrons Flex 96 Tip Rack 200 µL` in slot D1
- Reservoir: `NEST 12 Well Reservoir 15 mL` in slot D2
- Plate: `NEST 96 Well Plate 200 µL Flat` in slot D3
- Trash bin in slot A3

Pipette mount:

- Flex 1-channel 1000 µL pipette is mounted on the left

Commands:

1. Use the left-mounted Flex 1-channel 1000 µL pipette to distribute 100 µL of diluent from well A1 of the reservoir to all wells of the plate.
2. For each of the 8 rows in the plate:
   a. Transfer 100 µL of solution from well A2 of the reservoir to the first well of the row, mixing 3 times with 50 µL after transfer.
   b. Perform a serial dilution by transferring 100 µL from each well to the next well in the row (from left to right), for a total of 11 transfers. Mix 3 times with 50 µL after each transfer.
   </description>

<protocol>

```python
from opentrons import protocol_api

metadata = {
    "protocolName": "Serial Dilution Tutorial – Flex 1-channel",
    "description": """serial dilution""",
    "author": "New API User"
    }

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.16"
    }

def run(protocol: protocol_api.ProtocolContext):
    tips = protocol.load_labware("opentrons_flex_96_tiprack_200ul", "D1")
    reservoir = protocol.load_labware("nest_12_reservoir_15ml", "D2")
    plate = protocol.load_labware("nest_96_wellplate_200ul_flat", "D3")
    trash = protocol.load_trash_bin("A3")
    left_pipette = protocol.load_instrument("flex_1channel_1000", "left", tip_racks=[tips])

    # distribute diluent
    left_pipette.transfer(100, reservoir["A1"], plate.wells())

    # loop through each row
    for i in range(8):

        # save the destination row to a variable
        row = plate.rows()[i]

        # transfer solution to first well in column
        left_pipette.transfer(100, reservoir["A2"], row[0], mix_after=(3, 50))

        # dilute the sample down the row
        left_pipette.transfer(100, row[:11], row[1:], mix_after=(3, 50))
```

</protocol>

## 2. Serial dilution example

<description>

serial&heater-shaker
serial&heater-shaker
100%
10
A3

Write a protocol using the Opentrons Python Protocol API v2 for Flex robot for the following description:

Metadata:

- Author: New API User
- ProtocolName: Serial Dilution Tutorial – Flex 8-channel
- Description: This protocol is the outcome of following the Python Protocol API Tutorial located at https://docs.opentrons.com/v2/tutorial.html. It takes a solution and progressively dilutes it by transferring it stepwise across a plate.

Requirements:

- requirements = {"robotType": "Flex", "apiLevel": "2.16"}

Labware:

- Tiprack: `Opentrons 96 Tip Rack 300 µL` in slot D1
- Reservoir: `NEST 12 Well Reservoir 15 mL` in slot D2
- Plate: `NEST 96 Well Plate 200 µL Flat` in slot D3
- Trash bin in slot A3

Pipette mount:

- Flex 8-channel 1000 µL pipette is mounted on the right

Commands:

1. Use the right-mounted Flex 8-channel 1000 µL pipette to distribute 100 µL of diluent from well A1 of the reservoir to the first row of the plate.
2. Transfer 100 µL of solution from well A2 of the reservoir to the first column of the first row in the plate, mixing 3 times with 50 µL after transfer.
3. Perform a serial dilution by transferring 100 µL from each column to the next column in the row (from left to right), for a total of 11 transfers. Mix 3 times with 50 µL after each transfer.

Write a protocol using the Opentrons Python Protocol API v2 for Flex robot for the following description:

Metadata:

- Author: New API User
- ProtocolName: Serial Dilution Tutorial – Flex 8-channel
- Description: This protocol is the outcome of following the Python Protocol API Tutorial located at https://docs.opentrons.com/v2/tutorial.html. It takes a solution and progressively dilutes it by transferring it stepwise across a plate.

Requirements:

- requirements = {"robotType": "Flex", "apiLevel": "2.16"}

Labware:

- Tiprack: `Opentrons 96 Tip Rack 300 µL` in slot D1
- Reservoir: `NEST 12 Well Reservoir 15 mL` in slot D2
- Plate: `NEST 96 Well Plate 200 µL Flat` in slot D3
- Trash bin in slot A3

Pipette mount:

- Flex 8-channel 1000 µL pipette is mounted on the right

Commands:

1. Use the right-mounted Flex 8-channel 1000 µL pipette to distribute 100 µL of diluent from well A1 of the reservoir to the first row of the plate.
2. Transfer 100 µL of solution from well A2 of the reservoir to the first column of the first row in the plate, mixing 3 times with 50 µL after transfer.
3. Perform a serial dilution by transferring 100 µL from each column to the next column in the row (from left to right), for a total of 11 transfers. Mix 3 times with 50 µL after each transfer.
   Turn on screen reader support
   To enable screen reader support, press ⌘+Option+Z To learn about keyboard shortcuts, press ⌘slash
   </description>

<protocol>

```python
from opentrons import protocol_api

metadata = {
    "protocolName": "Serial Dilution Tutorial – Flex 8-channel",
    "description": """This protocol is the outcome of following the
                   Python Protocol API Tutorial located at
                   https://docs.opentrons.com/v2/tutorial.html. It takes a
                   solution and progressively dilutes it by transferring it
                   stepwise across a plate.""",
    "author": "New API User"
    }

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.16"
    }

def run(protocol: protocol_api.ProtocolContext):
    tips = protocol.load_labware("opentrons_96_tiprack_300ul", "D1")
    reservoir = protocol.load_labware("nest_12_reservoir_15ml", "D2")
    plate = protocol.load_labware("nest_96_wellplate_200ul_flat", "D3")
    trash = protocol.load_trash_bin("A3")
    left_pipette = protocol.load_instrument("flex_8channel_1000", "right", tip_racks=[tips])

    # distribute diluent
    left_pipette.transfer(100, reservoir["A1"], plate.rows()[0])

    # no loop, 8-channel pipette

    # save the destination row to a variable
    row = plate.rows()[0]

    # transfer solution to first well in column
    left_pipette.transfer(100, reservoir["A2"], row[0], mix_after=(3, 50))

    # dilute the sample down the row
    left_pipette.transfer(100, row[:11], row[1:], mix_after=(3, 50))
```

</protocol>

## 3. Serial dilution example

<description>

Write a protocol using the Opentrons Python Protocol API v2 for OT-2 robot for the following description:

Metadata:

- Author: New API User
- ProtocolName: Serial Dilution Tutorial – OT-2 single-channel
- Description: This protocol is the outcome of following the Python Protocol API Tutorial located at https://docs.opentrons.com/v2/tutorial.html. It takes a solution and progressively dilutes it by transferring it stepwise across a plate.
- apiLevel: 2.16

Requirements:

- robotType: OT-2
- apiLevel: 2.16

Labware:

- Tiprack: `Opentrons 96 Tip Rack 300 µL` in slot 1
- Reservoir: `NEST 12 Well Reservoir 15 mL` in slot 2
- Plate: `NEST 96 Well Plate 200 µL Flat` in slot 3

Pipette mount:

- P300 Single-Channel GEN2 pipette is mounted on the left

Commands:

1. Use the left-mounted P300 Single-Channel GEN2 pipette to distribute 100 µL of diluent from well A1 of the reservoir to all wells of the plate.
2. For each of the 8 rows in the plate:
   a. Transfer 100 µL of solution from well A2 of the reservoir to the first well of the row, mixing 3 times with 50 µL after transfer.
   b. Perform a serial dilution by transferring 100 µL from each well to the next well in the row (from left to right), for a total of 11 transfers. Mix 3 times with 50 µL after each transfer.

</description>

<protocol>

```python
from opentrons import protocol_api

metadata = {
    "apiLevel": "2.16",
    "protocolName": "Serial Dilution Tutorial – OT-2 single-channel",
    "description": """This protocol is the outcome of following the
                   Python Protocol API Tutorial located at
                   https://docs.opentrons.com/v2/tutorial.html. It takes a
                   solution and progressively dilutes it by transferring it
                   stepwise across a plate.""",
    "author": "New API User"
    }

def run(protocol: protocol_api.ProtocolContext):
    tips = protocol.load_labware("opentrons_96_tiprack_300ul", 1)
    reservoir = protocol.load_labware("nest_12_reservoir_15ml", 2)
    plate = protocol.load_labware("nest_96_wellplate_200ul_flat", 3)
    left_pipette = protocol.load_instrument("p300_single_gen2", "left", tip_racks=[tips])

    # distribute diluent
    left_pipette.transfer(100, reservoir["A1"], plate.wells())

    # loop through each row
    for i in range(8):

        # save the destination row to a variable
        row = plate.rows()[i]

        # transfer solution to first well in column
        left_pipette.transfer(100, reservoir["A2"], row[0], mix_after=(3, 50))

        # dilute the sample down the row
        left_pipette.transfer(100, row[:11], row[1:], mix_after=(3, 50))
```

</protocol>

## 4. Serial dilution example

<description>
Write a protocol using the Opentrons Python Protocol API v2 for OT-2 robot for the following description:

Metadata:

- Author: New API User
- ProtocolName: Serial Dilution Tutorial – OT-2 8-channel
- Description: This protocol is the outcome of following the Python Protocol API Tutorial located at https://docs.opentrons.com/v2/tutorial.html. It takes a solution and progressively dilutes it by transferring it stepwise across a plate.
- apiLevel: 2.16

Requirements:

- robotType: OT-2
- apiLevel: 2.16

Labware:

- Tiprack: `Opentrons 96 Tip Rack 300 µL` in slot 1
- Reservoir: `NEST 12 Well Reservoir 15 mL` in slot 2
- Plate: `NEST 96 Well Plate 200 µL Flat` in slot 3

Pipette mount:

- P300 8-Channel GEN2 pipette is mounted on the right

Commands:

1. Use the right-mounted P300 8-Channel GEN2 pipette to distribute 100 µL of diluent from well A1 of the reservoir to the first row of the plate.
2. Transfer 100 µL of solution from well A2 of the reservoir to the first column of the plate (row A), mixing 3 times with 50 µL after transfer.
3. Perform a serial dilution by transferring 100 µL from each column to the next column in the row (from left to right), for a total of 11 transfers across the plate. Mix 3 times with 50 µL after each transfer.
   </description>

<protocol>

```python
from opentrons import protocol_api

metadata = {
    "apiLevel": "2.16",
    "protocolName": "Serial Dilution Tutorial – OT-2 8-channel",
    "description": """This protocol is the outcome of following the
                   Python Protocol API Tutorial located at
                   https://docs.opentrons.com/v2/tutorial.html. It takes a
                   solution and progressively dilutes it by transferring it
                   stepwise across a plate.""",
    "author": "New API User"
    }

def run(protocol: protocol_api.ProtocolContext):
    tips = protocol.load_labware("opentrons_96_tiprack_300ul", 1)
    reservoir = protocol.load_labware("nest_12_reservoir_15ml", 2)
    plate = protocol.load_labware("nest_96_wellplate_200ul_flat", 3)
    left_pipette = protocol.load_instrument("p300_multi_gen2", "right", tip_racks=[tips])

    # distribute diluent
    left_pipette.transfer(100, reservoir["A1"], plate.rows()[0])

    # no loop, 8-channel pipette

    # save the destination row to a variable
    row = plate.rows()[0]

    # transfer solution to first well in column
    left_pipette.transfer(100, reservoir["A2"], row[0], mix_after=(3, 50))

    # dilute the sample down the row
    left_pipette.transfer(100, row[:11], row[1:], mix_after=(3, 50))
```

</protocol>

## 5. Serial dilution example

<description>
Write a protocol using the Opentrons Python Protocol API v2 for OT-2 robot for the following description:

Metadata:

- Author: John C. Lynch
- ProtocolName: Serial Dilution for Eskil
- Description: Execute serial dilution protocol
- Source: Custom Protocol Request
- API Level: 2.19

Requirements:

- requirements = {"robotType": "OT-2", "apiLevel": "2.19"}

Constants:

- Plate type: Opentrons 96 Aluminum Block NEST Well Plate 100 µL
- Dilution factor: 1.5
- Number of dilutions: 10
- Total mixing volume: 150 uL

Modules:

- Temperature module loaded in slot 4

Labware:

- NEST 12 Well Reservoir 15 mL in slot 1
- Dilution plate (Opentrons 96 Aluminum Block NEST Well Plate 100 uL) loaded on temperature module
- Two Opentrons 96 Tip Racks 300 uL in slots 2 and 3

Pipette Mount:

- P300 Multi-Channel GEN2 pipette mounted on the left side

Calculations:

- Transfer volume = Total mixing volume / Dilution factor
- Diluent volume = Total mixing volume - Transfer volume

Commands:

1. Using the P300 Multi-Channel pipette, transfer diluent from the first well of the reservoir to wells 2-10 of the first row of the dilution plate:

   - Volume: calculated diluent volume
   - Use a 10 uL air gap
   - Use new tips for each transfer

2. Perform serial dilutions across the first row of the dilution plate:

   - For each pair of adjacent wells (from well 1 to well 9, transferring to wells 2 to 10):
     - Transfer the calculated transfer volume
     - Use a 10 uL air gap
     - After each transfer, mix 5 times with (Total mixing volume - 5 uL)
     - Use new tips for each transfer

3. Add blank to the last well:
   - Transfer calculated diluent volume from the first reservoir well to the last well of the first row in the dilution plate
   - Use a 10 uL air gap
   - Use a new tip
     </description>

<protocol>

```python
metadata = {
    'protocolName': 'Serial Dilution for Eskil',
    'author': 'John C. Lynch',
    'source': 'Custom Protocol Request',
    'apiLevel': '2.19'
}

def run(protocol):

    # Constants
    PLATE_TYPE = 'opentrons_96_aluminumblock_nest_wellplate_100ul'
    DILUTION_FACTOR = 1.5
    NUM_DILUTIONS = 10
    TOTAL_MIXING_VOLUME = 150

    # Calculated volumes
    transfer_volume = TOTAL_MIXING_VOLUME / DILUTION_FACTOR
    diluent_volume = TOTAL_MIXING_VOLUME - transfer_volume

    # Load temperature module and labware
    temp_module = protocol.load_module('temperature module gen2', '4')
    reservoir = protocol.load_labware('nest_12_reservoir_15ml', '1')
    dilution_plate = temp_module.load_labware(PLATE_TYPE)

    # Load tipracks
    tipracks = [
        protocol.load_labware('opentrons_96_tiprack_300ul', slot)
        for slot in ['2', '3']
    ]

    # Load pipette
    pipette = protocol.load_instrument(
        'p300_multi_gen2',
        mount='left',
        tip_racks=tipracks
    )

    # 1. Distribute diluent
    pipette.transfer(
        diluent_volume,
        reservoir.wells()[0],
        dilution_plate.rows()[0][1:NUM_DILUTIONS],
        air_gap=10,
        new_tip='always'
    )

    # 2. Perform serial dilutions
    sources = dilution_plate.rows()[0][:NUM_DILUTIONS-1]
    dests = dilution_plate.rows()[0][1:NUM_DILUTIONS]

    pipette.transfer(
        transfer_volume,
        sources,
        dests,
        air_gap=10,
        mix_after=(5, TOTAL_MIXING_VOLUME-5),
        new_tip='always'
    )

    # 3. Add blank
    pipette.transfer(
        diluent_volume,
        reservoir.wells()[0],
        dilution_plate.rows()[0][-1],
        air_gap=10,
        new_tip='always'
    )
```

</protocol>

## 6. Serial dilution example

<description>
Write a protocol using the Opentrons Python Protocol API v2 for Flex robot for the following description:

Metadata:

- Author: Opentrons <protocols@opentrons.com>
- ProtocolName: Customizable Serial Dilution
- Source: Protocol Library

Requirements:

- requirements = {"robotType": "Flex", "apiLevel": "2.19"}

Inside the run function:

Constants:

- Dilution factor: 3
- Number of dilutions: 10
- Total mixing volume: 150.0 µL
- Air gap volume: 10 µL

Calculations:

- Transfer volume = Total mixing volume / Dilution factor
- Diluent volume = Total mixing volume - Transfer volume

Labware:

- NEST 12 Well Reservoir 15 mL in slot D2
- NEST 96 Well Plate 200 µL Flat in slot D3
- Two Opentrons Flex 96 Filter Tip Racks 1000 µL in slots C1 and D1
- Trash bin in slot A3

Pipette Mount:

- Flex 1-channel 1000 µL pipette mounted on the right side

Liquid Definitions:

- Diluent liquid: Green color (#33FF33), loaded in reservoir at 80% max volume
- Sample liquid: Red color (#FF0000), loaded in first column of plate at 150 µL per well

Commands:

1. Distribute diluent to dilution plate:

   - Pick up one tip
   - Transfer calculated diluent volume from reservoir to all wells in columns 2-11
   - Use 10 µL air gap for each transfer
   - Reuse the same tip for all transfers
   - Drop tip after completion

2. Perform serial dilutions:

   - Pick up one tip
   - For each well in columns 1-10 (source) to columns 2-11 (destination):
     - Transfer calculated transfer volume
     - Use 10 µL air gap
     - After each transfer, mix 5 times with half the total mixing volume
     - Reuse the same tip for all transfers
   - Drop tip after completion

3. Add blank to last column:
   - Pick up one tip
   - Transfer calculated diluent volume from reservoir to all wells in column 12
   - Use 10 µL air gap
   - Reuse the same tip for all transfers
   - Drop tip after completion
     </description>

<protocol>

```python
metadata = {
    'protocolName': 'Customizable Serial Dilution',
    'author': 'Opentrons <protocols@opentrons.com>',
    'source': 'Protocol Library'
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.19"
}

def run(protocol):

    # Constants
    DILUTION_FACTOR = 3
    NUM_DILUTIONS = 10
    TOTAL_MIXING_VOLUME = 150.0
    AIR_GAP_VOLUME = 10

    # Calculated volumes
    transfer_volume = TOTAL_MIXING_VOLUME / DILUTION_FACTOR
    diluent_volume = TOTAL_MIXING_VOLUME - transfer_volume

    # Labware setup
    trough = protocol.load_labware('nest_12_reservoir_15ml', 'D2')
    plate = protocol.load_labware('nest_96_wellplate_200ul_flat', 'D3')
    tip_name = "opentrons_flex_96_filtertiprack_1000ul"
    tipracks = [
        protocol.load_labware(tip_name, slot)
        for slot in ["C1", "D1"]
    ]

    # Pipette setup
    pipette = protocol.load_instrument('flex_1channel_1000', 'right', tipracks)

    # Waste setup
    trash = protocol.load_trash_bin("A3")

    # Reagent setup
    diluent = trough.wells()[0]
    source = plate.columns()[0]

    # Define and load liquids
    diluent_liquid = protocol.define_liquid(
        name="Dilutent",
        description="Diluent liquid is filled in the reservoir",
        display_color="#33FF33"
    )
    sample_liquid = protocol.define_liquid(
        name="Sample",
        description="Non-diluted samples are loaded in the 1st column",
        display_color="#FF0000"
    )

    diluent.load_liquid(liquid=diluent_liquid, volume=0.8 * diluent.max_volume)
    for well in source:
        well.load_liquid(liquid=sample_liquid, volume=TOTAL_MIXING_VOLUME)

    # Set up dilution destinations
    dilution_destination_sets = plate.columns()[1:NUM_DILUTIONS+1]
    dilution_source_sets = plate.columns()[:NUM_DILUTIONS]
    blank_set = plate.columns()[NUM_DILUTIONS+1]

    # 1. Distribute diluent
    all_diluent_destinations = [well for wells in dilution_destination_sets for well in wells]
    pipette.pick_up_tip()
    for dest in all_diluent_destinations:
        pipette.transfer(
            diluent_volume,
            diluent,
            dest,
            air_gap=AIR_GAP_VOLUME,
            new_tip='never'
        )
    pipette.drop_tip()

    # 2. Perform serial dilutions
    pipette.pick_up_tip()
    for source_set, dest_set in zip(dilution_source_sets, dilution_destination_sets):
        for s, d in zip(source_set, dest_set):
            pipette.transfer(
                transfer_volume,
                s,
                d,
                air_gap=AIR_GAP_VOLUME,
                mix_after=(5, TOTAL_MIXING_VOLUME/2),
                new_tip='never'
            )
    pipette.drop_tip()

    # 3. Add blank
    pipette.pick_up_tip()
    for blank_well in blank_set:
        pipette.transfer(
            diluent_volume,
            diluent,
            blank_well,
            air_gap=AIR_GAP_VOLUME,
            new_tip='never'
        )
    pipette.drop_tip()
```

</protocol>

## 7. Serial dilution example

<description>
Write a protocol using the Opentrons Python Protocol API v2 for Flex robot for the following description:

Metadata:

- Author: Opentrons <protocols@opentrons.com>
- ProtocolName: Customizable Serial Dilution
- Source: Protocol Library

Requirements:

- requirements = {"robotType": "Flex", "apiLevel": "2.19"}

Inside the run function:

Constants:

- Dilution factor: 3
- Number of dilutions: 10
- Total mixing volume: 150.0 µL
- Air gap volume: 10 µL

Calculations:

- Transfer volume = Total mixing volume / Dilution factor
- Diluent volume = Total mixing volume - Transfer volume

Labware:

- NEST 12 Well Reservoir 15 mL in slot D2
- NEST 96 Well Plate 200 µL Flat in slot D3
- Two Opentrons Flex 96 Filter Tip Racks 1000 µL in slots C1 and D1
- Trash bin in slot A3

Pipette Mount:

- Flex 8-channel 1000 µL pipette mounted on the right side

Liquid Definitions:

- Diluent liquid: Green color (#33FF33), loaded in reservoir at 80% max volume
- Sample liquid: Red color (#FF0000), loaded in first column of plate at 150 µL per well

Commands:

1. Distribute diluent to dilution plate:

   - Pick up one tip with 8-channel pipette
   - Transfer calculated diluent volume from reservoir to wells 2-11 in row A
   - Use 10 µL air gap for each transfer
   - Reuse the same tip for all transfers
   - Drop tip after completion

2. Perform serial dilutions along row A:

   - Pick up one tip with 8-channel pipette
   - For each well pair from A1 to A10 (source) to A2 to A11 (destination):
     - Transfer calculated transfer volume
     - Use 10 µL air gap
     - After each transfer, mix 5 times with half the total mixing volume
     - Reuse the same tip for all transfers
   - Drop tip after completion

3. Add blank to well A12:
   - Pick up one tip with 8-channel pipette
   - Transfer calculated diluent volume from reservoir to well A12
   - Use 10 µL air gap
   - Reuse the same tip
   - Drop tip after completion
     </description>

<protocol>

```python
metadata = {
    'protocolName': 'Customizable Serial Dilution',
    'author': 'Opentrons <protocols@opentrons.com>',
    'source': 'Protocol Library'
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.19"
}

def run(protocol):

    # Constants
    DILUTION_FACTOR = 3
    NUM_DILUTIONS = 10
    TOTAL_MIXING_VOLUME = 150.0
    AIR_GAP_VOLUME = 10

    # Calculated volumes
    transfer_volume = TOTAL_MIXING_VOLUME / DILUTION_FACTOR
    diluent_volume = TOTAL_MIXING_VOLUME - transfer_volume

    # Labware setup
    trough = protocol.load_labware('nest_12_reservoir_15ml', 'D2')
    plate = protocol.load_labware('nest_96_wellplate_200ul_flat', 'D3')
    tip_name = "opentrons_flex_96_filtertiprack_1000ul"
    tipracks = [
        protocol.load_labware(tip_name, slot)
        for slot in ["C1", "D1"]
    ]

    # Pipette setup
    pipette = protocol.load_instrument('flex_8channel_1000', 'right', tipracks)

    # Waste setup
    trash = protocol.load_trash_bin("A3")

    # Reagent setup
    diluent = trough.wells()[0]
    source = plate.columns()[0]

    # Define and load liquids
    diluent_liquid = protocol.define_liquid(
        name="Dilutent",
        description="Diluent liquid is filled in the reservoir",
        display_color="#33FF33"
    )
    sample_liquid = protocol.define_liquid(
        name="Sample",
        description="Non-diluted samples are loaded in the 1st column",
        display_color="#FF0000"
    )

    diluent.load_liquid(liquid=diluent_liquid, volume=0.8 * diluent.max_volume)
    for well in source:
        well.load_liquid(liquid=sample_liquid, volume=TOTAL_MIXING_VOLUME)

    # Set up dilution destinations
    dilution_destination_sets = [[row] for row in plate.rows()[0][1:NUM_DILUTIONS+1]]
    dilution_source_sets = [[row] for row in plate.rows()[0][:NUM_DILUTIONS]]
    blank_set = [plate.rows()[0][NUM_DILUTIONS+1]]

    # 1. Distribute diluent
    all_diluent_destinations = [well for wells in dilution_destination_sets for well in wells]
    pipette.pick_up_tip()
    for dest in all_diluent_destinations:
        pipette.transfer(
            diluent_volume,
            diluent,
            dest,
            air_gap=AIR_GAP_VOLUME,
            new_tip='never'
        )
    pipette.drop_tip()

    # 2. Perform serial dilutions
    pipette.pick_up_tip()
    for source_set, dest_set in zip(dilution_source_sets, dilution_destination_sets):
        for s, d in zip(source_set, dest_set):
            pipette.transfer(
                transfer_volume,
                s,
                d,
                air_gap=AIR_GAP_VOLUME,
                mix_after=(5, TOTAL_MIXING_VOLUME/2),
                new_tip='never'
            )
    pipette.drop_tip()

    # 3. Add blank
    pipette.pick_up_tip()
    for blank_well in blank_set:
        pipette.transfer(
            diluent_volume,
            diluent,
            blank_well,
            air_gap=AIR_GAP_VOLUME,
            new_tip='never'
        )
    pipette.drop_tip()
```

</protocol>
