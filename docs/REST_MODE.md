# REST Mode (Shelly Pro EM Emulator)

## Overview

REST mode allows **v2c-any** to emulate a **Shelly Pro EM** energy meter by exposing a REST API that V2C wallboxes can poll. This makes v2c-any act as a drop-in replacement for physical Shelly hardware.

## When to Use REST Mode

Use REST mode when:

- ✅ Your V2C wallbox is configured to poll a Shelly Pro EM meter
- ✅ You want to replace physical Shelly hardware without reconfiguring your wallbox
- ✅ You prefer a pull-based (polling) approach
- ✅ You don't have or don't want to set up an MQTT broker
- ✅ You're testing or simulating meter behavior

**Don't use REST mode when:**

- ❌ Your V2C wallbox is already configured for MQTT (use MQTT mode instead)
- ❌ You need very low latency updates (MQTT is faster)
- ❌ You want push-based event-driven updates

## Configuration Schema

```typescript
{
  provider: 'rest',
  properties: {
    port: number,              // HTTP server port (e.g., 3000)
    meters: {
      grid: RestFeedConfig,    // Grid power configuration
      solar: RestFeedConfig    // Solar power configuration
    }
  }
}
```

### Feed Types

Each meter (grid/solar) supports three feed types:

#### 1. HTTP Adapter Feed (Real Device)

Polls a real Shelly Pro EM device and forwards its data:

```typescript
{
  feed: {
    type: 'http-adapter',
    properties: {
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

#### 2. Mock Feed (Simulated)

Returns fixed or dynamically computed values:

```typescript
{
  feed: {
    type: 'mock',
    properties?: {
      value?: {
        id: number,            // EM1 channel ID (0 or 1)
        voltage?: number,      // Voltage in V
        current?: number,      // Current in A
        act_power?: number,    // Active power in W
        aprt_power?: number,   // Apparent power in VA
        pf?: number,           // Power factor
        freq?: number,         // Frequency in Hz
        calibration: string    // Calibration status
      }
    }
  }
}
```

#### 3. Off Feed (Disabled)

Disables the meter:

```typescript
{
  feed: {
    type: 'off';
  }
}
```

## Configuration Options

### HTTP Server Options

| Option | Type     | Required | Default | Description                                 |
| ------ | -------- | -------- | ------- | ------------------------------------------- |
| `port` | `number` | Yes      | -       | Port for the HTTP server (e.g., 3000, 8080) |

### HTTP Adapter Feed Options

| Option     | Type                | Required | Default  | Description                                         |
| ---------- | ------------------- | -------- | -------- | --------------------------------------------------- |
| `device`   | `string`            | Yes      | -        | Device type identifier (currently: `shelly-pro-em`) |
| `host`     | `string`            | Yes      | -        | IP address or hostname of the device                |
| `protocol` | `'http' \| 'https'` | No       | `'http'` | Protocol to use for communication                   |
| `port`     | `number`            | No       | `80`     | Port number of the device                           |

### Resilience Options

#### Circuit Breaker (`breaker`)

Prevents cascading failures by opening the circuit when errors exceed thresholds:

| Option                     | Type      | Default | Description                                      |
| -------------------------- | --------- | ------- | ------------------------------------------------ |
| `timeout`                  | `number`  | `10000` | Request timeout in milliseconds                  |
| `errorThresholdPercentage` | `number`  | `50`    | Error percentage to open circuit (0-100)         |
| `resetTimeout`             | `number`  | `30000` | Time before attempting to close circuit (ms)     |
| `rollingCountTimeout`      | `number`  | `10000` | Window for rolling error count (ms)              |
| `rollingCountBuckets`      | `number`  | `10`    | Number of buckets for rolling count              |
| `volumeThreshold`          | `number`  | `10`    | Minimum requests before circuit can open         |
| `allowWarmUp`              | `boolean` | `true`  | Allow warm-up period before enforcing thresholds |

#### Retry Strategy (`retry`)

Automatically retries failed requests with exponential backoff:

| Option         | Type      | Default  | Description                             |
| -------------- | --------- | -------- | --------------------------------------- |
| `attempts`     | `number`  | `3`      | Maximum number of retry attempts        |
| `factor`       | `number`  | `2`      | Exponential backoff factor              |
| `minTimeout`   | `number`  | `1000`   | Minimum delay between retries (ms)      |
| `maxTimeout`   | `number`  | `60000`  | Maximum delay between retries (ms)      |
| `randomize`    | `boolean` | `true`   | Add randomness to retry delays          |
| `maxRetryTime` | `number`  | `300000` | Maximum total time for all retries (ms) |

#### Exponential Moving Average (`ema`)

Smooths power readings to reduce fluctuations:

| Option               | Type           | Required | Description                                                   |
| -------------------- | -------------- | -------- | ------------------------------------------------------------- |
| `alphaRise`          | `number` (0-1) | Yes      | Smoothing factor for rising values (higher = more responsive) |
| `alphaFall`          | `number` (0-1) | Yes      | Smoothing factor for falling values                           |
| `alphaMissing`       | `number` (0-1) | Yes      | Smoothing factor when data is missing                         |
| `freshnessThreshold` | `number`       | No       | Time in ms before data is considered stale                    |

### Mock Feed Options

| Option  | Type        | Required | Description                                               |
| ------- | ----------- | -------- | --------------------------------------------------------- |
| `value` | `EM1Status` | No       | Fixed EM1 status to return. If omitted, returns undefined |

## Examples

### Example 1: Basic Setup (Real Shelly Device)

Proxy a real Shelly Pro EM device without modifications:

```yaml
provider: rest
properties:
  port: 3000
  meters:
    grid:
      feed:
        type: http-adapter
        properties:
          device: shelly-pro-em
          host: 192.168.1.100
    solar:
      feed:
        type: http-adapter
        properties:
          device: shelly-pro-em
          host: 192.168.1.101
