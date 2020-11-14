class Kinoko {

    constructor(baseUri = "wss://api.casterlabs.co/v1/kinoko") {
        this.listeners = {};

        this.baseUri = baseUri;
    }

    on(type, callback) {
        type = type.toLowerCase();

        let callbacks = this.listeners[type];

        if (!callbacks) callbacks = [];

        callbacks.push(callback);

        this.listeners[type] = callbacks;
    }

    broadcast(type, data) {
        let listeners = this.listeners[type.toLowerCase()];

        if (listeners) {
            listeners.forEach((callback) => {
                try {
                    callback(data);
                } catch (e) {
                    console.error("An event listener produced an exception: ");
                    console.error(e);
                }
            });
        }
    }

    disconnect() {
        if (this.ws && (this.ws.readyState == WebSocket.OPEN)) {
            this.ws.close();
        }
    }

    send(message) {
        if (this.ws && (this.ws.readyState == WebSocket.OPEN)) {
            if (this.proxy) {
                this.ws.send(message);
            } else {
                this.ws.send(JSON.stringify(message));
            }
        }
    }

    connect(channel, type = "client", proxy = false) {
        const instance = this;

        this.disconnect();

        let uri = this.baseUri + "?channel=" + encodeURI(channel) + "&type=" + encodeURI(type) + "&proxy=" + encodeURI(proxy);

        this.ws = new WebSocket(uri);
        this.proxy = proxy;

        this.ws.onerror = () => {
            setTimeout(() => instance.connect(channel, type, proxy), 1000);
        }

        this.ws.onopen = () => {
            instance.broadcast("open");
        };

        this.ws.onclose = () => {
            instance.broadcast("close");
        };

        this.ws.onmessage = (message) => {
            let data = message.data;

            switch (data) {
                case ":ping": {
                    instance.ws.send(":ping");
                    return;
                }

                case ":orphaned": {
                    instance.broadcast("orphaned");
                    return;
                }

                case ":adopted": {
                    instance.broadcast("adopted");
                    return;
                }

                default: {
                    if (instance.proxy) {
                        instance.broadcast("message", data);
                    } else {
                        try {
                            instance.broadcast("message", JSON.parse(data));
                        } catch (ignored) {
                            instance.broadcast("message", data);
                        }
                    }
                    return
                }
            }
        };
    }
}

// Basically https://stackoverflow.com/a/8809472
function generateUUID() {
    let micro = (performance && performance.now && (performance.now() * 1000)) || 0;
    let millis = new Date().getTime();

    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        let random = Math.random() * 16;

        if (millis > 0) {
            random = (millis + random) % 16 | 0;
            millis = Math.floor(millis / 16);
        } else {
            random = (micro + random) % 16 | 0;
            micro = Math.floor(micro / 16);
        }

        return ((c === "x") ? random : ((random & 0x3) | 0x8)).toString(16);
    });
}