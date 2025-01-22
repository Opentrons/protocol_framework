import argparse
import math
import matplotlib.pyplot as plot
import json
import os
import numpy
from scipy.interpolate import make_interp_spline
from scipy.signal import savgol_filter

from typing import Dict, Literal, List

from opentrons_shared_data import load_shared_data
from opentrons_shared_data.load import get_shared_data_root

from opentrons.protocol_engine.state.frustum_helpers import find_height_at_well_volume

from opentrons_shared_data.pipette.types import PipetteName, PipetteModel, LiquidClasses
from opentrons_shared_data.pipette import (
    pipette_load_name_conversions as pipette_load_name,
    load_data as load_pipette_data,
    types as pip_types,
    pipette_definition,
)
from opentrons_shared_data.pipette.ul_per_mm import calculate_ul_per_mm, piecewise_volume_conversion

from opentrons_shared_data.labware.labware_definition import LabwareDefinition

TIMESLICE = 0.001
SMOOTHING_FACTOR = 10

def load_labware_definition(loadname: str) -> "LabwareDefinition":
    lastest = sorted(os.listdir(f"{get_shared_data_root()}/labware/definitions/3/{loadname}/"))[-1]
    return  LabwareDefinition.model_validate(json.loads(load_shared_data(f"labware/definitions/3/{loadname}/{lastest}")))

def _get_plunger_channels(pipette_model: PipetteModel) -> int:
    if "96" in pipette_model:
        return 96
    elif "multi" in pipette_model:
        return 8
    else:
        return 1

def _get_plunger_max_speed(pipette_model: PipetteModel) -> float:
    if "96" in pipette_model:
        return 15
    elif "em" in pipette_model:
        return 90
    else:
        return 70

def _get_plunger_acceleration(pipette_model: PipetteModel) -> float:
    if "96" in pipette_model:
        return 30
    else:
        return 100

def _get_plunger_discontinuity(pipette_model: PipetteModel) -> float:
    if "96" in pipette_model:
        return 5
    else:
        return 10

def _ul_per_mm_at_volume(ul_per_mm_definition: pipette_definition.ulPerMMDefinition, volume: float):
    map = list(ul_per_mm_definition.default.values())[-1]
    return piecewise_volume_conversion(volume, map)

def _get_max_flow_rate_at_volume(
    ul_per_mm_definition: pipette_definition.ulPerMMDefinition,
    pipette_model: PipetteModel,
    volume: float,
) -> float:
    max_speed = _get_plunger_max_speed(pipette_model)
    ul_per_mm = _ul_per_mm_at_volume(ul_per_mm_definition, volume)
    return round(ul_per_mm * max_speed, 1)

def plunger_slices(flow_velocity, acceleration, distance, discontinuity):
    full_speed_time = (flow_velocity-discontinuity)/acceleration
    distance_during_rampup = (0.5)*(acceleration*full_speed_time**2) + discontinuity*full_speed_time
    acceleration_intercept = False
    inflection_time = 0
    inflection_distance = 0
    inflection_velocity = 0
    print(f"flow_velocity {flow_velocity} acceleration {acceleration} distance {distance} discontinuity {discontinuity} full_speed_time {full_speed_time} distance_during_rampup {distance_during_rampup}")
    if 2*distance_during_rampup < distance:
        flat_time = (distance - 2*distance_during_rampup)/flow_velocity
        total_time = 2 * full_speed_time + flat_time
    else:
        print("no flat time")
        flat_time = 0
        acceleration_intercept = True
        inflection_time = (math.sqrt(acceleration*distance + discontinuity**2) - discontinuity)/acceleration
        inflection_distance = 0.5 * acceleration * inflection_time**2 + discontinuity * inflection_time
        inflection_velocity = acceleration * inflection_time + discontinuity
        total_time = 2*inflection_time
        #print(f"inflection_time {inflection_time} inflection_distance {inflection_distance} inflection_velocity {inflection_velocity} total_time {total_time}")
    print(total_time)
    data = []
    for time_slice in range(0, int(total_time/TIMESLICE)):
        time = time_slice * TIMESLICE
        if acceleration_intercept:
            if time <= inflection_time:
                v = acceleration * time + discontinuity
                a = acceleration
                d = 0.5 * a * time**2 + discontinuity * time
            else:
                slope_time = time - inflection_time
                a = -1 * acceleration
                v = a * slope_time + inflection_velocity
                d = inflection_distance + (0.5 * a * slope_time**2) + inflection_velocity * slope_time
        else:
            if time < full_speed_time:
                a = acceleration
                v = a * time + discontinuity
                d = 0.5 * a * time**2 + discontinuity*time
            elif time < (full_speed_time + flat_time):
                a = 0
                v = flow_velocity
                d = distance_during_rampup + v * (time - full_speed_time)
            else:
                slope_time = time - flat_time - full_speed_time
                a = -1 * acceleration
                v = a * slope_time + flow_velocity
                d = distance_during_rampup + flow_velocity*flat_time + (0.5*a*slope_time**2 + flow_velocity*slope_time)
        #print(f"{time} {d} {v} {a}")
        data.append({"t": time, "d": d,  "v": v, "a": a})
    return data

