async function Success(page, id, completed, fails, webhook) {
  return new Promise(async (resolve) => {
    try {
      await fetch(webhook || process.env.SUCCESS_WEBHOOK, {
        method: "POST",
        headers: {
          ["content-type"]: "application/json"
        },
        body: JSON.stringify( {
          "content": null,
          "embeds": [
            {
              "title": "User Successful",
              "description": "A user has successfully completed your page",
              "color": 11725183,
              "fields": [
                {
                  "name": "Completed",
                  "value": completed,
                  "inline": true
                },
                {
                  "name": "Failed",
                  "value": fails,
                  "inline": true
                },
                {
                  "name": "Discord",
                  "value": `<@${id}>`
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

async function Failed(page, webhook) {
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
              "title": "User Failed",
              "description": "A user has failed to complete an advertisement link",
              "color": 15302527,
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


module.exports = { Success, CreatedProject, Failed }