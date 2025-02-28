"""Read folder of Artel Results Files."""
import argparse
import os
import statistics
from typing import List, Dict, Union, Any
import re
import sys
from abr_testing.automation import google_sheets_tool
from datetime import datetime


def read_html_file(file_path: str) -> str:
    """Read html file."""
    try:
        with open(file_path, "r", encoding="utf-8", errors="replace") as file:
            html_string = file.read()
            return html_string
    except FileNotFoundError:
        print(f"Error: File not found at path: {file_path}")
        return ""
    except Exception as e:
        print(f"An error occurred: {e}")
        return ""


def parse_file(html_str: str) -> Dict[str, Union[Any, List[Any]]]:
    """Parse File and extract raw data."""
    # Determine target volume of file
    pattern_target_ul = r"Target volume.*?<td align=\"left\">([\d\.]+)"
    target_ul = float(re.findall(pattern_target_ul, html_str)[0])
    pattern_raw_data = r'<td align="center" class="ht_?\d+">([\d\.]+)</td>'
    raw_data = re.findall(pattern_raw_data, html_str)
    raw_data = [float(x) for x in raw_data]
    mean_vol = raw_data[-1]
    raw_data = raw_data[:-1]
    date_match = re.search(r"<b>Date:\s*</b>(.*?)<br", html_str, re.DOTALL)
    date = date_match.group(1).strip() if date_match else ""
    file_name_match = re.search(r"<title>(.*?)</title", html_str, re.DOTALL)
    file_name = file_name_match.group(1).strip() if file_name_match else ""
    dict_raw_data = {
        "Date": date,
        "File Name": file_name,
        "Target Volume (ul)": target_ul,
        "Mean Volume": mean_vol,
        "Raw Data": raw_data,
    }
    return dict_raw_data


def analyze_raw_data(
    results: Dict[str, Union[Any, List[Any]]]
) -> Dict[str, Union[Any, List[Any], List[List[Any]]]]:
    """Analyze Raw Data."""
    raw_data: List[float] = results.get("Raw Data", [0.0])
    target_ul = results.get("Target Volume (ul)", 10000000.0)
    lists_by_row = [raw_data[i : i + 12] for i in range(0, len(raw_data), 12)]

    def find_statistics_of_list(
        list_of_values: List[Any], target_vol: Any
    ) -> List[Any]:
        """Find statistics of list."""
        # remove None values before doing stats
        filtered_values = [float(x) for x in list_of_values if x is not None]
        avg = statistics.mean(filtered_values)
        std_dev = statistics.stdev(filtered_values)
        cv = (std_dev / avg) * 100
        percent_d = ((avg - target_vol) / target_ul) * 100
        values_and_stats = list_of_values + [target_vol, avg, std_dev, percent_d, cv]
        return values_and_stats

    analyzed_data = []
    analyze_data_no_outliers = []
    for row in lists_by_row:
        # Look at data with outliers
        length_of_list = len(row)
        # remove values less than 0.3
        no_non_aspirates = [float(x) if x > 0.3 else None for x in row]
        row_stats = find_statistics_of_list(no_non_aspirates, target_ul)
        analyzed_data.append(row_stats)
        average_vol = row_stats[length_of_list + 1]
        std_dev = row_stats[length_of_list + 2]
        # Remove outliers and replace with None value
        upper_limit = average_vol + (2 * std_dev)
        lower_limit = average_vol - (2 * std_dev)
        l_no_outliers = [
            float(x) if lower_limit < x <= upper_limit else None for x in row
        ]
        # find same statistics
        row_no_outliers_stats = find_statistics_of_list(l_no_outliers, target_ul)
        analyze_data_no_outliers.append(row_no_outliers_stats)
    # Format for google sheet
    header = [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "Target Vol (ul)",
        "AVG",
        "ST DEV",
        "%D",
        "%CV",
    ]
    file_header = [results["Date"], results["File Name"]]
    file_header.extend([""] * (len(header) - 2))
    analyzed_data.insert(0, header)
    analyzed_data.insert(0, file_header)
    results["Analyzed Data"] = [list(row) for row in zip(*analyzed_data)]
    analyze_data_no_outliers.insert(0, header)
    file_name = results["File Name"]
    if isinstance(file_name, str):
        file_name_outlier = file_name + " No Outliers or Zeros"
    else:
        file_name_outlier = "NO OUTLIERS"
    file_header_no_outliers = [results["Date"], file_name_outlier]
    file_header_no_outliers.extend([""] * (len(header) - 2))
    analyze_data_no_outliers.insert(0, file_header_no_outliers)
    results["Analyzed Data No Outliers"] = [
        list(row) for row in zip(*analyze_data_no_outliers)
    ]
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
    google_sheet = google_sheets_tool.google_sheet(
        credentials_path, google_sheet_name, 0
    )
    sheet_name = str(datetime.now())
    list_of_files = os.listdir(storage_directory)
    sheet_id = google_sheet.create_worksheet(str(datetime.now()))
    header = []
    for file in list_of_files:
        if file.endswith(".html"):
            header.append(os.path.basename(file))
            header.extend([""] * 16)
    initial_row = 1
    col_start = 0

    for file in list_of_files:
        file_path = os.path.join(storage_directory, file)
        if file_path.endswith(".html"):
            html_str = read_html_file(file_path)
            raw_data = parse_file(html_str)
            results = analyze_raw_data(raw_data)
            # update sheet with raw data frame
            if sheet_id:
                google_sheet.batch_update_cells(
                    results["Analyzed Data"], col_start, initial_row, sheet_id
                )
            # Determine row number for no outliers data frame
            num_of_rows = len(results["Analyzed Data"][0])
            initial_row += num_of_rows + 1
            num_of_columns = len(results["Analyzed Data"])
            # Update sheet with no outliers data frame
            if sheet_id:
                google_sheet.batch_update_cells(
                    results["Analyzed Data No Outliers"],
                    col_start,
                    initial_row,
                    sheet_id,
                )
            # Reset start row to 1
            initial_row = 1
            # Determine new start column based on size of data frame
            col_start += num_of_columns + 1
