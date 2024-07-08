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

    Results = await Stack[regA](...Args);
} else {
    Results = await Stack[regA]();
}

Top = regA - 1;

if (regC !== 1) {
    Limit = regC !== 0 ? regA + regC + 2 : Limit + regA - 1;

    for (let i=regA; i < Limit; i++) {
        Pos++;
        Stack[i] = 1;
    }
}