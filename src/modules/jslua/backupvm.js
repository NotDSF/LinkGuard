((bytecode) => {
    let getfenv = (() => typeof global !== "undefined" ? (() => {
        global["InternalRequire"] = require;
        return global;
    })() : window);

    let rot2 = ((input) => input.split("").map(i => String.fromCharCode(i.charCodeAt()^rotKey)).join(""));

    // ##DEFINE TEMP_VARS
    let Env = getfenv();
    let stringLib = Env["PROTECT:String"];
    let Pos = 7;
    let fromCharCode = stringLib["PROTECT:fromCharCode"];
    let reflectSet = Env["PROTECT:Reflect"]["PROTECT:set"];
    let charCodes = {};

    for (let i=0; i <= 255; i++) {
        let charCode = fromCharCode(i);
        charCodes[i] = charCode;
        charCodes[charCode] = i;
    }

    function gBits8() {
        let Int = +bytecode["PROTECT:charAt"](Pos);
        Pos++;
        return Int;
    }

    function gInt() {
        let Len = +bytecode["PROTECT:charAt"](Pos);
        let Int = +bytecode["PROTECT:substr"](Pos+1, Len);

        Pos += (Len + 1);
        return Int ^ primaryXorKey;
    }

    function gString() {
        let Len = gInt();
        let string = "";
        for (let i=1; i <= Len; i++) {
            string += charCodes[(gInt() ^ constantXorKey)];
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
                    case cType_Nil: { // 0
                        Constant = null;
                        break;
                    }
                    case cType_Boolean: { // 1
                        Constant = Constant != 0;
                        break;
                    }
                    case cType_Number: { // 3
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
                            Data = Constants[Data ^ registerXorKey];
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

            return {
                randomIndex1: Instructions,
                randomIndex2: Constants,
                randomIndex3: Protos,
                randomIndex4: Upvalues,
                randomIndex5: Params
            }
        }

        return chunkDeserialze();
    }

    function _Returns(...vararg) {
        return [vararg["PROTECT:length"], vararg];
    }

    function Wrap(Chunk, Env, Upvalues) {
        let Instructions = Chunk.randomIndex1;
        let Constants = Chunk.randomIndex2;
        let Protos = Chunk.randomIndex3;

        return ((...Args) => {
            let PC = 1;
            let Top = 0;
            let Varargs = Args["PROTECT:length"];
            let Vararg = {};
            let Params = Chunk.randomIndex5;
            let Stack = new Proxy({}, {
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
                
                switch (Opcode) {
                    case 0: { // MOVE
                        Stack[Reg.A] = Stack[Reg.B];
                        break;
                    }
                    case 1: { // LOADK
                        Stack[Reg.A] = Constants[Reg.C];
                        break;
                    }
                    case 2: { // LOADBOOL
                        Stack[Reg.A] = Reg.B != 0;
                        if (Reg.C !== 0) {
                            PC++;
                        }
                        break;
                    }
                    case 3: { // LOADNIL
                        for (let i=Reg.A; i < Reg.B; i++) {
                            Stack[i] = null;
                        }
                        break;
                    }
                    case 4: { // GETUPVAL
                        Stack[Reg.A] = Upvalues[Reg.B];
                        break;
                    }
                    case 5: { // GETGLOBAL
                        Stack[Reg.A] = Env[Constants[Reg.C]];
                        break;
                    }
                    case 6: { // GETTABLE
                        Stack[Reg.A] = Stack[Reg.B][Reg.E || Stack[Reg.C]];
                        break;
                    }
                    case 7: { // SETGLOBAL
                        Env[Constants[Reg.C]] = Stack[Reg.A];
                        break;
                    }
                    case 8: { // SETUPVAL
                        Upvalues[Reg.B] = Stack[Reg.A];
                        break;
                    }
                    case 9: { // SETTABLE
                        Stack[Reg.A][Reg.D || Stack[Reg.B]] = (Reg.E || Stack[Reg.C]);
                        break;
                    }
                    case 10: { // NEWTABLE
                        Stack[Reg.A] = [];
                        break;
                    }
                    case 11: { // SELF
                        Stack[Reg.A+1] = Stack[Reg.B];
                        Stack[Reg.A] = Stack[Reg.B][Reg.E || Stack[Reg.C]];
                        break;
                    }
                    case 12: { // ADD
                        Stack[Reg.A] = (Reg.D || Stack[Reg.B]) + (Reg.E || Stack[Reg.C]);
                        break;
                    }
                    case 13: { // SUB
                        Stack[Reg.A] = (Reg.D || Stack[Reg.B]) - (Reg.E || Stack[Reg.C]);
                        break;
                    }
                    case 14: { // MUL
                        Stack[Reg.A] = (Reg.D || Stack[Reg.B]) * (Reg.E || Stack[Reg.C]);
                        break;
                    }
                    case 15: { // DIV
                        Stack[Reg.A] = (Reg.D || Stack[Reg.B]) / (Reg.E || Stack[Reg.C]);
                        break;
                    }
                    case 16: { // MOD
                        Stack[Reg.A] = (Reg.D || Stack[Reg.B]) % (Reg.E || Stack[Reg.C]);
                        break;
                    }
                    case 17: { // POW
                        Stack[Reg.A] = (Reg.D || Stack[Reg.B]) ** (Reg.E || Stack[Reg.C]);
                        break;
                    }
                    case 18: { // UNM
                        Stack[Reg.A] = -Stack[Reg.B];
                        break;
                    }
                    case 19: { // NOT
                        Stack[Reg.A] = !Stack[Reg.B];
                        break;
                    }
                    case 20: { // LEN
                        Stack[Reg.A] = Stack[Reg.B]["PROTECT:length"];
                        break;
                    }
                    case 21: { // CONCAT
                        let regB = Reg.B;
                        let regC = Reg.C;
                        let Finished = Stack[regB];
                        for (let i=regB + 1; i <= regC; i++) {
                            Finished += Stack[i]
                        }
                        Stack[Reg.A] = Finished;
                        break;
                    }
                    case 22: { // JMP
                        PC += Reg.C;
                        break;
                    }
                    case 23: { // EQ
                        if ((Reg.D || Stack[Reg.B]) === (Reg.E || Stack[Reg.C])) {
                            PC++;
                        }
                        break;
                    }
                    case 24: { // LT
                        if (((Reg.D || Stack[Reg.B]) < (Reg.E || Stack[Reg.C])) === (Reg.A !== 0)) {
                            PC++;
                        }
                        break;
                    }
                    case 25: { // LE
                        if (((Reg.D || Stack[Reg.B]) <= (Reg.E || Stack[Reg.C]))) {
                            PC++;
                        }
                        break;
                    }
                    case 26: { // TEST
                        if (Stack[Reg.A] && (Stack[Reg.C] !== 1)) {
                            PC++;
                        }
                        break;
                    }
                    case 27: { // TESTSET
                        if (Stack[Reg.B] && (Stack[Reg.C] !== 1)) {
                            Stack[Reg.A] = Stack[Reg.B];
                            PC++;
                        }
                        break;
                    }
                    case 28: { // CALL
                        let Limit;
                        let Results;
                        let Args = [];
                        let Pos = -1;
                        let regB = Reg.B;
                        let regA = Reg.A;
                        let regC = Reg.C;

                        if (regB !== 1) {
                            Limit = regB !== 0 ? regA+regB : Top;

                            for (let i=regA + 1; i < Limit; i++) {
                                Args.push(Stack[i]);
                            }

                            [Limit, Results] = _Returns(Stack[regA](...Args));
                        } else {
                            [Limit, Results] = _Returns(Stack[regA]());
                        }

                        Top = regA - 1;

                        if (regC !== 1) {
                            Limit = regC !== 0 ? regA + regC + 2 : Limit + regA - 1;

                            for (let i=regA; i < Limit; i++) {
                                Pos++;
                                Stack[i] = Results[Pos];
                            }
                        }
                        break;
                    }
                    case 29: { // TAILCALL
                        let Limit;
                        let Args = [];
                        let regB = Reg.B;
                        let regA = Reg.A;


                        if (regB !== 1) {
                            Limit = regB >= 2 ? regA+regB : Top;

                            for (let i=regA + 1; i < Limit; i++) {
                                Args.push(Stack[i]);
                            }
                        }

                        return Stack[regA](...Args);
                    }
                    case 30: { // RETURN
                        let Ret = [];
                        let regB = Reg.B;
                        let regA = Reg.A;

                        if (regB !== 1) {
                            let Limit;

                            if (regB >= 2) {
                                Limit = regB + regA - 2;
                            } else {
                                Limit = Top;
                            }

                            for (let i=regA; i <= Limit; i++) {
                                Ret.push(Stack[i]);
                            }
                        }
                        
                        return Ret;
                    }
                    case 31: { // FORLOOP
                        let Step = Stack[Reg.A];
                        let regA = Reg.A;

                        Stack[regA] = Step + Stack[regA + 2];

                        if (Stack[regA] <= (Stack[regA + 1])) {
                            PC += Reg.C;
                            Stack[regA + 3] = Stack[regA];
                        }
                        break;
                    }
                    case 32: { // FORPREP
                        let regA = Reg.A;
                        Stack[regA] -= Stack[regA + 2];
                        PC += Reg.C;
                        break;
                    }
                    case 34: { // SETLIST
                        let regA = Reg.A;
                        let regC = Reg.C;
                        let regB = Reg.B;
                        let Offset = (regC-1) * +("PROTECT:50");

                        regB = regB == 0 ? Top - regA : regB;

                        for (let i=1; i < regB; i++) {
                            Stack[regA][Offset+1] = Stack[regA+i];
                        }
                        break;
                    }
                    case 36: { // CLOSURE
                        Stack[Reg.A] = Wrap(Protos[Reg.C], Env, Upvalues);
                        break;
                    }
                    case 38: { // CUSTOM OP FOR EQ
                        if ((Reg.D || Stack[Reg.B]) !== (Reg.E || Stack[Reg.C])) {
                            PC++;
                        }
                        break;
                    }
                    case 39: { // DECRYPT LOADK
                        Stack[Reg.A] = ((constant) => {
                            return constant["PROTECT:split"]("")["PROTECT:map"](l => {
                                return charCodes[(charCodes[l] ^ encryptedStringKey)];
                            })["PROTECT:join"]("");
                        })(Constants[Reg.C]);
                        break;
                    }
                    case 40: {
                        Stack[Reg.A] = Env[((constant) => {
                            return constant["PROTECT:split"]("")["PROTECT:map"](l => {
                                return charCodes[(charCodes[l] ^ encryptedStringKey)];
                            })["PROTECT:join"]("");
                        })(Constants[Reg.C])];
                        break;
                    }
                }

                PC++;
            }
        });
    }

    return Wrap(deserialize(), getfenv(), {})();
})("JS-OBF|_Bytecode_", this);