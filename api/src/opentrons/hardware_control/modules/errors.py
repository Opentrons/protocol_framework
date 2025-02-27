from opentrons.drivers.flex_stacker.types import StackerAxis
from opentrons_shared_data.errors import EnumeratedError


class UpdateError(RuntimeError):
    pass


class AbsorbanceReaderDisconnectedError(RuntimeError):
    def __init__(self, serial: str):
        self.serial = serial


class FlexStackerStallError(EnumeratedError):
    def __init__(self, serial: str, axis: StackerAxis):
        self.serial = serial
        self.axis = axis
