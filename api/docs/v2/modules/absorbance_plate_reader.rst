:og:description: How to use the Absorbance Plate Reader Module in a Python protocol.

.. _absorbance-plate-reader-module:

******************************
Absorbance Plate Reader Module
******************************

The Absorbance Plate Reader Module is an on-deck microplate spectrophotometer that works with the Flex robot only. The module uses light absorbance to determine sample concentrations in 96-well plates.

The Absorbance Plate Reader is represented in code by a :py:class:`.AbsorbanceReaderContext` object, which has methods for moving the module lid with the Flex Gripper, initializing the module, and performing a read at a single wavelength or multiple wavelengths. With the Python Protocol API, you can process plate reader data immediately in your protocol or export it to a CSV for post-run use.

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

Flex uses the gripper to move the lid between its two positions.

  - :py:meth:`~.AbsorbanceReaderContext.open_lid()` moves the lid to the righthand side of the caddy, in deck column 4.
  - :py:meth:`~.AbsorbanceReaderContext.close_lid()` moves the lid onto the detection unit, in deck column 3.

If you call ``open_lid()`` or ``close_lid()`` and the lid is already in the corresponding position, the method will succeed immediately. You need to call ``close_lid()`` before initializing the reader, even if the reader was in the closed position at the start of the protocol.

.. warning::
    Do not move the lid manually, during or outside of a protocol. The API does not allow manual lid movement because there is a risk of damaging the module.

Initialization
==============

Initializing the reader prepares it to read a plate later in your protocol. The :py:meth:`.AbsorbanceReaderContext.initialize` method accepts parameters for the number of readings you want to take, the wavelengths to read, and whether you want to compare the reading to a reference wavelength.

The module uses these parameters immediately to perform the physical initialization. Additionally, the API preserves these values and uses them when you read the plate later in your protocol.

Let's take a look at examples of how to combine these parameters to prepare different types of readings. The simplest reading measures one wavelength, with no reference wavelength::

    pr_mod.initialize(mode="single", wavelengths=[400])

.. versionadded:: 2.21

Now the reader is prepared to read at 400 nm. Note that the ``wavelengths`` parameter always takes a list of integer wavelengths, even when only reading a single wavelength.

This example can be extended by adding a reference wavelength::

    pr_mod.initialize(
        mode="single", wavelengths=[400], reference_wavelength=[567]
    )

When configured this way, the module will read twice. In the :ref:`output data <plate-reader-output>`, the values read for ``reference_wavelength`` will be subtracted from the values read for the single member of ``wavelengths``. This is useful for normalization, or to correct for background interference in wavelength measurements.

The reader can also be initialized to take multiple measurements. When ``mode="multi"``, the ``wavelengths`` list can have up to six elements. This will initialize the reader to read at three wavelengths::

    pr_mod.initialize(mode="multi", wavelengths=[400, 500, 600])

You can't use a reference wavelength when performing multiple measurements.


Reading and Using Data
======================

TK

.. _plate-reader-output:

