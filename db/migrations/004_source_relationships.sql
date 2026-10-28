begin;
alter table public.source_refs add constraint source_refs_company foreign key(company_id) references public.companies(id) on delete cascade;
alter table public.filings add constraint filings_company_id_unique unique(company_id,id);
alter table public.source_refs add constraint source_refs_filing_owner foreign key(company_id,filing_id) references public.filings(company_id,id);
alter table public.adjustments add constraint adjustments_filing_owner foreign key(company_id,filing_id) references public.filings(company_id,id);
alter table public.shareholding add constraint shareholding_filing_owner foreign key(company_id,filing_id) references public.filings(company_id,id);
notify pgrst, 'reload schema';
commit;
