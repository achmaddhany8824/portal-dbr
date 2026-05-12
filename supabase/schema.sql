
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Observations Table
create table observations (
  id uuid default uuid_generate_v4() primary key,
  pertemuan text not null,
  waktu text not null,
  aktivitas text not null,
  hlt text not null,
  alt text not null,
  created_at timestamptz default now()
);

-- Validation Sessions Table
create table validation_sessions (
  id uuid default uuid_generate_v4() primary key,
  validator_name text not null,
  institution text not null,
  date date not null,
  scores jsonb not null default '{}'::jsonb,
  comment text,
  conclusion text check (conclusion in ('layak_tanpa_revisi', 'layak_revisi', 'tidak_layak')),
  created_at timestamptz default now()
);

-- Task Analysis Sessions Table
create table task_analysis_sessions (
  id uuid default uuid_generate_v4() primary key,
  total_students integer not null,
  results jsonb not null default '{}'::jsonb,
  qualitative_analysis jsonb not null default '[]'::jsonb,
  created_at timestamptz default now()
);

-- Interview Sessions Table
create table interview_sessions (
  id uuid default uuid_generate_v4() primary key,
  student_code text not null,
  date date not null,
  topic text not null,
  critical_moments text,
  hlt_alignment text check (hlt_alignment in ('sesuai', 'deviasi')),
  deviation_note text,
  notes text,
  created_at timestamptz default now()
);

-- Evaluation Sessions Table
create table evaluation_sessions (
  id uuid default uuid_generate_v4() primary key,
  student_id text not null,
  test_type text check (test_type in ('pre-test', 'post-test')),
  question_id text not null,
  scores jsonb not null default '{}'::jsonb,
  total_score integer not null,
  notes text,
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table observations enable row level security;
alter table validation_sessions enable row level security;
alter table task_analysis_sessions enable row level security;
alter table interview_sessions enable row level security;
alter table evaluation_sessions enable row level security;

-- Create policies (Allow public access for development - restrict in production!)
create policy "Allow public access to observations" on observations for all using (true);
create policy "Allow public access to validation_sessions" on validation_sessions for all using (true);
create policy "Allow public access to task_analysis_sessions" on task_analysis_sessions for all using (true);
create policy "Allow public access to interview_sessions" on interview_sessions for all using (true);
create policy "Allow public access to evaluation_sessions" on evaluation_sessions for all using (true);
