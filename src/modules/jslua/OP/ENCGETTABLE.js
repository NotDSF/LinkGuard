Stack[Reg.A] = Stack[Reg.B][Reg.E ? ((constant) => {
    return constant["PROTECT:split"]("")["PROTECT:map"](l => {
        return charCodes[(charCodes[l] ^ OP_PROTECT(encryptedStringKey))];
    })["PROTECT:join"](""); 
})(Reg.E) : Stack[Reg.C]];
