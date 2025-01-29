export interface IBridgePayload {
  resolve?: Function;
  reject?: Function;
  type: "BRIDGE_RESOLVE" | "BRIDGE_REJECT" | "BRIDGE";
  counter: number;
  key: string;
  payload: Record<string, any>;
}
class WidgetBridge {
  counter = 0;
  #eventTargets = new EventTarget();
  promises = new Map();
  cb: Function = () => {};
  channel = window;
  origin = "";
  constructor({
    cb = () => {},
    channel = window,
    origin = "",
  }: {
    cb?: Function;
    channel?: typeof window;
    origin?: string;
  }) {
    this.cb = cb;
    this.channel = channel;
    this.origin = origin;
    this.Send("INIT");
    const handleMessage = ({ data, origin }: any) => {
      if (origin !== this.origin) return;
      try {
        const message = JSON.parse(data) as IBridgePayload;
        message.resolve = (payload: any) =>
          this.Send(undefined, payload, {
            type: "BRIDGE_RESOLVE",
            counter: message.counter,
          });
        message.reject = (payload: any) =>
          this.Send(undefined, payload, {
            type: "BRIDGE_REJECT",
            counter: message.counter,
          });
        this.cb(message.key, message);
        const newEvent = new CustomEvent("message");
        Object.assign(newEvent, { data: message });
        this.#eventTargets.dispatchEvent(newEvent);

        if (message.type === "BRIDGE_RESOLVE") {
          this.promises.get(message.counter).resolve(message.payload);
        } else if (message.type === "BRIDGE_REJECT") {
          this.promises.get(message.counter).reject(message.payload);
        }
      } catch (error) {
        console.log(error);
      }
    };
    window.addEventListener("message", handleMessage);
  }
  addEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject,
    options?: any
  ) {
    this.#eventTargets.addEventListener(type, callback, options);
  }

  removeEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject,
    options?: any
  ) {
    this.#eventTargets.removeEventListener(type, callback, options);
  }
  UpdateChannel = (channel: any) => {
    this.channel = channel;
    this.Send("INIT");
  };
  Reset = () => {
    [...this.promises].forEach(([_, { reject }]) => {
      reject();
    });
    this.promises = new Map();
  };
  Send = (
    key: string | undefined,
    payload: any = {},
    options?: {
      type?: "BRIDGE_RESOLVE" | "BRIDGE_REJECT" | "BRIDGE";
      counter?: number;
    }
  ): any => {
    let { type, counter } = options || {};
    counter = counter ?? this.counter++;
    return new Promise((resolve, reject) => {
      if (key !== "INIT" && key !== "APP_DATA")
        this.promises.set(counter, { resolve, reject });
      this.channel.postMessage(
        JSON.stringify({
          type,
          counter,
          key,
          payload,
        }),
        this.origin
      );
    });
  };
}
export default WidgetBridge;
