// Functions
let shuffleArray = (arr) => arr.sort(() => Math.random() - 0.5);

function reserialize(chunks, mapping) {
    let bytecodeStream = [];
    let { registerMapping, Keys } = mapping;

    function writeInt(int) {
        int ^= Keys.primaryXorKey;
        bytecodeStream.push(int.toString().length, int);
    }

    function writeGbits8(byte) {
        bytecodeStream.push(byte);
    }

    function writeString(string) {
        writeInt(string.length);
        string.split("").forEach(char => writeInt(char.charCodeAt() ^ Keys.constantXorKey));
    }

    function chunkReserialize(chunk) {
        let { Instructions, Constants, Proto, Params, Upvalues } = chunk;

        writeInt(Params);
        writeInt(Upvalues);
        writeInt(Constants.length);

        for (let constant of Constants) {
            let Type = constant[0];
            let Const = constant[1];

            writeInt(mapping.constantTypes[Type]);
            writeString(Const);
        }

        writeInt(Instructions.length);

        for (let inst of Instructions) {
            let { Opcode, Registers } = inst;

            writeInt(mapping.RawOpcodes[Opcode]);
            writeInt(Object.values(Registers).length);

            for (let [i,v] of shuffleArray(Object.entries(Registers))) {
                let Type = 0;

                if (i === "D" || i === "E") {
                    Type = 1;
                    v = v ^ mapping.Keys.registerXorKey;
                }

                writeInt(registerMapping[i]);
                writeGbits8(Type);
                writeInt(v);
            }
        }

        writeInt(Proto.length);

        for (let p of Proto) {
            chunkReserialize(p);
        }
    }

    chunkReserialize(chunks);

    return bytecodeStream.join("");
}

module.exports = reserialize;