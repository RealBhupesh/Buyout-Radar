import type { Page } from "./schema";
export const NOTE_TOPICS=[/exceptional|non.recurring|one.off/i,/related.party|key management/i,/contingent|guarantee|litigation/i];
export function findNotePages(pages:Page[],maxPages=18):Page[] {
  const selected=new Set<number>();
  pages.forEach((p,i)=>{if(NOTE_TOPICS.some(topic=>topic.test(p.text))) for(const j of [i-1,i,i+1])if(j>=0&&j<pages.length)selected.add(j);});
  if(selected.size>maxPages) throw new Error(`Found ${selected.size} note pages; split into smaller reviewed batches`);
  return [...selected].sort((a,b)=>a-b).map(i=>pages[i]);
}
export async function readPdfPages(buffer:Uint8Array):Promise<Page[]> {
  const { PDFParse }=await import("pdf-parse");
  const parser=new PDFParse({data:buffer});
  try {const result=await parser.getText();return result.pages.map(p=>({page:p.num,text:p.text}));}
  finally{await parser.destroy();}
}
