
MODULES.moduleClasses["casterlabs_companion"] = class {

    constructor(id) {
        this.namespace = "casterlabs_companion";
        this.type = "settings";
        this.id = id;
        this.kinoko = new Kinoko();
        this.messageHistory = {};

        this.defaultSettings.reset_link = () => {
            this.uuid = generateUUID();
            this.setLinkText();
            this.connect();
            MODULES.saveToStore(this);
        };

        this.kinoko.on("message", (data) => {
            switch (data.type.toLowerCase()) {
                case "connected": {
                    this.sendAll();
                    return;
                }

            }
        });

        koi.addEventListener("chat", (event) => {
            if (event.id === "") {
                event.id = generateUUID();
            }

            event.upvotes = 0;
            event.timestamp = performance.now;

            this.messageHistory[event.id] = event;
            this.sendEvent("chat", event);
        });

        koi.addEventListener("donation", (event) => {
            if (event.id === "") {
                event.id = generateUUID();
            }

            event.upvotes = 0;
            event.timestamp = performance.now;

            this.messageHistory[event.id] = event;
            this.sendEvent("donation", event);
        });

        koi.addEventListener("upvote", (event) => {
            if (!this.messageHistory[event.id]) {
                this.messageHistory[event.id] = event.event;
            }

            this.messageHistory[event.id].upvotes = event.upvotes;
            this.sendEvent("upvote", event);
        });

        koi.addEventListener("follow", (event) => {
            this.sendEvent("follow", event);
        });

        koi.addEventListener("stream_status", (event) => {
            this.sendEvent("stream_status", event);
            this.streamStatus = event;
        });

        koi.addEventListener("user_update", (event) => {
            this.sendEvent("user_update", event);
        });

        STREAM_INTEGRATION.addEventListener("join", (event) => {
            this.sendEvent("join", event);
        });

        STREAM_INTEGRATION.addEventListener("leave", (event) => {
            this.sendEvent("leave", event);
        });

        STREAM_INTEGRATION.addEventListener("viewcount", (count) => {
            this.sendEvent("viewcount", count);
        });

        STREAM_INTEGRATION.addEventListener("viewers", (viewers) => {
            this.sendEvent("viewers", viewers);
        });
    }

    sendAll() {
        this.sendEvent("viewcount", STREAM_INTEGRATION.viewerCount, true);
        this.sendEvent("viewers", STREAM_INTEGRATION.viewers, true);
        this.sendEvent("user_update", CAFFEINATED.userdata, true);
        this.sendEvent("stream_status", this.streamStatus, true);

        // Send join messages
        Object.values(STREAM_INTEGRATION.viewers).forEach((viewer) => {
            this.sendEvent("join", viewer, true);
        });

        let messages = Object.values(this.messageHistory);

        messages.sort((a, b) => {
            return (a.timestamp < b.timestamp) ? 1 : -1;
        });

        this.sendEvent("message_history", messages, true);
    }

    sendEvent(type, event, isCatchup = false) {
        this.send("event", {
            type: type,
            event: event,
            is_catchup: isCatchup
        });
    }

    send(type, data) {
        this.kinoko.send({
            type: type,
            data: data
        });
    }

    getDataToStore() {
        return {
            uuid: this.uuid,
            enabled: this.settings.enabled
        };
    }

    connect() {
        this.kinoko.disconnect();

        if (this.settings.enabled) {
            this.kinoko.connect("companion:" + this.uuid, "parent");
        }
    }

    setLinkText() {
        document.querySelector("#casterlabs_companion_casterlabs_companion").querySelector("[name='Open on your device']").value = "casterlabs.co/companion?key=" + this.uuid;
    }

    init() {
        this.uuid = this.settings.uuid;

        if (!this.uuid) {
            this.uuid = generateUUID();

            MODULES.saveToStore(this);
        }

        document.querySelector("#casterlabs_companion_" + this.id).querySelector("[name='Open on your device']").setAttribute("readonly", "");


        this.setLinkText();
        this.connect();
    }


    onSettingsUpdate() {
        this.setLinkText();
        this.connect();
    }

    settingsDisplay = {
        enabled: "checkbox",
        "Open on your device": "input",
        reset_link: "button"
    };

    defaultSettings = {
        enabled: false,
        "Open on your device": "",
        // reset_link: () => {}
    };

};
