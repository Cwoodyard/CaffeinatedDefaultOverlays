
MODULES.moduleClasses["casterlabs_info"] = class {

    constructor(id) {
        this.namespace = "casterlabs_info";
        this.type = "overlay settings";
        this.id = id;

        if (this.id.includes("donation")) {
            this.settingsDisplay.currency = "select";

            if (VERSION.includes("0.5")) {
                this.defaultSettings.currency = ["Selected", "Default"];
            } else {
                this.defaultSettings.currency = ["USD", "Default"];
            }
        }
    }

    linkDisplay = {
        path: "https://caffeinated.casterlabs.co/info.html",
        option: {
            name: "Reset",
            onclick(instance) {
                instance.event = null;
                instance.text = "";
                MODULES.emitIO(instance, "event", "");
                MODULES.saveToStore(instance);
            }
        }
    };

    getDataToStore() {
        let data = Object.assign({}, this.settings);

        data.event = this.event;
        data.text = this.text;

        return data;
    }

    onConnection(socket) {
        MODULES.emitIO(this, "config", this.settings, socket);
        MODULES.emitIO(this, "event", this.text, socket);
    }

    init() {
        const instance = this;

        this.text = this.settings.text;
        this.event = this.settings.event;

        if (!this.text && this.event) {
            this.event = null;
        }

        if (this.id.includes("view")) {
            STREAM_INTEGRATION.addEventListener("viewcount", (count) => {
                instance.text = count;

                MODULES.emitIO(this, "event", instance.text);
                MODULES.saveToStore(instance);
            });
        } else {
            if (this.id.includes("follow")) {
                koi.addEventListener("follow", (event) => {
                    instance.event = event;
                    instance.text = event.follower.username;

                    MODULES.emitIO(this, "event", instance.text);
                    MODULES.saveToStore(instance);
                });
            } else {
                koi.addEventListener("donation", (event) => {
                    if (!instance.event || instance.id.includes("recent") || (instance.event.usd_equivalent <= event.usd_equivalent)) {
                        instance.event = event;

                        if (instance.settings.currency == "Default") {
                            instance.text = event.sender.username + " " + event.formatted;
                        } else {
                            instance.text = event.sender.username + " " + event.currency_info.formatted;
                        }

                        MODULES.emitIO(this, "event", instance.text);
                        MODULES.saveToStore(instance);
                    }
                });
            }

            koi.addEventListener("userupdate", (event) => {
                if ((instance.event) && (instance.event.streamer.uuid != event.streamer.uuid)) {
                    instance.event = null;
                    instance.text = "";
                    MODULES.emitIO(instance, "event", "");
                    MODULES.saveToStore(instance);
                }
            });
        }
    }

    async onSettingsUpdate() {
        MODULES.emitIO(this, "config", this.settings);
    }

    settingsDisplay = {
        font: "font",
        font_size: "number",
        // currency: "select",
        text_color: "color"
    };

    defaultSettings = {
        font: "Poppins",
        font_size: "16",
        // currency: ["default", "usd"],
        text_color: "#FFFFFF"
    };

};
