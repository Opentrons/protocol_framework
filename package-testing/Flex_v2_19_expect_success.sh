#!/bin/bash

# shellcheck disable=SC1091
source ./simulate.sh

PROTOCOL_FILE="../analyses-snapshot-testing/files/protocols/Flex_S_v2_19_Illumina_DNA_Prep_48x.py"
TEST_KEY=$(basename "$0" .sh)
RESULT_FILE="$RESULT_DIR/$TEST_KEY.txt"
EXPECTED_RETURN_CODE=0

echo running opentrons_simulate test "$TEST_KEY" ...
simulate_protocol "$PROTOCOL_FILE" "$RESULT_FILE" "$EXPECTED_RETURN_CODE"
