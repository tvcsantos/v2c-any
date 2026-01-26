# MQTT Mode (Direct Publisher)

## Overview

MQTT mode allows **v2c-any** to publish power data directly to MQTT topics that V2C wallboxes subscribe to. This enables push-based, event-driven updates with lower latency compared to REST polling.

## When to Use MQTT Mode

Use MQTT mode when:

- ✅ Your V2C wallbox is configured for MQTT integration
- ✅ You have an existing MQTT broker (Mosquitto, HiveMQ, etc.)
- ✅ You want push-based, event-driven updates
- ✅ You need lower latency or more frequent updates than REST polling allows
- ✅ You're integrating with other MQTT-based home automation systems
- ✅ You want to bridge multiple MQTT sources

**Don't use MQTT mode when:**

- ❌ Your V2C wallbox is only configured for Shelly REST polling (use REST mode)
- ❌ You don't have an MQTT broker and don't want to set one up
- ❌ Your data sources don't update frequently enough to benefit from push updates

## Configuration Schema

```typescript
{
  provider: 'mqtt',
  properties: {
    url: string,              // MQTT broker URL
    username?: string,        // Optional authentication
    password?: string,        // Optional authentication
    meters: {
      grid: MqttMeterConfig,  // Grid power configuration
      solar: MqttMeterConfig  // Solar power configuration
    }
  }
}
```

### Meter Modes

Each meter (grid/solar) supports two modes:

#### Pull Mode

v2c-any actively polls a device and publishes to MQTT:

```typescript
{
  mode: 'pull',
  feed: PullFeedConfig  // adapter, mock, or off
}
```

#### Push Mode

v2c-any subscribes to MQTT topics and republishes to V2C topics:

```typescript
{
  mode: 'push',
  feed: PushFeedConfig  // bridge or off
}
```

### Pull Feed Types

#### 1. HTTP Adapter Feed (Poll Device via HTTP)

Polls a device via HTTP at regular intervals and publishes to MQTT:

```typescript
{
  mode: 'pull',
  feed: {
    type: 'http-adapter',
    properties: {
      interval: number,        // Polling interval in ms
      device: string,          // Device type (e.g., 'shelly-pro-em')
      host: string,            // Device IP address
      protocol?: 'http' | 'https',  // Default: 'http'
      port?: number,           // Default: 80
      breaker?: BreakerOptions,     // Circuit breaker config (optional)
      retry?: RetryOptions,         // Retry config (optional)
      ema?: EmaOptions             // Smoothing config (optional)
    }
  }
}
```

#### 2. RPC MQTT Adapter Feed (Poll Device via RPC over MQTT)

Sends RPC requests over MQTT and processes responses:

```typescript
{
  mode: 'pull',
  feed: {
    type: 'rpc-mqtt-adapter',
    properties: {
      interval: number,        // Request interval in ms
      device: string,          // Device type (e.g., 'shelly-pro-em')
      url: string,             // MQTT broker URL for RPC
      username?: string,       // Optional authentication
      password?: string,       // Optional authentication
      topic: string,           // Topic to publish RPC requests
      id: string               // Device identifier
    }
  }
}
```

#### 3. Mock Feed (Simulated)

Publishes fixed or computed values at regular intervals:

```typescript
{
  mode: 'pull',
  feed: {
    type: 'mock',
    properties: {
      interval: number,        // Publishing interval in ms
      value?: {
        power: number          // Power in watts
      }
    }
  }
}
```

#### 3. Off Feed (Disabled)

Disables the meter:

```typescript
{
  mode: 'pull',
  feed: {
    type: 'off'
  }
}
```

### Push Feed Types

#### 1. Bridge Feed (MQTT Bridge)

Subscribes to an MQTT topic and republishes to V2C topics:

```typescript
{
  mode: 'push',
  feed: {
    type: 'bridge',
    properties: {
      url: string,            // Source MQTT broker URL
      username?: string,      // Optional authentication
      password?: string,      // Optional authentication
      device: string,         // Device type (for parsing messages)
      topic: string,          // Topic to subscribe to
      keepAlive: KeepAliveConfig  // Keep-alive configuration
    }
  }
}
```

**Keep-Alive Configuration:**

In push mode, v2c-any subscribes to MQTT topics and waits for messages. To ensure fresh data, you can configure a keep-alive mechanism that periodically requests data if no messages are received:

