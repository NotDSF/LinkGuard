const { publishers } = require("../../config.json");
const database = require("../modules/database");
const crypto = require("crypto");
const Database = new database();
const WebhookHandler = require("../modules/webhook");

const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");

global.licenses = new Map();
global.dsessions = new Map();

const ProjectSchema = {
    type: "object",
    properties: {
        Name: { type: "string", maxLength: 20, minLength: 3 },
        DisplayName: { type: "string", maxLength: 20, minLength: 4 },
        Webhook: { type: "string", maxLength: 150, minLength: 50 },
        ServerInvite: { type: "string" },
        ServerID: { type: "string" },
        LinkOne: { type: "string" },
        LinkTwo: { type: "string" },
        UserCooldown: { type: "number" },
        SessionType: { type: "string" },
        Enabled: { type: "boolean" }
    },
    required: ["Name", "Webhook", "ServerInvite", "ServerID", "LinkOne", "LinkTwo", "UserCooldown", "Enabled", "SessionType", "DisplayName"]
}

const UpdateProjectSchema = {
    type: "object",
    properties: {
        DisplayName: { type: "string", maxLength: 20, minLength: 4 },
        Webhook: { type: "string", maxLength: 150, minLength: 50 },
        ServerInvite: { type: "string" },
        ServerID: { type: "string" },
        LinkOne: { type: "string" },
        LinkTwo: { type: "string" },
        UserCooldown: { type: "number" },
        SessionType: { type: "string" },
        Enabled: { type: "boolean" }
    },
    required: ["Webhook", "ServerInvite", "ServerID", "LinkOne", "LinkTwo", "UserCooldown", "Enabled", "SessionType", "DisplayName"]
}

const ValidateProjectSchema = {
    type: "object",
    properties: {
        Name: { type: "string" },
        DisplayName: { type: "string" },
        Webhook: { type: "string" },
        ServerInvite: { type: "string" },
        ServerID: { type: "string" },
        UserCooldown: { type: "string" },
        SessionType: { type: "string" }
    },
    required: ["Name", "Webhook", "ServerInvite", "ServerID", "SessionType", "UserCooldown", "DisplayName"]
}

const AuthorizationHeader = {
    type: "object",
    properties: {
        lg_access_token: { type: "string" }
    },
    required: ["lg_access_token"]
}

const ProjectNameParam = {
    type: "object",
    properties: {
        name: { type: "string" }
    },
    required: ["name"]
}

const LicenseValidation = {
    type: "object",
    properties: {
        name: { type: "string" },
        license: { type: "string" }
    },
    required: ["name", "license"]
}

const DiscordValidation = {
    type: "object",
    properties: {
        name: { type: "string" },
        id: { type: "string" }
    },
    required: ["name", "id"]
}

const AuthorizationQuery = {
    type: "object",
    properties: {
        lg_access_token: { type: "string" }
    },
    required: ["lg_access_token"]
}

const CreateLicense = {
    type: "object",
    properties: {
        license: { type: "string", minLength: 4, maxLength: 20 },
        expiry: { type: "string" }
    },
    required: ["license", "expiry"]
}

