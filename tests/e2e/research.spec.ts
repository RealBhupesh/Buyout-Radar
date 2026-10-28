import { test,expect } from "@playwright/test";
test("Radar filters, Buy Box, pagination and saved research work",async({page})=>{
 const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));await page.goto("/");
 await expect(page.getByRole("heading",{name:"The buyout lens."})).toBeVisible();
 await expect(page.getByRole("table").getByRole("row")).toHaveCount(13);
 await page.getByRole("button",{name:"Show 12 more"}).click();await expect(page.getByRole("table").getByRole("row")).toHaveCount(25);
 await page.getByRole("textbox",{name:"Search companies"}).fill("SIM001");
 await expect(page.getByRole("table").getByRole("row")).toHaveCount(2);
 await page.getByRole("button",{name:"Save Aster Precision",exact:true}).click();
 await page.getByRole("link",{name:"Saved research",exact:true}).click();
 await expect(page.getByRole("heading",{name:"The second look."})).toBeVisible();await expect(page.getByRole("button",{name:"Unsave Aster Precision"})).toBeVisible();
 await page.getByRole("button",{name:"Edit Buy Box"}).click();await expect(page.getByRole("dialog")).toBeVisible();
 await page.getByRole("slider",{name:/Minimum IRR/}).fill("0.25");await page.getByRole("button",{name:"Close dialog"}).click();
 await page.reload();await page.getByRole("button",{name:"Edit Buy Box"}).click();await expect(page.getByRole("slider",{name:/Minimum IRR/})).toHaveValue("0.25");await page.keyboard.press("Escape");
 expect(errors).toEqual([]);
});
test("company assumptions, evidence, notes and Excel are live",async({page})=>{
 const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));await page.goto("/company/demo-01");
 const returns=page.getByRole("region",{name:"Live scenario returns"});const before=await returns.innerText();
 await page.getByRole("slider",{name:"Revenue growth",exact:true}).fill("0.15");await expect(returns).not.toHaveText(before);
 await page.getByRole("button",{name:"Downside",exact:true}).click();await expect(page.getByRole("slider",{name:"Revenue growth",exact:true})).toHaveValue("0.03");
 await page.getByRole("button",{name:"Reset",exact:true}).click();await page.getByRole("button",{name:"Financial history",exact:true}).click();
 await page.getByRole("row",{name:/Reported EBITDA/}).getByRole("button").last().click();await expect(page.getByRole("dialog")).toContainText("Synthetic reference ledger");await page.keyboard.press("Escape");
 await page.getByRole("button",{name:"Sources & notes",exact:true}).click();await page.getByRole("textbox",{name:"Investment research note"}).fill("Diligence: check recurring capex.");await page.reload();await page.getByRole("button",{name:"Sources & notes",exact:true}).click();await expect(page.getByRole("textbox",{name:"Investment research note"})).toHaveValue("Diligence: check recurring capex.");
 const note=page.waitForEvent("download");await page.getByRole("button",{name:"Download note"}).click();expect((await note).suggestedFilename()).toBe("SIM001-research.txt");
 const excel=page.waitForEvent("download");await page.getByRole("button",{name:"Export Excel"}).click();expect((await excel).suggestedFilename()).toBe("SIM001-buyout.xlsx");
 await page.getByRole("button",{name:"Underwriting",exact:true}).click();await page.getByRole("button",{name:"Leverage × growth",exact:true}).click();await expect(page.getByRole("table",{name:/IRR sensitivity/})).toBeVisible();
 const growthBefore=await page.getByRole("slider",{name:"Revenue growth",exact:true}).inputValue();await page.getByRole("table",{name:/IRR sensitivity/}).getByRole("button").first().click();await expect(page.getByRole("slider",{name:"Revenue growth",exact:true})).not.toHaveValue(growthBefore);
 expect(errors).toEqual([]);
});
test("bad evidence and malformed scenarios never show confident returns",async({page,request})=>{
 await page.goto("/company/demo-18");await expect(page.getByRole("alert")).toContainText("Data incomplete");await expect(page.getByRole("button",{name:"Export Excel"})).toBeDisabled();
 await page.goto("/company/demo-01?scenario=garbage");await expect(page.getByRole("status").filter({hasText:"scenario link was invalid"})).toBeVisible();
 const invalid=await request.post("/api/companies/demo-01/model",{data:{leverage:-1}});expect(invalid.status()).toBe(400);
 const incomplete=await request.get("/api/companies/demo-18/export");expect(incomplete.status()).toBe(422);
 const unfunded=await request.post("/api/companies/demo-01/model",{data:{capexRate:0.8}});expect(unfunded.status()).toBe(422);expect(await unfunded.json()).not.toHaveProperty("model.irr");
 await page.goto("/company/missing");await expect(page.getByRole("heading",{name:"Outside this universe."})).toBeVisible();
});
test("mobile, reduced motion and methodology remain readable",async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:"reduce"});await page.goto("/");
 await expect(page.getByRole("heading",{name:"The buyout lens."})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.getByRole("button",{name:"Edit Buy Box"}).click();await expect(page.getByRole("dialog")).toBeVisible();await page.getByRole("button",{name:"Close dialog"}).click();
 await page.goto("/company/demo-01");expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.getByText("All operating & transaction assumptions",{exact:true}).click();await expect(page.getByRole("spinbutton",{name:"Tax rate (%)"})).toBeVisible();
 await page.goto("/methodology");await expect(page.getByRole("heading",{name:"Show your working."})).toBeVisible();await expect(page.getByText(/Real model extraction accuracy: unmeasured/)).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});
