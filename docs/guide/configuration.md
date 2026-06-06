# Configuration

`v2ca` uses [cosmiconfig](https://github.com/cosmiconfig/cosmiconfig) to load
configuration, which means it automatically searches for configuration in
several standard locations and formats.

## Configuration Files

Create a configuration file in one of these formats:

| File             | Format       |
| ---------------- | ------------ |
| `.v2carc`        | JSON or YAML |
| `.v2carc.json`   | JSON         |
| `.v2carc.yaml`   | YAML         |
| `.v2carc.yml`    | YAML         |
| `v2ca.config.js` | CommonJS/ESM |
| `package.json`   | `"v2ca"` key |

cosmiconfig searches from the current working directory upward, using the first
configuration file it finds.

## Top-Level Schema

Every configuration file has the same top-level structure - a `provider`
discriminator and a `properties` object:

```yaml
provider: rest | mqtt
properties:
  # ... mode-specific options
```

### REST Provider

```yaml
provider: rest
properties:
  port: 3000 # HTTP server port
  meters:
    grid:
      feed: { ... } # Feed configuration
    solar:
      feed: { ... } # Feed configuration
```

See [REST Mode](./rest-mode) for full details.

### MQTT Provider

```yaml
provider: mqtt
properties:
  url: mqtt://localhost:1883 # MQTT broker URL
  username: user # Optional
  password: pass # Optional
  meters:
    grid:
      mode: pull | push
      feed: { ... } # Feed configuration
    solar:
      mode: pull | push
      feed: { ... } # Feed configuration
```

See [MQTT Mode](./mqtt-mode) for full details.

## Meters

Both modes require configuring two meters:

| Meter   | ID  | Description            |
| ------- | --- | ---------------------- |
| `grid`  | `0` | Grid power consumption |
| `solar` | `1` | Solar power production |

Each meter must have a feed configuration, even if it's set to `off`.

> [!NOTE]
>
> These IDs are fixed and cannot be changed, as they correspond to the V2C
> protocol specification. The `id` property in feed configurations is optional
> and only used for certain feed types (e.g. `mock`).

## Feed Types

### `http-adapter`

Polls a real device via HTTP. Currently supports the Shelly Pro EM.

```yaml
feed:
  type: http-adapter
  properties:
    device: shelly-pro-em
    host: 192.168.1.100
    protocol: http # Optional, default: http
    port: 80 # Optional, default: 80
    interval: 2000 # Required in MQTT pull mode
    breaker: { ... } # Optional circuit breaker
    retry: { ... } # Optional retry strategy
    ema: { ... } # Optional EMA smoothing
```

### `rpc-mqtt-adapter`

Sends RPC requests over MQTT (MQTT pull mode only).

```yaml
feed:
  type: rpc-mqtt-adapter
  properties:
    device: shelly-pro-em
    interval: 2000
    url: mqtt://broker:1883
    username: user # Optional
    password: pass # Optional
    topic: shellyproem/rpc
    id: shellyproem-abc123
```

### `mock`

Returns fixed or simulated values. Useful for testing.

::: code-group

```yaml [REST Mode]
feed:
  type: mock
  properties:
    value:
      id: 0
      act_power: 3500
      calibration: factory
```

```yaml [MQTT Mode]
feed:
  type: mock
  properties:
    interval: 1000
    value:
      power: 3500
```

:::

### `bridge`

Subscribes to an MQTT topic and republishes to V2C topics (MQTT push mode only).

```yaml
feed:
  type: bridge
  properties:
    url: mqtt://source-broker:1883
    username: user # Optional
    password: pass # Optional
    device: shelly-pro-em
    topic: home/energy/grid
    keepAlive:
      type: off # or http-adapter / rpc-mqtt-adapter
```

### `off`

Disables the meter.

```yaml
feed:
  type: off
```

## Resilience Options

All `http-adapter` feeds support optional resilience configuration. These can be
combined freely.

```yaml
feed:
  type: http-adapter
  properties:
    device: shelly-pro-em
    host: 192.168.1.100
    breaker:
      timeout: 5000
      errorThresholdPercentage: 30
    retry:
      attempts: 3
      minTimeout: 500
    ema:
      alphaRise: 0.5
      alphaFall: 0.4
      alphaMissing: 0.1
      freshnessThreshold: 10000
```

See [Resilience](/reference/resilience) for complete documentation on circuit
breaker, retry, and EMA options.

## Example Configurations

### Minimal REST

```yaml
provider: rest
properties:
  port: 80
  meters:
    grid:
      feed:
        type: http-adapter
        properties:
          device: shelly-pro-em
          host: 192.168.1.100
    solar:
      feed:
        type: off
```

### Minimal MQTT

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
          interval: 2000
          host: 192.168.1.100
    solar:
      mode: pull
      feed:
        type: off
```

### Full-Featured MQTT

```yaml
provider: mqtt
properties:
  url: mqtt://localhost:1883
  username: v2c-user
  password: secure-password
  meters:
    grid:
      mode: pull
      feed:
        type: http-adapter
        properties:
          interval: 1000
          device: shelly-pro-em
          host: 192.168.1.100
          breaker:
            timeout: 3000
            errorThresholdPercentage: 25
            resetTimeout: 15000
          retry:
            attempts: 3
            factor: 2
            minTimeout: 500
          ema:
            alphaRise: 0.5
            alphaFall: 0.4
            alphaMissing: 0.1
            freshnessThreshold: 10000
    solar:
      mode: push
      feed:
        type: bridge
        properties:
          url: mqtt://solar-broker.local:1883
          device: shelly-pro-em
          topic: solar/inverter/power
          keepAlive:
            type: http-adapter
            properties:
              interval: 30000
              device: shelly-pro-em
              host: 192.168.1.101
```
