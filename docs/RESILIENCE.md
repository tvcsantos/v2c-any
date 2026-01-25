# Resilience Features

## Overview

**v2c-any** provides comprehensive resilience features to ensure reliable operation even when data sources are unstable, slow, or temporarily unavailable. These features can be applied to any adapter feed in both REST and MQTT modes.

The three main resilience mechanisms are:

1. **Circuit Breaker** - Prevents cascading failures by failing fast when error thresholds are exceeded
2. **Retry Strategy** - Automatically retries failed requests with exponential backoff
3. **Exponential Moving Average (EMA)** - Smooths power readings to reduce fluctuations and provides graceful degradation

These features can be used independently or combined for maximum resilience.

## Circuit Breaker

### What is a Circuit Breaker?

A circuit breaker protects your system from cascading failures when a data source becomes unreliable or unresponsive. It works like an electrical circuit breaker - when too many failures occur, it "opens" the circuit and fails fast instead of waiting for timeouts, giving the failing service time to recover.

### Circuit States

```text
┌─────────┐
│ CLOSED  │ ◄─── Normal operation, requests pass through
└────┬────┘
     │ Errors exceed threshold
     ▼
┌─────────┐
│  OPEN   │ ◄─── Failing fast, no requests sent
└────┬────┘
     │ After resetTimeout
     ▼
┌──────────┐
│ HALF_OPEN│ ◄─── Testing with single request
└────┬─────┘
     │ Success      │ Failure
     ▼              ▼
  CLOSED          OPEN
```

### Circuit Breaker Configuration

```yaml
breaker:
  timeout: 10000 # Request timeout (ms)
  errorThresholdPercentage: 50 # Error % to open circuit (0-100)
  resetTimeout: 30000 # Time before retry (ms)
  rollingCountTimeout: 10000 # Error tracking window (ms)
  rollingCountBuckets: 10 # Number of buckets for rolling count
  volumeThreshold: 10 # Min requests before opening
  allowWarmUp: true # Allow warm-up period
```

**Options:**

| Option                     | Type      | Default | Description                                                                                                             |
| -------------------------- | --------- | ------- | ----------------------------------------------------------------------------------------------------------------------- |
| `timeout`                  | `number`  | `10000` | Maximum time to wait for a response (milliseconds). Requests exceeding this are considered failures.                    |
| `errorThresholdPercentage` | `number`  | `50`    | Percentage of failed requests (0-100) required to open the circuit. E.g., 50 = circuit opens when 50% of requests fail. |
| `resetTimeout`             | `number`  | `30000` | Time in milliseconds the circuit stays open before attempting to close (entering half-open state).                      |
| `rollingCountTimeout`      | `number`  | `10000` | Time window in milliseconds for tracking errors. Only errors within this window count toward the threshold.             |
| `rollingCountBuckets`      | `number`  | `10`    | Number of buckets to divide the rolling count window into. More buckets = finer granularity.                            |
| `volumeThreshold`          | `number`  | `10`    | Minimum number of requests required before the circuit can open. Prevents opening on low traffic.                       |
| `allowWarmUp`              | `boolean` | `true`  | If true, allows warm-up period before enforcing thresholds. Useful for startup scenarios.                               |

**When to use:**

✅ **Use circuit breaker when:**

- Data source is sometimes slow or unresponsive
- You want to prevent cascading failures
- You need to fail fast during outages
- System should give failing services time to recover
- You're dealing with remote devices over unreliable networks

❌ **Don't use circuit breaker when:**

- Data source is always reliable and fast
- Temporary failures are unacceptable (prefer retries instead)
- You need every request to be attempted

### Circuit Breaker Examples

#### Conservative Settings

Good for stable networks where occasional failures are expected:

```yaml
feed:
  type: adapter
  properties:
    device: shelly-pro-em
    host: 192.168.1.100
    breaker:
      timeout: 5000
      errorThresholdPercentage: 30
      resetTimeout: 20000
      volumeThreshold: 5
```

