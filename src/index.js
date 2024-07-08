const { readdirSync } = require("fs");
const fastify = require("fastify")();
const path = require("path");
const DiscordOauth2 = require("discord-oauth2");
const cors = require("@fastify/cors");

const oauth = new DiscordOauth2({
    clientId: "",
    clientSecret: "",
    redirectUri: process.platform === "win32" ? "http://127.0.0.1/discord" : "https://linkguard.cc/discord"
});

global.sessions = new Map();

fastify.register(cors);

fastify.addHook("preHandler", (request, reply, done) => {
    request.IPAddress = request.headers["cf-connecting-ip"] || request.ip;
    done();
});


fastify.register(require("./routes/trial"), { prefix: "/:name/" });
fastify.register(require("@fastify/view"), {
    engine: {
        ejs: require("ejs")
    },
    root: path.join(__dirname, "./serve")
});

fastify.register(require("@fastify/static"), {
    root: path.join(__dirname, "public")
})

fastify.register(require("@fastify/websocket"), {
    options: {
        maxPayload: 1048576
    }
});

fastify.get("/discord", async (request, reply) => {
    const session = sessions.get(request.IPAddress);
    if (!session) return;

    if (session.stage === "main") {
        session.stage = "linking";
        sessions.set(request.IPAddress, session);
        return reply.redirect(oauth.generateAuthUrl({ scope: ["identify", "guilds"] }))
    }

    if (session.stage !== "linking") {
        return reply.redirect(`./${session.hub}/`);
    }

    const { code } = request.query;
    if (!code) return;

    const response = await oauth.tokenRequest({
        code,
        scope: "identify guilds",
        grantType: "authorization_code"
    });

    const servers = await oauth.getUserGuilds(response.access_token);
    if (session.config.server_lock && !servers.find(server => server.id === session.config.server_id)) {
        return reply.view("error.ejs", { icon: session.config.icon, name: session.config.name, discord: session.config.discord, website_icon: session.config.website_icon, error: `You need to join the discord before redeeming a trial! Invite: ${session.config.discord}` })
    }

    session.discord = await oauth.getUser(response.access_token);
    session.stage = "link-1";
    sessions.set(request.IPAddress, session);

    reply.redirect(session.config.links[1]);
});

const StartTime = `${new Date().toLocaleTimeString("en-GB")} ${new Date().toLocaleDateString("en-GB")}`
fastify.get("/stats", (request, reply) => {
    reply.send({
        tc: global.CompletedTrials,
        tb: global.UsersBlocked,
        bux: global.BuxLootTrials,
        from: StartTime
    })
})

fastify.get("/join", (request, reply) => reply.redirect("https://discord.gg/Q3fbS54ZED"));
fastify.get("/dev1", (request, reply) => reply.redirect("./dev/stage-1"))
fastify.get("/dev2", (request, reply) => reply.redirect("./dev/stage-2"))

setInterval(async () => {
    sessions.forEach(async (session, key) => {
        if (session.expire && Date.now() > session.expire) {
            if (session.config.type == "script") {
                try {
                    await fetch(`https://api.luarmor.net/v3/projects/${session.config.luarmor.project_id}/users?user_key=${session.key}`, {
                        method: "DELETE",
                        headers: {
                            ["authorization"]: session.config.luarmor.api_key
                        }
                    })
                } catch (er) {
                    console.log(ER)
                }
            }

            sessions.delete(key);
        }
    });
}, 10000);

setInterval(() => {
    fetch("https://uptime.betterstack.com/api/v1/heartbeat/f8jAhSwt6v1U1vVPyb7F2SfZ")   
}, 180000);

for (let file of readdirSync(path.join(__dirname, "configs"))) {
    let data = require(path.join(__dirname, `configs/${file}`))
    fastify.get(`/${data.name.toLowerCase()}`, (request, reply) => reply.redirect(`/${data.name.toLowerCase()}/`))
}

(async () => {
    try {
        await fastify.listen({ port: 8080, host: "0.0.0.0" });
        console.log("Server now listenting to port 8008!");
    } catch (er) {
        console.log(er);
    }
})();