/**
 * @param {import("fastify").FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
*/
async function routes(fastify, options) {	
    fastify.get("/", async (request, reply) => {
        let completed = 0;
        let fails = 0;

        const result = await Database.GetAllProjectStats();
        for (const { CompletedLinks, FailedLinks } of result) {
            completed += CompletedLinks;
            fails += FailedLinks;
        }

        reply.send({
            online: true,
            version: "1",
            info: {
                completed,
                fails
            }
        });
    });

    // Create Project
    fastify.post("/project/", { schema: { body: ProjectSchema, headers: AuthorizationHeader } }, async (request, reply) => {
        const { lg_access_token } = request.headers;
        const { Name, Webhook, ServerInvite, ServerID, LinkOne, LinkTwo, UserCooldown, SessionType, DisplayName } = request.body;

        let form = new FormData();
        form.append("response", lg_access_token);
        form.append("secret", process.env.CAPTCHA_SECRET);
        form.append("remoteip", request.IPAddress);

        const packet = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            method: "POST",
            body: form
        });

        const body = await packet.json();
        if (!body.success) {
            return reply.status(401).send({ error: "Failed to verify the captcha" });
        }

        if (Name.match(/[^\w-]/)) {
            return reply.status(400).send({ error: "The project name contains invalid characters" });
        }

        if (!DisplayName.match(/^[\w'\-\!\s.\d]+$/)) {
            return reply.status(400).send({ error: "The display name contains invalid characters" });
        }

        if (!Webhook.match(/^https:\/\/(canary\.)?discord(app)?.com\/api\/webhooks\/\d+\/[\w\d-]+$/)) {
            return reply.status(400).send({ error: "The webhook url is not valid (must be a valid discord URL)" });
        }

        if (!ServerInvite.match(/^https:\/\/discord\.(gg)?(com)?\/(invite\/)?\w+$/)) {
            return reply.status(400).send({ error: "The server invite is not valid (must be a valid discord URL)" });
        }

        if (!ServerID.match(/^\d{10,20}$/)) {
            return reply.status(400).send({ error: "The server id is not valid (must be a discord server id)" });
        }

        if (UserCooldown > 72 || UserCooldown < 0) {
            return reply.status(400).send({ error: "Your cooldown must be between 0-72 hours" });
        }

        const resone = await fetch("https://proxy.xhspkkecfo.workers.dev/", {
            method: "GET",
            headers: {
                "url": LinkOne
            }
        }).then(res => res.text())

        const restwo = await fetch("https://proxy.xhspkkecfo.workers.dev/", {
            method: "GET",
            headers: {
                "url": LinkTwo
            }
        }).then(res => res.text())

        if (!publishers.includes(resone)) {
            return reply.status(400).send({ error: "The provided ad-link was invalid (url one)" });
        }

        if (!publishers.includes(restwo)) {
            return reply.status(400).send({ error: "The provided ad-link was invalid (url two)" });
        }

        const Project = await Database.GetProject(Name);
        if (Project) {
            return reply.status(400).send({ error: "This url prefix is already taken" });
        }

        const APIKey = crypto.randomUUID();
        const Result = await Database.CreateProject(Name, DisplayName, Webhook, ServerInvite, ServerID, LinkOne, LinkTwo, UserCooldown, SessionType, sha256(APIKey));
        
        try {
            await WebhookHandler.CreatedProject(Name, `REDACTED`);    
            await WebhookHandler.CreatedProject(Name, APIKey, Webhook); 
        } catch (er) {
            console.log(er);
        }

        Result.APIKey = APIKey;
        return reply.send(Result);
    });

    // Update Project
    fastify.put("/project/:name", { schema: { body: UpdateProjectSchema, headers: AuthorizationHeader, params: ProjectNameParam } }, async (request, reply) => {
        const { name } = request.params;
        const { lg_access_token } = request.headers;
        const { Webhook, ServerInvite, ServerID, LinkOne, LinkTwo, UserCooldown, SessionType, Enabled, DisplayName } = request.body;

        const Project = await Database.GetProject(name);
        if (!Project) {
            return reply.status(404).send({ error: "This project can't be found" });
        }

        if (Project.APIKey !== sha256(lg_access_token)) {
            return reply.status(401).send({ error: "Authorization required" });
        }

        if (!DisplayName.match(/^[\w'\-\!\s.\d]+$/)) {
            return reply.status(400).send({ error: "The display name contains invalid characters" });
        }

        if (!Webhook.match(/^https:\/\/(canary\.)?discord(app)?.com\/api\/webhooks\/\d+\/[\w\d-]+$/)) {
            return reply.status(400).send({ error: "Invalid webhook URL (must be discord.com)" });
        }

        if (!ServerInvite.match(/^https:\/\/discord\.(gg)?(com)?\/(invite\/)?\w+$/)) {
            return reply.status(400).send({ error: "The server invite is not valid (must be a valid discord URL)" });
        }

        if (!ServerID.match(/^\d{10,20}$/)) {
            return reply.status(400).send({ error: "Invalid server ID" });
        }

        if (UserCooldown > 72 || UserCooldown < 0) {
            return reply.status(400).send({ error: "Your cooldown must be between 0-72 hours" });
        }

        const resone = await fetch("https://proxy.xhspkkecfo.workers.dev/", {
            method: "GET",
            headers: {
                "url": LinkOne
            }
        }).then(res => res.text())

        const restwo = await fetch("https://proxy.xhspkkecfo.workers.dev/", {
            method: "GET",
            headers: {
                "url": LinkTwo
            }
        }).then(res => res.text())

        if (!publishers.includes(resone)) {
            return reply.status(400).send({ error: "Invalid advertisement link #1" });
        }

        if (!publishers.includes(restwo)) {
            return reply.status(400).send({ error: "Invalid advertisement link #2" });
        }

        const Result = await Database.UpdateProject(Project.Name, DisplayName, Webhook, ServerInvite, ServerID, LinkOne, LinkTwo, UserCooldown, SessionType, Enabled);
        return reply.send(Result);
    });

    // Get Project
    fastify.get("/project/:name", { schema: { headers: AuthorizationHeader, params: ProjectNameParam } }, async (request, reply) => {
        const { name } = request.params;
        const { lg_access_token } = request.headers;

        const Project = await Database.GetProject(name);
        if (!Project) {
            return reply.status(404).send({ error: "Project not found" });
        }

        if (Project.APIKey !== sha256(lg_access_token)) {
            return reply.status(401).send({ error: "Authorization required" });
        }

        delete Project.APIKey;
        return reply.send(Project);
    });

    // Validation for the frontend
    fastify.post("/validate/project", { schema: { body: ValidateProjectSchema } }, async (request, reply) => {
        const { Name, Webhook, ServerInvite, ServerID, UserCooldown, SessionType, DisplayName } = request.body;

        if (!Name.match(/^[\w-]{3,8}$/)) {
            return reply.status(400).send({ error: "Cannot include special characters or spaces in the Project Name" });
        }

        if (!DisplayName.match(/^[\w'\-\!\s.\d]+$/)) {
            return reply.status(400).send({ error: "The display name contains invalid characters" });
        }

        if (!Webhook.match(/^https:\/\/(canary\.)?discord(app)?.com\/api\/webhooks\/\d+\/[\w\d-]+$/)) {
            return reply.status(400).send({ error: "Webhook URL is not valid (must be discord.com)" });
        }

        if (!ServerInvite.match(/^https:\/\/discord\.(gg)?(com)?\/(invite\/)?\w+$/)) {
            return reply.status(400).send({ error: "Server Invite is not valid (must be valid discord url)" });
        }

        if (!ServerID.match(/^\d{10,20}$/)) {
            return reply.status(400).send({ error: "Server ID is not valid (must be valid discord server id)" });
        }

        if (UserCooldown > 72 || UserCooldown < 0) {
            return reply.status(400).send({ error: "User Cooldown is not valid (must be hours)" });
        }
        
        if (SessionType != "license" && SessionType != "discord") {
            return reply.status(400).send({ error: "Session Type is not valid (License Key or Discord ID)" });
        }

        reply.send({ ok: true });
    });

    // License Validation
    fastify.get("/project/:name/licenses/:license", { schema: { params: LicenseValidation } }, (request, reply) => {
        const { license, name } = request.params;
        const session = licenses.get(license);
        
        if (!session || session.name != name) {
            return reply.status(404).send({ error: "License not found" });
        }

        reply.send({
            valid: true,
            license_key: license,
            expire: session.expire,
            project: name,
            discord_id: session.user?.DiscordID || "NONE",
            ip: request.IPAddress
        });
    });

    // Get Sessions
    fastify.get("/project/:name/sessions/", { schema: { params: ProjectNameParam, headers: AuthorizationHeader } }, async (request, reply) => {
        const { lg_access_token } = request.headers;
        const Name = request.params.name;
        
        const Project = await Database.GetProject(Name);
        if (!Project) {
            return reply.status(404).send({ error: "Project not found" });
        }

        if (Project.APIKey !== sha256(lg_access_token)) {
            return reply.status(401).send({ error: "Authorization required" });
        }

        const Sessions = [...dsessions.values(), ...licenses.values()];
        let UniqueSessions = [];
        for (const { stage, complete, creation, license, user, name, expire } of [...Sessions].filter(session => session.name === Name)) {
            UniqueSessions.push({ stage, complete, creation, license, user, name, expire });
        }

        reply.send(UniqueSessions);
    });
    
    fastify.get("/project/:name/info", { schema: { params: ProjectNameParam } }, async (request, reply) => {
        const { name } = request.params;
        
        const Project = await Database.GetProject(name);
        if (!Project || !Project?.Enabled) {
            return reply.send({ error: "Project not found" });
        }

        reply.send({ active: true });
    });

    // Discord ID Validation
    fastify.get("/project/:name/discord/:id", { schema: { params: DiscordValidation } }, (request, reply) => {
        const { id, name } = request.params;
        const session = dsessions.get(id);

        if (!session || session.name != name) {
            return reply.status(404).send({ error: "User not found" });
        }

        reply.send({
            valid: true,
            discord_id: session.user.DiscordID,
            expire: session.expire,
            ip: request.IPAddress
        });
    });

    // Blacklist/Unblacklist User (has to be GET for webhooks/easy accessibility)
    fastify.get("/project/:name/user/:id", { schema: { params: DiscordValidation, querystring: AuthorizationQuery } }, async (request, reply) => {
        const { id, name } = request.params;
        const { lg_access_token } = request.query;

        const Project = await Database.GetProject(name);
        if (!Project) {
            return reply.status(404).send({ error: "Project not found" });
        }

        if (Project.APIKey !== lg_access_token) {
            return reply.status(401).send({ error: "Authorization required" });
        }

        const User = await Database.GetUser(id);
        if (!User) {
            return reply.status(404).send({ error: "User not found" }); 
        }

        const Blacklisted = Project.Blacklisted;
        if (Blacklisted.find(d => d === id)) {
            Blacklisted.splice(Blacklisted.indexOf(id), 1);

            await Database.BlacklistedUpdate(name, Blacklisted);
            return reply.send({
                success: true,
                message: "User has been unblacklisted"
            });
        }

        Blacklisted.push(id);
        await Database.BlacklistedUpdate(name, Blacklisted);

        reply.send({
            success: true,
            message: "User has been blacklisted"
        });
    });

    fastify.post("/project/:name/licenses/", { schema: { headers: AuthorizationHeader, params: ProjectNameParam, body: CreateLicense } }, async (request, reply) => {
        const { name } = request.params;
        const { lg_access_token } = request.headers;
        const { license, expiry } = request.body;

        const Project = await Database.GetProject(name);
        if (!Project) {
            return reply.status(404).send({ error: "Project not found" });
        }

        if (Project.APIKey !== sha256(lg_access_token)) {
            return reply.status(401).send({ error: "Authorization required" });
        }

        const ExpireDate = new Date(+expiry);
        if (ExpireDate == "Invalid Date") {
            return reply.status(400).send({ error: "Invalid expiry date" });
        }

        if (Date.now() > expiry) {
            return reply.status(400).send({ error: "This date has already passed" });
        }

        const Session = {
            stage: "finished",
            complete: true,
            name: Project.Name,
            expire: ExpireDate.getTime(),
            license
        }

        licenses.set(license, Session);
        reply.send(Session);
    });
}

module.exports = routes;