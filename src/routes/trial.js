const { existsSync, writeFileSync, readFileSync } = require("fs");
const { Success, Unauthorized, ConfigChange } = require("../modules/webhook");
const jslua = require("../modules/jslua");
const path = require("path");
const tokens = new Map();
const discordsessions = new Map();
let LuacScript = readFileSync(path.join(__dirname, "luac.out"), "binary");
global.CompletedTrials = 0;
global.UsersBlocked = 0;

setInterval(() => {
    discordsessions.forEach((session, key) => {
        if (session.expire && Date.now() > session.expire) {
            discordsessions.delete(key);
        }
    });
}, 10000);

const Refers = ["linkvertise.com", "lootlabs.gg", "https://linkvertise.com/", "https://lootlabs.gg/"]

const AcessTokenHeader = {
    type: "object",
    properties: {
        tg_access_token: { type: "string" }
    },
    required: ["tg_access_token"]
}

const VerifyByDiscord = {
    type: "object", 
    properties: {
        discord_id: { type: "string" },
        name: { type: "string" }
    },
    required: ["discord_id", "name"]
}

const UpdateConfig = {
    type: "object",
    properties: {
        hours: { type: "number" },
        script: { type: "string" },
        discord: { type: "string", minLength: 1 },
        webhook: { type: "string", minLength: 1 },
        linkone: { type: "string", minLength: 1 },
        linktwo: { type: "string", minLength: 1 },
        server_lock: { type: "boolean" },
        discordid: { type: "string", minLength: 1 },
        type: { type: "string", minLength: 1 },
        enabled: { type: "boolean" }
    },
    required: ["hours", "discord", "webhook", "linkone", "linktwo", "server_lock", "discordid", "type", "enabled"]
}

