const { publishers, discord } = require("../config.json");
const dotenv = require("dotenv");
const DiscordOauth2 = require("discord-oauth2");
const fastify = require("fastify")();
const path = require("path");
const cors = require("@fastify/cors");
dotenv.config();

global.HOSTNAME = process.platform === "win32" ? "http://127.0.0.1:8080" : "https://linkguard.cc";

global.sessions = new Map();
global.pubrefers = [];

const oauth = new DiscordOauth2({
    clientId: process.env.DISCORD_OAUTH_ID,
    clientSecret: process.env.DISCORD_OAUTH_SECRET,
    redirectUri: `${HOSTNAME}/discord`
});

for (publisher of publishers) {
    pubrefers.push(publisher);
    pubrefers.push(`https://${publisher}/`);
}

global.sessions = new Map();

fastify.register(cors);

fastify.addHook("preHandler", (request, reply, done) => {
    request.IPAddress = request.headers["cf-connecting-ip"] || request.ip;
    done();
});

fastify.register(require("./routes/api"), { prefix: "/v1/" });
fastify.register(require("./routes/adhandler"), { prefix: "/:name/" });

fastify.register(require("@fastify/view"), {
    engine: {
        ejs: require("ejs")
    },
    root: path.join(__dirname, "./ejs")
});

fastify.register(require("@fastify/static"), {
    root: path.join(__dirname, "public")
});

fastify.get("/discord", (request, reply) => {
    const { code } = request.query;
    const session = sessions.get(request.IPAddress);

    if (!session) {
        return reply.redirect("/");
    }

    switch (session.stage) {
        case "main": { // just visited /:name/ and redeemed!
            session.stage = "linking";
            sessions.set(request.IPAddress, session);

            return reply.redirect(oauth.generateAuthUrl({ scope: ["identify", "guilds"] }));
        }
        case "linking": { // callback from discord
            return reply.redirect(`${HOSTNAME}/${session.name}/discord?code=${code}`);
        }
        default: {
            break;
        }
    }
    
    reply.redirect("/");
});

// OUR linkvertise callback
fastify.get("/adcallback", (request, reply) => {
    const session = sessions.get(request.IPAddress);
    if (!session || session.stage !== "link-3") {
        return reply.redirect("/");
    }

    reply.redirect(`${HOSTNAME}/${session.name}/stage-3`);
});

fastify.get("/join", (request, reply) => reply.redirect(discord));

fastify.setNotFoundHandler((request, reply) => {
    reply.status(404).view("404.ejs");
});

(async () => {
    try {
        await fastify.listen({ port: 8080, host: "0.0.0.0" });
        await fetch(process.env.UPTIME_URL);

        setInterval(async () => {
            await fetch(process.env.UPTIME_URL);
        }, 300000);

        console.log("Server now listenting to port 8080!");
    } catch (er) {
        console.log(er);
    }
})();