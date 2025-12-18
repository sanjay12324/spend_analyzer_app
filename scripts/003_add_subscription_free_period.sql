-- Adds free tier date range columns to subscriptions
-- Run this in your Supabase SQL editor

alter table public.subscriptions
  add column if not exists free_start_date date;

alter table public.subscriptions
  add column if not exists free_end_date date;
