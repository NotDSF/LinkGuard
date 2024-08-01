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
        Name: { type: "string", maxLength: 8, minLength: 3 },
        Webhook: { type: "string", maxLength: 150, minLength: 50 },
        ServerInvite: { type: "string" },
        ServerID: { type: "string" },
        LinkOne: { type: "string" },
        LinkTwo: { type: "string" },
        UserCooldown: { type: "number" },
        VerificationType: { type: "string" },
        Enabled: { type: "boolean" }
    },
    required: ["Name", "Webhook", "ServerInvite", "ServerID", "LinkOne", "LinkTwo", "UserCooldown", "Enabled", "VerificationType"]
}

const ValidateProjectSchema = {
    type: "object",
    properties: {
        Name: { type: "string" },
        Webhook: { type: "string" },
        ServerInvite: { type: "string" },
        ServerID: { type: "string" },
        UserCooldown: { type: "string" },
        VerificationType: { type: "string" }
    },
    required: ["Name", "Webhook", "ServerInvite", "ServerID", "VerificationType", "UserCooldown"]
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

const validateProjectData = (Name, Webhook, ServerInvite, ServerID, UserCooldown) => {
    if (Name.match(/[^\w-]/)) {
        throw new Error("Project name cannot include special characters");
    }

    if (!Webhook.match(/^https:\/\/(canary\.)?discord(app)?.com\/api\/webhooks\/\d+\/[\w\d-]+$/)) {
        throw new Error("Invalid webhook URL (must be a valid discord URL)");
    }

    if (!ServerInvite.match(/^https:\/\/discord\.(gg)?(com)?\/(invite\/)?\w+$/)) {
        throw new Error("Invalid server invite (must start with https://)");
    }

    if (!ServerID.match(/^\d{10,20}$/)) {
        throw new Error("Invalid server ID");
    }

    if (UserCooldown > 72 || UserCooldown < 0) {
        throw new Error("Invalid cooldown (must be hours)");
    }
};

const validateLinks = async (LinkOne, LinkTwo, publishers) => {
    const fetchLink = async (url) => {
        const res = await fetch("https://proxy.xhspkkecfo.workers.dev/", {
            method: "GET",
            headers: { "url": url }
        });
        return res.text();
    };

    const resOne = await fetchLink(LinkOne);
    const resTwo = await fetchLink(LinkTwo);

    if (!publishers.includes(resOne)) {
        throw new Error("Invalid advertisement link #1");
    }

    if (!publishers.includes(resTwo)) {
        throw new Error("Invalid advertisement link #2");
    }
};

/**
 * @param {import("fastify").FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
*/
async function routes(fastify, options) {	
    fastify.get("/", (request, reply) => reply.send({ online: true, version: "1" }));

    // Create Project
    fastify.post("/project/", { schema: { body: ProjectSchema, headers: AuthorizationHeader } }, async (request, reply) => {
        const { lg_access_token } = request.headers;
        const { Name, Webhook, ServerInvite, ServerID, LinkOne, LinkTwo, UserCooldown, VerificationType } = request.body;
        try {
            const packet = await fetch("https://api.hcaptcha.com/siteverify", {
                method: "POST",
                body: new URLSearchParams({
                    response: lg_access_token,
                    secret: process.env.HCAPTCHA_SECRET
                })
            });
    
            if (packet.status !== 200) {
                throw new Error("Failed to verify captcha");
            }
    
            const body = await packet.json();
            if (!body.success) {
                throw new Error("Failed to verify captcha");
            }
    
            validateProjectData(Name, Webhook, ServerInvite, ServerID, UserCooldown);
    
            await validateLinks(LinkOne, LinkTwo, publishers);
    
            const Project = await Database.GetProject(Name);
            if (Project) {
                throw new Error("Project already exists")
            }
    
            const APIKey = crypto.randomUUID();
            const Result = await Database.CreateProject(Name, Webhook, ServerInvite, ServerID, LinkOne, LinkTwo, UserCooldown, VerificationType, sha256(APIKey));
            
            try {
                await WebhookHandler.CreatedProject(Name, `REDACTED`);    
                await WebhookHandler.CreatedProject(Name, APIKey, Webhook); 
            } catch (er) {
                console.log(er);
            }
    
            Result.APIKey = APIKey;
            return reply.send(Result);
        } catch (err) {
            response.status(400).send(err.message)
        }
    });

    // Update Project
    fastify.put("/project/:name", { schema: { body: ProjectSchema, headers: AuthorizationHeader, params: ProjectNameParam } }, async (request, reply) => {
        const { name } = request.params;
        const { lg_access_token } = request.headers;
        const { Name, Webhook, ServerInvite, ServerID, LinkOne, LinkTwo, UserCooldown, VerificationType, Enabled } = request.body;
        try {
            const Project = await Database.GetProject(name);
            if (!Project) {
                return reply.status(404).send({ error: "Project doesn't exist" });
            }
    
            if (Project.APIKey !== sha256(lg_access_token)) {
                return reply.send({ error: "Authorization required" });
            }
    
            validateProjectData(Name, Webhook, ServerInvite, ServerID, UserCooldown)
    
            await validateLinks(LinkOne, LinkTwo, publishers);
    
            const Existing = await Database.GetProject(Name);
            if (Existing && Existing.Name !== Project.Name) {
                return reply.send({ error: "Project name is taken" });
            }
    
            const Result = await Database.UpdateProject(Project.Name, Name, Webhook, ServerInvite, ServerID, LinkOne, LinkTwo, UserCooldown, VerificationType, Enabled);
            return reply.send(Result);
        } catch (err) {
            return reply.status(400).send({error: err.message})
        }
    });

    // Get Project
    fastify.get("/project/:name", { schema: { headers: AuthorizationHeader, params: ProjectNameParam } }, async (request, reply) => {
        const { name } = request.params;
        const { lg_access_token } = request.headers;

        const Project = await Database.GetProject(name);
        if (!Project) {
            return reply.send({ error: "Project doesn't exist" });
        }

        if (Project.APIKey !== sha256(lg_access_token)) {
            return reply.send({ error: "Authorization required" });
        }

        delete Project.APIKey;
        return reply.send(Project);
    });

    // Validation for the frontend
    fastify.post("/validate/project", { schema: { body: ValidateProjectSchema } }, async (request, reply) => {
        const { Name, Webhook, ServerInvite, ServerID, UserCooldown, VerificationType } = request.body;
        try {
            validateProjectData(Name, Webhook, ServerInvite, ServerID, UserCooldown)

            if (!Name.match(/^[\w-]{3,8}$/)) {
                throw new Error("Cannot include special characters or spaces in the Project Name")
            }
    
            if (VerificationType != "script" && VerificationType != "application") {
                throw new Error("Verification Type is not valid (script or application)")
            }

            reply.send({ ok: true });
        } catch (err) {
            return reply.status(400).send({error: err.message})
        }
    });

    // License Validation
    fastify.get("/project/:name/licenses/:license", { schema: { params: LicenseValidation } }, (request, reply) => {
        const { license, name } = request.params;
        const session = licenses.get(license);
        
        if (!session || session.name != name) {
            return reply.status(404).send({ error: "Not Found" });
        }

        reply.send({
            valid: true,
            license_key: license,
            expire: session.expire
        });
    });

    // Discord ID Validation
    fastify.get("/project/:name/discord/:id", { schema: { params: DiscordValidation } }, (request, reply) => {
        const { id, name } = request.params;
        const session = dsessions.get(id);

        if (!session || session.name != name) {
            return reply.status(404).send({ error: "Not Found" });
        }

        reply.send({
            valid: true,
            discord_id: session.user.DiscordID,
            expire: session.expire
        });
    });
}


module.exports = routes;