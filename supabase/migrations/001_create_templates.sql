-- Migration: Create templates table with Row Level Security for user isolation
-- Phase 1.2: Database Schema & RLS Policies

-- Create the templates table
create table templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text not null,
  description text not null,
  generated_code text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table templates enable row level security;

-- RLS Policy: users can only SELECT their own templates
create policy "users can view their own templates"
  on templates for select
  using (auth.uid() = user_id);

-- RLS Policy: users can only INSERT their own templates
create policy "users can insert their own templates"
  on templates for insert
  with check (auth.uid() = user_id);

-- RLS Policy: users can only UPDATE their own templates
create policy "users can update their own templates"
  on templates for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- RLS Policy: users can only DELETE their own templates
create policy "users can delete their own templates"
  on templates for delete
  using (auth.uid() = user_id);

-- Add helpful indexes
create index idx_templates_user_id on templates(user_id);
create index idx_templates_created_at on templates(created_at desc);
