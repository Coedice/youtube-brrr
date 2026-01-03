.PHONY: help
help:
	@grep -E '^[a-zA-Z_-]+:.*##' $(MAKEFILE_LIST) | sed -E 's/^([a-zA-Z_-]+):.*##\s*(.*)/\1: \2/'

.PHONY: install
install: ## Install dependencies
	npm install

.PHONY: test
test: ## Run unit tests
	npm test -- --coverage

.PHONY: lint
lint: ## Run linter
	npm run lint

.PHONY: format
format: ## Format code with prettier
	npm run format

.PHONY: clean
clean: ## Clean up build artifacts
	rm -rf node_modules coverage dist *.log

