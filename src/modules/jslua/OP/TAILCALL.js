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