#### Aggressive Settings

Good for unreliable networks where you want to fail fast:

```yaml
feed:
  type: adapter
  properties:
    device: shelly-pro-em
    host: 192.168.1.100
    breaker:
      timeout: 2000
      errorThresholdPercentage: 20
      resetTimeout: 10000
      rollingCountTimeout: 5000
      volumeThreshold: 3
```

#### Lenient Settings

Good for slow but eventually consistent data sources:

```yaml
feed:
  type: adapter
  properties:
    device: shelly-pro-em
    host: 192.168.1.100
    breaker:
      timeout: 15000
      errorThresholdPercentage: 70
      resetTimeout: 60000
      volumeThreshold: 20
```

## Retry Strategy

### What is Retry Strategy?

Automatic retry with exponential backoff handles transient failures by retrying failed requests with increasing delays between attempts. This is effective for temporary network issues, brief service outages, or rate limiting.

### Retry Behavior

```text
Attempt 1: Immediate
   ▼ FAIL
Attempt 2: Wait minTimeout (e.g., 1000ms)
   ▼ FAIL
Attempt 3: Wait minTimeout * factor (e.g., 2000ms)
   ▼ FAIL
Attempt 4: Wait minTimeout * factor² (e.g., 4000ms)
   ▼ FAIL
...
Final: Wait up to maxTimeout
```

### Retry Configuration

```yaml
retry:
  attempts: 5 # Max retry attempts
  factor: 2 # Backoff multiplier
  minTimeout: 1000 # Initial delay (ms)
  maxTimeout: 60000 # Max delay between retries (ms)
  randomize: true # Add jitter to delays
  maxRetryTime: 300000 # Total time limit for all retries (ms)
```

**Options:**

| Option         | Type      | Default  | Description                                                                                                        |
| -------------- | --------- | -------- | ------------------------------------------------------------------------------------------------------------------ |
| `attempts`     | `number`  | `3`      | Maximum number of retry attempts. E.g., 3 = initial attempt + 3 retries = 4 total attempts.                        |
| `factor`       | `number`  | `2`      | Exponential backoff multiplier. Delay doubles with each retry (factor=2).                                          |
| `minTimeout`   | `number`  | `1000`   | Initial delay in milliseconds before first retry. Each subsequent retry increases by factor.                       |
| `maxTimeout`   | `number`  | `60000`  | Maximum delay in milliseconds between retries. Prevents delays from growing infinitely.                            |
| `randomize`    | `boolean` | `true`   | Add random jitter to delays to prevent thundering herd problem. Recommended: true.                                 |
| `maxRetryTime` | `number`  | `300000` | Maximum total time in milliseconds for all retry attempts. Stops retrying after this time even if attempts remain. |

### Special Behavior

**Circuit Breaker Integration:** When used with a circuit breaker, retries automatically stop if the circuit opens (preventing wasted retry attempts).

**When to use:**

✅ **Use retry strategy when:**

- Network connections are occasionally flaky
- Data source has brief, transient failures
- API endpoints occasionally return 5xx errors
- You want to handle temporary outages gracefully
- Eventual consistency is acceptable

❌ **Don't use retry strategy when:**

- Failures are permanent (e.g., authentication errors)
- You need immediate failure feedback
- Retry delays would cause unacceptable latency
- The operation is not idempotent

### Retry Examples

#### Quick Retries

Good for fast networks with occasional hiccups:

```yaml
feed:
  type: adapter
  properties:
    device: shelly-pro-em
    host: 192.168.1.100
    retry:
      attempts: 3
      factor: 1.5
      minTimeout: 500
      maxTimeout: 5000
      randomize: true
```

**Timing:** 0ms → 500ms → 750ms → 1125ms (total ~2.4s)

#### Patient Retries

Good for slow or overloaded services:

