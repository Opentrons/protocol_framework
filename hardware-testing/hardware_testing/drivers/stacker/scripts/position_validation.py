import os
import sys
sys.path.append('../../')
import stacker
from stacker import AXIS, DIR
# import mitutoyo_digimatic_indicator as dial_indicator
import csv


if __name__ == '__main__':
    s = stacker.FlexStacker(None).create('COM11')
    # s.set_dfu()
    cycles = 50
    s.home_speed = 100
    s.home_acceleration = 500
    s.set_ihold_current(1.5, AXIS.X)
    s.set_ihold_current(1.5, AXIS.Z)
    s.set_ihold_current(0.6, AXIS.L)
    test_axis = AXIS.L
    # s.home(AXIS.X, DIR.POSITIVE_HOME, s.home_speed, s.home_acceleration)
    s.home(AXIS.Z, DIR.NEGATIVE_HOME, s.home_speed, s.home_acceleration)
    s.home(AXIS.L, DIR.NEGATIVE_HOME, s.home_speed, s.home_acceleration)
    if test_axis == AXIS.X:
        TOTAL_TRAVEL = 192.5
        s.home(test_axis, DIR.POSITIVE_HOME)
        axis_str = 'X'
        sw_axis = 'XE'
        msd = s.max_speed_discontinuity_x
        run_current = 1.5
    elif test_axis == AXIS.Z:
        TOTAL_TRAVEL = 136
        s.home(test_axis, DIR.NEGATIVE_HOME)
        axis_str = 'Z'
        sw_axis = 'ZE'
        msd = s.max_speed_discontinuity_z
        run_current = 1.5
    elif test_axis == AXIS.L:
        TOTAL_TRAVEL = 22
        s.home(test_axis, DIR.NEGATIVE_HOME)
        axis_str = 'L'
        sw_axis = 'LR'
        msd = 100
        run_current = 1.5
    else:
        raise("NO AXIS CHOSEN!!!")
    speed = s.home_speed
    acceleration = s.home_acceleration
    s.set_run_current(run_current, AXIS.L)
    for x in range(1, cycles+1):
        s.home(test_axis, DIR.NEGATIVE_HOME, s.home_speed, s.home_acceleration)
        s.move(test_axis,
                        TOTAL_TRAVEL, # 202 -4 = 200
                        DIR.POSITIVE,
                        speed,
                        acceleration,
                        msd)