```typescript
// No keep-alive (default)
keepAlive: {
  type: 'off'
}

// HTTP-based keep-alive
keepAlive: {
  type: 'http-adapter',
  properties: {
    interval: number,        // Request interval in ms
    device: string,          // Device type
    host: string,            // Device IP address
    protocol?: 'http' | 'https',
    port?: number,
    breaker?: BreakerOptions,     // Circuit breaker config (optional)
    retry?: RetryOptions,         // Retry config (optional)
    ema?: EmaOptions             // Smoothing config (optional)
  }
}

// RPC MQTT-based keep-alive
keepAlive: {
  type: 'rpc-mqtt-adapter',
  properties: {
    interval: number,        // Request interval in ms
    device: string,          // Device type
    url: string,             // MQTT broker URL
    username?: string,
    password?: string,
    topic: string,           // RPC request topic
    id: string               // Device identifier
  }
}
```

The keep-alive timer resets whenever a message is received on the subscribed topic. If no message arrives within the interval, a request is triggered.

#### 2. Off Feed (Disabled)

Disables the meter:

```typescript
{
  mode: 'push',
  feed: {
    type: 'off'
  }
}
```

## Configuration Options

### MQTT Connection Options

| Option     | Type     | Required | Default | Description                                     |
| ---------- | -------- | -------- | ------- | ----------------------------------------------- |
| `url`      | `string` | Yes      | -       | MQTT broker URL (e.g., `mqtt://localhost:1883`) |
| `username` | `string` | No       | -       | Username for MQTT broker authentication         |
| `password` | `string` | No       | -       | Password for MQTT broker authentication         |

### Pull Mode Options

#### HTTP Adapter Feed

| Option     | Type                | Required | Default  | Description                                         |
| ---------- | ------------------- | -------- | -------- | --------------------------------------------------- |
| `interval` | `number`            | Yes      | -        | Polling interval in milliseconds                    |
| `device`   | `string`            | Yes      | -        | Device type identifier (currently: `shelly-pro-em`) |
| `host`     | `string`            | Yes      | -        | IP address or hostname of the device                |
| `protocol` | `'http' \| 'https'` | No       | `'http'` | Protocol to use for communication                   |
| `port`     | `number`            | No       | `80`     | Port number of the device                           |
| `breaker`  | `BreakerOptions`    | No       | -        | Circuit breaker configuration                       |
| `retry`    | `RetryOptions`      | No       | -        | Retry strategy configuration                        |
| `ema`      | `EmaOptions`        | No       | -        | Exponential moving average smoothing configuration  |

#### RPC MQTT Adapter Feed

| Option     | Type     | Required | Default | Description                                         |
| ---------- | -------- | -------- | ------- | --------------------------------------------------- |
| `interval` | `number` | Yes      | -       | Request interval in milliseconds                    |
| `device`   | `string` | Yes      | -       | Device type identifier (currently: `shelly-pro-em`) |
| `url`      | `string` | Yes      | -       | MQTT broker URL for RPC communication               |
| `username` | `string` | No       | -       | Username for MQTT broker authentication             |
| `password` | `string` | No       | -       | Password for MQTT broker authentication             |
| `topic`    | `string` | Yes      | -       | MQTT topic to publish RPC requests                  |
| `id`       | `string` | Yes      | -       | Device identifier used in RPC requests              |

#### Mock Feed

| Option     | Type                | Required | Default | Description                                                 |
| ---------- | ------------------- | -------- | ------- | ----------------------------------------------------------- |
| `interval` | `number`            | Yes      | -       | Publishing interval in milliseconds                         |
| `value`    | `{ power: number }` | No       | -       | Fixed power value in watts. If omitted, publishes undefined |

### Push Mode Options

#### Bridge Feed

| Option      | Type              | Required | Default | Description                                                             |
| ----------- | ----------------- | -------- | ------- | ----------------------------------------------------------------------- |
| `url`       | `string`          | Yes      | -       | Source MQTT broker URL                                                  |
| `username`  | `string`          | No       | -       | Username for source broker authentication                               |
| `password`  | `string`          | No       | -       | Password for source broker authentication                               |
| `device`    | `string`          | Yes      | -       | Device type for parsing messages (e.g., `shelly-pro-em`)                |
| `topic`     | `string`          | Yes      | -       | MQTT topic to subscribe to                                              |
| `keepAlive` | `KeepAliveConfig` | Yes      | -       | Keep-alive configuration (`off`, `http-adapter`, or `rpc-mqtt-adapter`) |

### Resilience Options

