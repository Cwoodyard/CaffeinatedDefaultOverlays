let vars = {};

window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
    vars[key] = value;
});

class OverlayUtil {
    constructor(namespace) {
        this.namespace = namespace + ":" + vars.id;

        this.socket = io("http://localhost:8091", {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 1000,
            reconnectionAttempts: Number.MAX_SAFE_INTEGER
        });

        this.socket.on("init", () => {
            this.socket.emit("uuid", namespace + ":" + vars.id);
        });
    }

    on(channel, callback) {
        this.socket.on(this.namespace + " " + channel, callback);
    }

    emit(channel, data) {
        this.socket.emit(channel, data);
    }

    changeFont(fontname) {
        if (WebFont) {
            WebFont.load({
                active: () => {
                    document.documentElement.style = "font-family: '" + fontname + "';";
                },
                google: {
                    families: [fontname]
                }
            });
        } // Not loaded.
    }

}
