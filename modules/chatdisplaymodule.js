
MODULES.moduleClasses["casterlabs_chat_display"] = class {

    constructor(id) {
        this.namespace = "casterlabs_chat_display";
        this.type = "application";
        this.id = id;
        this.icon = "chatbox";
        this.displayname = "Chat";

        const instance = this;

        koi.addEventListener("chat", (event) => {
            instance.util.addMessage(event);
        });

        // Shares are depreceated.
        koi.addEventListener("share", (event) => {
            instance.util.addMessage(event);
        });

        koi.addEventListener("donation", (event) => {
            instance.util.addMessage(event);
        });

        koi.addEventListener("upvote", (event) => {
            instance.util.upvoteMessage(event);
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

            .upvote-1 {
                /* 1+ */
                background-color: #FF00FF;
            }

            .upvote-2 {
                /* 10+ */
                background-color: #00FF00;
            }

            .upvote-3 {
                /* 100+ */
                background-color: #FFFF00;
            }

            .upvote-4 {
                /* 1000+ */
                background-color: #FFFFFF;
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
                border-radius: 8px;
                cursor: default;
            }

            .vcimage {
                border-radius: 50%;
                object-fit: cover;
                height: 22px;
                width: 22px;
                margin: 1px 5px;
                vertical-align: bottom;
            }

            .verticalchatmodule {
                margin-bottom: 35px;
                margin-top: 25px;
                overflow-x: wrap;
            }

            ul {
                list-style: none;
            }
              
            ul#chatbox>li {
                height: auto;
                position: relative;
                list-style: none;
                margin-left: -30px;
            }
            
            ul li ul {
                display: none;
            }
            
            ul li a {
                display: inline-block;
                height: 100%;
                text-decoration: none;
                color: white !important;
            }
            
            ul li:hover ul {
                display: block;
            }

            ul li:hover > .vcchatmessage { 
                background-color: #4d4d4d;
            }
            
            ul.tip {
                border-top-left-radius: 8px;
                border-top-right-radius: 8px;
                display: none;
                background-color: #4d4d4d;
                position: absolute;
                bottom: 100%;
                padding: 0;
                height: auto;
                left: 0;
                right: 0;
                z-index: 1;
                width: 63px;
                height: 30px;
            }

            .tooltipbtn {
                font-size: 20px;
                margin-left: 10px;
                margin-top: 5px;
            }
        </style>
        <div class="container verticalchatmodule">
            <ul id="chatbox"></ul>
            <div class="buttons">
                <button class="button" id="vcopen">
                    Viewers
                </button>
            </div>
        </div>
        <div class="modal" id="timeout_modal">
            <div class="modal-background"></div>
                <div class="modal-content">

                </div>
            <button class="modal-close is-large" aria-label="close" id="timeout_modal_close"></button>
        </div>
        `;

        this.util = new VerticalChatUtil(this);
    }

};

class VerticalChatUtil {

    constructor(module) {
        this.module = module;

        this.module.page.querySelector("#vcopen").addEventListener("click", () => {
            this.createWindow();
        });

        this.module.page.querySelector("#timeout_modal_close").addEventListener("click", () => {
            this.module.page.querySelector("#timeout_modal").classList.remove("is-active");
        });

        window.addEventListener("beforeunload", () => {
            if (this.viewersWindow != null) {
                this.viewersWindow.close();
            }
        });
    }

    timeoutCaffeine(user) {
        this.timeoutTarget = user;

        // TODO, use the caffeine ignore system. Modal should show yes or no.

        this.module.page.querySelector("#timeout_modal").classList.add("is-active");
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

    // Upvotes are coming.
    messageUpvote(event) {
        let element = document.querySelector("[vc_message_id=" + event.id + "]");

        if (event.upvotes >= 1) {
            element.classList = "vcchatmessage upvote-1";
        } else if (event.upvotes >= 10) {
            element.classList = "vcchatmessage upvote-2";
        } else if (event.upvotes >= 100) {
            element.classList = "vcchatmessage upvote-3";
        } else if (event.upvotes >= 1000) {
            element.classList = "vcchatmessage upvote-4";
        }
    }

    addMessage(event) {
        let div = document.createElement("div");
        let username = document.createElement("span");
        let pfp = document.createElement("img");
        let text = document.createElement("span");

        let chatbox = document.getElementById("chatbox");
        let msg = document.createElement("li");
        let tooltip = document.createElement("ul");

        pfp.src = event.sender.image_link;
        pfp.classList.add("vcimage");

        username.classList.add("vcusername");
        username.style = "color: " + event.sender.color + ";";
        username.appendChild(pfp);
        username.appendChild(document.createTextNode(event.sender.username));
        username.appendChild(text);

        text.classList.add("vctext");
        text.innerText = event.message;

        div.classList.add("vcchatmessage");
        div.setAttribute("vc_message_id", event.id);
        div.appendChild(username);

        if (event.image) {
            let image = document.createElement("img");

            image.classList.add("vcimage");
            image.src = event.image;

            username.appendChild(image);
        }

        msg.appendChild(div);

        // Make this only available on Caffeine.
        if (STREAM_INTEGRATION.isPlatform("CAFFEINE")) {
            let tooltipbtn = document.createElement("div");
            let timeoutbtn = document.createElement("a");
            let upvotebtn = document.createElement("a");

            timeoutbtn.innerHTML = '<ion-icon name="alert"></ion-icon>';
            timeoutbtn.title = "Timeout";
            timeoutbtn.addEventListener("click", () => {
                this.timeoutCaffeine(event.sender);
            })

            upvotebtn.innerHTML = '<ion-icon name="arrow-up"></ion-icon>';
            upvotebtn.title = "Upvote";
            upvotebtn.addEventListener("click", () => {
                CAFFEINE.upvoteMessage(event.streamer.UUID, event.id);
            });

            tooltipbtn.classList.add("tooltipbtn");
            tooltipbtn.appendChild(upvotebtn);
            // tooltipbtn.appendChild(timeoutbtn); // TODO

            tooltip.appendChild(tooltipbtn);
            tooltip.classList.add("tip");

            msg.appendChild(tooltip);
        }

        chatbox.appendChild(msg);

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