See [REST Mode documentation](REST_MODE.md#resilience-options) for detailed explanation of:

- Circuit Breaker (`breaker`)
- Retry Strategy (`retry`)
- Exponential Moving Average (`ema`)

## MQTT Topics

v2c-any publishes to the following topics that V2C wallboxes subscribe to:

- **Grid power:** `trydan_v2c_grid_power`
- **Solar power:** `trydan_v2c_sun_power`

**Message format:** Plain number (power in watts)

**Example:**

```text
trydan_v2c_grid_power: 3450
trydan_v2c_sun_power: 2100
```

## Examples

### Example 1: Pull Both Meters

Poll two Shelly Pro EM devices and publish to MQTT:

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
          interval: 2000
          device: shelly-pro-em
          host: 192.168.1.100
    solar:
      mode: pull
      feed:
        type: http-adapter
        properties:
          interval: 2000
          device: shelly-pro-em
          host: 192.168.1.101
```

**Use case:** Standard setup where you want to publish data from two physical meters to MQTT for V2C consumption.

### Example 2: Push from Existing MQTT Infrastructure

Bridge existing MQTT topics to V2C topics:

```yaml
provider: mqtt
properties:
  url: mqtt://broker.local:1883
  username: v2c-user
  password: secure-password
  meters:
    grid:
      mode: push
      feed:
        type: bridge
        properties:
          url: mqtt://solar-system.local:1883
          device: shelly-pro-em
          topic: home/energy/grid
          keepAlive:
            type: off
    solar:
      mode: push
      feed:
        type: bridge
        properties:
          url: mqtt://solar-system.local:1883
          device: shelly-pro-em
          topic: home/energy/solar
          keepAlive:
            type: off
```

**Use case:** You already have meters publishing to MQTT topics and want to republish them in V2C format.

### Example 3: Hybrid Pull/Push Configuration

Pull from grid meter, push from existing solar MQTT:

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
          interval: 1000
          device: shelly-pro-em
          host: 192.168.1.100
    solar:
      mode: push
      feed:
        type: bridge
        properties:
          url: mqtt://solar-system.local:1883
          device: shelly-pro-em
          topic: solar/inverter/power
          keepAlive:
            type: http-adapter
            properties:
              interval: 30000
              device: shelly-pro-em
              host: 192.168.1.101
```

**Use case:** Mixed environment where grid uses REST polling but solar already publishes to MQTT.

### Example 4: Mock Solar, Real Grid (Testing)

Simulate solar production while using real grid data:

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
          interval: 2000
          device: shelly-pro-em
          host: 192.168.1.100
    solar:
      mode: pull
      feed:
        type: mock
        properties:
          interval: 1000
          value:
            power: 2500
```

**Use case:** Testing solar integration without physical panels or when your solar meter is offline.

### Example 5: High-Frequency Updates

Fast polling with resilience features:

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
          interval: 500 # Poll every 500ms
          device: shelly-pro-em
          host: 192.168.1.100
          breaker:
            timeout: 300
            errorThresholdPercentage: 20
          retry:
            attempts: 3
            minTimeout: 100
            maxTimeout: 1000
          ema:
            alphaRise: 0.4
            alphaFall: 0.6
            alphaMissing: 0.1
            freshnessThreshold: 2000
    solar:
      mode: pull
      feed:
        type: http-adapter
        properties:
          interval: 500
          device: shelly-pro-em
          host: 192.168.1.101
```

**Use case:** Scenarios requiring very responsive power tracking (fast EV charging adjustments).

### Example 6: Secure MQTT with TLS

Connect to a secured MQTT broker:

```yaml
provider: mqtt
properties:
  url: mqtts://secure-broker.local:8883
  username: v2c-client
  password: secure-password
  meters:
    grid:
      mode: pull
      feed:
        type: http-adapter
        properties:
          interval: 2000
          device: shelly-pro-em
          host: 192.168.1.100
          protocol: https
          port: 443
    solar:
      mode: pull
      feed:
        type: off
```

### Example 7: Complete Mock Setup

Simulate both meters for development:

```yaml
provider: mqtt
properties:
  url: mqtt://localhost:1883
  meters:
    grid:
      mode: pull
      feed:
        type: mock
        properties:
          interval: 1000
          value:
            power: 3500
    solar:
      mode: pull
      feed:
        type: mock
        properties:
          interval: 1000
          value:
            power: 1800
```

**Use case:** Development, testing, or demonstrations without any physical hardware.

## How It Works

### Pull Mode Flow

```text
┌──────────────┐
│   v2c-any    │
└──────┬───────┘
       │ Every interval
       ▼
┌──────────────┐
│ Shelly Pro EM│  ─── GET /rpc/EM1.GetStatus?id=0
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ MQTT Broker  │  ─── PUBLISH trydan_v2c_grid_power: 3450
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ V2C Wallbox  │  ─── SUBSCRIBE trydan_v2c_grid_power
└──────────────┘
```

### Push Mode Flow

```text
┌──────────────────┐
│ Source System    │  ─── PUBLISH home/energy/grid: {...}
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Source MQTT      │
│ Broker           │
└────────┬─────────┘
         │ SUBSCRIBE home/energy/grid
         ▼
┌──────────────────┐
│   v2c-any        │  ─── Transform & republish
└────────┬─────────┘
         │ PUBLISH trydan_v2c_grid_power: 3450
         ▼
┌──────────────────┐
│ V2C MQTT Broker  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ V2C Wallbox      │  ─── SUBSCRIBE trydan_v2c_grid_power
└──────────────────┘
```

## Setting Up MQTT Broker

If you don't have an MQTT broker, you can quickly set one up:

### Using Docker

```bash
docker run -d \
  --name mosquitto \
  -p 1883:1883 \
  eclipse-mosquitto
```

### Using Docker Compose (included)

The project includes a ready-to-use MQTT broker:

```bash
docker-compose up -d
```

This starts Mosquitto on `localhost:1883`.

## Troubleshooting

### V2C wallbox not receiving updates

**Possible causes:**

1. V2C wallbox not subscribed to correct topics
2. MQTT broker not running
3. Network connectivity issues
4. Wrong broker URL in V2C configuration

**Solutions:**

- Verify broker is running: `mosquitto_sub -h localhost -t '#' -v`
- Check v2c-any logs for connection errors
- Ensure V2C wallbox is configured for MQTT mode
- Test publishing manually: `mosquitto_pub -h localhost -t trydan_v2c_grid_power -m "1000"`

### Connection refused to MQTT broker

**Possible causes:**

1. Broker not running
2. Wrong URL/port
3. Firewall blocking connections

**Solutions:**

- Verify broker is running: `docker ps` or check system services
- Test connection: `mosquitto_sub -h broker-host -p 1883 -t test`
- Check firewall rules

### Authentication failures

**Possible causes:**

1. Wrong username/password
2. Broker requires authentication but credentials not provided
3. Broker configured for TLS but using non-TLS URL

**Solutions:**

- Verify credentials
- Check broker logs
- Use `mqtts://` for TLS connections
- Test connection: `mosquitto_pub -h host -u username -P password -t test -m "hello"`

### Updates too slow in pull mode

**Solutions:**

1. Decrease `interval` value (but not too aggressive)
2. Consider switching to push mode if data source supports it
3. Check network latency to device

### High CPU usage

**Possible causes:**

1. Polling interval too aggressive
2. Too many concurrent operations

**Solutions:**

- Increase `interval` (e.g., from 500ms to 2000ms)
- Add EMA smoothing to reduce update frequency
- Monitor device response times

## Performance Considerations

### On Pull Mode

- **Update frequency:** Controlled by `interval` setting
- **Recommended intervals:** 1000-5000ms for most scenarios
- **Network overhead:** Each poll = 1 HTTP request + 1 MQTT publish
- **Resource usage:** ~40-60 MB RAM

### On Push Mode

- **Update frequency:** Depends on source MQTT publishing rate
- **Latency:** Very low (~10-50ms from source publish to V2C publish)
- **Network overhead:** 1 MQTT subscription + 1 MQTT publish per update
- **Resource usage:** ~30-50 MB RAM

### Optimization Tips

1. **Use push mode when possible** for lower latency and better efficiency
2. **Don't poll too aggressively** - Most scenarios work fine with 2-5 second intervals
3. **Enable EMA smoothing** to reduce fluctuations and publish frequency
4. **Use circuit breaker** to prevent overwhelming slow devices
5. **Monitor MQTT broker load** if handling many messages

## Migration from REST Mode

To migrate from REST to MQTT mode:

1. **Set up MQTT broker** if not already running
2. **Configure V2C wallbox** for MQTT mode instead of Shelly REST polling
3. **Update v2c-any configuration** to use `provider: 'mqtt'`
4. **Choose pull or push mode** based on your data sources
5. **Test with low intervals first**, then optimize

## Migration from Shelly to MQTT

To migrate from Shelly direct MQTT to v2c-any:

1. **Keep existing Shelly devices** publishing to their topics
2. **Configure v2c-any in push mode** to bridge Shelly topics to V2C topics
3. **Update V2C wallbox** to subscribe to v2c-any topics instead of Shelly topics
4. **Optional:** Add resilience features (circuit breaker, retry, EMA)

## See Also

- [REST Mode Documentation](REST_MODE.md) - For pull-based integration
- [Configuration Schema](../src/schema/mqtt-configuration.ts) - Full TypeScript schema
- [Resilience Options](RESILIENCE.md) - Detailed explanation of circuit breaker, retry, and EMA
