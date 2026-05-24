---
layout: home

hero:
  name: v2c-any
  text: Turn any device into V2C Dynamic Power Control
  tagline: A universal adapter that bridges any power data source to V2C wallboxes for dynamic EV charging.
  image:
    src: /images/v2c-any-icon-alpha.png
    alt: v2c-any
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/tvcsantos/v2c-any

features:
  - icon: 🔌
    title: Universal Adapter
    details: Works with any power data source - physical meters, MQTT topics, simulators, or proxies.
  - icon: 📡
    title: MQTT Support
    details: Publish once, charge dynamically. Push-based, event-driven updates with low latency.
  - icon: ⚡
    title: Dynamic Power Control
    details: Supports grid, solar, or hybrid scenarios for intelligent EV charging.
  - icon: 🧪
    title: Simulation Mode
    details: Emulate supported meters for testing and development without physical hardware.
  - icon: 🔁
    title: Proxy Mode
    details: Forward and transform existing device data to the V2C protocol seamlessly.
  - icon: 🧩
    title: Extensible Architecture
    details: Add new adapters easily. TypeScript-first for predictable, typed, maintainable code.
---

## What is v2c-any?

V2C wallboxes expect power data from specific meters or MQTT inputs - but real setups are rarely that simple.

**v2c-any** sits in between, adapting **any power data source** into the protocol your V2C wallbox expects:

- **REST mode** - emulates a Shelly Pro EM so your wallbox polls v2c-any directly
- **MQTT mode** - publishes power data to the MQTT topics your wallbox subscribes to
- **Any input** - physical meters, MQTT bridges, HTTP APIs, or simulated data

The name says it all - from the TypeScript `any` type: _"I don't care what you are, I can work with you."_

## What it is _not_

- Not a replacement for your existing meters
- Not tied to a single vendor or ecosystem
- Not a lock-in - it's an **adapter**
