local HttpService = game:GetService("HttpService");
local assert = assert;
local pcall = pcall;
local format = string.format;

local linkguard = {};

function linkguard:ValidateLicense(project, key) 
    assert(type(project) == "string", "invalid argument #1 to 'ValidateLicense' (string expected)");
    assert(type(key) == "string", "invalid argument #2 to 'ValidateLicense' (string expected)");

    local response = game:HttpGet(format("https://linkguard.cc/v1/project/%s/licenses/%s", project, key));
    local ok, json = pcall(HttpService.JSONDecode, HttpService, response);
    if ok then
        return json.valid;
    end;

    return false;
end;

return linkguard;