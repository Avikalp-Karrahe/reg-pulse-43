-- Add evidence and model trace columns to issues table (idempotent)
alter table public.issues
  add column if not exists evidence_snippet text,
  add column if not exists evidence_start_ms int,
  add column if not exists evidence_end_ms int,
  add column if not exists model_rationale text,
  add column if not exists model_version text;