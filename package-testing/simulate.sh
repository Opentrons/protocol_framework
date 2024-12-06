#!/bin/bash

VENV_DIR=${VENV_DIR:-"venv"}
RESULT_DIR=${RESULT_DIR:-"results"}

mkdir -p "$RESULT_DIR"

# Function to test `opentrons_simulate` with a given protocol file
# Arguments:
#   1. Protocol file path (required)
#   2. Result file path (required)
#   3. Expected return code (optional, default 0)
simulate_protocol() {
    local protocol_file="$1"
    local result_file="$2"
    local expected_return_code="${3:-0}"

    echo "Activating virtual environment $VENV_DIR ..."
    # shellcheck disable=SC1091
    source "$VENV_DIR/bin/activate"

    printf "Running opentrons_simulate for protocol:\n %s\n" "$protocol_file"

    output=$(opentrons_simulate "$protocol_file" 2>&1)
    return_code=$?

    if [ $return_code -ne "$expected_return_code" ]; then
        echo "FAIL: Return code is $return_code, expected $expected_return_code" | tee "$result_file"
        echo "Output was:" >> "$result_file"
        echo "$output" >> "$result_file"
        mv "$result_file" "${result_file%.txt}_FAIL.txt"
        exit 1
    else
        echo "PASS: Return code is $return_code, expected $expected_return_code" | tee "$result_file"
        echo "Output was:" >> "$result_file"
        echo "$output" >> "$result_file"
        exit 0
    fi
}