def plot_data(plunger_data, liquid_heights, z_velocity, z_acceleration):
    print("plotting data")
    times = [s["t"] for s in plunger_data]
    distance_plot = [s["d"] for s in plunger_data]
    velocity_plot = [s["v"] for s in plunger_data]
    acceleration_plot = [s["a"] for s in plunger_data]
    plot.plot(times, distance_plot, label="Plunger distance", c="r")
    plot.plot(times, velocity_plot, label="Plunger speed", c="lightcoral")
    #plot.plot(times, acceleration_plot, label="Plunger acceleration", c="lightpink")
    plot.plot(times, liquid_heights, label="liquid_height", c="b")
    plot.plot(times, z_velocity, label="z_velocity", c="cornflowerblue")
    #plot.plot(times, z_acceleration, label="z_acceleration", c="c")
    #plot.legend()
    #plot.show()

    plot.plot(times, [5]*len(times), ls=':', c='y', label="max discontinuity")
    plot.plot(times, [-5]*len(times), ls=':', c='y')
    #z_times = [z['t'] for z in z_data]
    #z_velocity = [z['v'] for z in z_data]
    #plot.plot(z_times, z_velocity, label="z_velocity", c="cornflowerblue")
    #plot.plot(z_times, savgol_filter(z_velocity, 20, 2), label="z_velocity_filtered")
    #plot.plot(times, numpy.gradient(liquid_heights, TIMESLICE), label="z_velocity_grad")
    if (max(z_velocity) > 100):
        plot.plot(times, [100]*len(times), ls=':', c='m', label="max velocity")
        plot.plot(times, [-100]*len(times), ls=':', c='m')
    plot.plot(times, z_acceleration, label="z_acceleration", c="c")
    #if max(z_acceleration) > 150:
    #    plot.plot(times, [150]*len(times), ls=':', c='k', label = "max_acceleration")
    #    plot.plot(times, [-150]*len(times), ls=':', c='k')
    #plot.plot([times[0], times[-1]], [(liquid_heights[-1] - liquid_heights[0]) / times[-1]]*2, label="average velocity")
    plot.legend()
    plot.show()



    #plot.legend()
    #plot.show()

def plot_data_smothing(plunger_data, liquid_heights):
    print("plotting data")
    times = [s["t"] for s in plunger_data]
    spacing = len(plunger_data) * SMOOTHING_FACTOR
    T_ = numpy.linspace(times[0], times[-1], spacing)
    distance_plot = [s["d"] for s in plunger_data]
    d_spline = make_interp_spline(times, distance_plot)
    velocity_plot = [s["v"] for s in plunger_data]
    v_spline = make_interp_spline(times, velocity_plot)
    acceleration_plot = [s["a"] for s in plunger_data]
    a_spline = make_interp_spline(times, acceleration_plot)
    z_spline = make_interp_spline(times, liquid_heights)
    #zv_spline = make_interp_spline(times, z_velocity)
    #za_spline = make_interp_spline(times, z_acceleration)
    z_t = z_spline(T_)
    z_dt = numpy.gradient(z_t, times[-1]/spacing)
    z_dt2 = numpy.gradient(z_dt, times[-1]/spacing)
    #print(times)
    #print(distance_plot)
    #print(velocity_plot)
    #print(acceleration_plot)
    plot.plot(T_, d_spline(T_), label="Plunger distance", c="r")
    plot.plot(T_, v_spline(T_), label="Plunger speed", c="lightcoral")
    plot.plot(T_, a_spline(T_), label="Plunger acceleration", c="lightpink")
    plot.plot(T_, z_t, label="liquid_height", c="b")
    plot.legend()
    plot.show()


    plot.plot(T_, [100]*len(T_), ls=':', c='m', label="max velocity")
    plot.plot(T_, [-100]*len(T_), ls=':', c='m')
    plot.plot(T_, [5]*len(T_), ls=':', c='y', label="max discontinuity")
    plot.plot(T_, [-5]*len(T_), ls=':', c='y')
    plot.plot(T_, z_dt, label="z_velocity", c="cornflowerblue")
    plot.legend()
    plot.show()


    plot.plot(T_, z_dt2, label="z_acceleration", c="c")
    plot.plot(T_, [150]*len(T_), ls=':', c='k', label = "max_acceleration")
    plot.plot(T_, [-150]*len(T_), ls=':', c='k')
    plot.legend()
    plot.show()

