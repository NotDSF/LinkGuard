let regB = Reg.B;
let regC = Reg.C;
let Finished = Stack[regB];
for (let i=regB + 1; i <= regC; i++) {
    Finished += Stack[i]
}
Stack[Reg.A] = Finished;
