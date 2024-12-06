# Test Scripts for the opentrons package

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
