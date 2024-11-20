BASE_IMAGE_NAME ?= opentrons-python-base:3.10
CACHEBUST ?= $(shell date +%s)
ANALYSIS_REF ?= edge
PROTOCOL_NAMES ?= all
OVERRIDE_PROTOCOL_NAMES ?= all
OPENTRONS_VERSION ?= edge

export OPENTRONS_VERSION # used for server
export ANALYSIS_REF # used for analysis and snapshot test
export PROTOCOL_NAMES # used for the snapshot test
export OVERRIDE_PROTOCOL_NAMES # used for the snapshot test

ifeq ($(CI), true)
	PYTHON=python
else
	PYTHON=pyenv exec python
endif

.PHONY: black
black:
	$(PYTHON) -m pipenv run python -m black .

.PHONY: black-check
black-check:
	$(PYTHON) -m pipenv run python -m black . --check

.PHONY: ruff
ruff:
	$(PYTHON) -m pipenv run python -m ruff check . --fix

.PHONY: ruff-check
ruff-check:
	$(PYTHON) -m pipenv run python -m ruff check .

.PHONY: mypy
mypy:
	$(PYTHON) -m pipenv run python -m mypy automation tests citools

.PHONY: lint
lint: black-check ruff-check mypy

.PHONY: format
format: 
	@echo "Running black"
	$(MAKE) black
	@echo "Running ruff"
	$(MAKE) ruff
	@echo "Formatting the readme with yarn prettier"
	$(MAKE) format-readme

.PHONY: test-ci
test-ci:
	$(PYTHON) -m pipenv run python -m pytest -m "emulated_alpha"

.PHONY: test-protocol-analysis
test-protocol-analysis:
	pipenv run python -m pytest -v tests/protocol_analyze_test.py

.PHONY: setup
setup: install-pipenv
	$(PYTHON) -m pipenv install

.PHONY: teardown
teardown:
	$(PYTHON) -m pipenv --rm

.PHONY: format-readme
format-readme:
	yarn prettier --ignore-path .eslintignore --write analyses-snapshot-testing/**/*.md .github/workflows/analyses-snapshot-test.yaml

.PHONY: install-pipenv
install-pipenv:
	$(PYTHON) -m pip install -U pipenv

.PHONY: snapshot-test
snapshot-test:
	@echo "ANALYSIS_REF is $(ANALYSIS_REF)"
	@echo "PROTOCOL_NAMES is $(PROTOCOL_NAMES)"
	@echo "OVERRIDE_PROTOCOL_NAMES is $(OVERRIDE_PROTOCOL_NAMES)"
	$(PYTHON) -m pipenv run pytest -k analyses_snapshot_test -vv

.PHONY: snapshot-test-update
snapshot-test-update:
	@echo "ANALYSIS_REF is $(ANALYSIS_REF)"
	@echo "PROTOCOL_NAMES is $(PROTOCOL_NAMES)"
	@echo "OVERRIDE_PROTOCOL_NAMES is $(OVERRIDE_PROTOCOL_NAMES)"
	$(PYTHON) -m pipenv run pytest -k analyses_snapshot_test --snapshot-update

.PHONY: build-base-image
build-base-image:
	@echo "Building the base image $(BASE_IMAGE_NAME)"
	docker build --build-arg BASE_IMAGE_NAME=$(BASE_IMAGE_NAME) -f citools/Dockerfile.base -t $(BASE_IMAGE_NAME) citools/.

.PHONY: build-opentrons-analysis
build-opentrons-analysis:
	@echo "Building docker image for $(ANALYSIS_REF)"
	@echo "The image will be named opentrons-analysis:$(ANALYSIS_REF)"
	@echo "If you want to build a different version, run 'make build-opentrons-analysis ANALYSIS_REF=<version>'"
	docker build --build-arg BASE_IMAGE_NAME=$(BASE_IMAGE_NAME) --build-arg ANALYSIS_REF=$(ANALYSIS_REF) --build-arg CACHEBUST=$(CACHEBUST) -t opentrons-analysis:$(ANALYSIS_REF) -f citools/Dockerfile.analyze citools/.

LOCAL_IMAGE_NAME ?= opentrons-analysis:local

.PHONY: build-local
build-local:
	@echo "Building docker image for your local opentrons code"
	@echo "The image will be named opentrons-analysis:local"
	@echo "For a fresh build, run 'make local-build NO_CACHE=1'"
	docker build --build-arg BASE_IMAGE_NAME=$(BASE_IMAGE_NAME) $(BUILD_FLAGS) -t $(LOCAL_IMAGE_NAME) -f citools/Dockerfile.local .. || true
	@echo "Build complete"

.PHONY: snapshot-test-local
snapshot-test-local:
	export ANALYSIS_REF=$(LOCAL_IMAGE_NAME)
	@echo "ANALYSIS_REF is $(ANALYSIS_REF)"
	@echo "PROTOCOL_NAMES is $(PROTOCOL_NAMES)"
	@echo "OVERRIDE_PROTOCOL_NAMES is $(OVERRIDE_PROTOCOL_NAMES)"
	$(PYTHON) -m pipenv run pytest -k analyses_snapshot_test -vv 

.PHONY: generate-protocols
generate-protocols:
	$(PYTHON) -m pipenv run python -m automation.data.protocol_registry

.PHONY: build-rs
build-rs:
	@echo "Building docker image for opentrons-robot-server:$(OPENTRONS_VERSION)"
	@echo "Cache is always busted to ensure latest version of the code is used"
	@echo "If you want to build a different version, run 'make build-rs OPENTRONS_VERSION=chore_release-8.0.0'"
	docker build --build-arg BASE_IMAGE_NAME=$(BASE_IMAGE_NAME) --build-arg OPENTRONS_VERSION=$(OPENTRONS_VERSION) --build-arg CACHEBUST=$(CACHEBUST) -t opentrons-robot-server:$(OPENTRONS_VERSION) -f citools/Dockerfile.server .

.PHONY: run-flex
run-flex:
	@echo "Running opentrons-robot-server:$(OPENTRONS_VERSION)"
	@echo "If you want to run a different version, run 'make run-flex OPENTRONS_VERSION=chore_release-8.0.0'"
	docker run -p 31950:31950 --env-file ../robot-server/dev-flex.env opentrons-robot-server:$(OPENTRONS_VERSION)

.PHONY: run-ot2
run-ot2:
	@echo "Running opentrons-robot-server:$(OPENTRONS_VERSION)"
	@echo "If you want to run a different version, run 'make run-ot2 OPENTRONS_VERSION=chore_release-8.0.0'"
	docker run -p 31950:31950 --env-file ../robot-server/dev.env opentrons-robot-server:$(OPENTRONS_VERSION)
