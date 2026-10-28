begin;
create or replace function public.ingest_company_bundle(bundle jsonb, publish boolean default false)
returns void language plpgsql security invoker set search_path = '' as $$
declare f jsonb; s jsonb; a jsonb; cid text := bundle->>'id';
begin
 if jsonb_array_length(bundle->'financials') < 5 then raise exception 'Five years required'; end if;
 if bundle->>'dataKind'='verified' and jsonb_array_length(bundle->'sources') < 73 then raise exception 'Complete field provenance required'; end if;
 if bundle->>'dataKind'='verified' and exists (
  select 1 from jsonb_array_elements(bundle->'financials') fy,
  unnest(array['revenue','ebitda','depreciation','interest','taxPaid','pat','receivables','inventory','payables','capex','cash','debt','equity','shares']) key
  where not exists(select 1 from jsonb_array_elements(bundle->'sources') ref where ref->>'field'=key and ref->>'year'=fy->>'year' and ref->>'kind'='filing' and (ref->>'page')::integer>0 and ref->>'url' like 'https://%')
 ) then raise exception 'Each financial field requires filing provenance'; end if;
 if bundle->>'dataKind'='verified' and exists (
  select 1 from unnest(array['marketCap','promoterPct','pledgedPct']) key
  where not exists(select 1 from jsonb_array_elements(bundle->'sources') ref where ref->>'field'=key and ref->>'year'=bundle->'financials'->-1->>'year' and ref->>'kind'='filing' and (ref->>'page')::integer>0 and ref->>'url' like 'https://%')
 ) then raise exception 'Market capitalization and promoter observations require filing provenance'; end if;
 for f in select value from jsonb_array_elements(bundle->'financials') loop
  if exists(select 1 from unnest(array['year','revenue','ebitda','depreciation','interest','taxPaid','pat','receivables','inventory','payables','capex','cash','debt','equity','shares']) key where jsonb_typeof(f->key) is distinct from 'number') then raise exception 'Every financial field must be numeric'; end if;
 end loop;
 insert into public.companies(id,name,ticker,sector,description,market_cap,promoter_pct,pledged_pct,entry_multiple,growth_rate,data_kind,quality_issues,is_published)
 values(cid,bundle->>'name',bundle->>'ticker',bundle->>'sector',bundle->>'description',(bundle->>'marketCap')::numeric,(bundle->>'promoterPct')::numeric,(bundle->>'pledgedPct')::numeric,(bundle->>'entryMultiple')::numeric,(bundle->>'growthRate')::numeric,bundle->>'dataKind',bundle->'qualityIssues',publish)
 on conflict(id) do update set name=excluded.name,ticker=excluded.ticker,sector=excluded.sector,description=excluded.description,market_cap=excluded.market_cap,promoter_pct=excluded.promoter_pct,pledged_pct=excluded.pledged_pct,entry_multiple=excluded.entry_multiple,growth_rate=excluded.growth_rate,data_kind=excluded.data_kind,quality_issues=excluded.quality_issues,is_published=excluded.is_published,updated_at=now();
 delete from public.source_refs where company_id=cid;
 delete from public.financials where company_id=cid and period not in (select (v->>'year')::integer from jsonb_array_elements(bundle->'financials') v);
 update public.adjustments set status='rejected' where company_id=cid and id not in (select v->>'id' from jsonb_array_elements(bundle->'adjustments') v);
 for f in select value from jsonb_array_elements(bundle->'financials') loop
  insert into public.financials(company_id,period,data) values(cid,(f->>'year')::integer,f)
  on conflict(company_id,period) do update set data=excluded.data;
 end loop;
 for s in select value from jsonb_array_elements(bundle->'sources') loop
  insert into public.filings(id,company_id,type,period,url) values(s->>'filingId',cid,'annual',(s->>'year')::integer,s->>'url') on conflict(id) do nothing;
  insert into public.source_refs(company_id,period,field,filing_id,page,url,title,kind)
  values(cid,(s->>'year')::integer,s->>'field',s->>'filingId',(s->>'page')::integer,s->>'url',s->>'title',s->>'kind')
  on conflict(company_id,period,field) do update set filing_id=excluded.filing_id,page=excluded.page,url=excluded.url,title=excluded.title,kind=excluded.kind;
 end loop;
 for a in select value from jsonb_array_elements(bundle->'adjustments') loop
  insert into public.adjustments(id,company_id,period,label,amount,quote,page,filing_id,status)
  values(a->>'id',cid,(a->>'year')::integer,a->>'label',(a->>'amount')::numeric,a->>'quote',(a->>'page')::integer,a->>'filingId',a->>'status')
  on conflict(id) do update set amount=excluded.amount,quote=excluded.quote,status=excluded.status,label=excluded.label;
 end loop;
 insert into public.shareholding(company_id,quarter,promoter_pct,pledged_pct)
 values(cid,'FY'||(bundle->'financials'->-1->>'year'),(bundle->>'promoterPct')::numeric,(bundle->>'pledgedPct')::numeric)
 on conflict(company_id,quarter) do update set promoter_pct=excluded.promoter_pct,pledged_pct=excluded.pledged_pct;
end;
$$;
revoke execute on function public.ingest_company_bundle(jsonb,boolean) from public,anon,authenticated;
grant execute on function public.ingest_company_bundle(jsonb,boolean) to service_role;
commit;
