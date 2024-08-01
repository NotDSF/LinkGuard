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

    async AddKnownIPAddress(DiscordID, IP) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await prisma.user.update({
                    where: { DiscordID },
                    data: {
                        IPs: {
                            push: IP
                        }
                    }
                });
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
}