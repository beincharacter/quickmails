.PHONY: help install install-all install-client install-server dev dev-client dev-server build build-client build-server clean test seed preview server server-prod check-deps

# Default target
help:
	@echo "Email Sender SaaS - Available Commands:"
	@echo ""
	@echo "Installation:"
	@echo "  make install-all          Install all dependencies (client + server)"
	@echo "  make install-client       Install client dependencies only"
	@echo "  make install-server       Install server dependencies only"
	@echo ""
	@echo "Development:"
	@echo "  make dev                  Run both client and server in development mode"
	@echo "  make dev-client           Run client in development mode"
	@echo "  make dev-server           Run server in development mode"
	@echo ""
	@echo "Build:"
	@echo "  make build                Build both client and server"
	@echo "  make build-client         Build client only"
	@echo "  make build-server         Build server only"
	@echo ""
	@echo "Production:"
	@echo "  make server-prod          Start production server (compiled)"
	@echo "  make preview              Preview client build"
	@echo ""
	@echo "Utilities:"
	@echo "  make seed                 Seed database with test data"
	@echo "  make check-deps           Check if required dependencies are installed"
	@echo "  make clean                Clean build artifacts"
	@echo ""

# Installation
install-all: install-client install-server
	@echo "✅ All dependencies installed"

install-client:
	@echo "📦 Installing client dependencies..."
	cd client && npm install

install-server:
	@echo "📦 Installing server dependencies..."
	cd server && npm install

# Development
dev:
	@echo "🚀 Starting development mode (client + server)..."
	@echo "   Client: http://localhost:5173"
	@echo "   Server: http://localhost:3001"
	@echo ""
	@echo "   Press Ctrl+C to stop both"
	@$(MAKE) -j2 dev-client dev-server

dev-client:
	@echo "🎨 Starting client development server..."
	cd client && npm run dev

dev-server:
	@echo "⚙️  Starting server development mode..."
	cd server && npm run dev

# Build
build: build-client build-server
	@echo "✅ Build complete!"

build-client:
	@echo "🏗️  Building client..."
	cd client && npm run build
	@echo "✅ Client build complete → client/dist/"

build-server:
	@echo "🏗️  Building server..."
	cd server && npm run build
	@echo "✅ Server build complete → server/dist/"

# Production
server-prod:
	@echo "🚀 Starting production server..."
	cd server && npm run start

preview:
	@echo "👀 Previewing client build..."
	cd client && npm run preview

# Utilities
seed:
	@echo "🌱 Seeding database with test data..."
	cd server && npm run seed

check-deps:
	@echo "🔍 Checking dependencies..."
	@node scripts/check-dependencies.js

check-jobs:
	@echo "📊 Checking Redis jobs..."
	@cd server && node scripts/check-redis-jobs.mjs

check-jobs-queue:
	@echo "📊 Checking Redis jobs (specify queue name)..."
	@echo "Usage: make check-jobs-queue QUEUE=email-sending"
	@cd server && node scripts/check-redis-jobs.mjs $(QUEUE)

check-job:
	@echo "🔍 Checking specific job details..."
	@echo "Usage: make check-job JOB_ID=34"
	@echo "   Or: make check-job QUEUE=email-sending JOB_ID=34"
	@cd server && node scripts/check-redis-jobs.mjs $(or $(QUEUE),email-sending) $(JOB_ID)

clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf client/dist
	rm -rf server/dist
	@echo "✅ Clean complete!"

# Shortcuts (alias targets)
install: install-all
i: install-all
d: dev
dc: dev-client
ds: dev-server
b: build
bc: build-client
bs: build-server
s: server-prod
p: preview

