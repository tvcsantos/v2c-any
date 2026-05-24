# Getting Started

## Why v2c-any?

V2C wallboxes support Dynamic Power Control via specific meters or MQTT inputs. In real installations, however, power data often comes from **heterogeneous sources**:

- Different brands of energy meters
- Existing MQTT infrastructures
- Home Assistant sensors
- Custom hardware or software systems
- Simulated or virtual meters for testing

**v2c-any** bridges that gap. It adapts **any input** into the protocol and format expected by a V2C wallbox - without changing your existing setup.

## Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- An MQTT broker (for MQTT mode) - e.g. [Mosquitto](https://mosquitto.org/)
- A V2C wallbox configured for Dynamic Power Control

## Quick Start

### npx (no install needed)

```bash
npx v2c-any
```

### Global install

```bash
npm install -g v2c-any
v2ca
```

### From source

```bash
git clone https://github.com/tvcsantos/v2c-any.git
cd v2c-any
npm install
npm run build
npm start
```

### Docker

```bash
# Published image
docker run -v $(pwd)/.v2carc.yaml:/app/.v2carc.yaml ghcr.io/tvcsantos/v2c-any

# Or build locally
docker build -t v2c-any .
docker run -v $(pwd)/.v2carc.yaml:/app/.v2carc.yaml v2c-any
```

See [Docker](./docker) for full Docker and Docker Compose setup.

## Configuration

Create a `.v2carc.yaml` file in your working directory:

```yaml
provider: mqtt
properties:
  url: mqtt://localhost:1883
  meters:
    grid:
      mode: pull
      feed:
        type: http-adapter
        properties:
          device: shelly-pro-em
          interval: 5000
          host: 192.168.1.100
    solar:
      mode: pull
      feed:
        type: mock
        properties:
          interval: 5000
          value:
            power: 2500
```

See [Configuration](./configuration) for all options and formats.

## Choosing a Mode

v2c-any supports two primary operating modes:

| Feature         | REST Mode                  | MQTT Mode                   |
| --------------- | -------------------------- | --------------------------- |
| **Protocol**    | HTTP/REST                  | MQTT                        |
| **Direction**   | Pull (V2C polls v2ca)      | Push (v2ca publishes)       |
| **Latency**     | Higher (polling interval)  | Lower (event-driven)        |
| **Setup**       | Simpler (no broker needed) | Requires MQTT broker        |
| **Use Case**    | Shelly meter replacement   | MQTT-native setups          |
| **Scalability** | Limited by polling         | Better for multiple devices |

- **[REST Mode](./rest-mode)** - Emulates a Shelly Pro EM. Use when your V2C wallbox polls a Shelly meter.
- **[MQTT Mode](./mqtt-mode)** - Publishes to MQTT topics. Use when your wallbox is configured for MQTT integration.

## Next Steps

- [Configuration](./configuration) - Learn about all configuration file formats and options.
- [REST Mode](./rest-mode) - Detailed guide for REST mode.
- [MQTT Mode](./mqtt-mode) - Detailed guide for MQTT mode.
- [Docker](./docker) - Deploy with Docker and Docker Compose.
- [Resilience](/reference/resilience) - Circuit breaker, retry, and EMA smoothing options.
