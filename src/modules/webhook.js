async function CreatedProject(page, apikey, webhook) {
  return new Promise(async (resolve) => {
    try {
      await fetch(webhook || process.env.PROJECT_WEBHOOK, {
        method: "POST",
        headers: {
          ["content-type"]: "application/json"
        },
        body: JSON.stringify({
          "content": null,
          "embeds": [
            {
              "title": "Project Created",
              "description": `Your project has been created!\n- [Dashboard](https://linkguard.cc/${page}/dashboard)\n- [Page](https://linkguard.cc/${page}/)`,
              "color": 11725183,
              "fields": [
                {
                  "name": "API-Key",
                  "value": apikey
                }
              ],
              "author": {
                "name": `LinkGuard [${page}]`,
                "url": `https://linkguard.cc/${page}/`,
                "icon_url": "https://linkguard.cc/assets/logo.png"
              }
            }
          ],
          "username": "LinkGuard",
          "avatar_url": "https://linkguard.cc/assets/logo.png",
          "attachments": []
        })
      });
      resolve();
    } catch (er) {
      console.log(er);
    }
  });
}

async function UserFail(page, id, completed, fails, duration, error, webhook) {
  return new Promise(async (resolve) => {
    try {
      await fetch(webhook || process.env.SUCCESS_WEBHOOK, {
        method: "POST",
        headers: {
          ["content-type"]: "application/json"
        },
        body: JSON.stringify({
          "content": null,
          "embeds": [
            {
              "title": "User Failed",
              "description": "We failed to validate an advertisment link",
              "color": 15302527,
              "fields": [
                {
                  "name": ":book: Information",
                  "value": `<@${id}> (${completed} completions, ${fails} fails)\nDuration: ${duration}s`
                },
                {
                  "name": ":closed_book: Debug Information",
                  "value": `\`\`\`\n${error}\n\`\`\``
                }
              ],
              "author": {
                "name": `LinkGuard [${page}]`,
                "url": `https://linkguard.cc/${page}/`,
                "icon_url": "https://linkguard.cc/assets/logo.png"
              }
            }
          ],
          "username": "LinkGuard",
          "avatar_url": "https://linkguard.cc/assets/logo.png",
          "attachments": []
        })
      });
      resolve();
    } catch (er) {
      console.log(er);
    }
  });
}

async function LicenseSuccess(page, id, completed, fails, license, duration, webhook) {
  return new Promise(async (resolve) => {
    try {
      await fetch(webhook || process.env.SUCCESS_WEBHOOK, {
        method: "POST",
        headers: {
          ["content-type"]: "application/json"
        },
        body: JSON.stringify({
          "content": null,
          "embeds": [
            {
              "title": "User Success",
              "description": "Your content has been redeemed!",
              "color": 11725183,
              "fields": [
                {
                  "name": ":book: Information",
                  "value": `<@${id}> (${completed} completions, ${fails} fails)\nDuration: ${duration}s`
                },
                {
                  "name": "License Key",
                  "value": `\`\`\`${license}\`\`\``
                }
              ],
              "author": {
                "name": `LinkGuard [${page}]`,
                "url": `https://linkguard.cc/${page}/`,
                "icon_url": "https://linkguard.cc/assets/logo.png"
              }
            }
          ],
          "username": "LinkGuard",
          "avatar_url": "https://linkguard.cc/assets/logo.png",
          "attachments": []
        })
      });
      resolve();
    } catch (er) {
      console.log(er);
    }
  });
}

async function ApplicationSuccess(page, id, completed, fails, duration, webhook) {
  return new Promise(async (resolve) => {
    try {
      await fetch(webhook || process.env.SUCCESS_WEBHOOK, {
        method: "POST",
        headers: {
          ["content-type"]: "application/json"
        },
        body: JSON.stringify({
          "content": null,
          "embeds": [
            {
              "title": "User Success",
              "description": "Your content has been redeemed!",
              "color": 11725183,
              "fields": [
                {
                  "name": ":book: Information",
                  "value": `<@${id}> (${completed} completions, ${fails} fails)\nDuration: ${duration}s`
                }
              ],
              "author": {
                "name": `LinkGuard [${page}]`,
                "url": `https://linkguard.cc/${page}/`,
                "icon_url": "https://linkguard.cc/assets/logo.png"
              }
            }
          ],
          "username": "LinkGuard",
          "avatar_url": "https://linkguard.cc/assets/logo.png",
          "attachments": []
        })
      });
      resolve();
    } catch (er) {
      console.log(er);
    }
  });
}

module.exports = { LicenseSuccess, CreatedProject, UserFail, ApplicationSuccess }