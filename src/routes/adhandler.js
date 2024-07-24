const { readFileSync } = require("fs");
const path = require("path");
const crypto = require("crypto");
const GenerateScript = require("../modules/jslua");
const DiscordOauth2 = require("discord-oauth2");
const Webhook = require("../modules/webhook");
const database = require("../modules/database");
const Database = new database();
const tokens = new Map();

const oauth = new DiscordOauth2({
    clientId: process.env.DISCORD_OAUTH_ID,
    clientSecret: process.env.DISCORD_OAUTH_SECRET,
    redirectUri: `${HOSTNAME}/discord`
});

const RawScript = readFileSync(path.join(__dirname, "luac.out"), "binary");
const DiscordSchema = {
    type: "object",
    properties: {
        code: { type: "string" },
    },
    required: ["code"]
}

/**
 * @param {import("fastify").FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
*/
async function routes(fastify, options) {	
    fastify.get("/", async (request, reply) => {
        const { name } = request.params;
        const Project = await Database.GetProject(name);
        const session = sessions.get(request.IPAddress);
        
        if (!Project || !Project.Enabled) {
            return reply.redirect("/");
        }

        if (session && session.name !== Project.Name) {
            sessions.delete(request.IPAddress);
        }

        if (session && session.complete) {
            return reply.redirect("./finished");
        }

        sessions.set(request.IPAddress, {
            stage: "main",
            complete: false,
            name: Project.Name,
            ip: request.IPAddress,
            project: Project,
            creation: Date.now()
        });

        return reply.view("index.ejs", { name: Project.Name });
    });

    // Redirects to #1 Link
    fastify.get("/discord", { schema: { querystring: DiscordSchema } }, async (request, reply) => {
        const { code } = request.query;
        const session = sessions.get(request.IPAddress);

        if (!session || session.stage !== "linking") {
            return reply.redirect("./");
        }

        const response = await oauth.tokenRequest({
            code,
            scope: "identify guilds",
            grantType: "authorization_code"
        });

        const servers = await oauth.getUserGuilds(response.access_token);
        if (!servers.find(server => server.id === session.project.ServerID)) {
            return reply.view("discord.ejs", {
                name: session.name,
                discord: session.project.ServerInvite
            });
        }

        const duser = await oauth.getUser(response.access_token);
        
        let User = await Database.GetUser(duser.id);
        if (!User) {
            User = await Database.CreateUser(duser.id);
        }
        
        let HashedIP = crypto.createHash("sha256").update(request.IPAddress).digest("hex");
        if (!User.IPs.find(ip => ip == HashedIP)) {
            await Database.AddKnownIPAddress(User.DiscordID, HashedIP);
        }

        session.stage = "link-1";
        session.user = User;
        sessions.set(request.IPAddress, session);

        reply.redirect(session.project.LinkOne);
    });

    // Redirects to #2 Link
    fastify.get("/stage-1", async (request, reply) => {
        const session = sessions.get(request.IPAddress);
        if (!session || session.stage !== "link-1") {
            return reply.redirect("./");
        }

        if (!request.headers.referer || !pubrefers.includes(request.headers.referer)) {
            sessions.delete(request.IPAddress);

            try {
                await Database.IncrementFailed(session.user.DiscordID, 1);
                await Database.ProjectIncrementFailed(session.name, 1);

                await Webhook.UserFail(session.project.Name, session.user.DiscordID, session.user.CompletedLinks, session.user.FailedLinks, (Date.now() - session.creation) / 1000, "error: 0x1 = Invalid Request");
                await Webhook.UserFail(session.project.Name, session.user.DiscordID, session.user.CompletedLinks, session.user.FailedLinks, (Date.now() - session.creation) / 1000, "error: 0x1 = Invalid Request", session.project.Webhook);
            } catch (er) {
                console.log(er);
            }

            return reply.redirect("./");
        }

        const token = crypto.randomUUID();
        session.stage = "link-2";
        session.token = token;

        console.time("Generated Loader");
        const script = await GenerateScript(RawScript, {
            Node: false,
            EncryptConstants: true,
            Debug: false,
            Link: `${HOSTNAME}/${session.name}/v/${token}`,
            LINKVERTISE_LINK: session.project.LinkTwo
        });
        console.timeEnd("Generated Loader");

        tokens.set(token, { used: false, session: session });
        sessions.set(request.IPAddress, session);

        return reply.view("stage.ejs", {
            name: session.name,
            stage: 1,
            progress: 50,
            script
        });
    });

    // Redirects to #3 Link (our linkvertise)
    fastify.get("/stage-2", async (request, reply) => {
        const session = sessions.get(request.IPAddress);
        if (!session || session.stage !== "link-2") {
            return reply.redirect("./");
        }

        if (!request.headers.referer || !pubrefers.includes(request.headers.referer)) {
            sessions.delete(request.IPAddress);

            try {
                await Database.IncrementFailed(session.user.DiscordID, 1);
                await Database.ProjectIncrementFailed(session.name, 1);

                await Webhook.UserFail(session.project.Name, session.user.DiscordID, session.user.CompletedLinks, session.user.FailedLinks, (Date.now() - session.creation) / 1000, "error: 0x3 = Invalid Request");
                await Webhook.UserFail(session.project.Name, session.user.DiscordID, session.user.CompletedLinks, session.user.FailedLinks, (Date.now() - session.creation) / 1000, "error: 0x3 = Invalid Request", session.project.Webhook);
            } catch (er) {
                console.log(er);
            }

            return reply.redirect("./");
        }

        const token = tokens.get(session.token);
        if (!token || !token?.used) {
            sessions.delete(request.IPAddress);
            tokens.delete(session.token);

            try {
                await Database.IncrementFailed(session.user.DiscordID, 1);
                await Database.ProjectIncrementFailed(session.name, 1);

                
                await Webhook.UserFail(session.project.Name, session.user.DiscordID, session.user.CompletedLinks, session.user.FailedLinks, (Date.now() - session.creation) / 1000, "error: 0x4 = Failed to validate");
                await Webhook.UserFail(session.project.Name, session.user.DiscordID, session.user.CompletedLinks, session.user.FailedLinks, (Date.now() - session.creation) / 1000, "error: 0x4 = Failed to validate", session.project.Webhook);
            } catch (er) {
                console.log(er);
            }

            return reply.redirect("./");
        }

        const Expire = new Date();
        Expire.setHours(Expire.getHours() + session.project.UserCooldown);

        session.license = crypto.randomUUID();
        session.stage = "finished";
        session.complete = true;
        session.expire = Expire.getTime();

        sessions.set(request.IPAddress, session);
        licenses.set(session.license, session);
        dsessions.set(session.user.DiscordID, session);

        try {
            await Database.IncrementCompleted(session.user.DiscordID, 3);
            await Database.ProjectIncrementCompleted(session.name, 3);

            switch (session.project.VerificationType) {
                case "script":
                    await Webhook.LicenseSuccess(session.project.Name, session.user.DiscordID, session.user.CompletedLinks, session.user.FailedLinks, session.license, (Date.now() - session.creation) / 1000)
                    await Webhook.LicenseSuccess(session.project.Name, session.user.DiscordID, session.user.CompletedLinks, session.user.FailedLinks, session.license, (Date.now() - session.creation) / 1000, session.project.Webhook)
                    break;
                default:
                    await Webhook.ApplicationSuccess(session.project.Name, session.user.DiscordID, session.user.CompletedLinks, session.user.FailedLinks, (Date.now() - session.creation) / 1000)
                    await Webhook.ApplicationSuccess(session.project.Name, session.user.DiscordID, session.user.CompletedLinks, session.user.FailedLinks, (Date.now() - session.creation) / 1000, session.project.Webhook)
                    break;
            }
        } catch (er) {
            console.log(er);
        }
        
        return reply.redirect(`${HOSTNAME}/${session.name}/finished`);
    });

    fastify.get("/finished", (request, reply) => {
        const session = sessions.get(request.IPAddress);
        if (!session || session?.stage !== "finished") {
            return reply.redirect("./");
        }

        switch (session.project.VerificationType) {
            case "script":
                return reply.view("script/finished.ejs", {
                    expire: session.expire,
                    key: session.license,
                    discord: session.project.ServerInvite,
                    name: session.name
                });
            case "application":
                return reply.view("application/finished.ejs", {
                    expire: session.expire,
                    discord: session.project.ServerInvite,
                    name: session.name
                });
        }
    });
    
    fastify.get("/v/:token", (request, reply) => {
        const { token } = request.params;
        if (!token || !tokens.has(token)) return;

        const data = tokens.get(token);

        if (!request.headers.referer || request.headers.referer !== `${HOSTNAME}/${data.session.name}/stage-1`) {
            console.log("Token Validation Failed", request.headers.referer, data, token);
            return;
        }

        data.used = true;
        tokens.set(token, data);
        reply.send(true);
    });

    fastify.get("/dashboard", async (request, reply) => {
        const { key } = request.query;
        const { name } = request.params;

        if (!key) {
            return reply.view("dashboard/login.ejs", { name: name });
        }

        const Project = await Database.GetProjectFromAPIKey(key);
        if (Project.APIKey != key) {
            return reply.view("dashboard/login.ejs", { name: name });
        }

        return reply.view("dashboard/index.ejs", {
            name: Project.Name,
            webhook: Project.Webhook,
            invite: Project.ServerInvite,
            serverid: Project.ServerID,
            linkone: Project.LinkOne,
            linktwo: Project.LinkTwo,
            api: Project.APIKey,
            redeem: Project.UserCooldown,
            completed: Project.CompletedLinks,
            failed: Project.FailedLinks,
            type: Project.VerificationType
        });
    });
}

setInterval(() => {
    const Timestamp = Date.now();

    sessions.forEach((session, ip) => {
        if (Timestamp >= session.expire) {
            sessions.delete(ip);
        }
    });
    
    licenses.forEach((session, license) => {
        if (Timestamp >= session.expire) {
            licenses.delete(license);
        }
    });
    
    dsessions.forEach((session, id) => {
        if (Timestamp >= session.expire) {
            dsessions.delete(id);
        }
    });
}, 60000);

module.exports = routes;