import os, sys
import csv
import time
import plotly
import dash
from dash import html
from dash.dependencies import Input, Output
import plotly.graph_objs as go
import webbrowser
import pandas as pd

app = dash.Dash()
web_port = 8082

def open_browser():
    webbrowser.open_new("http://localhost: {}".format(web_port))

if __name__ == '__main__':
    working_dir = os.getcwd()
    detail_rows = 0
    folder = working_dir + '/results/'
    # file_name = 'Axis_X_SG_test_SG_value_1_speed_200_0.8Amps_lifetime_unit.csv'
    file_name = 'Axis_Z_SG_test_SG_value_24_speed_200_0.8Amps_lifetime_unit_T2.csv'
    trials = [x for x in range(1,40)]
    # outliners = [1,4, 6, 8, 18, 29,63 , 78, 80, 186, 198 ]
    outliners = [0]
    #print(trials)
    data = pd.read_csv(file_name , skiprows = detail_rows)
    print(data)
    #Time(s)	Force(N)	SG Value	Trials
    single_graph = go.Figure()

    for t in trials:
        if t not in outliners:
            new_df = data[
                        ['Time(s)',
                        'Force(N)',
                        'SG Value',
                        'Trials']
                        ]
            d = new_df.loc[(new_df['Trials']) == t]
            print(d)
            # d = d[:300]
            single_graph.add_trace(go.Scatter(x = d['Time(s)'],
                                                y = d['Force(N)'],
                                                mode = 'markers+lines',
                                                # line_shape = 'spline',
                                                name = '{}'.format(t)))
            single_graph.update_layout(
                                        title = 'Stall Detection SG value',
                                        xaxis_title = 'Time(s)',
                                        yaxis_title = 'Force(N)',
                                        xaxis = dict(dtick = 0.05),
                                        yaxis = dict(dtick = 5)
            )
    single_graph.show()
