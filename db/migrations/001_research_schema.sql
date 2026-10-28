begin;
create table public.companies (
 id text primary key, name text not null, ticker text unique not null, sector text not null,
 description text not null, market_cap numeric not null check (market_cap > 0),
 promoter_pct numeric not null check (promoter_pct between 0 and 100),
 pledged_pct numeric not null check (pledged_pct between 0 and 100),
 entry_multiple numeric not null check (entry_multiple > 0), growth_rate numeric not null,
 data_kind text not null check (data_kind in ('demo','verified')),
 quality_issues jsonb not null default '[]', is_published boolean not null default false,
 updated_at timestamptz not null default now()
);
create table public.filings (
 id text primary key, company_id text not null references public.companies(id) on delete cascade,
 type text not null, period integer not null, url text not null, sha256 text,
 fetched_at timestamptz not null default now(), unique(company_id,period,url)
);
create table public.financials (
 company_id text not null references public.companies(id) on delete cascade, period integer not null,
 data jsonb not null, revenue numeric generated always as ((data->>'revenue')::numeric) stored,
 ebitda numeric generated always as ((data->>'ebitda')::numeric) stored,
 primary key(company_id,period), check ((data->>'year')::integer = period), check ((data->>'revenue')::numeric > 0)
);
create table public.source_refs (
 company_id text not null, period integer not null, field text not null,
 filing_id text not null references public.filings(id) on delete cascade,
 page integer not null check(page > 0), url text not null, title text not null,
 kind text not null check(kind in ('demo','filing')),
 primary key(company_id,period,field),
 foreign key(company_id,period) references public.financials(company_id,period) on delete cascade
);
create table public.adjustments (
 id text primary key, company_id text not null references public.companies(id) on delete cascade,
 period integer not null, label text not null, amount numeric not null,
 quote text not null, page integer not null check(page > 0),
 filing_id text not null references public.filings(id),
 status text not null check(status in ('accepted','review','rejected')),
 check(status <> 'accepted' or length(quote) >= 12)
);
create table public.shareholding (
 company_id text not null references public.companies(id) on delete cascade,
 quarter text not null, promoter_pct numeric not null check(promoter_pct between 0 and 100),
 pledged_pct numeric not null check(pledged_pct between 0 and 100),
 filing_id text references public.filings(id), primary key(company_id,quarter)
);
create table public.review_queue (
 id uuid primary key default gen_random_uuid(),
 adjustment_id text references public.adjustments(id), company_id text references public.companies(id),
 answers jsonb not null, reason text not null, resolved_at timestamptz,
 created_at timestamptz not null default now()
);
create table public.eval_runs (
 id uuid primary key default gen_random_uuid(), model text not null, prompt_version text not null,
 dataset_kind text not null check(dataset_kind in ('fixture','human-labelled')),
 precision numeric check(precision between 0 and 1), recall numeric check(recall between 0 and 1),
 sample_count integer not null check(sample_count >= 0), created_at timestamptz not null default now()
);
create table public.memos (
 id uuid primary key default gen_random_uuid(), company_id text not null references public.companies(id),
 user_id uuid not null references auth.users(id) on delete cascade,
 type text not null check(type in ('thesis','pass','note')), body text not null,
 updated_at timestamptz not null default now(), unique(company_id,user_id,type)
);
create index filings_company on public.filings(company_id);
create index adjustments_company on public.adjustments(company_id);
create index review_queue_company on public.review_queue(company_id);
create index review_queue_adjustment on public.review_queue(adjustment_id);
create index shareholding_filing on public.shareholding(filing_id);
create index source_refs_filing on public.source_refs(filing_id);
create index adjustments_filing on public.adjustments(filing_id);
create index memos_user on public.memos(user_id);
create index companies_sector on public.companies(sector);
commit;
