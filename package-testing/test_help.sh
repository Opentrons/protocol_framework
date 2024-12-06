#!/bin/bash

TEST_KEY=$(basename "$0" .sh)
RESULT_DIR=${RESULT_DIR:-"results"}
RESULT_FILE="$RESULT_DIR/$TEST_KEY.txt"
VENV_DIR=${VENV_DIR:-"venv"}

# Ensure the result directory exists
mkdir -p "$RESULT_DIR"

echo "Activating virtual environment..."
# shellcheck disable=SC1091
source "$VENV_DIR/bin/activate"

echo "Validate opentrons_simulate --help ..."

EXPECTED_OUTPUT="Simulate a protocol for an Opentrons robot"

test_opentrons_simulate_help() {
    output=$(opentrons_simulate --help 2>&1)
    expected_return_code=0
    return_code=$?

    result_file="$RESULT_FILE"

    if [ $return_code -ne "$expected_return_code" ]; then
        echo "FAIL: Return code is $return_code, expected $expected_return_code" | tee "$result_file"
        echo "Output was:" >> "$result_file"
        echo "$output" >> "$result_file"
        return 1
    fi

    if echo "$output" | grep -q "$EXPECTED_OUTPUT"; then
        echo "PASS: Expected output '$EXPECTED_OUTPUT' is present" | tee -a "$result_file"
    else
        echo "FAIL: Expected output '$EXPECTED_OUTPUT' not found in stdout" | tee -a "$result_file"
        echo "Output was:" >> "$result_file"
        echo "$output" >> "$result_file"
        mv "$result_file" "${result_file%.txt}_FAIL.txt"
        return 1
    fi

    echo "PASS: All validations succeeded" | tee -a "$result_file"
    return 0
}

# Run the test
if ! test_opentrons_simulate_help; then
    echo "Test completed with errors. See $RESULT_FILE for details."
    exit 1
else
    echo "Test completed successfully. See $RESULT_FILE for details."
    exit 0
fi
