-- Run on a disposable database after applying all migrations.
begin;
set local role service_role;
do $$
declare
  bundle jsonb;
  first_company jsonb;
  second_company jsonb;
  old_source jsonb := '{"year":2025,"field":"revenue","filingId":"test-ingest-filing-2025","page":12,"url":"/test-ingest/2025","title":"Fixture","kind":"demo"}';
  new_source jsonb := '{"year":2026,"field":"revenue","filingId":"test-ingest-filing-2026","page":30,"url":"/test-ingest/2026","title":"Fixture","kind":"demo"}';
  adjustment jsonb := '{"id":"test-ingest-adjustment","year":2025,"label":"Test adjustment","amount":5,"quote":"Reported relocation expense","page":12,"filingId":"test-ingest-filing-2025","status":"accepted"}';
  blocked boolean := false;
begin
  select jsonb_build_object(
    'name','Test company','sector','Test','description','Test bundle','marketCap',1000,
    'promoterPct',40,'pledgedPct',0,'entryMultiple',8,'growthRate',0.1,
    'dataKind','demo','qualityIssues','[]'::jsonb,'adjustments','[]'::jsonb,
    'financials',jsonb_agg(jsonb_build_object(
      'year',year,'revenue',100,'ebitda',20,'depreciation',3,'interest',2,'taxPaid',4,
      'pat',11,'receivables',12,'inventory',10,'payables',8,'capex',5,
      'cash',6,'debt',18,'equity',40,'shares',1000000
    ) order by year)
  ) into bundle from generate_series(2022,2026) as year;

  first_company := bundle || jsonb_build_object(
    'id','test-ingest-a','ticker','TEST_INGEST_A',
    'sources',jsonb_build_array(old_source,new_source),
    'adjustments',jsonb_build_array(adjustment)
  );
  perform public.ingest_company_bundle(first_company,true);

  second_company := bundle || jsonb_build_object(
    'id','test-ingest-b','ticker','TEST_INGEST_B',
    'sources',jsonb_build_array(old_source || '{"filingId":"test-ingest-filing-b"}'::jsonb),
    'adjustments',jsonb_build_array(adjustment || '{"filingId":"test-ingest-filing-b","amount":99}'::jsonb)
  );
  begin
    perform public.ingest_company_bundle(second_company,true);
  exception when unique_violation then
    blocked := true;
  end;
  if not blocked or exists(select 1 from public.companies where id='test-ingest-b')
    or not exists(select 1 from public.adjustments where id='test-ingest-adjustment' and company_id='test-ingest-a' and amount=5)
  then
    raise exception 'Cross-company adjustment collision changed published research';
  end if;

  first_company := first_company || jsonb_build_object(
    'adjustments',jsonb_build_array(adjustment || '{"year":2026,"page":30,"filingId":"test-ingest-filing-2026","amount":6}'::jsonb)
  );
  perform public.ingest_company_bundle(first_company,true);
  perform public.ingest_company_bundle(first_company,true);
  if not exists(
    select 1 from public.adjustments where id='test-ingest-adjustment'
      and period=2026 and page=30 and filing_id='test-ingest-filing-2026' and amount=6
  ) then
    raise exception 'Re-ingestion retained stale adjustment provenance';
  end if;

  blocked := false;
  begin
    update public.companies set data_kind='verified', quality_issues='["Unresolved"]'
      where id='test-ingest-a';
  exception when check_violation then
    blocked := true;
  end;
  if not blocked then
    raise exception 'Database accepted verified publication with unresolved issues';
  end if;
end $$;
rollback;
