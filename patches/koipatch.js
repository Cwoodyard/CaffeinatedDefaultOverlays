/*
 * Description:
 *
 * This patch has to deal with the behavior of koi.js,
 * as it manually checks event types rather than just passing them through.
 * 
 * So we override koi#reconnect to change it's behavior.
 * 
 * Applies to:
 * 0.5.0 (Any)
 * 0.5.1 (Any)
 * 
 * Patched by:
 * e3ndr
 */

if (RepoUtil.isSupported(["0.5.*-*"])) {
    koi.reconnect = function () {
        if (this.ws && !this.ws.CLOSED) {
            this.ws.close();
        }

        const instance = this;

        this.ws = new WebSocket(this.address);

        this.ws.onerror = function () {
            setTimeout(() => instance.reconnect, 1000);
        }

        this.ws.onopen = function () {
            instance.broadcast("open");
        };

        this.ws.onclose = function () {
            instance.broadcast("close");
        };

        this.ws.onmessage = function (message) {
            let raw = message.data;
            let json = JSON.parse(raw);

            if (json["type"] == "KEEP_ALIVE") {
                let json = {
                    request: "KEEP_ALIVE"
                };

                this.send(JSON.stringify(json));
            } else if (json["type"] == "ERROR") {
                instance.broadcast("error", json);
            } else if (json["type"] == "EVENT") {
                // -------- PATCH START --------

                let event = json["event"];
                let type = event["event_type"];

                switch (type) {
                    case "INFO": instance.broadcast("info", event["event"]); break;
                    case "STREAM_STATUS": instance.broadcast("streamstatus", event); break;
                    case "USER_UPDATE": instance.broadcast("userupdate", event); break;

                    default: instance.broadcast(type.toLowerCase(), event); break;
                }
                // -------- PATCH END --------
            } else {
                instance.broadcast("message", json);
            }
        };
    };

    // Trigger reconnect
    koi.ws.close();

    console.log("Sucessfully applied patch to koi.js");
}
