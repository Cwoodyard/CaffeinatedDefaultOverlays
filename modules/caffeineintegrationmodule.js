
window.addEventListener("beforeunload", () => {
    if (CAFFEINE.loginWindow != null) {
        CAFFEINE.loginWindow.close();
    }
});


const CAFFEINE = {
    refreshToken: "",
    credential: {},
    signed: "",
    connected: false,
    loggedIn: false,
    viewerIds: [],
    knownViewers: [],
    anonymousCount: 0,
    loginWindow: null,
    module: null,

    createWindow() {
        if (!this.loginWindow) {
            this.loginWindow = new BrowserWindow({
                width: 800,
                height: 600,
                resizable: false,
                transparent: false,
                show: false,
                titleBarStyle: "shown",
                icon: __dirname + "/media/app_icon.png",
                frame: false,
                webPreferences: {
                    nodeIntegration: true
                }
            });

            this.loginWindow.once("close", () => {
                this.loginWindow = null;
            });

            this.loginWindow.once("ready-to-show", () => {
                this.loginWindow.show();

                if (this.loggedIn) {
                    instance.loginWindow.webContents.executeJavaScript("setDisplay('success');");
                } else {
                    instance.loginWindow.webContents.executeJavaScript("setDisplay('signin');");
                }
            });

            const instance = this;
            this.loginWindow.addListener("signin", (data) => {
                this.login(data.username, data.password, data.mfa).then((response) => {
                    switch (response) {
                        case "UNSUCCESSFUL": {
                            instance.loginWindow.webContents.executeJavaScript("setDisplay('signin');");
                            break;
                        }

                        case "MFA_AWAIT": {
                            instance.loginWindow.webContents.executeJavaScript("setDisplay('mfa');");
                            break;
                        }

                        default: {
                            instance.loginWindow.webContents.executeJavaScript("setDisplay('success');");
                        }
                    }
                });
            });

            this.loginWindow.addListener("signout", (data) => {
                instance.loginWindow.webContents.executeJavaScript("setDisplay('signin');");

                this.loggedIn = false;

                CAFFEINATED.store.set("caffeine_refresh_token", null);
                document.querySelector("#casterlabs_caffeine_integration_caffeine_integration").querySelector("[name=signin]").innerText = "Signin";

                if (this.connected) {
                    this.ws.close();
                    this.connected = false;
                }
            });

            this.loginWindow.loadURL("https://caffeinated.casterlabs.co/modules/caffeinelogin.html");
        }
    },

    login(username, password, mfa) {
        const instance = this;

        this.loggedIn = false;

        if (this.connected) {
            this.ws.close();
            this.connected = false;
        }

        return new Promise((resolve) => {
            let loginPayload = {
                "account": {
                    "username": username,
                    "password": password
                },
                "mfa": {
                    "otp": mfa
                }
            }

            CaffeineViewerUtil.httpPost("https://api.caffeine.tv/v1/account/signin", loginPayload).then((text) => {
                let response = JSON.parse(text);

                if (response.hasOwnProperty("next")) {
                    resolve("MFA_AWAIT");
                } else if (response.hasOwnProperty("errors")) {
                    resolve("UNSUCCESSFUL");
                } else {
                    instance.refreshToken = response.refresh_token;
                    instance.refresh(this.refreshToken, true);
                    resolve("SUCCESSFUL");
                }
            });
        });
    },

    refresh(refreshToken = this.refreshToken, reconnect) {
        if (this.connected) {
            this.ws.close();
            this.connected = false;
        }

        if (refreshToken) {
            const instance = this;
            let refreshPayload = {
                "refresh_token": refreshToken
            };

            CaffeineViewerUtil.httpPost("https://api.caffeine.tv/v1/account/token", refreshPayload).then((response) => {
                instance.credential = JSON.parse(response);

                if (!instance.credential.hasOwnProperty("errors")) {
                    CaffeineViewerUtil.httpGet("https://api.caffeine.tv/v1/users/" + instance.credential.caid + "/signed", instance.credential.access_token).then((signed) => {
                        instance.signed = signed.token;
                        instance.refreshToken = refreshToken;
                        instance.loggedIn = true;

                        CAFFEINATED.store.set("caffeine_refresh_token", refreshToken);

                        CaffeineViewerUtil.getUser(instance.credential.caid).then((user) => {
                            document.querySelector("#casterlabs_caffeine_integration_caffeine_integration").querySelector("[name=signin]").innerText = "Signed in as " + user.username;
                        });

                        if (reconnect) {
                            this.connectViewers();
                        }

                        setTimeout(() => {
                            instance.refresh(refreshToken);
                        }, (5 * 60) * 1000);
                    });
                }
            });
        }
    },

    upvoteMessage(streamer, id) {
        let payload = {
            s: streamer.substring(4, streamer.length), // Convert from CAID to StageID
            u: id
        };

        CaffeineViewerUtil.httpPost("https://realtime.caffeine.tv/v2/reaper/messages/" + btoa(JSON.stringify(payload)) + "/endorsements", {}, this.credential.access_token);
    },

    connectViewers() {
        try {
            if (this.connected) {
                this.ws.close();
                this.connected = false;
            }

            const instance = this;
            this.connected = true;

            let payload = {
                "Headers": {
                    "Authorization": "Bearer " + instance.credential.credentials.access_token,
                    "X-Client-Type": "external"
                },
                "Body": "{\"user\":\"" + instance.signed + "\"}"
            };
            this.ws = new WebSocket("wss://realtime.caffeine.tv/v2/reaper/stages/" + instance.credential.caid.substring(4) + "/viewers");

            this.ws.onopen = function () {
                instance.ws.send(JSON.stringify(payload));
                setInterval(() => {
                    instance.ws.send('"HEALZ"');
                }, 10000);
            }

            this.ws.onclose = function () {
                this.connected = false;
                instance.connectViewers();
            }

            this.ws.onmessage = (message) => {
                let message_raw = message.data;

                if (message_raw != ("\"THANKS\"")) {
                    let json = JSON.parse(message_raw);

                    if (json.hasOwnProperty("anonymous_user_count")) {
                        instance.anonymousCount = json.anonymous_user_count;
                        instance.updateViewerCount();
                    } else if (json.hasOwnProperty("user_event")) {
                        let status = json.user_event.is_viewing;
                        let viewing = instance.viewerIds.includes(json.user_event.caid);

                        if (status && !viewing) {
                            instance.addViewer(json.user_event.caid);
                        } else if (!status && viewing) {
                            instance.removeViewer(json.user_event.caid);
                        }
                    }
                }
            }
        } catch (e) {
            this.connected = false;
            setTimeout(() => this.connectViewers(), 1000);
            console.debug(e);
        }
    },

    updateViewerCount() {
        STREAM_INTEGRATION.viewerCount = this.anonymousCount + Object.values(STREAM_INTEGRATION.viewers).length;
        STREAM_INTEGRATION.broadcast("viewcount", STREAM_INTEGRATION.viewerCount);
    },

    addViewer(caid) {
        if (!this.viewerIds.includes(caid)) {
            this.viewerIds.push(caid);

            if (!this.knownViewers.includes(caid)) {
                this.knownViewers.push(caid);

                CaffeineViewerUtil.getUser(caid).then((user) => {
                    let userdata = {
                        user: user.username,
                        image: "https://images.caffeine.tv" + user.avatar_image_path,
                        color: "#FFFFFF"
                    };

                    STREAM_INTEGRATION.viewers[user.username] = userdata;
                    STREAM_INTEGRATION.broadcast("join", userdata);
                    STREAM_INTEGRATION.broadcast("viewers", Object.values(STREAM_INTEGRATION.viewers));

                    this.updateViewerCount();
                });
            }
        }
    },

    removeViewer(caid) {
        let index = this.viewerIds.indexOf(caid);

        if (index > -1) {
            this.viewerIds.splice(index, 1);

            setTimeout(() => {
                if (!this.viewerIds.includes(caid)) {
                    CaffeineViewerUtil.getUser(caid).then((user) => {
                        let userdata = {
                            user: user.username,
                            image: "https://images.caffeine.tv" + user.avatar_image_path,
                            color: "#FFFFFF"
                        };

                        this.knownViewers.splice(this.knownViewers.indexOf(caid), 1);

                        delete STREAM_INTEGRATION.viewers[user.username];
                        STREAM_INTEGRATION.broadcast("leave", userdata);
                        STREAM_INTEGRATION.broadcast("viewers", Object.values(STREAM_INTEGRATION.viewers));

                        this.updateViewerCount();
                    });
                }
            }, 3000); // Prevent users from constantly popping.
        }
    }

}

