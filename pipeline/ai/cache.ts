import { createHash } from "node:crypto";
import { mkdir,readFile,writeFile,rename } from "node:fs/promises";
import { join } from "node:path";
export function cacheKey(content:string,version:string,models:string[]):string {
  return createHash("sha256").update(JSON.stringify({content,version,models})).digest("hex");
}
export async function cached<T>(key:string,compute:()=>Promise<T>,directory="pipeline/cache"):Promise<T> {
  if(!/^[a-f0-9]{64}$/.test(key))throw new Error("Invalid cache key");
  await mkdir(directory,{recursive:true});const path=join(directory,`${key}.json`);
  try{return JSON.parse(await readFile(path,"utf8")) as T;}catch(error){if((error as NodeJS.ErrnoException).code!=="ENOENT")throw error;}
  const value=await compute();const temp=`${path}.${process.pid}.tmp`;
  await writeFile(temp,JSON.stringify(value));await rename(temp,path);return value;
}
