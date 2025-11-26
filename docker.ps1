#!/usr/bin/env pwsh

# Build and Run Todo MCP Server Docker Container

param(
    [string]$Action = "build",
    [int]$Port = 8123,
    [string]$Tag = "todo-mcp-server"
)

Write-Host "Todo MCP Server Docker Management Script" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

switch ($Action.ToLower()) {
    "build" {
        Write-Host "Building Docker image: $Tag" -ForegroundColor Yellow
        docker build -t $Tag .
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Docker image built successfully!" -ForegroundColor Green
            Write-Host "To run the container, use: ./docker.ps1 run" -ForegroundColor Cyan
        } else {
            Write-Host "❌ Failed to build Docker image" -ForegroundColor Red
            exit 1
        }
    }
    
    "run" {
        Write-Host "Starting Todo MCP Server container on port $Port..." -ForegroundColor Yellow
        docker run -d `
            --name todo-mcp-server `
            -p "${Port}:8123" `
            -v todo-mcp-data:/app/data `
            --restart unless-stopped `
            $Tag
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Container started successfully!" -ForegroundColor Green
            Write-Host "🚀 Server is running at: http://localhost:$Port/mcp" -ForegroundColor Cyan
            Write-Host "📊 View logs: docker logs todo-mcp-server" -ForegroundColor Cyan
            Write-Host "🛑 Stop server: ./docker.ps1 stop" -ForegroundColor Cyan
        } else {
            Write-Host "❌ Failed to start container" -ForegroundColor Red
            exit 1
        }
    }
    
    "stop" {
        Write-Host "Stopping Todo MCP Server container..." -ForegroundColor Yellow
        docker stop todo-mcp-server
        docker rm todo-mcp-server
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Container stopped and removed successfully!" -ForegroundColor Green
        }
    }
    
    "logs" {
        Write-Host "Showing container logs..." -ForegroundColor Yellow
        docker logs -f todo-mcp-server
    }
    
    "compose-up" {
        Write-Host "Starting services with Docker Compose..." -ForegroundColor Yellow
        docker-compose up -d
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Services started successfully!" -ForegroundColor Green
            Write-Host "🚀 Server is running at: http://localhost:8123/mcp" -ForegroundColor Cyan
        }
    }
    
    "compose-down" {
        Write-Host "Stopping services with Docker Compose..." -ForegroundColor Yellow
        docker-compose down
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Services stopped successfully!" -ForegroundColor Green
        }
    }
    
    "clean" {
        Write-Host "Cleaning up Docker resources..." -ForegroundColor Yellow
        docker stop todo-mcp-server 2>$null
        docker rm todo-mcp-server 2>$null
        docker rmi $Tag 2>$null
        docker volume rm todo-mcp-data 2>$null
        Write-Host "✅ Cleanup completed!" -ForegroundColor Green
    }
    
    default {
        Write-Host "Usage: ./docker.ps1 [action]" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Available actions:" -ForegroundColor Cyan
        Write-Host "  build        - Build the Docker image" -ForegroundColor White
        Write-Host "  run          - Run the container" -ForegroundColor White
        Write-Host "  stop         - Stop and remove the container" -ForegroundColor White
        Write-Host "  logs         - Show container logs" -ForegroundColor White
        Write-Host "  compose-up   - Start with docker-compose" -ForegroundColor White
        Write-Host "  compose-down - Stop docker-compose services" -ForegroundColor White
        Write-Host "  clean        - Remove all Docker resources" -ForegroundColor White
        Write-Host ""
        Write-Host "Examples:" -ForegroundColor Cyan
        Write-Host "  ./docker.ps1 build" -ForegroundColor Gray
        Write-Host "  ./docker.ps1 run -Port 3000" -ForegroundColor Gray
        Write-Host "  ./docker.ps1 compose-up" -ForegroundColor Gray
    }
}