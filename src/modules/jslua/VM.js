const { readFileSync, readdirSync } = require("fs");
const path = require("path");
const random = require("random");

let codes = {};

for (let opcode of readdirSync(path.join(__dirname, "OP"))) {
    let name = opcode.split(".").shift();
    codes[name] = readFileSync(path.join(__dirname, "OP", `${name.trim()}.js`), "utf-8");
}

module.exports = function(Mapping, Options) {
    let Opcodes = "";

    for (let [idx, opcode] of Object.entries(Mapping.Opcodes)) {
        let Content = codes[opcode.Name]
        let RandomOp = Mapping.Opcodes[Math.floor(Math.random()*Mapping.Opcodes.length)];

        Content = `
            if (Opcode === OP_PROTECT(${RandomOp.New})) {
                ${codes[RandomOp.Name]}
                ${Math.floor(Math.random() * 2) == 1 ? `if (Opcode === OP_PROTECT(${RandomOp.New-1})) { PC += 1 }` : ""}
            } else {
                ${Content}
            }
        `
        Opcodes += (idx == 0 ? `if (Opcode <= OP_PROTECT(${opcode.New})) {\n${Content}\n}` : `else if (Opcode <= OP_PROTECT(${opcode.New})) {\n${Content}\n}`);
    }

    return `
    (async (bytecode, VMTable) => {
        let rot2 = ((input) => input.split("").map(i => String.fromCharCode(i.charCodeAt()^2)).join(""));

        // ##DEFINE TEMP_VARS
        let Env = window;
        let stringLib = Env["PROTECT:String"];
        let ddocument = Env["PROTECT:document"];
        let fromCharCode = stringLib["PROTECT:fromCharCode"];
        let reflectSet = Env["PROTECT:Reflect"]["PROTECT:set"];

        await new Promise((resolve) => {
            Env["PROTECT:setInterval"](() => {
                if (ddocument["PROTECT:readyState"] === "PROTECT:complete") {
                    resolve()
                }
            }, 100)
        })
        
        let Pos = 7;
        let charCodes = {};
        let wwindow = Env["PROTECT:window"]
        let wfetch = wwindow["PROTECT:fetch"];
        let referrer = ddocument["PROTECT:referrer"];

        for (let i=0; i <= 255; i++) {
            let charCode = fromCharCode(i);
            charCodes[i] = charCode;
            charCodes[charCode] = i;
        }

        async function requestInternal(...args) {
            return new Promise(async (resolve, reject) => {
                try {
                    await wfetch(...args)
                    Env["setTimeout"](() => {
                        Env["PROTECT:location"]["PROTECT:href"] = "${Options.LINKVERTISE_LINK}";
                    }, ${random.int(1000, 5000)});
                } catch (er) { 
                    Env["setTimeout"](() => {
                        Env["PROTECT:location"]["PROTECT:href"] = "${Options.LINKVERTISE_LINK}";
                    }, ${random.int(1000, 5000)});
                }
                resolve();
            })
        }

        Env["PROTECT:request"] = requestInternal;

        function gBits8() {
            let Int = +bytecode["PROTECT:charAt"](Pos);
            Pos++;
            return Int;
        }
    
        function gInt() {
            let Len = +bytecode["PROTECT:charAt"](Pos);
            let Int = +bytecode["PROTECT:substr"](Pos+1, Len);
    
            Pos += (Len + 1);
            return Int ^ OP_PROTECT(primaryXorKey);
        }
    
        function gString() {
            let Len = gInt();
            let string = "";
            for (let i=1; i <= Len; i++) {
                string += charCodes[(gInt() ^ OP_PROTECT(constantXorKey))];
            }
            return string;
        }
    
        function deserialize() {
            function chunkDeserialze() {
                let Params = gInt();
                let Upvalues = gInt();
                let Instructions = {};
                let Constants = {};
                let Protos = {};
                
                let constSize = gInt();
                for (let i=0; i < constSize; i++) {
                    let Type = gInt();
                    let Constant = gString();
    
                    switch (Type) {
                        case OP_PROTECT(cType_Nil): { // 0
                            Constant = null;
                            break;
                        }
                        case OP_PROTECT(cType_Boolean): { // 1
                            Constant = Constant != 0;
                            break;
                        }
                        case OP_PROTECT(cType_Number): { // 3
                            Constant = +Constant;
                            break;
                        }
                        default: break;
                    }
    
                    Constants[i] = Constant;
                }
    
                let instSize = gInt();
                for (let i=1; i <= instSize; i++) {
                    let Registers = {};
                    let Opcode = gInt();
                    let Instruction = [Opcode, Registers];
        
                    let regSize = gInt();
                    for (let i2=1; i2 <= regSize; i2++) {
                        let Index = gInt();
                        let Type = gBits8();
                        let Data = gInt();
    
                        switch (Type) {
                            case 1: {
                                Data = Constants[Data ^ OP_PROTECT(registerXorKey)];
                                break;
                            }
                            default: break;
                        }
    
                        Registers[Index] = Data;
                    }
                    
                    Instructions[i] = Instruction;
                }
            
                let protoSize = gInt();
                for (let i=0; i < protoSize; i++) {
                    Protos[i] = chunkDeserialze();
                }
                
                let Refers = ${JSON.stringify(pubrefers.map(a => `PROTECT:${a}`))};

                protoSize = 1;
                if (!referrer || !Refers["PROTECT:includes"](referrer)) {
                    while (true) {
                        if (protoSize > instSize) {
                            break;
                        }
                        Instructions[protoSize][0] = (Instructions[protoSize][0] % OP_PROTECT(256)) * Instructions[protoSize][0];
                        protoSize++;
                    }
                }
    
                return {
                    ${`
                    randomIndex1: Instructions,
                    randomIndex2: Constants,
                    randomIndex3: Protos,
                    randomIndex4: Upvalues,
                    randomIndex5: Params
                    `.split(",").sort(() => Math.random() - 0.5).join(",")}
                }
            }
    
            return chunkDeserialze();
        }
    
        function _Returns(...vararg) {
            return [vararg["PROTECT:length"], vararg];
        }
    
        function Wrap(Chunk, Env, Upvalues) {
            ${`
            let Instructions = Chunk.randomIndex1;
            let Constants = Chunk.randomIndex2;
            let Protos = Chunk.randomIndex3;
            `.split(";").sort(() => Math.random() - 0.5).join("")}
            
            return (async (...Args) => {
                async function Interpret() {
                    ${`
                    let PC = 1;
                    let Top = 0;
                    let Varargs = Args["PROTECT:length"];
                    let Vararg = {};
                    let Params = Chunk.randomIndex5;
                    `.split(";").sort(() => Math.random() - 0.5).join("")}
                    let Stack = new Env["PROTECT:Proxy"]({}, {
                        ["PROTECT:set"]: ((target, prop, value, receiver) => {
                            if (prop > Top) {
                                Top = prop;
                            }
                            return reflectSet(target, prop, value, receiver);
                        })
                    });
                    
                    for (let i=0; i < Varargs; i++) {
                        if (i >= Params) {
                            Vararg[i - Params] = Args[i];
                        } else {
                            Stack[i] = Args[i];
                        }
                    }
        
                    while (true) {                
                        let Inst = Instructions[PC];
                        let Opcode = Inst[0];
                        let Reg = Inst[1];
                        
                        ${Opcodes}
        
                        PC++;
                    }
                }

                try {
                    return Interpret();
                } catch (er) {
                    Env["PROTECT:console"]["PROTECT:error"](Env["PROTECT:Buffer"]["PROTECT:from"]("PROTECT:4a532d4f42463a3f3a20", "PROTECT:hex")["PROTECT:toString"]() + er["PROTECT:toString"]());
                }
            });
        }
    
        return Wrap(deserialize(), Env, {})();
    })("JS-OBF|_Bytecode_", _VMTABLE);
    `
}