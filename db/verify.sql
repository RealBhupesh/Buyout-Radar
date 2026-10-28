-- Run against the dedicated project after migrations; raises on a failed boundary.
do $$
declare t text;
begin
 foreach t in array array['companies','filings','financials','source_refs','adjustments','shareholding','review_queue','eval_runs','memos'] loop
  if not (select relrowsecurity from pg_class where oid=('public.'||t)::regclass) then raise exception 'RLS disabled on %',t; end if;
  if has_table_privilege('anon','public.'||t,'INSERT') or has_table_privilege('anon','public.'||t,'UPDATE') or has_table_privilege('anon','public.'||t,'DELETE') then raise exception 'Anonymous mutation on %',t; end if;
 end loop;
 if has_table_privilege('anon','public.review_queue','SELECT') then raise exception 'Public review access'; end if;
 if has_function_privilege('anon','public.ingest_company_bundle(jsonb,boolean)','EXECUTE') then raise exception 'Public ingestion access'; end if;
end $$;
select (select count(*) from companies) companies,(select count(*) from financials) financial_years,(select count(*) from source_refs) field_references,(select count(*) from companies where data_kind='verified') verified_companies;
