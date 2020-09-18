
const TWITCH = {
    viewers: [],

    update() {
        if (STREAM_INTEGRATION.isPlatform("twitch")) {
            const instance = this;

            fetch("https://tmi.twitch.tv/group/user/" + CAFFEINATED.userdata.streamer.username + "/chatters").then((response) => response.json()).then((viewerJson) => {
                let viewerList = [];

                // Update count
                STREAM_INTEGRATION.viewerCount = viewerJson.chatter_count;
                STREAM_INTEGRATION.broadcast("viewcount", STREAM_INTEGRATION.viewerCount);

                viewerJson.chatters.vips.forEach((username) => viewerList.push(username));
                viewerJson.chatters.moderators.forEach((username) => viewerList.push(username));
                viewerJson.chatters.staff.forEach((username) => viewerList.push(username));
                viewerJson.chatters.admins.forEach((username) => viewerList.push(username));
                viewerJson.chatters.global_mods.forEach((username) => viewerList.push(username));
                viewerJson.chatters.viewers.forEach((username) => viewerList.push(username));

                viewerList.splice(viewerList.indexOf("casterlabs"), 1);

                console.log(viewerList)
                console.log(instance.viewers)

                // Add people
                viewerList.forEach((username) => {
                    if (!instance.viewers.includes(username)) {
                        instance.viewers.push(username);

                        let userdata = {
                            user: username,
                            image: "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==",
                            color: "#FFFFFF"
                        };

                        STREAM_INTEGRATION.viewers[username] = userdata;
                        STREAM_INTEGRATION.broadcast("join", userdata);
                        STREAM_INTEGRATION.broadcast("viewers", Object.values(STREAM_INTEGRATION.viewers));
                    }
                });

                // Remove people
                instance.viewers.forEach((username) => {
                    if (!viewerList.includes(username)) {
                        instance.viewers.splice(viewerList.indexOf(username), 1);

                        let userdata = {
                            user: username,
                            image: "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==",
                            color: "#FFFFFF"
                        };

                        delete STREAM_INTEGRATION.viewers[username];
                        STREAM_INTEGRATION.broadcast("leave", userdata);
                        STREAM_INTEGRATION.broadcast("viewers", Object.values(STREAM_INTEGRATION.viewers));
                    }
                });

            });
        } else {
            this.viewers = [];
        }
    }

};

setInterval(() => {
    TWITCH.update();
}, 30 * 1000); // Every 30s
