
MODULES.moduleClasses["casterlabs_credits"] = class {

    constructor(id) {
        this.namespace = "casterlabs_credits";
        this.type = "application";
        this.id = id;
        this.icon = "star";
        this.displayname = "Support Us";
    }

    init() {
        this.page.innerHTML = `
            <h3 style="text-align:center">Our Supporters</h1>
            <p style="text-align:center">
                Supporters above $10 USD are listed below, thank you ♥
            </p>
                <div style="text-align:center" id="supporters"></div>
                <br/>
            <p style="text-align:center">
                Loving Caffeinated? Feel free to support the project
                <a onclick="openLink('https://paypal.me/casterlabs')">
                here.
                </a>
            </p.
        `;

        setInterval(this.update, 15000); // Every 15s

        this.update();
    }

    update() {
        fetch("https://caffeinated.casterlabs.co/supporters.json").then((response) => response.json()).then((donations) => {
            let div = document.querySelector("#supporters");

            div.innerHTML = "";

            donations.forEach((donation) => {
                let span = document.createElement("span");

                span.innerText = donation;

                div.appendChild(span);
                div.appendChild(document.createElement("br"));
            });
        });
    }

};
