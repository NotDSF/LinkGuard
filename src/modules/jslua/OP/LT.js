if (((Reg.D || Stack[Reg.B]) < (Reg.E || Stack[Reg.C])) === (Reg.A !== 0)) {
    PC++;
}
