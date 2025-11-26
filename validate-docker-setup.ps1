#!/usr/bin/env pwsh

# Docker Setup Validation Script for Todo MCP Server

Write-Host "Todo MCP Server Docker Setup Validation" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host ""

# Check if Docker is installed
Write-Host "🔍 Checking Docker installation..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker is installed: $dockerVersion" -ForegroundColor Green
    } else {
        throw "Docker not found"
    }
} catch {
    Write-Host "❌ Docker is not installed or not in PATH" -ForegroundColor Red
    Write-Host "📥 Please install Docker Desktop from: https://www.docker.com/products/docker-desktop" -ForegroundColor Cyan
    Write-Host ""
}

# Check required files
Write-Host ""
Write-Host "🔍 Checking required files..." -ForegroundColor Yellow

$requiredFiles = @(
    "Dockerfile",
    "docker-compose.yml", 
    ".dockerignore",
    "package.json",
    "http-server.js",
    "src/server/index.js"
)

$allFilesExist = $true

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $file is missing" -ForegroundColor Red
        $allFilesExist = $false
    }
}

Write-Host ""
Write-Host "🔍 Validating package.json scripts..." -ForegroundColor Yellow
try {
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    if ($packageJson.scripts."start:http") {
        Write-Host "✅ start:http script found" -ForegroundColor Green
    } else {
        Write-Host "❌ start:http script missing" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error reading package.json" -ForegroundColor Red
}

Write-Host ""
if ($allFilesExist) {
    Write-Host "🎉 All required files are present!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Install Docker Desktop if not already installed" -ForegroundColor White
    Write-Host "2. Run: ./docker.ps1 build" -ForegroundColor White
    Write-Host "3. Run: ./docker.ps1 run" -ForegroundColor White
    Write-Host "4. Test: curl http://localhost:8123/mcp" -ForegroundColor White
    Write-Host ""
    Write-Host "Alternative with Docker Compose:" -ForegroundColor Cyan
    Write-Host "1. Run: docker-compose up -d" -ForegroundColor White
    Write-Host "2. Test: curl http://localhost:8123/mcp" -ForegroundColor White
} else {
    Write-Host "⚠️  Some required files are missing. Please ensure all files are in place." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔧 Docker commands quick reference:" -ForegroundColor Cyan
Write-Host "Build:     docker build -t todo-mcp-server ." -ForegroundColor Gray
Write-Host "Run:       docker run -d -p 8123:8123 --name todo-mcp-server todo-mcp-server" -ForegroundColor Gray
Write-Host "Logs:      docker logs -f todo-mcp-server" -ForegroundColor Gray
Write-Host "Stop:      docker stop todo-mcp-server && docker rm todo-mcp-server" -ForegroundColor Gray