const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = class Database {
    async GetProject(Name) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await prisma.project.findUnique({
                    where: { Name }
                });
                resolve(result);
            } catch (er) {
                console.log(er);
                reject(er);
            }
        });
    }

    async GetProjectFromAPIKey(APIKey) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await prisma.project.findUnique({
                    where: { APIKey }
                });
                resolve(result);
            } catch (er) {
                console.log(er);
                reject(er);
            }
        });
    }

    async CreateProject(Name, Webhook, ServerInvite, ServerID, LinkOne, LinkTwo, UserCooldown, VerificationType, APIKey) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await prisma.project.create({
                    data: { 
                        Name, 
                        Webhook, 
                        ServerInvite, 
                        ServerID, 
                        LinkOne, 
                        LinkTwo, 
                        UserCooldown, 
                        VerificationType,
                        APIKey 
                    }
                });
                resolve(result);
            } catch (er) {
                console.log(er);
                reject(er);
            }
        })
    }

    async UpdateProject(CurrentName, Name, Webhook, ServerInvite, ServerID, LinkOne, LinkTwo, UserCooldown, VerificationType, Enabled) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await prisma.project.update({
                    where: { Name: CurrentName },
                    data: { 
                        Name, 
                        Webhook, 
                        ServerInvite, 
                        ServerID, 
                        LinkOne, 
                        LinkTwo, 
                        UserCooldown,
                        VerificationType,
                        Enabled: Enabled
                    }
                });
                resolve(result);
            } catch (er) {
                console.log(er);
                reject(er);
            }
        })
    }

    async GetUser(DiscordID) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await prisma.user.findUnique({
                    where: { DiscordID }
                });
                resolve(result);
            } catch (er) {
                console.log(er);
                reject(er);
            }
        });
    }

    async CreateUser(DiscordID) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await prisma.user.create({
                    data: { DiscordID }
                })
                resolve(result);
            } catch (er) {
                console.log(er);
                reject(er);
            }
        });
    }

    async ProjectIncrementCompleted(Name, Amount) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await prisma.project.update({
                    where: { Name },
                    data: {
                        CompletedLinks: {
                            increment: Amount
                        }
                    }
                })
                resolve(result);
            } catch (er) {
                console.log(er);
                reject(er);
            }
        })
    }

    async ProjectIncrementFailed(Name, Amount) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await prisma.project.update({
                    where: { Name },
                    data: {
                        FailedLinks: {
                            increment: Amount
                        }
                    }
                })
                resolve(result);
            } catch (er) {
                console.log(er);
                reject(er);
            }
        })
    }

    async IncrementCompleted(DiscordID, Amount) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await prisma.user.update({
                    where: { DiscordID },
                    data: {
                        CompletedLinks: {
                            increment: Amount
                        }
                    }
                })
                resolve(result);
            } catch (er) {
                console.log(er);
                reject(er);
            }
        })
    }

    async IncrementFailed(DiscordID, Amount) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await prisma.user.update({
                    where: { DiscordID },
                    data: {
                        FailedLinks: {
                            increment: Amount
                        }
                    }
                })
                resolve(result);
            } catch (er) {
                console.log(er);
                reject(er);
            }
        })
    }

    async BlacklistedUpdate(Name, Blacklisted) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await prisma.project.update({
                    where: { Name },
                    data: {
                        Blacklisted
                    }
                });
                resolve(result);
            } catch (er) {
                console.log(er);
                reject(er);
            }
        });
    }

    async AddSession(IP, Expire, License, Project, DiscordID) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await prisma.session.create({
                    data: {
                        IP,
                        License,
                        DiscordID,
                        Project,
                        Expire: Expire.toString(),
                        Creation: Date.now().toString()
                    }
                });
                resolve(result);
            } catch (er) {
                console.log(er);
                reject(er);
            }
        });
    }

    async GetSession(IP) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await prisma.session.findUnique({
                    where: {
                        IP
                    }
                });
                resolve(result);
            } catch (er) {
                console.log(er);
                reject(er);
            }
        });
    }

    async GetSessions() {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await prisma.session.findMany();
                resolve(result);
            } catch (er) {
                console.log(er);
            }
        });
    }

    async DeleteSession(IP) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await prisma.session.delete({
                    where: {
                        IP
                    }
                });
                resolve(result);
            } catch (er) {
                console.log(er);
                reject(er);
            }
        });
    }

    async GetAllProjectStats() {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await prisma.project.findMany({
                    select: {
                        CompletedLinks: true,
                        FailedLinks: true
                    }
                });
                resolve(result);
            } catch (er) {
                console.log(er);
                reject(er);
            }
        });
    }

    async SeenWarningUser(DiscordID) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await prisma.user.update({
                    where: { DiscordID },
                    data: {
                        SeenWarning: true
                    }
                })
                resolve(result);
            } catch (er) {
                console.log(er);
                reject(er);
            }
        })
    }
}