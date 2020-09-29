
MODULES.moduleClasses["casterlabs_chat_display"] = class {

    constructor(id) {
        this.namespace = "casterlabs_chat_display";
        this.type = "application";
        this.id = id;
        this.icon = "chatbox";
        this.displayname = "Chat";

        const instance = this;

        koi.addEventListener("chat", (event) => {
            instance.util.addMessage(event.sender.username, event.sender.image_link, event.sender.color, event.message, event.id);
        });

        koi.addEventListener("share", (event) => {
            instance.util.addMessage(event.sender.username, event.sender.image_link, event.sender.color, event.message, event.id);
        });

        koi.addEventListener("donation", (event) => {
            instance.util.addMessage(event.sender.username, event.sender.image_link, event.sender.color, event.message, event.id, event.image);
        });

        koi.addEventListener("follow", (event) => {
            instance.util.addStatus(event.follower.username, event.follower.image_link, event.follower.color, "follow");
        });

        STREAM_INTEGRATION.addEventListener("join", (event) => {
            instance.util.addStatus(event.user, event.image, event.color, "join");
        });

        STREAM_INTEGRATION.addEventListener("leave", (event) => {
            instance.util.addStatus(event.user, event.image, event.color, "leave");
        });

        STREAM_INTEGRATION.addEventListener("viewcount", (count) => {
            if (instance.util.viewersWindow != null) {
                instance.util.viewersWindow.webContents.executeJavaScript("setViewerCount(" + count + ");");
            }
        });

        STREAM_INTEGRATION.addEventListener("viewers", (viewers) => {
            if (instance.util.viewersWindow != null) {
                instance.util.viewersWindow.webContents.executeJavaScript("setViewers(" + JSON.stringify(viewers) + ");");
            }
        });

    }

    init() {
        this.page.innerHTML = `
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@550&display=swap" rel="stylesheet" />
        <style>
            .buttons {
                position: fixed;
                right: 10px;
                bottom: 5px;
                z-index: 1000;
            }

            .buttons button {
                height: 30px;
                font-size: 15px;
                padding-top: 0;
                padding-bottom: calc(.2em - 1px);
                -webkit-app-region: no-drag;
                display: block;
            }
            
            .vcviewicon {
                padding-top: 10px;
            }

            .verticalchatmodule span {
                font-family: "Inter", sans-serif;
                color: white;
            }
        
            .vctext::before {
                content: "\\00a0";
            }
        
            .vctext {
                border-radius: 1px;
            }
        
            .vctext::after {
                content: "\\00a0";
            }
        
            .vcusername::after {
                content: "\\00a0";
            }
        
            .vcstatus {
                position: relative;
                font-style: italic;
                display: flex;
                align-items: center;
            }

            .vcstatus .vctext {
                color: #D0D0D0;
            }

            .vcchatmessage {
                position: relative;
                display: flex;
                align-items: center;
            }
        
            .vcimage {
                border-radius: 50%;
                object-fit: cover;
                height: 22px;
                width: 22px;
                margin-right: 5px;
                vertical-align: bottom;
            }

            .verticalchatmodule {
                margin-bottom: 35px;
                overflow-x: wrap;
            }
        </style>
        <script src="https://unpkg.com/ionicons@5.1.2/dist/ionicons.js"></script>
        <div class="container verticalchatmodule">
            <div id="chatbox"></div>
            <div class="buttons">
                <button class="button" id="vcclear">
                    Clear
                </button>
                <br />
                <button class="button" id="vcopen">
                    Viewers
                </button>
            </div>
        </div>
        `;

        this.util = new VerticalChatUtil(this);
    }

};

class VerticalChatUtil {

    constructor(module) {
        this.module = module;

        this.module.page.querySelector("#vcclear").addEventListener("click", () => {
            module.page.querySelector("#chatbox").innerHTML = "";
        });

        this.module.page.querySelector("#vcopen").addEventListener("click", () => {
            this.createWindow();
        });

        window.addEventListener("beforeunload", () => {
            if (this.viewersWindow != null) {
                this.viewersWindow.close();
            }
        });

    }

    createWindow() {
        if (!this.viewersWindow) {
            this.viewersWindow = new BrowserWindow({
                width: 200,
                height: 400,
                resizable: true,
                transparent: false,
                show: false,
                titleBarStyle: "shown",
                icon: __dirname + "/media/app_icon.png",
                frame: false,
                webPreferences: {
                    nodeIntegration: true
                }
            });

            this.viewersWindow.once("close", () => {
                this.viewersWindow = null;
            });

            this.viewersWindow.once("ready-to-show", () => {
                this.viewersWindow.show();

                this.viewersWindow.webContents.executeJavaScript("setViewerCount(" + STREAM_INTEGRATION.viewerCount + ");");
                this.viewersWindow.webContents.executeJavaScript("setViewers(" + JSON.stringify(Object.values(STREAM_INTEGRATION.viewers)) + ");");
            });

            this.viewersWindow.loadURL("https://caffeinated.casterlabs.co/modules/chatviewers.html");
        }
    }

    addMessage(sender, profilePic, color, message, id, imageLink) {
        let div = document.createElement("div");
        let username = document.createElement("span");
        let pfp = document.createElement("img");
        let text = document.createElement("span");

        pfp.src = profilePic;
        pfp.classList.add("vcimage");

        username.classList.add("vcusername");
        username.style = "color: " + color + ";";
        username.appendChild(pfp);
        username.appendChild(document.createTextNode(sender));
        username.appendChild(text);

        text.classList.add("vctext");
        text.innerText = message;

        div.classList.add("vcchatmessage");
        div.setAttribute("vc_message_id", id);
        div.appendChild(username);

        if (imageLink) {
            let image = document.createElement("img");

            image.classList.add("vcimage");
            image.src = imageLink;

            username.appendChild(image);
        }

        this.module.page.querySelector("#chatbox").appendChild(div);

        this.jumpBottom();
    }

    addStatus(user, profilePic, color, type) {
        let div = document.createElement("div");
        let pfp = document.createElement("img");
        let username = document.createElement("span");
        let text = document.createElement("span");

        pfp.src = profilePic;
        pfp.classList.add("vcimage");

        username.classList.add("vcusername");
        username.style = "color: " + color + ";";
        username.innerText = user;

        switch (type.toLowerCase()) {
            case "leave": text.innerText = "left the stream."; break;
            case "join": text.innerText = "joined the stream."; break;
            case "follow": text.innerText = "started following."; break;
        }

        div.classList.add("vcchatmessage");
        div.classList.add("vcstatus");
        div.appendChild(pfp);
        div.appendChild(username);
        div.appendChild(text);

        this.module.page.querySelector("#chatbox").appendChild(div);

        this.jumpBottom();
    }

    isHidden() {
        return this.module.page.classList.contains("hide");
    }

    isAtBottom() {
        return (this.module.page.parentNode.scrollHeight - this.module.page.parentNode.scrollTop) < 750;
    }

    jumpBottom() {
        if (!this.isHidden() && this.isAtBottom()) {
            this.module.page.parentNode.scrollTo(0, this.module.page.querySelector("#chatbox").scrollHeight + 1000);
        }
    }

};
