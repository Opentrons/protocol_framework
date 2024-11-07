:og:description: How to use the Absorbance Plate Reader Module in a Python protocol.

.. _absorbance-plate-reader-module:

******************************
Absorbance Plate Reader Module
******************************

The Absorbance Plate Reader Module is an on-deck microplate spectrophotometer that works with the Flex robot only. The module uses light absorbance to determine sample concentrations in 96-well plates. 

The Absorbance Plate Reader is represented in code by a :py:class:`.AbsorbanceReaderContext` object, which has methods for moving the module lid with the gripper, initializing the module, and performing a read at a single wavelength or multiple wavelengths. With the Python Protocol API, you can process plate reader data immediately in your protocol or export it to a CSV for post-run use.

This page explains the actions necessary for using the Absorbance Plate Reader. These combine to form the typical reader workflow:

  1. Close the lid with no plate inside
  2. Initialize the reader
  3. Open the lid
  4. Move a plate onto the module
  5. Close the lid
  6. Read the plate


Loading and Deck Slots
======================

The examples in this section will use an Absorbance Plate Reader Module loaded as follows::

    pr_mod = protocol.load_module(
        module_name="absorbanceReaderV1",
        location="D3"
    )

.. versionadded:: 2.21

The Absorbance Plate Reader can only be loaded in slots A3–D3. If you try to load it in any other slot, the API will raise an error. The module's caddy is designed such that the detection unit is in deck column 3 and the special staging area for the lid/illumination unit is in deck column 4. You can't load or move other labware on the Absorbance Plate Reader caddy in deck column 4, even while the lid is in the closed position (on top of the detection unit in deck column 3).

Lid Control
===========

TK

Initialization
==============

TK

Reading and Using Data
======================

TK