# Eleutheri Ads
The simplest solution for developers looking to monetize their software, without the hassle.                

![](https://link.eleutheri.com/assets/Diagram.png)

## Supported Publishers
- [Linkvertise](https://linkvertise.com)
- [LootLabs](https://lootlabs.gg)
- [Boost.ink](https://boost.ink)

## Getting Started
- Head over to [link.eleutheri.com](https://link.eleutheri.com)
- Navigate to **Create Link**

## Validation Methods
API Methods to verify users have completed advertisement links

### Discord ID
> :warning: Intended Usage: Discord Bots, Web Applications, API's

Validate completed links via Discord ID
```javascript
const packet = await fetch(`https://link.eleutheri.com/v1/project/:projectPrefix/discord/:discordID`);
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

project_prefix = ""
license_key = input("License Key: ")

response = requests.get("https://link.eleutheri.com/v1/project/{}/licenses/{}".format(project_prefix, license_key))
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
DATABASE_URL=""
DISCORD_OAUTH_ID=""
DISCORD_OAUTH_SECRET=""
CAPTCHA_SECRET=""
SUCCESS_WEBHOOK=""
PROJECT_WEBHOOK=""
UPTIME_URL=""
```