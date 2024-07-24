# LinkGuard
Reward your users easily for completing advertisement links while also preventing against bypass.city & others

## Supported Publishers
- [Linkvertise](https://linkvertise.com)
- [LootLabs](https://lootlabs.gg)
- [Boost.ink](https://boost.ink)

## Getting Started
- Head over to [linkguard.cc](https://linkguard.cc)
- Navigate to **Create Link**
- Input the required details

## Validation Methods
API Methods to verify users have completed advertisement links

### Discord ID
> :warning: Intended Usage: Discord Bots, Web Applications, API's

Validate completed links via Discord ID
```javascript
const packet = await fetch(`https://linkguard.cc/v1/project/:projectName/discord/:discordID`);
if (packet.status !== 200) {
    return console.log("Invalid License");
}

const body = await packet.json();
if (!body.valid) {
    return console.log("Invalid License");
}

console.log("Valid License:", body);
```

### License Key
> :warning: Intended Usage: Lua Scripts, Python Scripts, Desktop Applications
```python
import requests

project_name = ""
license_key = input("License Key: ")

response = requests.get("https://linkguard.cc/v1/project/{}/licenses/{}".format(project_name, license_key))
if response.status_code != 200:
    print("Invalid License")
    exit(1)

body = response.json()
if not body["valid"]:
    print("Invalid License")
    exit(1)

print("Valid!", body)
```

## Contributing
We'd love for your contributions, you'll need some resources first:

### Environment Structure
```env
# MongoDB
DATABASE_URL=""

# Discord OAuth (whitelist '127.0.0.1:8080/discord' on your application)
DISCORD_OAUTH_ID=""
DISCORD_OAUTH_SECRET=""

# HCaptcha
HCAPTCHA_SECRET=""

# Discord Webhooks
SUCCESS_WEBHOOK=""
PROJECT_WEBHOOK=""

# Better Uptime
UPTIME_URL=""
```