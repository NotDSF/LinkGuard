Stack[Reg.A] = ((constant) => {
    return constant["PROTECT:split"]("")["PROTECT:map"](l => {
        return charCodes[(charCodes[l] ^ OP_PROTECT(encryptedStringKey))];
    })["PROTECT:join"]("");
})(Constants[Reg.C]);