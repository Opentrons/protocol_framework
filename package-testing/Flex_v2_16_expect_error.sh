#!/bin/bash

# shellcheck disable=SC1091
source ./simulate.sh

PROTOCOL_FILE="../analyses-snapshot-testing/files/protocols/Flex_X_v2_16_P1000_96_TM_ModuleAndWasteChuteConflict.py"
TEST_KEY=$(basename "$0" .sh)
RESULT_FILE="$RESULT_DIR/$TEST_KEY.txt"
EXPECTED_RETURN_CODE=1

echo running opentrons_simulate test "$TEST_KEY" ...
simulate_protocol "$PROTOCOL_FILE" "$RESULT_FILE" "$EXPECTED_RETURN_CODE"
