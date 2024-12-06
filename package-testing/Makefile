# package testing Makefile

VENV_DIR ?= venv
RESULTS_DIR ?= results
TEST ?= Flex_v2_19_expect_success

.PHONY: setup
setup:
	./setup.sh $(VENV_DIR)

.PHONY: clean
clean:
	@echo "Removing the results directory $(RESULTS_DIR)"
	rm -rf $(RESULTS_DIR) || true

.PHONY: teardown
teardown: clean
	rm -rf $(VENV_DIR) || true

.PHONY: test
test: clean
	@echo "Running all tests"
	@echo "Test are run serially and fail fast, so if one fails the rest won't run"
	@echo "This target expects you already have run 'make setup'"
	./test_help.sh $(VENV_DIR) $(RESULTS_DIR)
	./Flex_v2_19_expect_success.sh $(VENV_DIR) $(RESULTS_DIR)
	./OT2_v2_20_expect_success.sh $(VENV_DIR) $(RESULTS_DIR)
	./Flex_v2_16_expect_error.sh $(VENV_DIR) $(RESULTS_DIR)
	./OT2_v6PD_expect_error.sh $(VENV_DIR) $(RESULTS_DIR)

.PHONY: test1
test1: clean
	@echo "Easy way to run a single test"
	@echo Run like this: make test1 TEST=Flex_v2_19_expect_success
	@echo "This target expects you already have run 'make setup'"
	@echo "Running test $(TEST)"
	./$(TEST).sh $(VENV_DIR) $(RESULTS_DIR)
