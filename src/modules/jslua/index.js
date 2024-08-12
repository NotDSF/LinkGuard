// This is ass. from 2 years ago

const { minify } = require("uglify-js");
const { writeFileSync } = require("fs");

const random = require("random");
const deserialize = require("./deserialze");
const reserialize = require("./reserialize");
const amg = require("./Tools/amg");
const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");

function randomString() {
    let str = "";
    for (let i=0; i < random.int(5, 15); i++) {
        str += charset[Math.floor(Math.random() * charset.length)];
    }
    return str;
}

function encryptString(input, key) {
    let str = "";
    for (let i=0; i < input.length; i++) {
        str += String.fromCharCode(input.charCodeAt(i)^key);
    }
    return str;
}

let mapping = {
    registerMapping: {
        "A": random.int(1, 999),
        "B": random.int(1, 999),
        "C": random.int(1, 999),
        "D": random.int(1, 999),
        "E": random.int(1, 999)
    },
    constantTypes: {
        0: random.int(1, 99), // nil
        1: random.int(1, 99), // boolean
        3: random.int(1, 99), // number
        4: random.int(1, 99) // string
    },
    Opcodes: [],
    RawOpcodes: {},
    Keys: {
        "primaryXorKey": 6,
        "constantXorKey": 6,
        "rotKey": 6,
        "loadkKey": 6,
        "registerXorKey": 6
    },
    VirtualEnv: {
        "InternalRequire": randomString()
    }
}

let shuffleArray = (arr) => arr.sort(() => Math.random() - 0.5);

{
    let Dictionary = {};
    let Opcodes = ["MOVE", "LOADK", "LOADBOOL", "LOADNIL", "GETUPVAL", "GETGLOBAL", "GETTABLE", "SETGLOBAL", "SETUPVAL", "SETTABLE", "NEWTABLE", "SELF", "ADD", "SUB", "MUL", "DIV", "MOD", "POW", "UNM", "NOT", "LEN", "CONCAT", "JMP", "EQ", "LT", "LE", "TEST", "TESTSET", "CALL", "TAILCALL", "RETURN", "FORLOOP", "FORPREP", "TFORLOOP", "SETLIST", "CLOSE", "CLOSURE", "VARARG", "DEQ", "ENCLOADK", "ENCGLOBAL", "ENCGETTABLE", "DEBUG"]
    
    Opcodes.forEach((op, index) => {
        let New = random.int(1, 256);

        if (Dictionary[New]) {
            
            New++
            if (Dictionary[New]) {
                New++;
                if (Dictionary[New]) {
                    console.log('wtf');
                    New++;
                }
            }

        }

        mapping.Opcodes.push({ Name: op, New: New });
        mapping.RawOpcodes[index] = New;
        Dictionary[New] = true;
    });

    //console.log(mapping);
    mapping.Opcodes.sort((a, b) => a.New - b.New);
}

async function main(luaC, Options) {
    return new Promise(async (resolve, reject) => {
 

        let newVM = require("./VM")(mapping, Options);
        let bytecode = reserialize(deserialize(luaC, mapping, Options), mapping);
        let rotStringData = {Count: -1, Vars: []};
        let vmTable = [];

        newVM = newVM.replace("_Bytecode_", bytecode, 2)
            .replace("primaryXorKey", mapping.Keys.primaryXorKey)
            .replace("constantXorKey", mapping.Keys.constantXorKey)
            .replace("rotKey", mapping.Keys.rotKey)
            .replace(/encryptedStringKey/g, mapping.Keys.loadkKey)
            .replace("registerXorKey", mapping.Keys.registerXorKey)
            .replace("cType_Boolean", mapping.constantTypes[1])
            .replace("cType_Number", mapping.constantTypes[3])
            .replace("cType_Nil", mapping.constantTypes[0])
            .replace("InternalRequire", mapping.VirtualEnv.InternalRequire)
            .replace(/Return_Key/g, "RETURNKEY");
        
        for (let match of newVM.matchAll(/randomIndex\d+/g)) {
            newVM = newVM.replace(new RegExp(match[0], "g"), randomString())
        }

        let AlreadyProtected = new Set();

        for (let match of newVM.matchAll(/"PROTECT:(.*?)"/g)) {
            if (AlreadyProtected.has(match[0])) continue;
            
            rotStringData.Count++;
    
            let lName = `L_${rotStringData.Count}`;
            newVM = newVM.replace(new RegExp(match[0], "g"), lName);
            
            let Data = encryptString(match[1], 2);
            let VMIndex = `${randomString()}`;

            vmTable.push(`${VMIndex}:"${Data}"`);
            rotStringData.Vars.push(`let ${lName} = rot2(VMTable.${VMIndex});`);
            AlreadyProtected.add(match[0]);
        }

        AlreadyProtected.clear();

        for (let match of newVM.matchAll(/OP_PROTECT\((\d+)\)/g)) {
            if (AlreadyProtected.has(match[0])) continue;

            let Index = `${randomString()}`;
            let Value = await amg(parseInt(match[1]), {
                recursion: -1
            }, 0);
            
            vmTable.push(`${Index}:${Value}`);
            newVM = newVM.replace(new RegExp(match[0].replace("(", "\\(").replace(")", "\\)"), "g"), `VMTable.${Index}`);
            AlreadyProtected.add(match[0]);
        }

        AlreadyProtected.clear();
    
        for (let match of newVM.matchAll(/Reg\.(\w)/g)) {
            if (AlreadyProtected.has(match[0])) continue;

            let Index = `${randomString()}`;
            let Value = mapping.registerMapping[match[1]];

            vmTable.push(`${Index}:${Value}`);
            newVM = newVM.replace(new RegExp(match[0].replace("(", "\\(").replace(")", "\\)"), "g"), `Reg[VMTable.${Index}]`);
            AlreadyProtected.add(match[0]);
        }

        let ShuffledVMTable = `{${shuffleArray(vmTable).join(",")}}`;

        newVM = newVM.replace("// ##DEFINE TEMP_VARS", rotStringData.Vars.join("\n"));
    
        if (Options.Node)
            newVM = `return ${newVM}`;

        let Minfied = minify(newVM, {
            parse: {
                bare_returns: true
            }
        });

        if (!Minfied.code) return reject("Error obfuscating. Try again?");
        if (Options.Debug) {
            writeFileSync("debug.js", newVM.replace("_VMTABLE", ShuffledVMTable));
        }

        resolve("// dsf is cute;\n\n" + Minfied.code.replace("_VMTABLE", ShuffledVMTable));
    });
}

module.exports = main;