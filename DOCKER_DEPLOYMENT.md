# Docker Deployment Guide for Todo MCP Server

## Overview

This guide covers deploying the Todo MCP Server using Docker in HTTP mode. The server provides a Model Context Protocol (MCP) interface over HTTP with Server-Sent Events support.

## Prerequisites

- Docker Desktop installed and running
- Git (to clone the repository)
- PowerShell (for Windows users using the provided scripts)

## Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd todo-mcp-server

# Start the services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop the services
docker-compose down
```

### Option 2: PowerShell Scripts (Windows)

```powershell
# Validate setup
.\validate-docker-setup.ps1

# Build the image
.\docker.ps1 build

# Run the container
.\docker.ps1 run

# View logs
.\docker.ps1 logs

# Stop the container
.\docker.ps1 stop
```

### Option 3: Manual Docker Commands

```bash
# Build the image
docker build -t todo-mcp-server .

# Run the container
docker run -d \
  --name todo-mcp-server \
  -p 8123:8123 \
  -v todo-mcp-data:/app/data \
  --restart unless-stopped \
  todo-mcp-server

# View logs
docker logs -f todo-mcp-server

# Stop and remove container
docker stop todo-mcp-server
docker rm todo-mcp-server
```

## Configuration

### Environment Variables

The container supports the following environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8123` | HTTP server port |
| `NODE_ENV` | `production` | Node.js environment |
| `DB_PATH` | `/app/data/todo.db` | SQLite database path |

### Custom Port

To run on a different port:

```bash
# Docker run with custom port
docker run -d \
  --name todo-mcp-server \
  -p 3000:8123 \
  -e PORT=8123 \
  -v todo-mcp-data:/app/data \
  todo-mcp-server

# Or using PowerShell script
.\docker.ps1 run -Port 3000
```

### Data Persistence

The container uses Docker volumes to persist SQLite database:

- Volume: `todo-mcp-data`
- Mount point: `/app/data`
- Database file: `/app/data/todo.db`

## Testing the Deployment

Once the container is running, test the server:

```bash
# Health check (should return 200 OK)
curl -X GET http://localhost:8123/mcp

# Initialize MCP session
curl -X POST http://localhost:8123/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {
        "name": "test-client",
        "version": "1.0.0"
      }
    }
  }'
```

## Integration with MCP Clients

### GitHub Copilot Configuration

Add to your MCP configuration file:

```json
{
    "servers": {
        "todo-http": {
            "type": "http",
            "url": "http://localhost:8123/mcp"
        }
    },
    "inputs": []
}
```

### Claude Desktop Configuration

For stdio mode (not HTTP), you can still use:

```json
{
  "mcpServers": {
    "todo": {
      "command": "docker",
      "args": ["run", "--rm", "-i", "todo-mcp-server", "node", "index.js"]
    }
  }
}
```

## Monitoring and Maintenance

### View Container Status

```bash
# Check if container is running
docker ps | grep todo-mcp-server

# View container resource usage
docker stats todo-mcp-server

# Inspect container configuration
docker inspect todo-mcp-server
```

### Logs and Debugging

```bash
# View recent logs
docker logs todo-mcp-server

# Follow logs in real-time
docker logs -f todo-mcp-server

# View logs with timestamps
docker logs -t todo-mcp-server
```

### Health Checks

The container includes a built-in health check:

```bash
# Check container health status
docker inspect --format='{{.State.Health.Status}}' todo-mcp-server

# View health check logs
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' todo-mcp-server
```

## Security Considerations

- The container runs as a non-root user (`nodeuser`)
- Only the necessary port (8123) is exposed
- SQLite database is stored in a Docker volume
- No sensitive data is logged

## Troubleshooting

### Container Won't Start

```bash
# Check container logs for errors
docker logs todo-mcp-server

# Verify image was built correctly
docker images | grep todo-mcp-server

# Check port availability
netstat -an | findstr :8123  # Windows
lsof -i :8123                # macOS/Linux
```

### Connection Issues

```bash
# Test if port is accessible
curl -v http://localhost:8123/mcp

# Check if container is listening on correct port
docker exec todo-mcp-server netstat -tlnp | grep 8123
```

### Data Persistence Issues

```bash
# List Docker volumes
docker volume ls | grep todo

# Inspect volume
docker volume inspect todo-mcp-data

# Backup database
docker run --rm -v todo-mcp-data:/data -v $(pwd):/backup alpine cp /data/todo.db /backup/
```

## Scaling and Production Deployment

### Multiple Instances

```bash
# Run multiple instances with different ports
docker run -d --name todo-mcp-1 -p 8123:8123 todo-mcp-server
docker run -d --name todo-mcp-2 -p 8124:8123 todo-mcp-server
docker run -d --name todo-mcp-3 -p 8125:8123 todo-mcp-server
```

### Reverse Proxy Setup

Example Nginx configuration:

```nginx
upstream todo_mcp {
    server localhost:8123;
    server localhost:8124;
    server localhost:8125;
}

server {
    listen 80;
    server_name your-domain.com;
    
    location /mcp {
        proxy_pass http://todo_mcp;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Backup and Recovery

### Database Backup

```bash
# Create backup
docker run --rm \
  -v todo-mcp-data:/data \
  -v $(pwd):/backup \
  alpine cp /data/todo.db /backup/todo-backup-$(date +%Y%m%d).db

# Restore from backup
docker run --rm \
  -v todo-mcp-data:/data \
  -v $(pwd):/backup \
  alpine cp /backup/todo-backup-20241126.db /data/todo.db
```