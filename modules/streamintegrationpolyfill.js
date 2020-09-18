koi.addEventListener("userupdate", (event) => {
    STREAM_INTEGRATION.platform = event.streamer.platform;
    STREAM_INTEGRATION.broadcast("platform", STREAM_INTEGRATION.platform);
});

const STREAM_INTEGRATION = {
    listeners: {},
    viewers: {},
    viewerCount: 0,
    platform: "",

    isPlatform(platform) {
        return this.platform.toLowerCase() == platform.toLowerCase();
    },

    addEventListener(type, callback) {
        type = type.toLowerCase();

        let callbacks = this.listeners[type];

        if (!callbacks) callbacks = [];

        callbacks.push(callback);

        this.listeners[type] = callbacks;
    },

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

};