```

**Usage:**

1. Start v2c-any: `v2ca`
2. Configure V2C wallbox to use Shelly PRO EM

> Note that V2C wallbox considers meter ID `0` as grid and `1` as solar.
>
> Also V2C does not allow to define the port number, and uses `80` by default.
> So make sure to set the correct port in v2c-any configuration.

### Example 2: Mock Solar, Real Grid

Use real grid measurements but simulate solar production:

```yaml
provider: rest
properties:
  port: 8080
  meters:
    grid:
      feed:
        type: http-adapter
        properties:
          device: shelly-pro-em
          host: 192.168.1.100
    solar:
      feed:
        type: mock
        properties:
          value:
            id: 1
            voltage: 230.5
            current: 10.87
            act_power: 2500
            aprt_power: 2550
            pf: 0.98
            freq: 50
            calibration: factory
```

**Use case:** Testing solar integration without physical panels or when your solar meter is offline.

### Example 3: High-Availability Configuration

Add resilience with circuit breaker, retries, and smoothing:

```yaml
provider: rest
properties:
  port: 3000
  meters:
    grid:
      feed:
        type: http-adapter
        properties:
          device: shelly-pro-em
          host: 192.168.1.100
          breaker:
            timeout: 5000
            errorThresholdPercentage: 30
            resetTimeout: 20000
          retry:
            attempts: 5
            minTimeout: 500
            maxTimeout: 30000
          ema:
            alphaRise: 0.3
            alphaFall: 0.5
            alphaMissing: 0.1
            freshnessThreshold: 10000
    solar:
      feed:
        type: off
```

**Benefits:**

- Circuit breaker prevents overwhelming a flaky device
- Retries handle transient network issues
- EMA smoothing reduces power reading fluctuations
- Falls back to last known value if device becomes unavailable

### Example 4: HTTPS with Custom Port

Connect to a Shelly device behind HTTPS on a non-standard port:

```yaml
provider: rest
properties:
  port: 3000
  meters:
    grid:
      feed:
        type: http-adapter
        properties:
          device: shelly-pro-em
          host: secure-meter.local
          protocol: https
          port: 8443
    solar:
      feed:
        type: off
