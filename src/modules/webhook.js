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
              "description": `Your project has been created!\n- [Dashboard](https://link.eleutheri.com/${page}/dashboard)\n- [Page](https://link.eleutheri.com/${page}/)`,
              "color": 11725183,
              "fields": [
                {
                  "name": "API-Key",
                  "value": apikey
                }
              ],
              "author": {
                "name": `Eleutheri Ads [${page}]`,
                "url": `https://link.eleutheri.com/${page}/`,
                "icon_url": "https://link.eleutheri.com/assets/logo.png"
              }
            }
          ],
          "username": "Eleutheri Ads",
          "avatar_url": "https://link.eleutheri.com/assets/logo.png",
          "attachments": []
        })
      });
      resolve();
    } catch (er) {
      console.log(er);
    }
  });
}

async function UserFail(page, id, completed, fails, duration, error, apikey, webhook) {
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
                  "value": `<@${id}> (${completed} completions, ${fails} fails) [(Blacklist)](https://link.eleutheri.com/v1/project/${page}/user/${id}?lg_access_token=${apikey})\nDuration: ${duration}s`
                },
                {
                  "name": ":closed_book: Debug Information",
                  "value": `\`\`\`\n${error}\n\`\`\``
                }
              ],
              "author": {
                "name": `Eleutheri Ads [${page}]`,
                "url": `https://link.eleutheri.com/${page}/`,
                "icon_url": "https://link.eleutheri.com/assets/logo.png"
              }
            }
          ],
          "username": "Eleutheri Ads",
          "avatar_url": "https://link.eleutheri.com/assets/logo.png",
          "attachments": []
        })
      });
      resolve();
    } catch (er) {
      console.log(er);
    }
  });
}

async function LicenseSuccess(page, id, completed, fails, license, duration, apikey, webhook) {
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
                  "value": `<@${id}> (${completed} completions, ${fails} fails) [(Blacklist)](https://link.eleutheri.com/v1/project/${page}/user/${id}?lg_access_token=${apikey})\nDuration: ${duration}s`
                },
                {
                  "name": "License Key",
                  "value": `\`\`\`${license}\`\`\``
                }
              ],
              "author": {
                "name": `Eleutheri Ads [${page}]`,
                "url": `https://link.eleutheri.com/${page}/`,
                "icon_url": "https://link.eleutheri.com/assets/logo.png"
              }
            }
          ],
          "username": "Eleutheri Ads",
          "avatar_url": "https://link.eleutheri.com/assets/logo.png",
          "attachments": []
        })
      });
      resolve();
    } catch (er) {
      console.log(er);
    }
  });
}

async function ApplicationSuccess(page, id, completed, fails, duration, apikey, webhook) {
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
                  "value": `<@${id}> (${completed} completions, ${fails} fails) [(Blacklist)](https://link.eleutheri.com/v1/project/${page}/user/${id}?lg_access_token=${apikey})\nDuration: ${duration}s`
                }
              ],
              "author": {
                "name": `Eleutheri Ads [${page}]`,
                "url": `https://link.eleutheri.com/${page}/`,
                "icon_url": "https://link.eleutheri.com/assets/logo.png"
              }
            }
          ],
          "username": "Eleutheri Ads",
          "avatar_url": "https://link.eleutheri.com/assets/logo.png",
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