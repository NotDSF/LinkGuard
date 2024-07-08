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

    return
}

return [...Ret];