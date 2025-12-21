![v2a - V2C any](docs/assets/images/v2ca.png)

# v2c-any (v2ca)

> **Turn `{ device: any }` into V2C Dynamic Power Control**

**v2c-any** (binary: `v2ca`) is a universal adapter that allows **any device** — physical meters, MQTT topics, simulators, or proxies — to integrate with **V2C wallboxes** for **Dynamic Power Control**.

If it can expose power data, **v2c-any** can make it speak *V2C*.

## Why v2c-any?

V2C wallboxes support Dynamic Power Control via specific meters or MQTT inputs.  
In real installations, however, power data often comes from **heterogeneous sources**:

- Different brands of energy meters  
- Existing MQTT infrastructures  
- Home Assistant sensors  
- Custom hardware or software systems  
- Simulated or virtual meters for testing  

**v2c-any** bridges that gap.

It adapts **any input** into the protocol and format expected by a V2C wallbox — without changing your existing setup.

## The idea

```ts
{ device: any } → V2C
```

Or in practical terms:

```
[Any Meter | MQTT | API | Simulator]
            │
            ▼
         v2c-any
            │
            ▼
       V2C Wallbox
```

## Key features

- 🔌 **Universal adapter** – works with *any* power data source  
- 📡 **MQTT support** – publish once, charge dynamically  
- ⚡ **Dynamic Power Control** – grid, solar, or hybrid scenarios  
- 🧪 **Simulation mode** – emulate supported meters for testing  
- 🔁 **Proxy mode** – forward and transform existing devices  
- 🧩 **Extensible architecture** – add new adapters easily  
- 🟦 **TypeScript-first** – predictable, typed, maintainable  

## What v2c-any is *not*

- ❌ Not a replacement for your existing meters  
- ❌ Not tied to a single vendor or ecosystem  
- ❌ Not limited to one communication protocol  

It’s an **adapter**, not a lock-in.

## Name origin

`v2c-any` comes from the TypeScript `any` type:

> “I don’t care what you are — I can work with you.”

Exactly the philosophy behind this project.

## License

MIT License - see [LICENSE](LICENSE) for details.
