import { createHash } from "node:crypto";
const ALLOWED_HOSTS=new Set(["www.bseindia.com","bseindia.com","nsearchives.nseindia.com","archives.nseindia.com","www.nseindia.com"]);
/** This is an explicit manifest fetcher, not a crawler or a terms-of-use bypass. */
export async function fetchFiling(url:string,additionalHosts:string[]=[]) {
  const parsed=new URL(url);
  const hosts=new Set([...ALLOWED_HOSTS,...additionalHosts]);
  if(parsed.protocol!=="https:" || parsed.username || parsed.password || !hosts.has(parsed.hostname) || (parsed.port && parsed.port!=="443"))throw new Error("Filing URL must use an approved HTTPS host");
  const response=await fetch(parsed,{redirect:"error",signal:AbortSignal.timeout(30000),headers:{"User-Agent":"BuyoutRadar/1.0 filing-research"}});
  if(!response.ok)throw new Error(`Filing fetch failed: ${response.status}`);
  const max=25_000_000;
  if(Number(response.headers.get("content-length"))>max)throw new Error("Filing exceeds 25MB");
  if(!response.body)throw new Error("Empty filing");
  const reader=response.body.getReader();const chunks:Uint8Array[]=[];let size=0;
  try {while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw new Error("Filing exceeds 25MB");}chunks.push(value);}}finally{reader.releaseLock();}
  const bytes=Buffer.concat(chunks);
  return {bytes,sha256:createHash("sha256").update(bytes).digest("hex"),fetchedAt:new Date().toISOString(),url};
}
