import { validateAssumptions,type Assumptions } from "@buyout/engine";
export function parseScenario(input:unknown,base:Assumptions):Assumptions {
 if(!input||typeof input!=="object"||Array.isArray(input))throw new Error("Assumptions must be an object");
 const a={...base};
 for(const [key,value] of Object.entries(input)) {
  if(!(key in a))throw new Error(`Unknown assumption: ${key}`);
  if(typeof value!=="number"||!Number.isFinite(value))throw new Error(`Invalid ${key}`);
  (a as unknown as Record<string,number>)[key]=value;
 }
 const errors=validateAssumptions(a);if(errors.length)throw new Error(errors.join("; "));return a;
}
export function scenarioQuery(a:Assumptions) {return new URLSearchParams({scenario:JSON.stringify(a)}).toString();}
export function scenarioFromQuery(raw:string|undefined,base:Assumptions) {
 if(!raw)return {assumptions:base,error:null};
 try{if(raw.length>3000)throw new Error("Scenario is too large");return {assumptions:parseScenario(JSON.parse(raw),base),error:null};}
 catch{return {assumptions:base,error:"The scenario link was invalid. Base assumptions are shown."};}
}
