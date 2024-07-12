const ldexp = require("math-float64-ldexp");

const Opcodes = [ // Thanks menprotect for this wonderful array
    "ABC", "ABx", "ABC", "ABC",
    "ABC", "ABx", "ABC", "ABx",
    "ABC", "ABC", "ABC", "ABC",
    "ABC", "ABC", "ABC", "ABC",
    "ABC", "ABC", "ABC", "ABC",
    "ABC", "ABC", "AsBx", "ABC",
    "ABC", "ABC", "ABC", "ABC",
    "ABC", "ABC", "ABC", "AsBx",
    "AsBx", "ABC", "ABC", "ABC",
    "ABx", "ABC",
]


const Opmode = [ // Thanks again menprotect for this wonderful array
    {b: "OpArgR", c: "OpArgN"}, {b: "OpArgK", c: "OpArgN"}, {b: "OpArgU", c: "OpArgU"},
    {b: "OpArgR", c: "OpArgN"}, {b: "OpArgU", c: "OpArgN"}, {b: "OpArgK", c: "OpArgN"},
    {b: "OpArgR", c: "OpArgK"}, {b: "OpArgK", c: "OpArgN"}, {b: "OpArgU", c: "OpArgN"},
    {b: "OpArgK", c: "OpArgK"}, {b: "OpArgU", c: "OpArgU"}, {b: "OpArgR", c: "OpArgK"},
    {b: "OpArgK", c: "OpArgK"}, {b: "OpArgK", c: "OpArgK"}, {b: "OpArgK", c: "OpArgK"},
    {b: "OpArgK", c: "OpArgK"}, {b: "OpArgK", c: "OpArgK"}, {b: "OpArgK", c: "OpArgK"},
    {b: "OpArgR", c: "OpArgN"}, {b: "OpArgR", c: "OpArgN"}, {b: "OpArgR", c: "OpArgN"},
    {b: "OpArgR", c: "OpArgR"}, {b: "OpArgR", c: "OpArgN"}, {b: "OpArgK", c: "OpArgK"},
    {b: "OpArgK", c: "OpArgK"}, {b: "OpArgK", c: "OpArgK"}, {b: "OpArgR", c: "OpArgU"},
    {b: "OpArgR", c: "OpArgU"}, {b: "OpArgU", c: "OpArgU"}, {b: "OpArgU", c: "OpArgU"},
    {b: "OpArgU", c: "OpArgN"}, {b: "OpArgR", c: "OpArgN"}, {b: "OpArgR", c: "OpArgN"},
    {b: "OpArgN", c: "OpArgU"}, {b: "OpArgU", c: "OpArgU"}, {b: "OpArgN", c: "OpArgN"},
    {b: "OpArgU", c: "OpArgN"}, {b: "OpArgU", c: "OpArgN"}
]

function gBit(Bit, Start, End) {
    if (End) {
        let Res = (Bit / Math.pow(2, Start - 1)) % Math.pow(2, (End - 1) - (Start - 1) + 1)
        return Res - Res % 1
    } else {
        let Plc = Math.pow(2, Start - 1)
        return ((Bit % (Plc + Plc) >= Plc) && 1) || 0
    }
}

function encryptConstant(cnst, Key) {
    let New = "";
    cnst.split("").forEach(l => {
        New += String.fromCharCode(l.charCodeAt()^Key);
    });
    return New;
}

