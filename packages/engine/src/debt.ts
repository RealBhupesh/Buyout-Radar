export function debtCapacity(ebitda:number, leverage:number, rate:number, floor:number) {
  if (![ebitda,leverage,rate,floor].every(Number.isFinite) || ebitda<0 || leverage<0 || rate<=0 || floor<=0) throw new Error("Invalid debt capacity inputs");
  const leverageLimit=ebitda*leverage;
  const coverageLimit=ebitda/(rate*floor);
  return {maxDebt:Math.min(leverageLimit,coverageLimit),leverageLimit,coverageLimit,
    binding:leverageLimit<=coverageLimit?"Leverage":"Interest coverage",
    stressedCoverage:Math.min(leverageLimit,coverageLimit)>0?ebitda*0.8/(Math.min(leverageLimit,coverageLimit)*rate):null};
}