/**
 * @param {import("fastify").FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
*/
async function routes(fastify, options) {	
    fastify.get("/", (request, reply) => {
        const { name } = request.params;

        if (!existsSync(path.join(__dirname, `../configs/${name.toLowerCase()}.json`))) {
            return reply.redirect("/");
        }

        const session = sessions.get(request.IPAddress);
        if (session && session.hub !== name) {
            sessions.delete(request.IPAddress);    
        }

        if (session && session.complete) {
            return reply.redirect("./finished");
        }

        const config = require(`../configs/${name.toLowerCase()}.json`)
        if (!config.enabled) {
            return reply.redirect("https://linkguard.cc");
        }

        sessions.set(request.IPAddress, { stage: "main", complete: false, hub: name, config, ip: request.IPAddress });
        reply.view("index.ejs", { name: config.name, icon: config.icon, discord: config.discord, website_icon: config.website_icon });
    });

    fastify.get("/stage-1", async (request, reply) => {
        const session = sessions.get(request.IPAddress);
        if (!session || session.stage !== "link-1") {
            return reply.redirect("./");
        }

        if ((!request.headers.referer || !Refers.includes(request.headers.referer)) && session.hub !== "dev") {
            global.UsersBlocked++;
            sessions.delete(request.IPAddress);
            try {
                await Unauthorized(request.IPAddress, session.discord.id, request.headers.referer || "none");
            } catch (er) {
                console.log(er);
            }
            return reply.redirect("./");
        }
        
        let token = crypto.randomUUID().replace(/-*/g, "").substring(0, 6);
        session.stage = "link-2";
        session.token = token;

        console.time("generated");
        const script = await jslua(LuacScript, {
            Node: false,
            EncryptConstants: true,
            Debug: false,
            Link: `${process.platform == "win32" ? "http://127.0.0.1/" : "https://linkguard.cc/"}${session.hub}/v/${token}`,
            LINKVERTISE_LINK: session.config.links[2]
        })
        console.timeEnd("generated");

        tokens.set(token, { used: false, hub: session.hub });
        sessions.set(request.IPAddress, session);
        return reply.view("stage.ejs", { script, stage: 1, progress: 50, icon: session.config.icon, name: session.config.name, discord: session.config.discord, website_icon: session.config.website_icon });
    });

    fastify.get("/stage-2", async (request, reply) => {
        const session = sessions.get(request.IPAddress);
        if (!session || session.stage !== "link-2") {
            return reply.redirect("./");
        }

        if ((!request.headers.referer || !Refers.includes(request.headers.referer)) && session.hub !== "dev") {
            global.UsersBlocked++;
            sessions.delete(request.IPAddress);
            try {
                await Unauthorized(request.IPAddress, session.discord.id, request.headers.referer || "none");
            } catch (er) {
                console.log(er);
            }
            return reply.redirect("./");
        }

        let TokenData = tokens.get(session.token);
        if (!TokenData.used) {
            global.UsersBlocked++;
            sessions.delete(request.IPAddress);
            tokens.delete(session.token);
            try {
                await Unauthorized(request.IPAddress, session.discord.id, request.headers.referer || "none");
            } catch (er) {
                console.log(er);
            }
            return reply.redirect("./");
        }
        tokens.delete(session.token);

        const Expire = new Date();
        Expire.setHours(Expire.getHours() + session.config.trial_hours);

        let userkey;

        if (session.config.luarmor) {
            let response;

            try {
                const packet = await fetch(`https://api.luarmor.net/v3/projects/${session.config.luarmor.project_id}/users`, {
                    method: "POST",
                    headers: {
                        ["authorization"]: session.config.luarmor.api_key,
                        ["content-type"]: "application/json"
                    },
                    body: JSON.stringify({
                        auth_expire: Math.floor(Expire.getTime() / 1000),
                        discord_id: session.discord.id,
                        note: `LinkGuard | ${request.IPAddress}`
                    })
                })

                if (packet.status === 403) {
                    console.log("abc");
                    return reply.view("error.ejs", { icon: session.config.icon, name: session.config.name, discord: session.config.discord, website_icon: session.config.website_icon, error: `We failed to create your trial key! Reason: VPS is not whitelisted on Luarmor or Luarmor is experiencing server issues` })
                }

                response = await packet.json();
            } catch (er) {
                console.log(er);
                return reply.view("error.ejs", { icon: session.config.icon, name: session.config.name, discord: session.config.discord, website_icon: session.config.website_icon, error: `We failed to create your trial key! Reason: Unknown` })
            }

            if (!response || !response.success) {
                console.log(response);
                return reply.view("error.ejs", { icon: session.config.icon, name: session.config.name, discord: session.config.discord, website_icon: session.config.website_icon, error: `We failed to create your trial key! Reason: ${response ? response.message : "Unknown"}` })
            }

            userkey = response.user_key;
        }

        if (session.config.valid8) {
            let response;

            try {
                const packet = await fetch("https://valid8app.com/api/v1/generatekey", {
                    method: "POST",
                    headers: {
                        ["v8apikey"]: session.config.valid8.api_key,
                        ["content-type"]: "application/json"
                    },
                    body: JSON.stringify({
                        userid: session.config.valid8.userid,
                        pid: session.config.valid8.pid,
                        expires: Math.floor(Expire.getTime() / 1000)
                    })
                })

                response = await packet.json();
            } catch (er) {
                console.log(er);
                return reply.view("error.ejs", { icon: session.config.icon, name: session.config.name, discord: session.config.discord, website_icon: session.config.website_icon, error: `We failed to create your trial key! Reason: Unknown` })
            }

            if (!response || response?.error) {
                console.log(response);
                return reply.view("error.ejs", { icon: session.config.icon, name: session.config.name, discord: session.config.discord, website_icon: session.config.website_icon, error: `We failed to create your trial key! Reason: ${response ? response.message : "Unknown"}` })
            }

            userkey = response.key;
        }

        if (!userkey) {
            userkey = "none";
        }
        
        try {
            await Success(request.IPAddress, session.discord.id, userkey, session.config.icon); // global
            await Success(request.IPAddress, session.discord.id, userkey, session.config.icon, session.config.webhook);
        } catch (er) {
            console.log(er);
        }

        session.key = userkey;
        session.stage = "finished";
        session.complete = true;
        session.expire = Expire.getTime();

        sessions.set(request.IPAddress, session);
        discordsessions.set(session.discord.id, session);

        global.CompletedTrials++;

        return reply.view("stage.ejs", { script: `setTimeout(() => window.location.href = 'https://linkguard.cc/${session.hub}/finished', 4000)`, stage: 2, progress: 100, icon: session.config.icon, name: session.config.name, discord: session.config.discord, website_icon: session.config.website_icon, token: "" });
    });

    fastify.get("/finished", (request, reply) => {
        const session = sessions.get(request.IPAddress);
        if (!session || session.stage !== "finished") {
            return reply.redirect("./");
        }

        if (session.config.type === "service") {
            return reply.view("fservice.ejs", { icon: session.config.icon, name: session.config.name, discord: session.config.discord, expires: (session.expire).toString(), website_icon: session.config.website_icon })
        }

        reply.view("finished.ejs", { link: `https://linkguard.cc/${session.hub}/finished`, stage: 2, progress: 100, icon: session.config.icon, name: session.config.name, discord: session.config.discord, script: session.config.script, key: session.key, expires: (session.expire).toString(), website_icon: session.config.website_icon })
    })

    fastify.get("/dashboard", (request, reply) => {
        const { token } = request.query;
        if (!token) {
            return reply.view("login.ejs", { name: request.params.name });
        }

        const config = require(`../configs/${request.params.name.toLowerCase()}.json`);
        if (config.token !== token) {
            return reply.view("login.ejs", { name: request.params.name });
        }

        reply.view("dashboard.ejs", { name: request.params.name, hours: config.trial_hours.toString(), script: config.script, discord: config.discord, webhook: config.webhook, token: config.token, linkone: config.links["1"], linktwo: config.links["2"], serverlock: config.server_lock ? '1' : '0', discordid: config.server_id, type: config.type, enabled: config.enabled ? '1' : '0' })
    });

    fastify.post("/api/config", { schema: { body: UpdateConfig, headers: AcessTokenHeader } }, async (request, reply) => {
        const { name } = request.params; 
        const { hours, discord, webhook, linkone, linktwo, server_lock, discordid, type, enabled } = request.body;
        const { tg_access_token } = request.headers;

        const config = require(`../configs/${name.toLowerCase()}.json`);
        if (config.token !== tg_access_token) {
            return reply.status(401).send({ error: "Invalid API Key" });
        }

        config.trial_hours = hours;
        config.script = request.body.script || "";
        config.discord = discord;
        config.webhook = webhook;
        config.links["1"] = linkone;
        config.links["2"] = linktwo;
        config.server_lock = server_lock;
        config.server_id = discordid;
        config.type = type;
        config.enabled = enabled;
        writeFileSync(path.join(__dirname, `../configs/${request.params.name.toLowerCase()}.json`), JSON.stringify(config, null, 4));
        await ConfigChange(config.name, JSON.stringify(config, null, 4));

        return reply.send({ success: true });
    });

    fastify.get("/v/:key", (request, reply) => {
        const { key } = request.params;
        if (!key || !tokens.has(key)) return;

        const { referer } = request.headers;
        if (!referer) return;

        const data = tokens.get(key);
        if (referer !== `${process.platform !== "win32" ? `https://linkguard.cc/${data.hub}/stage-1` : `http://127.0.0.1/${data.hub}/stage-1`}`) {
            console.log("failed to set token");
            return;
        }

        console.log(`Recieved token ${key}`);
        tokens.set(key, { used: true });
        reply.send(true);
    });

    fastify.get("/discord/:discord_id", { schema: { headers: AcessTokenHeader, params: VerifyByDiscord } }, (request, reply) => {
        const { discord_id, name } = request.params;
        const { tg_access_token } = request.headers;

        const config = require(`../configs/${name.toLowerCase()}.json`);
        if (config.token !== tg_access_token) {
            return reply.status(401).send({ error: "Invalid API Key" });
        }
        
        const Session = discordsessions.get(discord_id);
        if (!Session || Session.hub !== name || !Session.complete) {
            return reply.status(404).send({ trial_active: false });
        }

        reply.send({ trial_active: Session.complete, ip: Session.ip, expires: Session.expire });
    })
}

//PgAMUosGLAZpL6fn

module.exports = routes;