let regA = Reg.A;
let regC = Reg.C;
let regB = Reg.B;
let Offset = (regC-1) * +("PROTECT:50");

regB = regB == 0 ? Top - regA : regB;

for (let i=1; i < regB; i++) {
    Stack[regA][Offset+1] = Stack[regA+i];
}