let Step = Stack[Reg.A];
let regA = Reg.A;

Stack[regA] = Step + Stack[regA + 2];

if (Stack[regA] <= (Stack[regA + 1])) {
    PC += Reg.C;
    Stack[regA + 3] = Stack[regA];
}
