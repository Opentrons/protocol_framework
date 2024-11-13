from dataclasses import dataclass
import serial
from serial.tools.list_ports import comports
import re
from enum import Enum

STACKER_VID = 0x483
STACKER_PID = 0xEF24
STACKER_FREQ = 115200


class HardwareRevision(Enum):
    """Hardware Revision."""

    NFF = "nff"
    EVT = "a1"


@dataclass
class StackerInfo:
    """Stacker Info."""

    fw: str
    hw: HardwareRevision
    sn: str


class FlexStacker:
    """FLEX Stacker Driver."""

    @classmethod
    def build(cls, port: str = "") -> "FlexStacker":
        if not port:
            for i in comports():
                if i.vid == STACKER_VID and i.pid == STACKER_PID:
                    port = i.device
                    break
        assert port, "could not find connected FLEX Stacker"
        return cls(port)

    @classmethod
    def build_simulator(cls, port: str = "") -> "FlexStacker":
        return cls(port, simulating=True)

    def __init__(self, port: str, simulating: bool = False) -> None:
        self._serial = serial.Serial(port, baudrate=STACKER_FREQ)
        self._simulating = simulating

    def _send_and_recv(self, msg: str, guard_ret: str = "") -> str:
        """Internal utility to send a command and receive the response"""
        self._serial.write(msg.encode())
        ret = self._serial.readline()
        if guard_ret:
            if not ret.startswith(guard_ret.encode()):
                raise RuntimeError(f"Incorrect Response: {ret}")
        if ret.startswith("ERR".encode()):
            raise RuntimeError(ret)
        return ret.decode()

    def get_device_info(self) -> StackerInfo:
        """Get Device Info."""
        if self._simulating:
            return StackerInfo(
                "STACKER-FW", HardwareRevision.EVT, "STACKER-SIMULATOR-SN"
            )

        _DEV_INFO_RE = re.compile(
            "^M115 FW:(?P<fw>.+) HW:Opentrons-flex-stacker-(?P<hw>.+) SerialNo:(?P<sn>.+) OK\n"
        )
        res = self._send_and_recv("M115\n", "M115 FW:")
        m = _DEV_INFO_RE.match(res)
        if not m:
            raise RuntimeError(f"Incorrect Response: {res}")
        return StackerInfo(
            m.group("fw"), HardwareRevision(m.group("hw")), m.group("sn")
        )

    def set_serial_number(self, sn: str) -> None:
        if self._simulating:
            return
        self._send_and_recv(f"M996 {sn}\n", "M996 OK")

    def __del__(self) -> None:
        self._serial.close()
