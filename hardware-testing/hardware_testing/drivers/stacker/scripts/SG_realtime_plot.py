import os
import sys
sys.path.append('../../')
import stacker
from stacker import AXIS, DIR
import csv
import time
from typing import Dict
import numpy as np
import argparse
import mark10
import dash
from dash import html
from dash import dcc
from dash.dependencies import Input, Output
import plotly.graph_objs as go
from numpy import random
import pandas as pd
import os
import webbrowser

def open_browser():
	webbrowser.open_new("http://localhost:{}".format(web_port))

app = dash.Dash()
web_port = 8082

def find_filename(keyword: str):
    for fname in os.listdir(folder):
        #print(fname)
        if keyword in fname:
            #print(fname)
            return fname

def scan_for_files(folder):
    most_recent_file = None
    most_recent_time = 0
    # iterate over the files in the directory using os.scandir
    for entry in os.scandir(folder):
        if entry.is_file():
            # get the modification time of the file using entry.stat().st_mtime_ns
            mod_time = entry.stat().st_mtime_ns
            if mod_time > most_recent_time:
                # update the most recent file and its modification time
                most_recent_file = entry.name
                most_recent_time = mod_time
    return most_recent_file

@app.callback(Output('graphid', 'figure'),
              [Input('500ms_intervals', 'n_intervals')])
def update_layout(n):
    # Probes
    folder= working_dir + '/results/'
    file_name = scan_for_files(folder)
    accel_data = pd.read_csv(folder + file_name, skiprows = detail_rows)
    figure={
            'data': [
                 go.Scattergl(x=accel_data['Time'], y=accel_data['Ax'], mode = 'lines+markers', name = 'Ax'),
                 go.Scattergl(x=accel_data['Time'], y=accel_data['Ay'], mode = 'lines+markers', name = 'Ay'),
                 go.Scattergl(x=accel_data['Time'], y=accel_data['Az'], mode = 'lines+markers', name = 'Az'),
            ],
            'layout': {
                'title': 'Accelerometer Data',
                'xaxis':{'title': 'Time','scaleanchor': 'x', 'autorange': True},
                'yaxis': {'title': 'accelerometer', 'scaleanchor': 'y','autorange': True},
                'uirevision': True
            }
        }
    return figure

if __name__ == '__main__':
    working_dir = os.getcwd()
    detail_rows = 0
    folder= working_dir + '/results/'
    file_name = scan_for_files(folder)
    data = pd.read_csv(folder + file_name, skiprows = detail_rows)
    print(data)
    # if realtime_plot:
    app.layout = html.Div([
        dcc.Graph(
            id='graphid',
            figure={
                'data': [
                    go.Scattergl(x=data['Time(s)'], y=data['Force(N)'], mode = 'lines+markers', name = 'SG'),
                ],
                'layout': {
                    'title': 'SG Data',
                    'xaxis':{'title': 'Time(s)','scaleanchor': 'x', 'autorange': True},
                    'yaxis': {'title': 'Force', 'scaleanchor': 'y','autorange': True},
                    'uirevision': True
                }
            }

        ),
        dcc.Interval(
            id='500ms_intervals',
            interval=500, # 1000 milliseconds = 1 seconds
            n_intervals=0
        ),

    ])
    open_browser()
    app.run_server(port = web_port, debug = True)
