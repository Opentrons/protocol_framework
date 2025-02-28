"""Read folder of Artel Results Files."""
import argparse
import os
import statistics
from typing import List, Dict
import re
import sys
from abr_testing.automation import google_sheets_tool
from datetime import datetime

def read_html_file(file_path: str)-> str:
    """Read html file."""
    try:
        with open(file_path, 'r', encoding='utf-8', errors = "replace") as file:
            html_string = file.read()
            return html_string
    except FileNotFoundError:
        print(f"Error: File not found at path: {file_path}")
        return None
    except Exception as e:
        print(f"An error occurred: {e}")
        return None

def parse_file(html_str: str)-> Dict[str, float|List[float]]:
    """Parse File and extract raw data."""
    # Determine target volume of file
    pattern_target_ul = r"Target volume.*?<td align=\"left\">([\d\.]+)" 
    target_ul = float(re.findall(pattern_target_ul, html_str)[0])
    pattern_raw_data = r'<td align="center" class="ht_?\d+">([\d\.]+)</td>'
    raw_data = re.findall(pattern_raw_data, html_str)
    raw_data = [float(x) for x in raw_data]
    mean_vol = raw_data[-1]
    raw_data = raw_data[:-1]
    dict_raw_data = {"Target Volume (ul)": target_ul, "Mean Volume": mean_vol, "Raw Data": raw_data}
    return dict_raw_data

def analyze_raw_data(results:Dict[str, float|List[float]])-> Dict[str, float| List[float]| List[List[float]]]:
    """Analyze Raw Data."""
    raw_data = results["Raw Data"]
    target_ul = results["Target Volume (ul)"]
    print(target_ul)
    lists_by_row = [raw_data[i:i + 12] for i in range(0, len(raw_data), 12)]
    
    def find_statistics_of_list(list_of_values: List[float], target_vol: float)-> List[float]:
        """Find statistics of list."""
        # remove None values before doing stats
        filtered_values = [x for x in list_of_values if x is not None]
        avg = statistics.mean(filtered_values)
        std_dev = statistics.stdev(filtered_values)
        cv = (std_dev/avg) * 100
        percent_d = ((avg - target_vol)/target_ul)* 100
        list_of_values.extend([target_vol, avg, std_dev, percent_d, cv])
        return list_of_values
    
    analyzed_data = []
    analyze_data_no_outliers = []
    for l in lists_by_row:
        # Look at data with outliers
        length_of_list = len(l)
        row_stats = find_statistics_of_list(l, target_ul)
        analyzed_data.append(row_stats)
        average_vol = row_stats[length_of_list + 1]
        std_dev = row_stats[length_of_list + 2]
        # Remove outliers and replace with None value
        upper_limit = average_vol + (2*std_dev)
        lower_limit = average_vol - (2*std_dev)
        l_no_outliers = [x if lower_limit <= x <= upper_limit else None for x in l]
        # find same statistics
        row_no_outliers_stats = find_statistics_of_list(l_no_outliers, target_ul)
        analyze_data_no_outliers.append(row_no_outliers_stats)
    # Format for google sheet
    header = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "Target Vol (ul)", "AVG", "%D", "%CV"]
    analyzed_data.insert(0, header)
    results["Analyzed Data"] =  [list(row) for row in zip(*analyzed_data)]
    analyze_data_no_outliers.insert(0, header)
    results["Analyzed Data No Outliers"] = [list(row) for row in zip(*analyze_data_no_outliers)]
    return results
    
if __name__ == "__main__":
    print("started")
    parser = argparse.ArgumentParser(description="Read folder of artel results")
    parser.add_argument(
        "storage_directory",
        metavar="STORAGE_DIRECTORY",
        type=str,
        nargs=1,
        help="Path to long term storage directory for run logs.",
    )
    parser.add_argument(
        "google_sheet_name",
        metavar="GOOGLE_SHEET_NAME",
        type=str,
        nargs=1,
        help="Google sheet name.",
    )
    args = parser.parse_args()
    storage_directory = args.storage_directory[0]
    try:
        credentials_path = os.path.join(storage_directory, "credentials.json")
    except FileNotFoundError:
        print(f"Add credentials.json file to: {storage_directory}.")
        sys.exit()
    google_sheet_name = args.google_sheet_name[0]
    google_sheet = google_sheets_tool.google_sheet(credentials_path, google_sheet_name, 0)
    sheet_name = str(datetime.now())
    sheet_id = google_sheet.create_worksheet(str(datetime.now()))
    list_of_files = os.listdir(storage_directory)
    initial_row = 2
    for file in list_of_files:
        file_path = os.path.join(storage_directory, file)
        if file_path.endswith(".html"):
            html_str = read_html_file(file_path)
            raw_data = parse_file(html_str)
            results = analyze_raw_data(raw_data)
            google_sheet.batch_update_cells(results["Analyzed Data"], "A", initial_row, sheet_id)
            initial_row+=9
            google_sheet.batch_update_cells(results["Analyzed Data No Outliers"], "A", initial_row, sheet_id)
            initial_row+=9
            
        
