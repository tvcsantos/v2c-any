# API Reference

This page documents the HTTP endpoints exposed by v2c-any when running in **REST mode**.

## Endpoints

### `GET /health`

Health check endpoint.

**Response:**

```json
{
  "ok": true
}
```

**Status codes:**

| Code  | Description |
| ----- | ----------- |
| `200` | Healthy     |

---

### `GET /rpc/EM1.GetStatus`

Get energy meter status. Compatible with the Shelly Pro EM API format.

**Query Parameters:**

| Parameter | Type     | Required | Description                       |
| --------- | -------- | -------- | --------------------------------- |
| `id`      | `number` | Yes      | Meter ID (`0` = grid, `1` = solar) |

**Success Response (`200`):**

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

**Response Fields:**

| Field         | Type     | Description                                      |
| ------------- | -------- | ------------------------------------------------ |
| `id`          | `number` | EM1 component instance ID                        |
| `voltage`     | `number` | Voltage measurement (V)                          |
| `current`     | `number` | Current measurement (A)                          |
| `act_power`   | `number` | Active power measurement (W)                     |
| `aprt_power`  | `number` | Apparent power measurement (VA)                  |
| `pf`          | `number` | Power factor                                     |
| `freq`        | `number` | Network frequency (Hz)                           |
| `calibration` | `string` | Calibration status (e.g., `"factory"`)           |
| `errors`      | `string[]` | Error conditions (present only if not empty)   |
| `flags`       | `string[]` | Condition flags (present only if not empty)    |

**Error Response:**

```json
{
  "code": -1,
  "message": "Error description"
}
```

---

### `POST /expectaction`

Update mock meter values at runtime. Only works with feeds configured as `type: mock`.

**Request Body:**

```json
{
  "id": 0,
  "act_power": 3000,
  "voltage": 230.0,
  "calibration": "factory"
}
```

The body follows the same schema as the `EM1Status` object. At minimum, `id` and `calibration` are required.

**Status Codes:**

| Code  | Description                                 |
| ----- | ------------------------------------------- |
| `200` | Value updated successfully                  |
| `400` | Unknown meter ID or meter not in mock mode  |
| `500` | Internal error                              |

## MQTT Topics

When running in **MQTT mode**, v2c-any publishes to these topics:

| Topic                      | Direction | Format               | Description  |
| -------------------------- | --------- | -------------------- | ------------ |
| `trydan_v2c_grid_power`    | Publish   | Plain number (watts) | Grid power   |
| `trydan_v2c_sun_power`     | Publish   | Plain number (watts) | Solar power  |

**Example:**

```
trydan_v2c_grid_power: 3450
trydan_v2c_sun_power: 2100
```

## CLI

v2c-any is invoked via the `v2ca` binary. It accepts no command-line arguments - all configuration is loaded from configuration files (see [Configuration](/guide/configuration)).

```bash
# Run with auto-detected configuration
v2ca

# Run via npx
npx v2c-any

# Run in development mode
npm run dev
```

The application logs to stdout using [pino](https://github.com/pinojs/pino) with [pino-pretty](https://github.com/pinojs/pino-pretty) formatting.