```yaml
feed:
  type: adapter
  properties:
    device: shelly-pro-em
    host: 192.168.1.100
    retry:
      attempts: 5
      factor: 2
      minTimeout: 2000
      maxTimeout: 30000
      randomize: true
      maxRetryTime: 120000
```

**Timing:** 0ms → 2s → 4s → 8s → 16s → 30s (capped, total ~60s or until maxRetryTime)

#### Aggressive Retries

Good for critical data where you want many quick attempts:

```yaml
feed:
  type: adapter
  properties:
    device: shelly-pro-em
    host: 192.168.1.100
    retry:
      attempts: 10
      factor: 1.2
      minTimeout: 100
      maxTimeout: 5000
```

## Exponential Moving Average (EMA)

### What is EMA?

Exponential Moving Average smooths power readings over time, reducing noise and fluctuations. It's particularly useful for:

- Filtering out sensor noise
- Smoothing erratic power readings
- Providing graceful degradation when data becomes unavailable
- Creating asymmetric response (fast rise, slow fall or vice versa)

### EMA Mechanics

EMA maintains a running average that gives more weight to recent values:

```text
EMA_new = α × new_value + (1 - α) × EMA_old
```

Where `α` (alpha) is the smoothing factor (0 to 1):

- **Higher α (e.g., 0.8):** More responsive to changes (less smoothing)
- **Lower α (e.g., 0.2):** More smoothing (less responsive)

### Asymmetric EMA

**v2c-any** supports **asymmetric smoothing** with different alphas for rising vs falling values:

- `alphaRise`: Used when new value > current EMA
- `alphaFall`: Used when new value < current EMA
- `alphaMissing`: Used when data fetch fails

**Example use case:** Solar power often rises quickly (cloud clears) but falls slowly (cloud approaches). You might want `alphaRise=0.6` (responsive to increases) and `alphaFall=0.3` (smooth decreases).

### EMA Configuration

```yaml
ema:
  alphaRise: 0.5 # Smoothing for rising values (0-1)
  alphaFall: 0.5 # Smoothing for falling values (0-1)
  alphaMissing: 0.1 # Decay rate when data missing (0-1)
  freshnessThreshold: 10000 # Time before data is stale (ms)
```

**Options:**

| Option               | Type           | Required | Description                                                                            |
| -------------------- | -------------- | -------- | -------------------------------------------------------------------------------------- |
| `alphaRise`          | `number` (0-1) | Yes      | Smoothing factor when values are increasing. Higher = more responsive.                 |
| `alphaFall`          | `number` (0-1) | Yes      | Smoothing factor when values are decreasing. Higher = more responsive.                 |
| `alphaMissing`       | `number` (0-1) | Yes      | Smoothing factor when data fetch fails. Controls decay toward zero.                    |
| `freshnessThreshold` | `number`       | No       | Time in ms before data is considered stale. If exceeded, uses `alphaMissing` to decay. |

**When to use:**

✅ **Use EMA when:**

- Power readings are noisy or fluctuating
- You want to filter out brief spikes/dips
- Graceful degradation during outages is important
- You need different response rates for increases vs decreases
- Sensor data has measurement noise

❌ **Don't use EMA when:**

- You need real-time, unfiltered values
- Power changes need immediate reflection
- Your data source already provides smoothed values
- You're doing analytics that require raw data

### EMA Examples

#### Balanced Smoothing

Equal smoothing for rises and falls:

```yaml
feed:
  type: adapter
  properties:
    device: shelly-pro-em
    host: 192.168.1.100
    ema:
      alphaRise: 0.4
      alphaFall: 0.4
      alphaMissing: 0.1
      freshnessThreshold: 10000
```

**Result:** Moderate smoothing, symmetric response to changes.

#### Fast Rise, Slow Fall

Responsive to increases, smooth on decreases (good for solar):

```yaml
feed:
  type: adapter
  properties:
    device: shelly-pro-em
    host: 192.168.1.100
    ema:
      alphaRise: 0.7
      alphaFall: 0.2
      alphaMissing: 0.05
      freshnessThreshold: 5000
```

