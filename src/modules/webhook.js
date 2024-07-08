async function Success(ip, discord, key, icon, webhook) {
    return new Promise(async (resolve) => {
        try {
            await fetch("https://webhook.xhspkkecfo.workers.dev/", {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "LuaShield-Authorization": "$nJnbfNGm4iH8z5k"
                },
                body: JSON.stringify({
                    url: webhook || "https://discord.com/api/webhooks/1226625536030408836/c5zInwCp5NKV3gPqshU-JfFBCzvBBPUrKIwVtcjH5yHoGuiXMQH1MEQV4doynUngUbep",
                    body: {
                        "content": null,
                        "embeds": [
                          {
                            "title": "Trial Redeemed",
                            "description": "A user has completed your trial steps :tada:\nFortunately we've caught on and awarded them their trial",
                            "color": 9027814,
                            "fields": [
                              {
                                "name": "IP Address",
                                "value": ip,
                                "inline": true
                              },
                              {
                                "name": "Discord ID",
                                "value": `<@${discord}>`,
                                "inline": true
                              },
                              {
                                "name": "Key",
                                "value": `\`\`\`\n${key}\n\`\`\``
                              }
                            ],
                            "footer": {
                              "text": "linkguard.cc - v1.0.0"
                            },
                            "image": {
                                "url": icon
                            }
                          }
                        ],
                        "username": "Trial Guard",
                        "avatar_url": "https://i.imgur.com/NIP0GLH.jpeg",
                        "attachments": []
                      }
                })
            });
        } catch (er) {
            console.log(er);
        }

        resolve();
    });
}

async function Unauthorized(ip, discord, refer) {
  return new Promise(async (resolve) => {
      try {
          await fetch("https://webhook.xhspkkecfo.workers.dev/", {
              method: "POST",
              headers: {
                  "content-type": "application/json",
                  "LuaShield-Authorization": "$nJnbfNGm4iH8z5k"
              },
              body: JSON.stringify({
                  url: "https://discord.com/api/webhooks/1226528028297789542/bhixYhJlj5vwIDxFPrR0TEtj8x5SMkF3_vYZTRDKjjCbpcx_3Sw5YADQj5v5xP7PtOLG",
                  body: {
                      "content": null,
                      "embeds": [
                        {
                          "title": "Unauthorized Access",
                          "description": "A user has tried to bypass a trial system L",
                          "color": 9027814,
                          "fields": [
                            {
                              "name": "IP Address",
                              "value": ip,
                              "inline": true
                            },
                            {
                              "name": "Discord ID",
                              "value": `<@${discord}>`,
                              "inline": true
                            },
                            {
                              "name": "Refer",
                              "value": `\`\`\`\n${refer}\n\`\`\``
                            }
                          ],
                          "footer": {
                            "text": "linkguard.cc - v1.0.0"
                          }
                        }
                      ],
                      "username": "Trial Guard",
                      "avatar_url": "https://i.imgur.com/NIP0GLH.jpeg",
                      "attachments": []
                    }
              })
          });
      } catch (er) {
          console.log(er);
      }

      resolve();
  });
}

async function ConfigChange(hub, newconfig) {
  return new Promise(async (resolve) => {
      try {
          await fetch("https://webhook.xhspkkecfo.workers.dev/", {
              method: "POST",
              headers: {
                  "content-type": "application/json",
                  "LuaShield-Authorization": "$nJnbfNGm4iH8z5k"
              },
              body: JSON.stringify({
                  url: "https://discord.com/api/webhooks/1225830450468093953/qtueITEr6ecsUidI23eayJSHcgYxhZLp15NAvQRxutSOt7BcY6LRYZ3MsCQivPuF7rJQ",
                  body: {
                      "content": null,
                      "embeds": [
                        {
                          "title": "Updated config",
                          "description": "A user has updated a config",
                          "color": 9027814,
                          "fields": [
                            {
                              "name": "Hub Name",
                              "value": hub,
                              "inline": true
                            },
                            {
                              "name": "New Config",
                              "value": `\`\`\`json\n${newconfig}\n\`\`\``
                            }
                          ],
                          "footer": {
                            "text": "linkguard.cc - v1.0.0"
                          }
                        }
                      ],
                      "username": "Trial Guard",
                      "avatar_url": "https://i.imgur.com/NIP0GLH.jpeg",
                      "attachments": []
                    }
              })
          });
      } catch (er) {
          console.log(er);
      }

      resolve();
  });
}

async function BuxlootSuccess(username, date, expiry, ip, webhook) {
  return new Promise(async (resolve) => {
      try {
          await fetch("https://webhook.xhspkkecfo.workers.dev/", {
              method: "POST",
              headers: {
                  "content-type": "application/json",
                  "LuaShield-Authorization": "$nJnbfNGm4iH8z5k"
              },
              body: JSON.stringify({
                  url: webhook || "https://discord.com/api/webhooks/1226625823432249467/H3NOVb9gp5x2m1MyLD8RV-qnSnzweFWChu3QZgt-QhkgDLa6kH8BzT4KhWHh6cQBTqM1",
                  body: {
                    "content": null,
                    "embeds": [
                      {
                        "title": `${username} - Redeemed 1 R$`,
                        "description": `User completed 1 linkvertise and redeemed 1 R$\nDate: <t:${date}>\nThey can redeem another at: <t:${expiry}>`,
                        "color": 16771970,
                        "footer": {
                          "text": `IP - ${ip}`
                        }
                      }
                    ],
                    "username": "Buxloot",
                    "avatar_url": "https://buxloot.com/favicon.ico",
                    "attachments": []
                  }
              })
          });
      } catch (er) {
          console.log(er);
      }

      resolve();
  });
}

async function BuxlootUnauthorized(ip, username, refer, webhook) {
  return new Promise(async (resolve) => {
      try {
          await fetch("https://webhook.xhspkkecfo.workers.dev/", {
              method: "POST",
              headers: {
                  "content-type": "application/json",
                  "LuaShield-Authorization": "$nJnbfNGm4iH8z5k"
              },
              body: JSON.stringify({
                  url: webhook || "https://discord.com/api/webhooks/1226631665535680523/OhFw2coBBYw3i5V2Zql7RdNeLZ1jWYuSUp1yU3VOruU6wxNJasvcgBKpghgB77L9eaW6",
                  body: {
                    "content": null,
                    "embeds": [
                      {
                        "title": `${username} - Unauthorized Access`,
                        "description": `This user has been flagged for unauthorized access\nRefer: \`${refer}\``,
                        "color": 16771970,
                        "footer": {
                          "text": `IP - ${ip}`
                        }
                      }
                    ],
                    "username": "Buxloot",
                    "avatar_url": "https://buxloot.com/favicon.ico",
                    "attachments": []
                  }
              })
          });
      } catch (er) {
          console.log(er);
      }

      resolve();
  });
}

module.exports = { Success, Unauthorized, ConfigChange, BuxlootSuccess, BuxlootUnauthorized }