def main(args: argparse.Namespace):
    ################ HANDLE PIPETTE ##################
    pipette_model = pipette_load_name.convert_pipette_model(
            PipetteModel(args.pipette),
        )
    pipette_def = load_pipette_data.load_definition(
        pipette_model.pipette_type,
        pipette_model.pipette_channels,
        pipette_model.pipette_version,
        pipette_model.oem_type,
    )
    tip_type = pip_types.PipetteTipType(args.tip)
    tip_settings = pipette_def.liquid_properties[LiquidClasses.default].supported_tips[tip_type]
    if args.aspirate:
        ul_per_mm = tip_settings.aspirate
    else:
        ul_per_mm = tip_settings.dispense
    ui_max = tip_settings.ui_max_flow_rate
    flow_rate = min(ui_max, _get_max_flow_rate_at_volume(ul_per_mm, PipetteModel(args.pipette), args.action_volume))
    flow_velocity = flow_rate / _ul_per_mm_at_volume(ul_per_mm, args.action_volume)

    plunger_acceleration = _get_plunger_acceleration(PipetteModel(args.pipette))
    plunger_distance = args.action_volume /calculate_ul_per_mm(args.action_volume, "aspirate" if args.aspirate else "dispense", tip_settings, "2")
    plunger_discontinuity = _get_plunger_discontinuity(PipetteModel(args.pipette))

    print(f"plunger distance {plunger_distance}")
    plunger_data = plunger_slices(flow_velocity, plunger_acceleration, plunger_distance, plunger_discontinuity)

    #### Handle Labware ############
    labware_def = load_labware_definition(args.labware)
    well_geometry = labware_def.innerLabwareGeometry[list(labware_def.innerLabwareGeometry.keys())[0]]
    #print(well_geometry)

    liquid_heights = []
    #z_velocity = []
    #z_acceleration = []
    print(f"{ul_per_mm}")
    for s in plunger_data:
        channels_per_well = _get_plunger_channels(PipetteModel(args.pipette))
        changed_volume = _ul_per_mm_at_volume(ul_per_mm, args.action_volume) * s["d"] *
        #print(f"At p distance {s['d']} changed volume is {changed_volume}")
        if args.dispense:
            changed_volume = -1 * changed_volume
        #print(f"{s['t']} {args.start_volume} {changed_volume}")
        print(f"{s['d']} {changed_volume}")
        liquid_heights.append(find_height_at_well_volume(args.start_volume - changed_volume, well_geometry))
    liquid_heights_hat = savgol_filter(liquid_heights, 50, 4)
    #z_velocity = numpy.gradient(liquid_heights_hat, TIMESLICE)
    #z_velocity_hat = savgol_filter(z_velocity, 50, 3)
    z_velocity = savgol_filter(liquid_heights, 50, 3, deriv=1, delta=TIMESLICE)
    z_acceleration = savgol_filter(z_velocity, 30, 2, deriv=1, delta=TIMESLICE)
    #z_acceleration = numpy.gradient(z_velocity, TIMESLICE)
    #z_acceleration_hat = savgol_filter(z_acceleration, 50,3)
    """
    times = [s["t"] for s in plunger_data][:-1]
    z_velocity = []
    for i in range(2, len(times)-2):
        prev_avg = liquid_heights[i-2]#sum(liquid_heights[i-2:i])/2
        next_avg = liquid_heights[i+2]#sum(liquid_heights[i:i+2])/2
        z_velocity.append({'t': times[i], 'v': (next_avg - prev_avg) / (4*TIMESLICE)})
    """
    #z_acceleration = numpy.gradient(z_velocity)
    #plot_data(plunger_data, liquid_heights_hat, z_velocity_hat, z_acceleration_hat)
    plot_data(plunger_data, liquid_heights_hat, z_velocity, z_acceleration)
    #plot_data(plunger_data, liquid_heights)

if __name__ == "__main__":
    parser = argparse.ArgumentParser("Liquid Action Visualizer")
    parser.add_argument("--start-volume", type=float, required=True)
    parser.add_argument("--action-volume", type=float, required=True)
    parser.add_argument("--aspirate", action="store_true")
    parser.add_argument("--dispense", action="store_true")
    parser.add_argument("--labware", type=str, required=True)
    parser.add_argument("--pipette", type=str, required=True)
    parser.add_argument("--tip", type=int, choices= [20, 50, 200, 1000], required=True)
    args = parser.parse_args()
    if not (args.aspirate or args.dispense):
        print("Aspirate or Dispense needs to be set")
        exit(-1)
    main(args)

