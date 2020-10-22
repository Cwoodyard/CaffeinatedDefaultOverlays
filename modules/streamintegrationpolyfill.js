const STREAM_INTEGRATION = {
    listeners: {},
    viewers: {},
    viewerCount: 0,
    platform: "",

    isPlatform(platform) {
        if (this.platform) {
            return this.platform.toLowerCase() == platform.toLowerCase();
        } else {
            return false;
        }
    },

    addEventListener(type, callback) {
        type = type.toLowerCase();

        let callbacks = this.listeners[type];

        if (!callbacks) callbacks = [];

        callbacks.push(callback);

        this.listeners[type] = callbacks;

        if ((type === "platform") && this.platform) {
            callback(this.platform);
        }
    },

    updatePlatform(platform) {
        this.platform = platform;
        STREAM_INTEGRATION.broadcast("platform", this.platform);
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

koi.addEventListener("userupdate", (event) => {
    STREAM_INTEGRATION.updatePlatform(event.streamer.platform);
});

if (CAFFEINATED.userdata) {
    STREAM_INTEGRATION.updatePlatform(userdata.streamer.platform);
}
