if (Stack[Reg.B] && (Stack[Reg.C] !== 1)) {
    Stack[Reg.A] = Stack[Reg.B];
    PC++;
}