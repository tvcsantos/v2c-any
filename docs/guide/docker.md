# Docker

v2c-any provides Docker support out of the box for easy deployment and
management.

## Docker Image

### Building

```bash
docker build -t v2c-any .
```

The Dockerfile uses a multi-stage build:

1. **Builder stage** - Installs all dependencies and compiles TypeScript
2. **Production stage** - Copies only the built output and production
   dependencies, runs as a non-root user

### Running

```bash
docker run -v $(pwd)/.v2carc.yaml:/app/.v2carc.yaml v2c-any
```

For REST mode, you need to expose the HTTP port:

```bash
docker run \
  -p 3000:3000 \
  -v $(pwd)/.v2carc.yaml:/app/.v2carc.yaml \
  v2c-any
```

### Environment Variables

| Variable         | Default      | Description         |
| ---------------- | ------------ | ------------------- |
| `NODE_ENV`       | `production` | Node.js environment |
| `V2CA_LOG_LEVEL` | `info`       | Logging level       |

## Docker Compose

The project includes a ready-to-use `docker-compose.yml` that starts both an
MQTT broker (Mosquitto) and v2c-any.

### Services

| Service  | Image                   | Ports  | Description         |
| -------- | ----------------------- | ------ | ------------------- |
| `broker` | `eclipse-mosquitto:2.0` | `1883` | MQTT broker         |
| `app`    | Built from Dockerfile   | `3000` | v2c-any application |

### Starting

```bash
# Start all services
docker compose up -d

# Start only the MQTT broker
docker compose up -d broker

# View logs
docker compose logs -f app

# Stop all services
docker compose down
```

### Configuration

Mount your configuration file to `/app/.v2carc.yaml`:

```yaml
services:
  app:
    volumes:
      - ./.v2carc.yaml:/app/.v2carc.yaml:ro
```

### Customizing the Compose File

The included `docker-compose.yml`:

```yaml
services:
  broker:
    image: eclipse-mosquitto:2.0
    container_name: mqtt-broker
    ports:
      - '1883:1883'
    volumes:
      - ./docker/mosquitto/mosquitto.conf:/mosquitto/config/mosquitto.conf:ro
      - mosquitto_data:/mosquitto/data
      - mosquitto_log:/mosquitto/log
    networks:
      - v2c-network

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: v2c-any
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - V2CA_LOG_LEVEL=${V2CA_LOG_LEVEL:-info}
    volumes:
      - ./.v2carc.yaml:/app/.v2carc.yaml:ro
    depends_on:
      - broker
    networks:
      - v2c-network
    restart: unless-stopped

networks:
  v2c-network:
    driver: bridge

volumes:
  mosquitto_data:
  mosquitto_log:
```

## Setting Up an MQTT Broker

If you only need a standalone MQTT broker (without v2c-any in Docker):

```bash
docker run -d \
  --name mosquitto \
  -p 1883:1883 \
  eclipse-mosquitto
```

Or use the included compose file to start just the broker:

```bash
docker compose up -d broker
```

This starts Mosquitto on `localhost:1883`.

## Production Tips

- Use `restart: unless-stopped` or `restart: always` for the v2c-any container.
- Mount configuration as read-only (`:ro`).
- Use named volumes for Mosquitto data persistence.
- Set `V2CA_LOG_LEVEL=warn` in production to reduce log noise.
- Place the MQTT broker and v2c-any on the same Docker network for low-latency
  communication.
