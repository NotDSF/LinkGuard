const encoding = require("../../encoding.json");
const utf8 = require("utf8");

function EncodeObject(obj) {
    let stream = Buffer.alloc(999);
    let offset = 0;

    function wByte(value) {
        stream.writeUint8(value, offset);
        offset = offset + 1;
    }

    function wInt32(value) {
        stream.writeUint32LE(value ^ encoding.int32_xor, offset);
        offset = offset + 4;
    }

    function wString(value) {
        wInt32(value.length);
        for (let char of value.split(""))
            wInt32(char.charCodeAt(0) ^ encoding.string_xor);
    }

    function HandleValue(value) {
        switch (typeof(value)) {
            case "string":
                wInt32(encoding.string_header);
                wString(value);
                break;

            case "number":
                wInt32(encoding.number_header);
                wInt32(value);
                break;

            case "boolean":
                wInt32(encoding.boolean_header);
                wByte(value ? 1 : 0);
                break;

            case "object":
                wInt32(encoding.object_header);
                WriteObject(value);
                break;
        }
    }

    function WriteObject(object) {
        wInt32(Object.keys(object).length);
        for (let [index, value] of Object.entries(object)) {
            HandleValue(index);
            HandleValue(value);
        }
    }

    WriteObject(obj);
    return stream.slice(0, offset).toString().split("").map(c => `${utf8.encode(c).charCodeAt(0)}`).join("x");
}

module.exports = EncodeObject;