**Result:**

- Quickly tracks increasing power (sun emerging)
- Slowly tracks decreasing power (cloud passing)
- Slowly decays toward zero if data unavailable

#### Heavy Smoothing

Maximum smoothing for very noisy data:

```yaml
feed:
  type: adapter
  properties:
    device: shelly-pro-em
    host: 192.168.1.100
    ema:
      alphaRise: 0.1
      alphaFall: 0.1
      alphaMissing: 0.01
      freshnessThreshold: 30000
```

**Result:** Very smooth, slow to respond to changes, holds values for long periods during outages.

#### Minimal Smoothing

Light smoothing, highly responsive:

```yaml
feed:
  type: adapter
  properties:
    device: shelly-pro-em
    host: 192.168.1.100
    ema:
      alphaRise: 0.9
      alphaFall: 0.9
      alphaMissing: 0.3
```

**Result:** Minimal smoothing, nearly real-time tracking.

## Combining Resilience Features

The three features can be combined for comprehensive resilience. They are applied in layers:

```text
Request Flow:

Circuit Breaker (outermost)
    ▼
Retry Strategy
    ▼
EMA Smoothing
    ▼
Base Provider (device)
```

### Combination Examples

#### Full Resilience Stack

```yaml
feed:
  type: adapter
  properties:
    device: shelly-pro-em
    host: 192.168.1.100

    # Fail fast if device is down
    breaker:
      timeout: 3000
      errorThresholdPercentage: 25
      resetTimeout: 15000
      volumeThreshold: 5

    # Retry transient failures
    retry:
      attempts: 3
      factor: 2
      minTimeout: 500
      maxTimeout: 5000
      randomize: true

    # Smooth readings and handle gaps
    ema:
      alphaRise: 0.5
      alphaFall: 0.4
      alphaMissing: 0.1
      freshnessThreshold: 10000
```

**Behavior:**

1. **Circuit Breaker** prevents hammering a failing device
2. **Retry** handles brief network issues
3. **EMA** smooths noisy readings and provides graceful degradation
4. If device is down, returns last smoothed value (decaying toward zero)

#### High-Frequency Polling

For aggressive polling (e.g., 500ms intervals):

```yaml
feed:
  type: adapter
  properties:
    interval: 500 # (MQTT mode only)
    device: shelly-pro-em
    host: 192.168.1.100

    breaker:
      timeout: 300
      errorThresholdPercentage: 20
      resetTimeout: 5000
      rollingCountTimeout: 2000
      volumeThreshold: 3

    retry:
      attempts: 2
      minTimeout: 100
      maxTimeout: 500

    ema:
      alphaRise: 0.6
      alphaFall: 0.5
      alphaMissing: 0.2
      freshnessThreshold: 2000
```

#### Maximum Stability

For maximum stability at the cost of responsiveness:

```yaml
feed:
  type: adapter
  properties:
    device: shelly-pro-em
    host: 192.168.1.100

    breaker:
      timeout: 10000
      errorThresholdPercentage: 60
      resetTimeout: 60000
      volumeThreshold: 20

    retry:
      attempts: 5
      factor: 2
      minTimeout: 2000
      maxTimeout: 30000
      maxRetryTime: 120000

    ema:
      alphaRise: 0.2
      alphaFall: 0.2
      alphaMissing: 0.05
      freshnessThreshold: 30000
```

## Choosing the Right Configuration

### Decision Tree

```text
Is your data source reliable?
├─ YES → Minimal or no resilience features needed
└─ NO
   └─ What type of failures occur?
      ├─ Brief network glitches → Use RETRY
      ├─ Occasional long outages → Use CIRCUIT BREAKER
      ├─ Noisy/fluctuating readings → Use EMA
      └─ All of the above → Use ALL THREE
```

### Common Scenarios

#### Scenario 1: Stable Local Network

**Setup:** Devices on reliable local network, occasional Wi-Fi hiccups

**Recommendation:**