function deserialize(bytecode, mapping, options) {
    let bytecodePos = 0

    function gBits8() {
        let A = bytecode.charCodeAt(bytecodePos)
        bytecodePos++
        return A
    }

    function gBits32() {
        let [A,B,C,D] = [
            bytecode.charCodeAt(bytecodePos),
            bytecode.charCodeAt(bytecodePos + 1),
            bytecode.charCodeAt(bytecodePos + 2),
            bytecode.charCodeAt(bytecodePos + 3)
        ]

        bytecodePos += 4;
        return  (D * 16777216) + (C * 65536) + (B * 256) + A;
    }

    function gFloat() {
        let [Left, Right] = [gBits32(), gBits32()];
        let isNormal = 1;
        let Mantissa = (gBit(Right, 1, 20) * 4294967296) + Left;
        let Exponent = gBit(Right, 21, 31);
        let Sign = (-1) ** gBit(Right, 32);

        if (Exponent == 0) {
            if (Mantissa == 0) {
                return Sign * 0;
            } else {
                Exponent = 1;
                isNormal = 0;
            }
        } else if (Exponent == 2047) {
            return Sign * ((Mantissa == 0 ? 1 : 0) / 0);
        }

        return ldexp(Sign, Exponent - 1023) * (isNormal + (Mantissa / 4503599627370496));
    }

    let [gSizeT, gInt] = [gBits32, gBits32];

    function gString(Len) {
        let finishedStr = ""

        if (Len) {
            finishedStr += bytecode.substring(bytecodePos, bytecodePos + Len);
            bytecodePos += Len;
        } else {
            Len = gSizeT();
            if (Len == 0) return;

            finishedStr += bytecode.substring(bytecodePos, bytecodePos + Len);
            bytecodePos += Len;
        }

        return finishedStr;
    }

    function chunkDecode() {
        gString();
        gInt();
        gInt();
        let Upvalues = gBits8();
        let Params = gBits8();
        gBits8();

        //let [Instructions, Constants, Protos] = [[], {}, {}]
        let Instructions = [];
        let Constants = [];
        let Protos = [];
        let Chunk = {
            Params: Params,
			Upvalues: Upvalues,
            Stack: gBits8(),
            Instructions: Instructions,
            Constants: Constants,
            Proto: Protos
        }

        // Loads instructions.
        let instCount = gInt()
        for (let i=1; i <= instCount; i++) {
            let bitData = gBits32();
            let Opcode = gBit(bitData, 1, 6);

            let [Type, Mode] = [Opcodes[Opcode], Opmode[Opcode]];
            let Registers = { A: gBit(bitData, 7 , 14) }
            let Instruction = { Opcode: Opcode, Registers: Registers }

            switch (Type) {
                case "ABC": {
                    Registers["C"] = gBit(bitData, 15, 23);
                    Registers["B"] = gBit(bitData, 24, 32);
                    break;
                }
                case "ABx": {
                    Registers["C"] = gBit(bitData, 15, 32);
                    break;
                }
                case "AsBx": {
                    Registers["C"] = gBit(bitData, 15, 32) - 131071;
                    break;
                }
                default: break;
            }

            // Data processing
            {
                let isD;

                if (Mode.b === "OpArgK" && Registers["B"] >= 256) {
                    Registers["D"] = Registers["B"] - 256;
                    isD = true;
                }

                if (Mode.c === "OpArgK" && Registers["C"] >= 256) {
                    Registers["D"] = isD ? Registers["D"] : "";
                    Registers["E"] = Registers["C"] - 256;
                }

                switch (Opcode) {
                    case 23: { // EQ
                        if (Registers["A"] !== 0) {
                            Instruction = { Opcode: 38, Registers: Registers }
                        }
                        break;
                    }
                    default: break
                }
            }

            Instructions.push(Instruction);
        }

        // Loads constants.
        let constSize = gInt();
        for (let i=1; i <= constSize; i++) {
            let Type = gBits8();
            let Constant = "";

            // Ignores nil because it will just be assigned ""
            switch (Type) {
                case 1:
                    Constant = gBits8();
                    break;
                case 3:
                    Constant = gFloat();
                    break;
                case 4:
                    Constant = gString().slice(0, -1);

                    if (Constant.startsWith("https")) {
                        Constant = options.Link;
                    }

                    break;
            }

            Constants.push([Type, Constant.toString()]);
        }

        // Loads nested function prototypes.
        let protoSize = gInt();
        for (let i=1; i <= protoSize; i++) {
            Protos.push(chunkDecode());
        }

        // Optional debugging info.
        {
            // Optional debugging info size line info.
            let sizeLineI = gInt();
            for (let i=1; i <= sizeLineI; i++) {
                gInt();
            }

            // Optional debugging info size local variables.
            let sizeLocVa = gInt();
            for (let i=1; i <= sizeLocVa; i++) {
                gString();
                gInt();
                gInt();
            }

            // Optional debugging info size upvalues.
            let sizeUpval = gInt();
            for (let i=1; i <= sizeUpval; i++) {
                gInt();
                gString();
            }
        }

        /*
            ENCGLOBAL = OP_40;
            ENCLOADK = OP_39;
        */

        {
            Instructions.forEach((Inst, instPos) => {
                let { Opcode, Registers } = Inst;

                switch (Opcode) {
                    case 6: { // GETTABLE
                        if (Registers.E && Constants[Registers.E]) {
                            delete Registers.C;
                        }
                        delete Registers.D;

                        if (options.EncryptConstants) {
                            if (!Registers.C && Constants[Registers.E][0] == 4) {
                                let cnst = Constants[Registers.E];
    
                                Instructions[instPos].Opcode = 41;
                                Constants[Registers.E][1] = encryptConstant(cnst[1], mapping.Keys.loadkKey);
                            }
                        }

                        break;
                    }
                    case 5: { // GETGLOBAL  
                        switch (Constants[Registers.C][1]) {
                            case "VM_CRASH": {
                                Instructions[instPos] = { Opcode: 22, Registers: { C: -1 } }
                                Constants[Registers.C] = [3, "1"];
                                break;
                            }
                            case "VM_VIRTUAL_JMP": {
                                let nextInst = Instructions[instPos+1];

                                if (nextInst && nextInst.Opcode === 1) {
                                    let jmpPC = Constants[nextInst.Registers.C];

                                    if (jmpPC[0] !== 3) break; // Does not equal number
                                    if (Instructions[instPos+2].Opcode !== 28) { // Check if the OPCODE for PC + 2 is CALL
                                        console.warn("Incorrect usage of VM_VIRTUAL_JMP!");
                                        break;
                                    }

                                    Instructions[instPos+2] = { Opcode: 22, Registers: { C: jmpPC[1] } };
                                    Instructions.splice(instPos, 2);
                                    Constants[Registers.C] = [3, "1"];
                                }
                                break;
                            }
                            case "require": {
                                Constants[Registers.C][1] = mapping.VirtualEnv.InternalRequire;
                                break;
                            }
                            default: {
                                if (!options.EncryptConstants) break;

                                Instructions[instPos].Opcode = 40;
                                Constants[Registers.C][1] = encryptConstant(Constants[Registers.C][1], mapping.Keys.loadkKey);
                                break;
                            }
                        }
                        break;
                    }
                    case 1: { // LOADK
                        if (!options.EncryptConstants) break;

                        let cnst = Constants[Registers.C];

                        if (cnst[0] == 4) { // Is string
                            Instructions[instPos].Opcode = 39;
                            Constants[Registers.C][1] = encryptConstant(cnst[1], mapping.Keys.loadkKey);
                        }
                        break;
                    }
                }
            });
        }

        return Chunk;
    }

    let Header = {
        Signature: gString(4),
        Version: gBits8(),
        formatVersion: gBits8(),
        EdiannessFlag: gBits8(),
        Int: gBits8(),
        sizeT: gBits8(),
        Instruction: gBits8(),
        luaNumber: gBits8(),
        intFlag: gBits8()
    }

    //console.log({ Header })

    return chunkDecode()
}

module.exports = deserialize;