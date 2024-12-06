#!/bin/bash

# shellcheck disable=SC1091
source ./simulate.sh

PROTOCOL_FILE="../analyses-snapshot-testing/files/protocols/OT2_S_v2_20_8_None_SINGLE_HappyPath.py"
TEST_KEY=$(basename "$0" .sh)
RESULT_FILE="$RESULT_DIR/$TEST_KEY.txt"
EXPECTED_RETURN_CODE=0

echo running opentrons_simulate test "$TEST_KEY" ...
simulate_protocol "$PROTOCOL_FILE" "$RESULT_FILE" "$EXPECTED_RETURN_CODE"
