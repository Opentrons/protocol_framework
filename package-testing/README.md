# Test Scripts for the opentrons package

## Structure

- Makefile has targets for setting up, tearing down and running tests for windows and unix-ish systems
- setup.\* is the script run create the virtual environment and install the packages
- help.\* is a script to test --help
- simulate.\* is a script to test that the simulation runs and produces the expected status code
- tests.json maps tests to scripts
- run_tests.py is the main script that drives test execution

## Use the tests

Run against your local code.

1. pyenv local 3.10
2. make setup - note that this deletes and recreates the virtual environment every run
3. make test

## Notes

- find . -name "\*.sh" -exec shellcheck {} +

## TODO

- setup shellcheck in CI
- more tests
- windows tests
