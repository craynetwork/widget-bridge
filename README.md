# Cross-Domain Communication Bridge Library Documentation

## Overview

The `WidgetBridge` class facilitates secure cross-domain communication between different browser contexts (e.g., iframes, popups, or other windows). It leverages the `postMessage` API and supports asynchronous message handling using `async/await`.

## Features

- Asynchronous request handling with `SendAsync`
- Event-driven architecture with `addEventListener`
- Secure communication by enforcing `origin` restrictions
- Automatic message resolution and rejection
- Reset mechanism to clear pending promises
- Supports both synchronous (`Send`) and asynchronous (`SendAsync`) messaging

## Installation

```sh
npm install widget-bridge
```

## Usage

### Initialization

```ts
import WidgetBridge from "widget-bridge";
const popup = window.open("https://trusted-origin.com");

const bridge = new WidgetBridge({
  cb: (key, message) => {
    console.log("Received message:", key, message);
  },
  channel: popup,
  origin: "https://trusted-origin.com",
});
```

### Sending Messages

#### Synchronous Send

```ts
bridge.Send("someEvent", { data: "Hello" });
```

#### Asynchronous Send with Await

```ts
async function sendMessage() {
  try {
    const response = await bridge.SendAsync("storeLog", { data: "Hello" });
    console.log("Response received:", response);
  } catch (error) {
    console.error("Error in message exchange", error);
  }
}
```

### Listening for Messages in popup window

```ts
const bridge = new WidgetBridge({
  channel: window.opener,
  origin: "https://parent-origin.com",
});

bridge.addEventListener(
  "message",
  async ({ data }: { data: IBridgePayload }) => {
    console.log("Received event:", data);
    try {
      switch (data.key) {
        case "storeLog":
          let res = await DoSomething(data.payload);
          data.resolve(res);
      }
    } catch (error) {
      data.reject(error);
    }
  },
);
```

### Updating Communication Channel

If the communication target changes dynamically, update it using:

```ts
bridge.UpdateChannel(newChannel);
```

example

```ts
import WidgetBridge from "widget-bridge";

// initialize popup without channel
const bridge = new WidgetBridge({
  cb: (key, message) => {
    console.log("Received message:", key, message);
  },
  origin: "https://trusted-origin.com",
});
const openPopup = () => {
  const popup = window.open("https://trusted-origin.com");
  bridge.UpdateChannel(popup); //set channel
};
```

### Resetting the Bridge

```ts
bridge.Reset();
```

This clears all pending promises and resets the bridge state.

## API Reference

### `new WidgetBridge(options)`

#### Parameters:

- `cb` (Function, optional): Callback executed when a message is received.
- `channel` (Window, optional): The target window for communication.
- `origin` (string, optional): Expected origin for security validation.

### `.Send(key, payload)`

Sends a message to the target window.

#### Parameters:

- `key` (string, optional): Identifier for the message.
- `payload` (object): Data to send.

### `.SendAsync(key, payload)`

Similar to `.Send()`, but returns a Promise that resolves when a response is received.

### `.UpdateChannel(channel)`

Updates the communication channel.

### `.Reset()`

Clears pending promises and resets the internal state.

### `.addEventListener("message", callback)`

Registers an event listener for incoming messages.

### `.removeEventListener("message", callback)`

Removes an event listener.

## Security Considerations

- Always specify a trusted `origin` when instantiating `WidgetBridge`.
- Validate and sanitize incoming data before processing.
- Ensure proper error handling when using `SendAsync` to prevent unresolved promises.

## License

MIT
