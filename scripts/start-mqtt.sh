#!/usr/bin/env bash
set -euo pipefail

# Starts the MQTT broker via docker-compose and initializes retained values
# for read topics:
#  - trydan_v2c_sun_power
#  - trydan_v2c_grid_power
# The write topic (trydan_v2c_battery_power) is left for your app to publish.

BROKER_SERVICE="broker"
READ_TOPICS=("trydan_v2c_sun_power" "trydan_v2c_grid_power")
READ_VALUE="0"

# Seed using local mosquitto_pub against the published port
BROKER_HOST=${BROKER_HOST:-localhost}
BROKER_PORT=${BROKER_PORT:-1883}
MQTT_USER=${MQTT_USER:-}
MQTT_PASS=${MQTT_PASS:-}

opts=(-h "$BROKER_HOST" -p "$BROKER_PORT")
if [[ -n "$MQTT_USER" ]]; then
  opts+=( -u "$MQTT_USER" )
fi
if [[ -n "$MQTT_PASS" ]]; then
  opts+=( -P "$MQTT_PASS" )
fi

echo "[mqtt] Bringing up broker via docker compose..."
docker compose up -d "$BROKER_SERVICE"

# Retry helper for seeding retained messages until broker is ready
publish_retained() {
  local topic="$1"; local value="$2"; local tries=30; local delay=1
  for ((i=1;i<=tries;i++)); do
    if mosquitto_pub "${opts[@]}" -t "$topic" -m "$value" -r; then
      return 0
    fi
    echo "[mqtt] Broker not ready yet, retry $i/$tries..."
    sleep "$delay"
  done
  echo "[mqtt] Failed to publish retained message to '$topic'" >&2
  return 1
}

echo "[mqtt] Seeding retained values on read topics using mosquitto_pub..."
for topic in "${READ_TOPICS[@]}"; do
  echo "  - Publishing retained '${READ_VALUE}' to '${topic}'"
  publish_retained "$topic" "$READ_VALUE"
done

echo "[mqtt] Done. Broker listening on ${BROKER_HOST}:${BROKER_PORT}."
echo "[mqtt] Topics initialized: ${READ_TOPICS[*]}"
