import { expect,it } from "vitest";
import { DEMO_COMPANIES } from "../apps/web/lib/demo";
import { analyze,screen,DEFAULT_BUY_BOX } from "../apps/web/lib/research";
import { validateFinancials,companyAssumptions } from "../packages/engine/src/index";
it("distinguishes bad evidence from an unfunded scenario",()=>{
 expect(analyze(DEMO_COMPANIES[17]).status).toBe("incomplete");
 const c={...DEMO_COMPANIES[0],financials:DEMO_COMPANIES[0].financials.map(f=>({...f,capex:f.revenue*0.8}))};
 expect(analyze(c).status).toBe("unfunded");expect(analyze(c).irr).toBeNull();
});
it("keeps empty histories visible without a crash or fabricated model",()=>{
 const c={...DEMO_COMPANIES[0],financials:[]};
 expect(()=>analyze(c)).not.toThrow();expect(analyze(c).model).toBeNull();
 expect(analyze(c).status).toBe("incomplete");expect(companyAssumptions(c)).toBeDefined();
});
it("rejects an omitted financial field",()=>{
 const years=DEMO_COMPANIES[0].financials.map(f=>({...f}));delete (years[0] as Partial<typeof years[0]>).capex;
 expect(validateFinancials(years).length).toBeGreaterThan(0);
});
it("sorts unavailable returns last and search respects the actual company universe",()=>{
 const rows=DEMO_COMPANIES.map(analyze),sorted=screen(rows,DEFAULT_BUY_BOX);
 expect(sorted.at(-1)!.irr).toBeNull();
 expect(screen(rows,{...DEFAULT_BUY_BOX,search:"SIM001"}).map(r=>r.company.id)).toEqual(["demo-01"]);
});
