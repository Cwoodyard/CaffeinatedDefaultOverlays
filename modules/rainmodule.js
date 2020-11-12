
MODULES.moduleClasses["casterlabs_rain"] = class {

    constructor(id) {
        this.namespace = "casterlabs_rain";
        this.type = "overlay settings";
        this.id = id;
    }

    linkDisplay = {
        path: "https://caffeinated.casterlabs.co/eomji.html",
        option: {
            name: "Test",
            onclick(instance) {
                MODULES.emitIO(instance, "event", {
                    message: "🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉"
                });
            }
        }
    };

    getDataToStore() {
        return this.settings;
    }

    onConnection(socket) {
        MODULES.emitIO(this, "config", this.settings, socket);
    }

    init() {
        const instance = this;

        koi.addEventListener("chat", (event) => {
            MODULES.emitIO(instance, "event", event);
        });

        koi.addEventListener("donation", (event) => {
            MODULES.emitIO(instance, "event", event);
        });
    }

    onSettingsUpdate() {
        MODULES.emitIO(this, "config", this.settings);
    }

    settingsDisplay = {
        "life_time (Seconds)": "number",
        max_emojis: "number",
        size: "number"
    };

    defaultSettings = {
        "life_time (Seconds)": 10,
        max_emojis: 1000,
        size: 20
    };

};
