# ============================================================================
#  Flyby AI — Frontend Makefile
#
#  The backend is started the normal way:
#       cd ../flyby_ai && python main.py        # Flask API on :8659
#
#  The frontend is started with make:
#       make install     # one-time: install frontend + backend dependencies
#       make             # start the Vite dev server on :8080
#
#  Then open  http://localhost:8080  (the dev server proxies backend paths
#  — /api, /auth, /rest, /functions, /storage — to :8659).
#
#  Convenience: `make run` starts BOTH the backend and the frontend together
#  in one terminal if you'd rather not use two.
# ============================================================================

# Path to the Flask backend repo (sibling folder by default).
BACKEND_DIR ?= ../flyby_ai
FRONTEND_PORT ?= 8080
BACKEND_PORT  ?= 8659
VENV_PY = $(BACKEND_DIR)/venv/bin/python
VENV_PIP = $(BACKEND_DIR)/venv/bin/pip

.PHONY: default run up dev install install-frontend install-backend \
        frontend backend build preview stop clean seed health help

# `make` with no target runs the frontend dev server.
default: frontend

## ---------------------------------------------------------------------------
## Install
## ---------------------------------------------------------------------------
install: install-frontend install-backend ## Install all dependencies (frontend + backend)
	@echo "\n✅ Everything installed. Run 'make run' to start Flyby AI.\n"

install-frontend: ## Install frontend (npm) dependencies
	@echo "📦 Installing frontend dependencies..."
	npm install

install-backend: ## Create the backend virtualenv and install Python dependencies
	@echo "🐍 Setting up backend virtualenv + dependencies..."
	@cd $(BACKEND_DIR) && (test -d venv || python3 -m venv venv)
	@$(VENV_PIP) install -q --upgrade pip
	@$(VENV_PIP) install -q -r $(BACKEND_DIR)/requirements.txt

## ---------------------------------------------------------------------------
## Run
## ---------------------------------------------------------------------------
run up: ## Run backend (python main.py) AND frontend together — Ctrl+C stops both
	@echo "🚀 Starting Flyby AI — backend :$(BACKEND_PORT), frontend :$(FRONTEND_PORT)"
	@echo "   Open http://localhost:$(FRONTEND_PORT)  (Ctrl+C to stop both)\n"
	@bash -c ' \
	  FE=$$(pwd); \
	  cd $(BACKEND_DIR) && venv/bin/python main.py & BACK=$$!; \
	  trap "echo; echo \"🛑 Stopping...\"; kill $$BACK 2>/dev/null" EXIT INT TERM; \
	  cd $$FE && npm run dev'

frontend dev: ## Run ONLY the Vite dev server (:8080) — this is the default
	npm run dev

backend: ## Run ONLY the Flask backend (python main.py, :8659)
	cd $(BACKEND_DIR) && venv/bin/python main.py

## ---------------------------------------------------------------------------
## Build / misc
## ---------------------------------------------------------------------------
build: ## Production build of the frontend
	npm run build

preview: ## Preview the production build locally
	npm run preview

seed: ## Create the backend tables and seed the demo accounts
	cd $(BACKEND_DIR) && venv/bin/python -m flask --app main custom generate_data

health: ## Check that the backend is up
	@curl -fsS http://localhost:$(BACKEND_PORT)/health && echo "" \
	  || echo "❌ Backend is not responding on :$(BACKEND_PORT). Start it with 'make backend'."

stop: ## Kill anything left running on the app ports
	@echo "🛑 Freeing ports $(BACKEND_PORT) and $(FRONTEND_PORT)..."
	@lsof -ti tcp:$(BACKEND_PORT) | xargs kill -9 2>/dev/null || true
	@lsof -ti tcp:$(FRONTEND_PORT) | xargs kill -9 2>/dev/null || true
	@echo "Done."

clean: ## Remove build artifacts
	rm -rf dist

help: ## Show this help
	@echo "Flyby AI — available make targets:\n"
	@grep -E '^[a-zA-Z_ -]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