```

### Example 5: Complete Mock Setup (Testing)

Simulate both meters for development or testing:

```yaml
provider: rest
properties:
  port: 3000
  meters:
    grid:
      feed:
        type: mock
        properties:
          value:
            id: 0
            voltage: 230.0
            current: 15.5
            act_power: 3565
            aprt_power: 3600
            pf: 0.99
            freq: 50
            calibration: factory
    solar:
      feed:
        type: mock
        properties:
          value:
            id: 1
            act_power: 1800
            calibration: factory
```

**Use case:** Development, testing, or demonstrations without any physical hardware.

## API Endpoints

When running in REST mode, v2c-any exposes the following endpoints:

### `GET /health`

Health check endpoint.

**Response:**

```json
{
  "ok": true
}
```

### `GET /rpc/EM1.GetStatus`

Get energy meter status (Shelly Pro EM compatible).

**Query Parameters:**

- `id` (required): Meter ID (`0` for grid, `1` for solar)

**Response (success):**

```json
{
  "id": 0,
  "voltage": 230.5,
  "current": 12.3,
  "act_power": 2834,
  "aprt_power": 2875,
  "pf": 0.986,
  "freq": 50.0,
  "calibration": "factory"
}
```

**Response (error):**

```json
{
  "code": -1,
  "message": "Error description"
}
```

### `POST /expectaction`

Update mock meter values at runtime (only works with mock feeds).

**Body:**

```json
{
  "id": 0,
  "act_power": 3000,
  "voltage": 230.0
}
```

**Response (success):** HTTP 200

**Response (errors):**

- HTTP 400: Unknown meter ID or meter not in mock mode
- HTTP 500: Internal error

## How It Works

```text
┌─────────────┐
│ V2C Wallbox │
└──────┬──────┘
       │ HTTP GET /rpc/EM1.GetStatus?id=0
       ▼
┌──────────────┐
│   v2c-any    │
│  (REST API)  │
└──────┬───────┘
       │
       ├─► Grid Feed (adapter)  ──► Polls real Shelly @ 192.168.1.100
       │
       └─► Solar Feed (mock)    ──► Returns fixed value
```

## Troubleshooting

### V2C wallbox shows "Meter Offline"

**Possible causes:**

1. Wrong port configured in V2C wallbox
2. Firewall blocking connections
3. v2c-any not running

**Solutions:**

- Verify v2c-any is running: check logs or curl `http://your-host:port/health`
- Check firewall rules
- Ensure V2C wallbox can reach the v2c-any host

### Getting "Unknown ID" errors

**Cause:** The V2C wallbox is requesting a meter ID that isn't configured.

**Solution:** Ensure both `grid` (id=0) and `solar` (id=1) are configured, even if you set one to `type: 'off'`.

### Power readings are erratic

**Solutions:**

1. Enable EMA smoothing to reduce fluctuations
2. Increase `freshnessThreshold` to use cached values longer
3. Add retry logic to handle transient network issues

### Circuit breaker keeps opening

**Possible causes:**

1. Target device is unreliable or slow
2. Circuit breaker thresholds too aggressive

**Solutions:**

- Increase `timeout` value
- Increase `errorThresholdPercentage`
- Increase `resetTimeout` to give device more recovery time
- Check target device health

## Migration from Physical Shelly

To migrate from a physical Shelly Pro EM to v2c-any:

1. **Note your current V2C wallbox configuration** (Shelly IP address)
2. **Deploy v2c-any** with REST mode on the same IP (or update V2C config)
3. **Configure v2c-any** to either:
   - Proxy the existing Shelly (http-adapter feed)
   - Replace it with another data source
   - Use mock data for testing
4. **No changes needed on V2C wallbox** if using the same IP address

## Performance Considerations

- **Polling interval:** The V2C wallbox controls how often it polls. Typical intervals are 1-10 seconds.
- **Response time:** HTTP adapter feeds add minimal latency (~50-200ms depending on network)
- **Concurrent requests:** Fastify server handles multiple simultaneous requests efficiently
- **Resource usage:** Very lightweight (~30-50 MB RAM)

## See Also

- [MQTT Mode Documentation](MQTT_MODE.md) - For push-based integration
- [Configuration Schema](../src/schema/rest-configuration.ts) - Full TypeScript schema
- [Resilience Options](RESILIENCE.md) - Detailed explanation of circuit breaker, retry, and EMA