```yaml
retry:
  attempts: 3
  minTimeout: 500
  maxTimeout: 3000
# No circuit breaker needed
# Light EMA if readings are noisy
```

#### Scenario 2: Unreliable Internet Connection

**Setup:** Remote devices over internet, frequent dropouts

**Recommendation:**

```yaml
breaker:
  timeout: 5000
  errorThresholdPercentage: 30
  resetTimeout: 20000

retry:
  attempts: 4
  minTimeout: 1000
  maxTimeout: 10000

ema:
  alphaRise: 0.4
  alphaFall: 0.4
  alphaMissing: 0.1
  freshnessThreshold: 15000
```

#### Scenario 3: Noisy Sensors

**Setup:** Reliable connection but readings fluctuate wildly

**Recommendation:**

```yaml
# No circuit breaker or retry needed
ema:
  alphaRise: 0.2
  alphaFall: 0.2
  alphaMissing: 0.1
  freshnessThreshold: 5000
```

#### Scenario 4: Critical Production System

**Setup:** Maximum reliability required, cost is not a concern

**Recommendation:**

```yaml
breaker:
  timeout: 3000
  errorThresholdPercentage: 20
  resetTimeout: 10000

retry:
  attempts: 5
  factor: 1.5
  minTimeout: 500
  maxTimeout: 5000

ema:
  alphaRise: 0.5
  alphaFall: 0.5
  alphaMissing: 0.1
  freshnessThreshold: 10000
```

## Monitoring and Debugging

### Log Messages

**v2c-any** logs important resilience events:

**Circuit Breaker:**

- `Circuit opened` - Too many failures, circuit opened
- `Circuit half-open` - Testing if service recovered
- `Circuit closed` - Service recovered, normal operation resumed

**Retry:**

- `Attempt to get value failed` - Retry attempt failed
- Includes: `attemptNumber`, `retriesLeft`, `retriesConsumed`

**EMA:**

- `Handling missing value` - Data fetch failed, decaying toward zero
- `Returning last EMA value` - Using cached smooth value

### Troubleshooting

#### Circuit Keeps Opening

**Symptoms:** Frequent "Circuit opened" messages

**Possible causes:**

- Target device is genuinely down or slow
- Timeout too aggressive
- Error threshold too low

**Solutions:**

1. Check target device health
2. Increase `timeout` value
3. Increase `errorThresholdPercentage`
4. Increase `volumeThreshold`

#### Too Many Retries

**Symptoms:** High latency, many retry log messages

**Possible causes:**

- Network is unstable
- Too many retry attempts
- Retry timeouts too long

**Solutions:**

1. Reduce `attempts`
2. Reduce `maxTimeout`
3. Add or tune circuit breaker to fail faster

#### EMA Too Smooth/Not Smooth Enough

**Symptoms:** Values lag behind reality (too smooth) or still noisy (not smooth enough)

**Solutions:**

- **Too smooth:** Increase alpha values (e.g., 0.2 → 0.5)
- **Not smooth enough:** Decrease alpha values (e.g., 0.7 → 0.3)
- Adjust asymmetrically if needed (different rise/fall rates)

## Performance Impact

### Circuit Breaker Performance

- **CPU:** Negligible
- **Memory:** ~1KB per circuit
- **Latency:** Adds <1ms overhead per request

### Retry Strategy Performance

- **CPU:** Negligible
- **Memory:** Negligible
- **Latency:** Adds delay during failures (by design)

### EMA Performance

- **CPU:** Negligible (simple arithmetic)
- **Memory:** Stores one value per meter
- **Latency:** Adds <1ms overhead per request

**Overall:** All resilience features are very lightweight and can be used without performance concerns.

## See Also

- [REST Mode Documentation](REST_MODE.md) - REST mode configuration
- [MQTT Mode Documentation](MQTT_MODE.md) - MQTT mode configuration
- [Configuration Schema](../src/schema/common-configuration.ts) - TypeScript schema definitions
