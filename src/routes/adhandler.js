const { readFileSync } = require("fs");
const path = require("path");
const crypto = require("crypto");
const GenerateScript = require("../modules/jslua");
const DiscordOauth2 = require("discord-oauth2");
const Webhook = require("../modules/webhook");
const database = require("../modules/database");
const logger = require("../modules/log");
const Database = new database();
const tokens = new Map();

const oauth = new DiscordOauth2({
    clientId: process.env.DISCORD_OAUTH_ID,
    clientSecret: process.env.DISCORD_OAUTH_SECRET,
    redirectUri: `${HOSTNAME}/discord`
});

const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");

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
        if (session.project.Blacklisted.find(id => id === duser.id)) {
            return reply.view("blacklisted.ejs", {
                name: session.name,
                discord: session.project.ServerInvite
            });
        }

        let User = await Database.GetUser(duser.id);
        if (!User) {
            User = await Database.CreateUser(duser.id);
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

                const duration = (Date.now() - session.creation) / 1000;
                await Webhook.UserFail(session.project.Name, session.user.DiscordID, session.user.CompletedLinks, session.user.FailedLinks, duration, `error: 0x1 = Invalid Request\n${request.headers.referer || "none"}`, session.project.APIKey);
                await Webhook.UserFail(session.project.Name, session.user.DiscordID, session.user.CompletedLinks, session.user.FailedLinks, duration, "error: 0x1 = Invalid Request", session.project.APIKey, session.project.Webhook);
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
            script
        });
    });

    // Redirects to /finished
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

                const duration = (Date.now() - session.creation) / 1000;
                await Webhook.UserFail(session.project.Name, session.user.DiscordID, session.user.CompletedLinks, session.user.FailedLinks, duration, `error: 0x2 = Invalid Request\n${request.headers.referer || "none"}`, session.project.APIKey);
                await Webhook.UserFail(session.project.Name, session.user.DiscordID, session.user.CompletedLinks, session.user.FailedLinks, duration, "error: 0x2 = Invalid Request", session.project.APIKey, session.project.Webhook);
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

                const duration = (Date.now() - session.creation) / 1000;
                await Webhook.UserFail(session.project.Name, session.user.DiscordID, session.user.CompletedLinks, session.user.FailedLinks, duration, "error: 0x3 = Failed to validate", session.project.APIKey);
                await Webhook.UserFail(session.project.Name, session.user.DiscordID, session.user.CompletedLinks, session.user.FailedLinks, duration, "error: 0x3 = Failed to validate", session.project.APIKey, session.project.Webhook);
            } catch (er) {
                console.log(er);
            }

            return reply.redirect("./");
        }

        const Expire = new Date();
        Expire.setHours(Expire.getHours() + session.project.UserCooldown);

        session.license = `lg${crypto.randomUUID().split("-").join("").slice(0, 6)}`;
        session.stage = "finished";
        session.complete = true;
        session.expire = Expire.getTime();

        sessions.set(request.IPAddress, session);
        licenses.set(session.license, session);
        dsessions.set(session.user.DiscordID, session);

        try {
            await Database.AddSession(request.IPAddress, session.expire, session.license, session.project.Name, session.user.DiscordID);
            logger(`Saved session (id=${session.user.DiscordID})`)

            await Database.IncrementCompleted(session.user.DiscordID, 2);
            await Database.ProjectIncrementCompleted(session.name, 2);
            
            const duration = (Date.now() - session.creation) / 1000;
            switch (session.project.VerificationType) {
                case "script":
                    await Webhook.LicenseSuccess(session.project.Name, session.user.DiscordID, session.user.CompletedLinks, session.user.FailedLinks, session.license, duration, session.project.APIKey)
                    await Webhook.LicenseSuccess(session.project.Name, session.user.DiscordID, session.user.CompletedLinks, session.user.FailedLinks, session.license, duration, session.project.APIKey, session.project.Webhook)
                    break;
                default:
                    await Webhook.ApplicationSuccess(session.project.Name, session.user.DiscordID, session.user.CompletedLinks, session.user.FailedLinks, duration, session.project.APIKey)
                    await Webhook.ApplicationSuccess(session.project.Name, session.user.DiscordID, session.user.CompletedLinks, session.user.FailedLinks, duration, session.project.APIKey, session.project.Webhook)
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

        return reply.view(`${session.project.VerificationType}/finished.ejs`, {
            expire: session.expire,
            key: session.license,
            discord: session.project.ServerInvite,
            name: session.name
        });
    });
    
    fastify.get("/v/:token", (request, reply) => {
        const { token } = request.params;
        if (!token || !tokens.has(token)) return;

        const data = tokens.get(token);

        if (!request.headers.referer || request.headers.referer !== `${HOSTNAME}/${data.session.name}/stage-1`) {
            return console.log("Token Validation Failed", request.headers.referer, data, token);
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

        const hashed = sha256(key);
        const Project = await Database.GetProjectFromAPIKey(hashed);
        if (Project?.APIKey != hashed) {
            return reply.view("dashboard/login.ejs", { name: name });
        }

        return reply.view("dashboard/index.ejs", {
            name: Project.Name,
            webhook: Project.Webhook,
            invite: Project.ServerInvite,
            serverid: Project.ServerID,
            linkone: Project.LinkOne,
            linktwo: Project.LinkTwo,
            api: key,
            redeem: Project.UserCooldown,
            completed: Project.CompletedLinks,
            failed: Project.FailedLinks,
            type: Project.VerificationType,
            blacklisted: Project.Blacklisted.length
        });
    });
}

(async () => {
    let restored = 0;

    const result = await Database.GetSessions();
    logger(`Fetched ${result.length} user sessions`);

    for (const { IP, Expire, License, DiscordID, Project, Creation } of result) {
        if (Date.now() >= Number(Expire)) {
            await Database.DeleteSession(IP);
            continue;
        }

        const ProjectData = await Database.GetProject(Project);
        if (!ProjectData) {
            await Database.DeleteSession(IP);
            continue;
        }

        const session = {
            expire: Number(Expire),
            stage: "finished",
            complete: true,
            name: Project,
            project: ProjectData,
            ip: IP,
            creation: Number(Creation),
            license: License,
            user: {
                DiscordID
            }
        }

        sessions.set(IP, session);
        licenses.set(License, session);
        dsessions.set(DiscordID, session);
        restored++;
    }

    logger(`Restored ${restored}/${result.length}`);
})();

setInterval(() => {
    const Timestamp = Date.now();

    sessions.forEach(async (session, ip) => {
        if (Timestamp >= session.expire) {
            sessions.delete(ip);
            try {
                await Database.DeleteSession(ip);
            } catch (er) {
                console.log(er);
            }
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