const CaffeineViewerUtil = {
    getUser(id) {
        return new Promise((resolve) => {
            this.httpGet("https://api.caffeine.tv/v1/users/" + id).then((userdata) => { // We use Casterlabs' proxy here because there's no ratelimit
                resolve(userdata.user);
            });
        });
    },

    httpGet(url, credential) {
        return new Promise((resolve) => {
            let headers = {};

            if (credential) {
                headers.authorization = "Bearer " + credential;
            }

            const options = {
                method: "GET",
                headers: new Headers(headers),
            };

            fetch(url, options).then((response) => {
                response.text().then((text) => {
                    resolve(JSON.parse(text));
                });
            });
        });
    },

    httpPost(url, body, credential) {
        return new Promise((resolve) => {
            let headers = {
                "Content-Type": "application/json"
            };

            if (credential) {
                headers.authorization = "Bearer " + credential;
            }

            const options = {
                method: "POST",
                body: JSON.stringify(body),
                headers: new Headers(headers),
            };

            fetch(url, options).then((response) => {
                response.text().then((text) => {
                    resolve(text);
                });
            });
        });
    }
};

MODULES.moduleClasses["casterlabs_caffeine_integration"] = class {

    constructor(id) {
        this.namespace = "casterlabs_caffeine_integration";
        this.type = "settings";
        this.id = id;

        this.defaultSettings.signin = () => {
            CAFFEINE.createWindow();
        };

        CAFFEINE.module = this;

    }

    init() {
        const div = document.getElementById(this.namespace + "_" + this.id).parentElement;

        STREAM_INTEGRATION.addEventListener("platform", (platform) => {
            // Hide the Caffeine settings box if not on Caffeine
            if (platform == "CAFFEINE") {
                div.classList.remove("hide");

                if (CAFFEINE.refreshToken.length < 0) {
                    CAFFEINE.createWindow();
                }
            } else {
                div.classList.add("hide");

                if (CAFFEINE.loginWindow) {
                    CAFFEINE.loginWindow.close();
                }
            }
        });

        let token = CAFFEINATED.store.get("caffeine_refresh_token");

        if (token) {
            CAFFEINE.refresh(token, true);
        }
    }

    settingsDisplay = {
        signin: "button"
    };

    defaultSettings = {
        // signin: () => {};
    };

};
