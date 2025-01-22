import numpy
import plotly
import pandas as pd
import os, sys
import time
import argparse

def print_to_string(list):
    count = 1
    data = ''
    for x in list:
        data += x + ','
    return data

def build_arg_parser():
    arg_parser = argparse.ArgumentParser(description='Flex Stacker Axis Accelerated Lifetime Test')
    arg_parser.add_argument('-c', '--current', type=float, required=True, help='Current', default=1.0)
    arg_parser.add_argument('-s', '--speed', type=int, required=True, help='speed', default=50)
    return arg_parser

if __name__ == '__main__':
    arg_parser = build_arg_parser()
    args = arg_parser.parse_args()
    working_dir = os.getcwd()
    detail_row = 0
    file_name = working_dir + '/EVT Motion Parameter Test - Tiprack Load Z Axis-Unit 1.csv'

    df = pd.read_csv(file_name, skiprows=detail_row)
    new_df = df[
                [
                'MOTOR_CURRENT',
                'VELOCITY',
                'ACCELERATION',
                'PASS/FAIL',
                ]]
    current = args.current
    speed = args.speed
    accel_data = df['ACCELERATION']
    pass_fail_creterion = df['PASS/FAIL']
    total_num = int(2000/100)
    print(f'total: {total_num}')
    # sample_list = sample_list.tolist()
    target = df.loc[(new_df['MOTOR_CURRENT'] == current) & (new_df['VELOCITY'] == speed)]
    # print(sample_list)

    # print(new_df)
    split_list = [100,200,300,400]
    bigger_list = []
    list = []
    count = 0
    print(f'current: {current}, velocity: {speed}')
    for index, row in df.iterrows():
        if row['MOTOR_CURRENT'] == current:
            if row['VELOCITY'] == speed:
                count += 1
                # print(f'index: {index}, Velocity: {row["VELOCITY"]}, Accel: {row["ACCELERATION"]}, P/F: {row["PASS/FAIL"]}')
                list.append(row["PASS/FAIL"])
                if count == 10:
                    d = print_to_string(list)
                    print(d)
                    bigger_list.append(list)
                    count = 0
                    list=[]
                # print(index)
                # if (index) == 381:
                #     list.append(row["PASS/FAIL"])
                #     bigger_list.append(list)
                #     print(list)
                #     list=[]
