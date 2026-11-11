-- =====================================================================
-- Money Pay — complete database schema
-- ---------------------------------------------------------------------
-- Safe to run on a NEW Supabase project and safe to RE-RUN on an existing
-- installation (it upgrades earlier versions in place, keeping data).
-- Paste the whole file into Supabase → SQL Editor → Run.
--
-- What it sets up
--   • admin_users            – who can use /admin
--   • site_settings          – lender disclosure, grievance officer, refund policy
--   • payment_settings       – payee name, UPI ID, QR image (fee fixed at ₹299)
--   • applications           – one row per application, incl. refund tracking
--   • application_kyc        – private KYC details (1:1 with applications)
--   • application_events     – audit timeline shown to applicant and admin
--   • loans                  – loan details the admin records after approval
--   • borrower_access/_sessions – borrower login (admin-generated password)
--   • storage buckets + RLS  – public QR, private payment proofs & KYC docs
--   • RPCs                   – the ONLY way to write data (validated server-side)
--
-- Rules enforced here (not just in the UI)
--   • Applications are refused until a lender name + RBI registration number
--     are published, so every applicant sees who the lender is.
--   • Rejecting an application whose ₹299 payment was received creates a
--     refund obligation; it stays in the admin refund queue until a refund
--     UTR is recorded.
--   • Accepting requires payment received + KYC reviewed.
--   • One pending application per user; a UTR can be used only once.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 0. Remove legacy RPCs (earlier versions) so old clients cannot bypass
--    the lender-disclosure and refund rules.
-- ---------------------------------------------------------------------
drop function if exists public.submit_application(text,text,text,integer,text,text,text);
drop function if exists public.review_application(uuid,text,boolean,text);
drop function if exists public.submit_application_kyc(text,text,text,integer,text,text,text,jsonb);
drop function if exists public.review_application_kyc(uuid,text,boolean,boolean,text);

-- ---------------------------------------------------------------------
-- 1. Admins
-- ---------------------------------------------------------------------
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users add column if not exists created_at timestamptz not null default now();
alter table public.admin_users enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.admin_users where user_id = auth.uid()); $$;
revoke all on function public.is_admin() from public, anon, authenticated;
grant execute on function public.is_admin() to authenticated;

revoke all on public.admin_users from anon, authenticated;
grant select on public.admin_users to authenticated;
drop policy if exists "Admin can read own membership" on public.admin_users;
create policy "Admin can read own membership" on public.admin_users
  for select to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- 2. Site settings: lender disclosure + grievance + refund policy
-- ---------------------------------------------------------------------
create table if not exists public.site_settings (
  id                integer primary key default 1 check (id = 1),
  lender_name       text not null default '',
  lender_type       text not null default 'NBFC'
                    check (lender_type in ('NBFC','Bank','Other RBI-regulated entity')),
  lender_reg_no     text not null default '',
  lender_website    text not null default '',
  company_name      text not null default 'Money Pay',
  company_address   text not null default '',
  support_email     text not null default '',
  support_phone     text not null default '',
  grievance_officer text not null default '',
  grievance_email   text not null default '',
  grievance_phone   text not null default '',
  refund_days       integer not null default 7 check (refund_days between 1 and 30),
  updated_at        timestamptz not null default now(),
  updated_by        uuid references auth.users(id) on delete set null
);
insert into public.site_settings(id) values (1) on conflict (id) do nothing;
alter table public.site_settings enable row level security;
revoke all on public.site_settings from anon, authenticated;
grant select on public.site_settings to anon, authenticated;
drop policy if exists "Public site settings" on public.site_settings;
create policy "Public site settings" on public.site_settings for select using (true);

-- ---------------------------------------------------------------------
-- 3. Payment settings (fee fixed at ₹299)
-- ---------------------------------------------------------------------
create table if not exists public.payment_settings (
  id         integer primary key check (id = 1),
  qr_path    text,
  payee_name text not null default '',
  upi_id     text not null default '',
  fee        integer not null default 299 check (fee = 299),
  updated_at timestamptz not null default now()
);
insert into public.payment_settings(id) values (1) on conflict (id) do nothing;
alter table public.payment_settings enable row level security;
revoke all on public.payment_settings from anon, authenticated;
grant select on public.payment_settings to anon, authenticated;
drop policy if exists "Public payment details" on public.payment_settings;
drop policy if exists "Admin edits payment details" on public.payment_settings; -- writes go through RPC now
create policy "Public payment details" on public.payment_settings for select using (true);

-- ---------------------------------------------------------------------
-- 4. Applications
-- ---------------------------------------------------------------------
create table if not exists public.applications (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  full_name        text not null check (length(trim(full_name)) between 2 and 100),
  phone            text not null check (phone ~ '^[6-9][0-9]{9}$'),
  category         text not null check (category in ('Student','Driver','Employed','Self-employed','Unemployed')),
  requested_amount integer not null check (requested_amount between 1000 and 500000),
  transaction_id   text not null unique check (transaction_id ~ '^[A-Za-z0-9]{6,40}$'),
  proof_path       text not null,
  fee              integer not null default 299 check (fee = 299),
  payee_name       text not null,
  upi_id           text not null,
  qr_path          text not null,
  status           text not null default 'pending' check (status in ('pending','accepted','rejected')),
  payment_verified boolean not null default false,
  admin_note       text not null default '',
  reviewed_by      uuid references auth.users(id),
  reviewed_at      timestamptz,
  created_at       timestamptz not null default now()
);
-- Columns added after v1 (no-ops when already present)
alter table public.applications add column if not exists kyc_verified boolean not null default false;
alter table public.applications add column if not exists ref_code text;
alter table public.applications add column if not exists refund_upi_id text
  check (refund_upi_id is null or refund_upi_id ~ '^[A-Za-z0-9._-]{2,128}@[A-Za-z][A-Za-z0-9.-]{1,63}$');
alter table public.applications add column if not exists refund_status text not null default 'not_applicable'
  check (refund_status in ('not_applicable','pending','refunded'));
alter table public.applications add column if not exists refund_reference text;
alter table public.applications add column if not exists refunded_at timestamptz;
alter table public.applications add column if not exists refunded_by uuid references auth.users(id);
alter table public.applications add column if not exists lender_name text;
alter table public.applications add column if not exists lender_reg_no text;
alter table public.applications add column if not exists updated_at timestamptz not null default now();
-- Optional email the applicant gave at sign-up (login is by mobile number)
alter table public.applications add column if not exists contact_email text
  check (contact_email is null or contact_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$');
create index if not exists applications_phone_idx on public.applications(phone) where status = 'accepted';

-- Human-friendly reference, e.g. MP-7F3A9C21 (backfill existing rows)
update public.applications
   set ref_code = 'MP-' || upper(substr(replace(id::text,'-',''),1,8))
 where ref_code is null;
create unique index if not exists applications_ref_code_key on public.applications(ref_code);

create unique index if not exists one_pending_application_per_user
  on public.applications(user_id) where status = 'pending';
create index if not exists applications_status_created_idx on public.applications(status, created_at desc);
create index if not exists applications_user_created_idx   on public.applications(user_id, created_at desc);
create index if not exists applications_refund_idx         on public.applications(refund_status) where refund_status = 'pending';

alter table public.applications enable row level security;
revoke all on public.applications from anon, authenticated;
grant select on public.applications to authenticated;
drop policy if exists "Applicants read own; admins read all" on public.applications;
create policy "Applicants read own; admins read all" on public.applications
  for select to authenticated using (auth.uid() = user_id or public.is_admin());

-- ---------------------------------------------------------------------
-- 5. KYC details (private)
-- ---------------------------------------------------------------------
create table if not exists public.application_kyc (
  application_id     uuid primary key references public.applications(id) on delete cascade,
  dob                date not null,
  address            text not null check (length(trim(address)) between 10 and 500),
  city               text not null check (length(trim(city)) between 2 and 100),
  state              text not null check (length(trim(state)) between 2 and 100),
  pincode            text not null check (pincode ~ '^[1-9][0-9]{5}$'),
  identity_type      text not null check (identity_type in ('Voter ID','Passport','Driving licence')),
  identity_last4     text not null check (identity_last4 ~ '^[A-Za-z0-9]{4}$'),
  institution        text,
  identity_path      text not null,
  identity_back_path text,
  address_path       text not null,
  student_path       text,
  consent_at         timestamptz not null default now()
);
alter table public.application_kyc enable row level security;
revoke all on public.application_kyc from anon, authenticated;
grant select on public.application_kyc to authenticated;
drop policy if exists "Read own KYC or admin" on public.application_kyc;
create policy "Read own KYC or admin" on public.application_kyc for select to authenticated using (
  public.is_admin() or exists(
    select 1 from public.applications a where a.id = application_id and a.user_id = auth.uid())
);

-- ---------------------------------------------------------------------
-- 6. Audit timeline
-- ---------------------------------------------------------------------
create table if not exists public.application_events (
  id             bigint generated always as identity primary key,
  application_id uuid not null references public.applications(id) on delete cascade,
  kind           text not null,
  note           text not null default '',
  actor          uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now()
);
create index if not exists application_events_app_idx on public.application_events(application_id, created_at);
alter table public.application_events enable row level security;
revoke all on public.application_events from anon, authenticated;
grant select on public.application_events to authenticated;
drop policy if exists "Read own events or admin" on public.application_events;
create policy "Read own events or admin" on public.application_events for select to authenticated using (
  public.is_admin() or exists(
    select 1 from public.applications a where a.id = application_id and a.user_id = auth.uid())
);

-- Backfill a 'submitted' event for applications created before the timeline existed
insert into public.application_events(application_id, kind, note, actor, created_at)
select a.id, 'submitted', 'Application submitted', a.user_id, a.created_at
  from public.applications a
 where not exists (select 1 from public.application_events e where e.application_id = a.id);

-- ---------------------------------------------------------------------
-- 7. Storage buckets & policies
-- ---------------------------------------------------------------------
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types) values
  ('payment-qr',     'payment-qr',     true,  2097152, array['image/png','image/jpeg','image/webp']),
  ('payment-proofs', 'payment-proofs', false, 5242880, array['image/png','image/jpeg','image/webp']),
  ('kyc-documents',  'kyc-documents',  false, 5242880, array['image/png','image/jpeg','image/webp','application/pdf'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Read published QR" on storage.objects;
create policy "Read published QR" on storage.objects
  for select using (bucket_id = 'payment-qr');

drop policy if exists "Admin uploads QR" on storage.objects;
create policy "Admin uploads QR" on storage.objects
  for insert to authenticated with check (bucket_id = 'payment-qr' and public.is_admin());

drop policy if exists "Applicants upload own proof" on storage.objects;
create policy "Applicants upload own proof" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'payment-proofs' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Read own proof or admin" on storage.objects;
create policy "Read own proof or admin" on storage.objects
  for select to authenticated using (
    bucket_id = 'payment-proofs'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

drop policy if exists "Applicants upload own KYC" on storage.objects;
create policy "Applicants upload own KYC" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Read own KYC documents or admin" on storage.objects;
create policy "Read own KYC documents or admin" on storage.objects
  for select to authenticated using (
    bucket_id = 'kyc-documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- ---------------------------------------------------------------------
-- 8. RPC: applicant submits an application (atomic: application + KYC + event)
-- ---------------------------------------------------------------------
create or replace function public.submit_loan_application(
  p_full_name        text,
  p_phone            text,
  p_category         text,
  p_requested_amount integer,
  p_transaction_id   text,
  p_proof_path       text,
  p_expected_qr      text,
  p_refund_upi_id    text,
  p_kyc              jsonb
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_uid       uuid := auth.uid();
  v_site      public.site_settings;
  v_payment   public.payment_settings;
  v_id        uuid;
  v_ref       text;
  v_dob       date;
  v_txn       text := upper(trim(coalesce(p_transaction_id,'')));
  v_refund    text := lower(trim(coalesce(p_refund_upi_id,'')));
  v_doc       text;
begin
  if v_uid is null then raise exception 'Please sign in to submit an application.'; end if;

  -- Lender disclosure must be published before anyone can apply.
  select * into v_site from public.site_settings where id = 1;
  if coalesce(trim(v_site.lender_name),'') = '' or coalesce(trim(v_site.lender_reg_no),'') = '' then
    raise exception 'Applications are closed until lender details are published.';
  end if;

  if exists(select 1 from public.applications where user_id = v_uid and status = 'pending') then
    raise exception 'You already have an application under review.';
  end if;
  if v_txn !~ '^[A-Z0-9]{6,40}$' then
    raise exception 'Enter a valid UPI transaction reference (UTR).';
  end if;
  if exists(select 1 from public.applications where transaction_id = v_txn) then
    raise exception 'This UTR has already been used for another application.';
  end if;
  if v_refund !~ '^[a-z0-9._-]{2,128}@[a-z][a-z0-9.-]{1,63}$' then
    raise exception 'Enter a valid UPI ID for refunds (e.g. name@okbank).';
  end if;

  -- KYC
  if p_kyc is null or coalesce(p_kyc->>'consent','') <> 'true' then
    raise exception 'KYC consent is required.';
  end if;
  begin
    v_dob := (p_kyc->>'dob')::date;
  exception when others then
    raise exception 'Enter a valid date of birth.';
  end;
  if v_dob is null or v_dob > (current_date - interval '18 years')::date
     or v_dob < (current_date - interval '120 years')::date then
    raise exception 'Applicant must be between 18 and 120 years old.';
  end if;
  if p_category = 'Driver' and (p_kyc->>'identity_type') is distinct from 'Driving licence' then
    raise exception 'Drivers must upload a driving licence.';
  end if;
  if p_category = 'Student' and (
       length(trim(coalesce(p_kyc->>'institution',''))) not between 2 and 150
       or nullif(p_kyc->>'student_path','') is null) then
    raise exception 'Students must provide their institution and student ID.';
  end if;

  foreach v_doc in array array[p_kyc->>'identity_path', p_kyc->>'address_path'] loop
    if v_doc is null or not exists(
         select 1 from storage.objects
          where bucket_id = 'kyc-documents' and name = v_doc
            and (storage.foldername(name))[1] = v_uid::text) then
      raise exception 'Upload your identity document and address proof.';
    end if;
  end loop;
  foreach v_doc in array array[p_kyc->>'identity_back_path',
                               case when p_category = 'Student' then p_kyc->>'student_path' end] loop
    if nullif(v_doc,'') is not null and not exists(
         select 1 from storage.objects
          where bucket_id = 'kyc-documents' and name = v_doc
            and (storage.foldername(name))[1] = v_uid::text) then
      raise exception 'A supporting document could not be found. Please upload it again.';
    end if;
  end loop;

  -- Payment
  select * into v_payment from public.payment_settings where id = 1 for share;
  if v_payment.qr_path is null or v_payment.payee_name = '' or v_payment.upi_id = '' then
    raise exception 'Payments are not configured yet.';
  end if;
  if v_payment.qr_path is distinct from p_expected_qr then
    raise exception 'Payment details changed while you were applying. Reload the page and check the payee before submitting.';
  end if;
  if not exists(
       select 1 from storage.objects
        where bucket_id = 'payment-proofs' and name = p_proof_path
          and (storage.foldername(name))[1] = v_uid::text) then
    raise exception 'Upload your payment screenshot.';
  end if;
  if exists(select 1 from public.applications where proof_path = p_proof_path) then
    raise exception 'This payment screenshot was already submitted.';
  end if;

  v_id  := gen_random_uuid();
  v_ref := 'MP-' || upper(substr(replace(v_id::text,'-',''),1,8));

  insert into public.applications(
    id, ref_code, user_id, full_name, phone, category, requested_amount, transaction_id,
    proof_path, fee, payee_name, upi_id, qr_path, refund_upi_id, lender_name, lender_reg_no, contact_email)
  values (
    v_id, v_ref, v_uid, trim(p_full_name), trim(p_phone), p_category, p_requested_amount, v_txn,
    p_proof_path, 299, v_payment.payee_name, v_payment.upi_id, v_payment.qr_path, v_refund,
    v_site.lender_name, v_site.lender_reg_no,
    -- optional email saved in the account's metadata at sign-up
    (select case when e ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then lower(e) end
       from (select nullif(trim(coalesce(auth.jwt() -> 'user_metadata' ->> 'contact_email', '')), '') as e) x));

  insert into public.application_kyc(
    application_id, dob, address, city, state, pincode, identity_type, identity_last4,
    institution, identity_path, identity_back_path, address_path, student_path)
  values (
    v_id, v_dob, trim(p_kyc->>'address'), trim(p_kyc->>'city'), trim(p_kyc->>'state'),
    trim(p_kyc->>'pincode'), p_kyc->>'identity_type', upper(trim(p_kyc->>'identity_last4')),
    case when p_category = 'Student' then trim(p_kyc->>'institution') end,
    p_kyc->>'identity_path', nullif(p_kyc->>'identity_back_path',''), p_kyc->>'address_path',
    case when p_category = 'Student' then p_kyc->>'student_path' end);

  insert into public.application_events(application_id, kind, note, actor)
  values (v_id, 'submitted', 'Application submitted with ₹299 fee (UTR ' || v_txn || ')', v_uid);

  return jsonb_build_object('id', v_id, 'ref_code', v_ref);
end; $$;
revoke all on function public.submit_loan_application(text,text,text,integer,text,text,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.submit_loan_application(text,text,text,integer,text,text,text,text,jsonb) to authenticated;

-- ---------------------------------------------------------------------
-- 9. RPC: admin decision (creates refund obligation on rejection)
-- ---------------------------------------------------------------------
create or replace function public.admin_review_application(
  p_id               uuid,
  p_decision         text,
  p_payment_received boolean,
  p_kyc_verified     boolean,
  p_note             text
) returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_app     public.applications;
  v_note    text    := trim(coalesce(p_note,''));
  v_paid    boolean := coalesce(p_payment_received,false);
  v_kyc     boolean := coalesce(p_kyc_verified,false);
  v_refund  text;
begin
  if not public.is_admin() then raise exception 'Admin access required.'; end if;
  if p_decision is null or p_decision not in ('accepted','rejected') then raise exception 'Invalid decision.'; end if;
  if length(v_note) > 1000 then raise exception 'Note is too long (max 1000 characters).'; end if;

  select * into v_app from public.applications where id = p_id for update;
  if not found then raise exception 'Application not found.'; end if;
  if v_app.status <> 'pending' then raise exception 'This application has already been reviewed.'; end if;

  if p_decision = 'accepted' then
    if not v_paid or not v_kyc then
      raise exception 'Confirm the payment was received and KYC was reviewed before accepting.';
    end if;
    if not exists(select 1 from public.application_kyc where application_id = p_id) then
      raise exception 'This application has no KYC documents and cannot be accepted.';
    end if;
  else
    if length(v_note) < 3 then raise exception 'Give the applicant a reason for rejection.'; end if;
  end if;

  v_refund := case when p_decision = 'rejected' and v_paid then 'pending' else 'not_applicable' end;

  update public.applications
     set status = p_decision, payment_verified = v_paid, kyc_verified = v_kyc,
         admin_note = v_note, reviewed_by = auth.uid(), reviewed_at = now(),
         refund_status = v_refund, updated_at = now()
   where id = p_id;

  insert into public.application_events(application_id, kind, note, actor)
  values (p_id, p_decision, v_note, auth.uid());

  if v_refund = 'pending' then
    insert into public.application_events(application_id, kind, note, actor)
    values (p_id, 'refund_due',
            'Refund of ₹' || v_app.fee || ' due to ' || coalesce(v_app.refund_upi_id, 'the paying UPI account'),
            auth.uid());
  elsif p_decision = 'rejected' then
    insert into public.application_events(application_id, kind, note, actor)
    values (p_id, 'no_refund',
            'No refund issued: the ₹299 payment could not be found in the receiving account. Contact the grievance officer with your UTR if you were charged.',
            auth.uid());
  end if;
end; $$;
revoke all on function public.admin_review_application(uuid,text,boolean,boolean,text) from public, anon, authenticated;
grant execute on function public.admin_review_application(uuid,text,boolean,boolean,text) to authenticated;

-- ---------------------------------------------------------------------
-- 10. RPC: admin records a completed refund
-- ---------------------------------------------------------------------
create or replace function public.admin_mark_refunded(p_id uuid, p_reference text) returns void
language plpgsql security definer set search_path = public
as $$
declare v_ref text := upper(trim(coalesce(p_reference,'')));
begin
  if not public.is_admin() then raise exception 'Admin access required.'; end if;
  if v_ref !~ '^[A-Z0-9]{6,40}$' then raise exception 'Enter the refund UTR (6–40 letters/numbers).'; end if;

  update public.applications
     set refund_status = 'refunded', refund_reference = v_ref,
         refunded_at = now(), refunded_by = auth.uid(), updated_at = now()
   where id = p_id and refund_status = 'pending';
  if not found then raise exception 'No pending refund for this application.'; end if;

  insert into public.application_events(application_id, kind, note, actor)
  values (p_id, 'refunded', 'Refund sent (UTR ' || v_ref || ')', auth.uid());
end; $$;
revoke all on function public.admin_mark_refunded(uuid,text) from public, anon, authenticated;
grant execute on function public.admin_mark_refunded(uuid,text) to authenticated;

-- ---------------------------------------------------------------------
-- 11. RPC: admin updates payment settings
-- ---------------------------------------------------------------------
create or replace function public.admin_update_payment_settings(
  p_payee_name text, p_upi_id text, p_qr_path text
) returns void
language plpgsql security definer set search_path = public
as $$
declare v_payee text := trim(coalesce(p_payee_name,'')); v_upi text := lower(trim(coalesce(p_upi_id,'')));
begin
  if not public.is_admin() then raise exception 'Admin access required.'; end if;
  if length(v_payee) not between 2 and 100 then raise exception 'Payee name must be 2–100 characters.'; end if;
  if v_upi !~ '^[a-z0-9._-]{2,128}@[a-z][a-z0-9.-]{1,63}$' then raise exception 'Enter a valid UPI ID.'; end if;
  if p_qr_path is null or not exists(select 1 from storage.objects where bucket_id = 'payment-qr' and name = p_qr_path) then
    raise exception 'Upload the payment QR image.';
  end if;
  update public.payment_settings
     set payee_name = v_payee, upi_id = v_upi, qr_path = p_qr_path, updated_at = now()
   where id = 1;
end; $$;
revoke all on function public.admin_update_payment_settings(text,text,text) from public, anon, authenticated;
grant execute on function public.admin_update_payment_settings(text,text,text) to authenticated;

-- ---------------------------------------------------------------------
-- 12. RPC: admin updates lender disclosure / grievance / refund policy
-- ---------------------------------------------------------------------
create or replace function public.admin_update_site_settings(p jsonb) returns void
language plpgsql security definer set search_path = public
as $$
declare
  email_re constant text := '^[^@\s]+@[^@\s]+\.[^@\s]+$';
  phone_re constant text := '^[0-9+() -]{8,20}$';
  v_name  text := trim(coalesce(p->>'lender_name',''));
  v_type  text := coalesce(p->>'lender_type','NBFC');
  v_reg   text := upper(trim(coalesce(p->>'lender_reg_no','')));
  v_web   text := trim(coalesce(p->>'lender_website',''));
  v_days  integer;
begin
  if not public.is_admin() then raise exception 'Admin access required.'; end if;
  if length(v_name) not between 2 and 150 then raise exception 'Lender name must be 2–150 characters.'; end if;
  if v_type not in ('NBFC','Bank','Other RBI-regulated entity') then raise exception 'Choose a lender type.'; end if;
  if v_reg !~ '^[A-Z0-9./ -]{5,40}$' then raise exception 'Enter the lender''s RBI registration number.'; end if;
  if v_web <> '' and v_web !~ '^https?://' then raise exception 'Lender website must start with https://'; end if;
  if length(trim(coalesce(p->>'grievance_officer',''))) not between 2 and 100 then
    raise exception 'Grievance officer name is required.';
  end if;
  if trim(coalesce(p->>'grievance_email','')) !~ email_re then raise exception 'Enter a valid grievance email.'; end if;
  if trim(coalesce(p->>'grievance_phone','')) <> '' and trim(p->>'grievance_phone') !~ phone_re then
    raise exception 'Enter a valid grievance phone number.';
  end if;
  if trim(coalesce(p->>'support_email','')) <> '' and trim(p->>'support_email') !~ email_re then
    raise exception 'Enter a valid support email.';
  end if;
  if trim(coalesce(p->>'support_phone','')) <> '' and trim(p->>'support_phone') !~ phone_re then
    raise exception 'Enter a valid support phone number.';
  end if;
  begin
    v_days := coalesce((p->>'refund_days')::integer, 7);
  exception when others then
    raise exception 'Refund window must be a number of days.';
  end;
  if v_days not between 1 and 30 then raise exception 'Refund window must be 1–30 days.'; end if;

  update public.site_settings set
    lender_name       = v_name,
    lender_type       = v_type,
    lender_reg_no     = v_reg,
    lender_website    = v_web,
    company_name      = coalesce(nullif(trim(p->>'company_name'),''), 'Money Pay'),
    company_address   = left(trim(coalesce(p->>'company_address','')), 300),
    support_email     = trim(coalesce(p->>'support_email','')),
    support_phone     = trim(coalesce(p->>'support_phone','')),
    grievance_officer = trim(p->>'grievance_officer'),
    grievance_email   = trim(p->>'grievance_email'),
    grievance_phone   = trim(coalesce(p->>'grievance_phone','')),
    refund_days       = v_days,
    updated_at        = now(),
    updated_by        = auth.uid()
  where id = 1;
end; $$;
revoke all on function public.admin_update_site_settings(jsonb) from public, anon, authenticated;
grant execute on function public.admin_update_site_settings(jsonb) to authenticated;

-- ---------------------------------------------------------------------
-- 13. RPC: admin dashboard numbers (all times in IST)
-- ---------------------------------------------------------------------
create or replace function public.admin_dashboard_stats() returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_result jsonb;
  v_today  date := (now() at time zone 'Asia/Kolkata')::date;
begin
  if not public.is_admin() then raise exception 'Admin access required.'; end if;

  select jsonb_build_object(
    'total',                  count(*),
    'pending',                count(*) filter (where status = 'pending'),
    'accepted',               count(*) filter (where status = 'accepted'),
    'rejected',               count(*) filter (where status = 'rejected'),
    'overdue',                count(*) filter (where status = 'pending' and created_at < now() - interval '48 hours'),
    'refunds_pending',        count(*) filter (where refund_status = 'pending'),
    'refunds_pending_amount', coalesce(sum(fee) filter (where refund_status = 'pending'), 0),
    'refunded_amount',        coalesce(sum(fee) filter (where refund_status = 'refunded'), 0),
    'fees_retained',          coalesce(sum(fee) filter (where status = 'accepted'), 0),
    'accepted_volume',        coalesce(sum(requested_amount) filter (where status = 'accepted'), 0),
    'avg_review_hours',       round((extract(epoch from avg(reviewed_at - created_at)) / 3600)::numeric, 1)
  ) into v_result
  from public.applications;

  v_result := v_result || jsonb_build_object('daily', (
    select coalesce(jsonb_agg(jsonb_build_object('day', d.day, 'count', coalesce(c.n, 0)) order by d.day), '[]'::jsonb)
      from (select (v_today - g)::date as day from generate_series(0, 13) g) d
      left join (
        select (created_at at time zone 'Asia/Kolkata')::date as day, count(*) as n
          from public.applications
         where created_at >= (v_today - 13)::timestamp at time zone 'Asia/Kolkata'
         group by 1
      ) c on c.day = d.day
  ));
  return v_result;
end; $$;
revoke all on function public.admin_dashboard_stats() from public, anon, authenticated;
grant execute on function public.admin_dashboard_stats() to authenticated;

-- ---------------------------------------------------------------------
-- 14. Upgrade existing data (no-ops on a fresh project)
-- ---------------------------------------------------------------------
-- Older installs used a different default company name
alter table public.site_settings alter column company_name set default 'Money Pay';
update public.site_settings set company_name = 'Money Pay' where company_name = 'Rakvih';

-- Applications rejected under the old non-refundable policy, where payment was
-- confirmed, are moved into the refund queue so they are refunded too.
with moved as (
  update public.applications
     set refund_status = 'pending', updated_at = now()
   where status = 'rejected' and payment_verified and refund_status = 'not_applicable'
     and refunded_at is null
     and not exists (select 1 from public.application_events e
                      where e.application_id = applications.id and e.kind in ('refund_due','refunded'))
  returning id, fee
)
insert into public.application_events(application_id, kind, note)
select id, 'refund_due', 'Refund of ₹' || fee || ' due under the updated refund policy' from moved;

-- ---------------------------------------------------------------------
-- 15. Borrower portal — approved applications only
--     Admin enters the loan details and generates a one-time-shown password.
--     The borrower logs in with Loan ID (the application reference, e.g.
--     MP-7F3A9C21) + that password and sees their loan dashboard.
--     Passwords are bcrypt-hashed; sessions are random tokens stored as
--     SHA-256 hashes and expire after 12 hours; 5 failed attempts lock the
--     login for 15 minutes.
-- ---------------------------------------------------------------------
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- Event kinds (re-declared so upgrades pick up the new ones)
alter table public.application_events drop constraint if exists application_events_kind_check;
alter table public.application_events add constraint application_events_kind_check
  check (kind in ('submitted','accepted','rejected','refund_due','no_refund','refunded','loan_updated','access_issued','payment_recorded','document_added'));

create table if not exists public.loans (
  application_id    uuid primary key references public.applications(id) on delete cascade,
  loan_account_no   text not null default '' check (length(loan_account_no) <= 40),
  sanctioned_amount integer check (sanctioned_amount is null or sanctioned_amount between 1000 and 10000000),
  interest_rate     numeric(5,2) check (interest_rate is null or interest_rate between 0 and 60),
  tenure_months     integer check (tenure_months is null or tenure_months between 1 and 120),
  emi_amount        integer check (emi_amount is null or emi_amount >= 0),
  first_emi_date    date,
  disbursed_on      date,
  status            text not null default 'sanctioned' check (status in ('sanctioned','disbursed','active','closed')),
  note              text not null default '' check (length(note) <= 1000),
  updated_at        timestamptz not null default now(),
  updated_by        uuid references auth.users(id) on delete set null
);
-- Disbursement, charges and how-to-pay (added after v1 of the loan table)
alter table public.loans add column if not exists disbursed_amount integer check (disbursed_amount is null or disbursed_amount >= 0);
alter table public.loans add column if not exists disbursed_to text not null default '' check (length(disbursed_to) <= 60);
alter table public.loans add column if not exists processing_fee integer check (processing_fee is null or processing_fee >= 0);
alter table public.loans add column if not exists apr numeric(5,2) check (apr is null or apr between 0 and 100);
alter table public.loans add column if not exists late_fee text not null default '' check (length(late_fee) <= 300);
alter table public.loans add column if not exists prepayment_terms text not null default '' check (length(prepayment_terms) <= 500);
alter table public.loans add column if not exists repayment_method text not null default '' check (repayment_method in ('','auto_debit','lender_link','bank_transfer','other'));
alter table public.loans add column if not exists repayment_details text not null default '' check (length(repayment_details) <= 1000);
alter table public.loans add column if not exists repayment_link text not null default '' check (repayment_link = '' or repayment_link ~ '^https://');
alter table public.loans enable row level security;
revoke all on public.loans from anon, authenticated;
grant select on public.loans to authenticated;
drop policy if exists "Read own loan or admin" on public.loans;
create policy "Read own loan or admin" on public.loans for select to authenticated using (
  public.is_admin() or exists(select 1 from public.applications a where a.id = application_id and a.user_id = auth.uid())
);

create table if not exists public.borrower_access (
  application_id  uuid primary key references public.applications(id) on delete cascade,
  password_hash   text not null,
  issued_at       timestamptz not null default now(),
  issued_by       uuid references auth.users(id) on delete set null,
  failed_attempts integer not null default 0,
  locked_until    timestamptz,
  last_login_at   timestamptz
);
alter table public.borrower_access enable row level security;
revoke all on public.borrower_access from anon, authenticated;
grant select (application_id, issued_at, last_login_at, locked_until) on public.borrower_access to authenticated;
drop policy if exists "Admins read borrower access" on public.borrower_access;
create policy "Admins read borrower access" on public.borrower_access for select to authenticated using (public.is_admin());

create table if not exists public.borrower_sessions (
  token_hash     text primary key,
  application_id uuid not null references public.applications(id) on delete cascade,
  created_at     timestamptz not null default now(),
  expires_at     timestamptz not null
);
create index if not exists borrower_sessions_app_idx on public.borrower_sessions(application_id);
alter table public.borrower_sessions enable row level security;
revoke all on public.borrower_sessions from anon, authenticated;

-- Admin: save loan details for an approved application
create or replace function public.admin_save_loan(p_id uuid, p jsonb) returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_amount integer; v_rate numeric; v_tenure integer; v_emi integer; v_first date; v_disb date;
  v_disb_amt integer; v_fee integer; v_apr numeric;
  v_status text := coalesce(nullif(p->>'status',''), 'sanctioned');
  v_method text := coalesce(p->>'repayment_method','');
  v_link   text := trim(coalesce(p->>'repayment_link',''));
  v_r numeric;
begin
  if not public.is_admin() then raise exception 'Admin access required.'; end if;
  if not exists(select 1 from public.applications where id = p_id and status = 'accepted') then
    raise exception 'Loan details can only be added to approved applications.';
  end if;
  begin
    v_amount   := nullif(p->>'sanctioned_amount','')::integer;
    v_rate     := nullif(p->>'interest_rate','')::numeric;
    v_tenure   := nullif(p->>'tenure_months','')::integer;
    v_first    := nullif(p->>'first_emi_date','')::date;
    v_disb     := nullif(p->>'disbursed_on','')::date;
    v_disb_amt := nullif(p->>'disbursed_amount','')::integer;
    v_fee      := nullif(p->>'processing_fee','')::integer;
    v_apr      := nullif(p->>'apr','')::numeric;
  exception when others then
    raise exception 'Check the amounts, rates and dates.';
  end;
  if v_amount is not null and v_amount not between 1000 and 10000000 then raise exception 'Sanctioned amount must be between ₹1,000 and ₹1,00,00,000.'; end if;
  if v_rate is not null and v_rate not between 0 and 60 then raise exception 'Interest rate must be between 0 and 60%% a year.'; end if;
  if v_tenure is not null and v_tenure not between 1 and 120 then raise exception 'Tenure must be 1–120 months.'; end if;
  if v_apr is not null and v_apr not between 0 and 100 then raise exception 'APR must be between 0 and 100%%.'; end if;
  if v_disb_amt is not null and v_amount is not null and v_disb_amt > v_amount then raise exception 'Amount credited can''t be more than the sanctioned amount.'; end if;
  if v_fee is not null and v_fee < 0 then raise exception 'Processing fee can''t be negative.'; end if;
  if v_status not in ('sanctioned','disbursed','active','closed') then raise exception 'Choose a loan status.'; end if;
  if v_method not in ('','auto_debit','lender_link','bank_transfer','other') then raise exception 'Choose how the borrower pays.'; end if;
  if v_link <> '' and v_link !~ '^https://' then raise exception 'The payment link must start with https://'; end if;
  if length(coalesce(p->>'loan_account_no','')) > 40 then raise exception 'Loan account number is too long.'; end if;
  if length(coalesce(p->>'disbursed_to','')) > 60 then raise exception '"Credited to" is too long.'; end if;
  if length(coalesce(p->>'note','')) > 1000 or length(coalesce(p->>'repayment_details','')) > 1000 then raise exception 'Text is too long (max 1000 characters).'; end if;
  if length(coalesce(p->>'late_fee','')) > 300 or length(coalesce(p->>'prepayment_terms','')) > 500 then raise exception 'Charges text is too long.'; end if;

  -- EMI is always calculated here so admin and borrower see the same figure
  if v_amount is not null and v_rate is not null and v_tenure is not null then
    v_r := v_rate / 1200;
    if v_r = 0 then
      v_emi := round(v_amount::numeric / v_tenure);
    else
      v_emi := round(v_amount * v_r * power(1 + v_r, v_tenure) / (power(1 + v_r, v_tenure) - 1));
    end if;
  end if;

  insert into public.loans(application_id, loan_account_no, sanctioned_amount, interest_rate, tenure_months, emi_amount,
                           first_emi_date, disbursed_on, status, note,
                           disbursed_amount, disbursed_to, processing_fee, apr, late_fee, prepayment_terms,
                           repayment_method, repayment_details, repayment_link, updated_at, updated_by)
  values (p_id, trim(coalesce(p->>'loan_account_no','')), v_amount, v_rate, v_tenure, v_emi,
          v_first, v_disb, v_status, trim(coalesce(p->>'note','')),
          v_disb_amt, trim(coalesce(p->>'disbursed_to','')), v_fee, v_apr, trim(coalesce(p->>'late_fee','')), trim(coalesce(p->>'prepayment_terms','')),
          v_method, trim(coalesce(p->>'repayment_details','')), v_link, now(), auth.uid())
  on conflict (application_id) do update set
    loan_account_no = excluded.loan_account_no, sanctioned_amount = excluded.sanctioned_amount,
    interest_rate = excluded.interest_rate, tenure_months = excluded.tenure_months, emi_amount = excluded.emi_amount,
    first_emi_date = excluded.first_emi_date, disbursed_on = excluded.disbursed_on, status = excluded.status,
    note = excluded.note, disbursed_amount = excluded.disbursed_amount, disbursed_to = excluded.disbursed_to,
    processing_fee = excluded.processing_fee, apr = excluded.apr, late_fee = excluded.late_fee,
    prepayment_terms = excluded.prepayment_terms, repayment_method = excluded.repayment_method,
    repayment_details = excluded.repayment_details, repayment_link = excluded.repayment_link,
    updated_at = now(), updated_by = auth.uid();

  insert into public.application_events(application_id, kind, note, actor)
  values (p_id, 'loan_updated', 'Loan details updated (' || v_status || ')', auth.uid());
end; $$;
revoke all on function public.admin_save_loan(uuid,jsonb) from public, anon, authenticated;
grant execute on function public.admin_save_loan(uuid,jsonb) to authenticated;

-- Admin: generate (or regenerate) the borrower's password. Returned once; only the hash is stored.
create or replace function public.admin_issue_borrower_password(p_id uuid) returns text
language plpgsql security definer set search_path = public
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  v_bytes bytea := extensions.gen_random_bytes(12);
  v_pw text := '';
  i int;
begin
  if not public.is_admin() then raise exception 'Admin access required.'; end if;
  if not exists(select 1 from public.applications where id = p_id and status = 'accepted') then
    raise exception 'Only approved applications can get a borrower login.';
  end if;
  for i in 0..11 loop
    v_pw := v_pw || substr(alphabet, (get_byte(v_bytes, i) % length(alphabet)) + 1, 1);
    if i in (3, 7) then v_pw := v_pw || '-'; end if;
  end loop;

  insert into public.borrower_access(application_id, password_hash, issued_at, issued_by, failed_attempts, locked_until)
  values (p_id, extensions.crypt(v_pw, extensions.gen_salt('bf', 10)), now(), auth.uid(), 0, null)
  on conflict (application_id) do update set
    password_hash = excluded.password_hash, issued_at = now(), issued_by = auth.uid(), failed_attempts = 0, locked_until = null;

  delete from public.borrower_sessions where application_id = p_id;  -- old password's sessions end now

  insert into public.application_events(application_id, kind, note, actor)
  values (p_id, 'access_issued', 'Borrower login password issued', auth.uid());
  return v_pw;
end; $$;
revoke all on function public.admin_issue_borrower_password(uuid) from public, anon, authenticated;
grant execute on function public.admin_issue_borrower_password(uuid) to authenticated;

-- Borrower: log in with mobile number + the admin-generated password.
-- Returns {token, expires_at} or {error}. Errors are returned (not raised) so the
-- failed-attempt counter is saved. If one number has several approved loans,
-- the password decides which loan is opened.
drop function if exists public.borrower_login(text,text);
create or replace function public.borrower_login(p_phone text, p_password text) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_phone text := right(regexp_replace(coalesce(p_phone,''), '\D', '', 'g'), 10);
  v_app uuid; v_token text; v_exp timestamptz; r record;
  generic constant text := 'Incorrect mobile number or password.';
begin
  if v_phone !~ '^[6-9][0-9]{9}$' then return jsonb_build_object('error', 'Enter your 10-digit mobile number.'); end if;

  if exists(select 1 from public.borrower_access b join public.applications a on a.id = b.application_id
             where a.phone = v_phone and a.status = 'accepted' and b.locked_until > now()) then
    return jsonb_build_object('error', 'Too many attempts. Try again in 15 minutes.');
  end if;

  for r in select b.application_id, b.password_hash from public.borrower_access b
             join public.applications a on a.id = b.application_id
            where a.phone = v_phone and a.status = 'accepted'
            order by b.issued_at desc for update of b loop
    if extensions.crypt(coalesce(p_password,''), r.password_hash) = r.password_hash then
      v_app := r.application_id;
      exit;
    end if;
  end loop;

  if v_app is null then
    update public.borrower_access b
       set failed_attempts = case when b.failed_attempts + 1 >= 5 then 0 else b.failed_attempts + 1 end,
           locked_until   = case when b.failed_attempts + 1 >= 5 then now() + interval '15 minutes' else null end
      from public.applications a
     where a.id = b.application_id and a.phone = v_phone and a.status = 'accepted';
    return jsonb_build_object('error', generic);
  end if;

  update public.borrower_access set failed_attempts = 0, locked_until = null, last_login_at = now() where application_id = v_app;
  delete from public.borrower_sessions where expires_at < now();
  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  v_exp := now() + interval '12 hours';
  insert into public.borrower_sessions(token_hash, application_id, expires_at)
  values (encode(extensions.digest(v_token, 'sha256'), 'hex'), v_app, v_exp);
  return jsonb_build_object('token', v_token, 'expires_at', v_exp);
end; $$;
revoke all on function public.borrower_login(text,text) from public, anon, authenticated;
grant execute on function public.borrower_login(text,text) to anon, authenticated;

-- EMI payments recorded by the admin (one row per paid instalment)
create table if not exists public.loan_payments (
  application_id uuid not null references public.applications(id) on delete cascade,
  instalment_no  integer not null check (instalment_no between 1 and 120),
  paid_on        date not null,
  amount         integer not null check (amount > 0),
  reference      text not null default '' check (length(reference) <= 60),
  recorded_by    uuid references auth.users(id) on delete set null,
  recorded_at    timestamptz not null default now(),
  primary key (application_id, instalment_no)
);
alter table public.loan_payments enable row level security;
revoke all on public.loan_payments from anon, authenticated;
grant select on public.loan_payments to authenticated;
drop policy if exists "Read own payments or admin" on public.loan_payments;
create policy "Read own payments or admin" on public.loan_payments for select to authenticated using (
  public.is_admin() or exists(select 1 from public.applications a where a.id = application_id and a.user_id = auth.uid())
);

-- Loan documents (KFS, sanction letter, agreement, NOC) in a private bucket
create table if not exists public.loan_documents (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  kind           text not null check (kind in ('kfs','sanction_letter','agreement','noc','other')),
  title          text not null check (length(trim(title)) between 2 and 120),
  path           text not null unique,
  uploaded_at    timestamptz not null default now(),
  uploaded_by    uuid references auth.users(id) on delete set null
);
create index if not exists loan_documents_app_idx on public.loan_documents(application_id);
alter table public.loan_documents enable row level security;
revoke all on public.loan_documents from anon, authenticated;
grant select on public.loan_documents to authenticated;
drop policy if exists "Read own loan documents or admin" on public.loan_documents;
create policy "Read own loan documents or admin" on public.loan_documents for select to authenticated using (
  public.is_admin() or exists(select 1 from public.applications a where a.id = application_id and a.user_id = auth.uid())
);

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('loan-documents', 'loan-documents', false, 10485760, array['application/pdf','image/png','image/jpeg','image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "Admin uploads loan documents" on storage.objects;
create policy "Admin uploads loan documents" on storage.objects
  for insert to authenticated with check (bucket_id = 'loan-documents' and public.is_admin());
drop policy if exists "Admin deletes loan documents" on storage.objects;
create policy "Admin deletes loan documents" on storage.objects
  for delete to authenticated using (bucket_id = 'loan-documents' and public.is_admin());
drop policy if exists "Read own loan documents files or admin" on storage.objects;
create policy "Read own loan documents files or admin" on storage.objects
  for select to authenticated using (
    bucket_id = 'loan-documents' and (public.is_admin() or exists(
      select 1 from public.applications a where a.id::text = (storage.foldername(name))[1] and a.user_id = auth.uid())));

-- Admin: mark an EMI as paid (or update it)
create or replace function public.admin_record_payment(p_id uuid, p_instalment integer, p_paid_on date, p_amount integer, p_reference text)
returns void language plpgsql security definer set search_path = public
as $$
declare v_tenure integer;
begin
  if not public.is_admin() then raise exception 'Admin access required.'; end if;
  select tenure_months into v_tenure from public.loans where application_id = p_id;
  if v_tenure is null then raise exception 'Save the loan amount, rate and tenure first.'; end if;
  if p_instalment is null or p_instalment not between 1 and v_tenure then raise exception 'Instalment must be between 1 and %.', v_tenure; end if;
  if p_paid_on is null or p_paid_on > current_date + 1 then raise exception 'Enter the date the EMI was paid.'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Enter the amount paid.'; end if;
  if length(coalesce(p_reference,'')) > 60 then raise exception 'Reference is too long.'; end if;
  insert into public.loan_payments(application_id, instalment_no, paid_on, amount, reference, recorded_by, recorded_at)
  values (p_id, p_instalment, p_paid_on, p_amount, trim(coalesce(p_reference,'')), auth.uid(), now())
  on conflict (application_id, instalment_no) do update set
    paid_on = excluded.paid_on, amount = excluded.amount, reference = excluded.reference, recorded_by = auth.uid(), recorded_at = now();
  insert into public.application_events(application_id, kind, note, actor)
  values (p_id, 'payment_recorded', 'EMI ' || p_instalment || ' marked paid (₹' || p_amount || ')', auth.uid());
end; $$;
revoke all on function public.admin_record_payment(uuid,integer,date,integer,text) from public, anon, authenticated;
grant execute on function public.admin_record_payment(uuid,integer,date,integer,text) to authenticated;

create or replace function public.admin_remove_payment(p_id uuid, p_instalment integer) returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required.'; end if;
  delete from public.loan_payments where application_id = p_id and instalment_no = p_instalment;
end; $$;
revoke all on function public.admin_remove_payment(uuid,integer) from public, anon, authenticated;
grant execute on function public.admin_remove_payment(uuid,integer) to authenticated;

-- Admin: register an uploaded document (file must already be in loan-documents/<application id>/...)
create or replace function public.admin_add_loan_document(p_id uuid, p_kind text, p_title text, p_path text) returns uuid
language plpgsql security definer set search_path = public
as $$
declare v_id uuid;
begin
  if not public.is_admin() then raise exception 'Admin access required.'; end if;
  if not exists(select 1 from public.applications where id = p_id and status = 'accepted') then
    raise exception 'Documents can only be added to approved applications.';
  end if;
  if p_kind not in ('kfs','sanction_letter','agreement','noc','other') then raise exception 'Choose the document type.'; end if;
  if length(trim(coalesce(p_title,''))) not between 2 and 120 then raise exception 'Give the document a name.'; end if;
  if (storage.foldername(p_path))[1] is distinct from p_id::text
     or not exists(select 1 from storage.objects where bucket_id = 'loan-documents' and name = p_path) then
    raise exception 'Upload the file first.';
  end if;
  insert into public.loan_documents(application_id, kind, title, path, uploaded_by)
  values (p_id, p_kind, trim(p_title), p_path, auth.uid()) returning id into v_id;
  insert into public.application_events(application_id, kind, note, actor)
  values (p_id, 'document_added', trim(p_title) || ' added', auth.uid());
  return v_id;
end; $$;
revoke all on function public.admin_add_loan_document(uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.admin_add_loan_document(uuid,text,text,text) to authenticated;

-- Admin: remove a document; returns its storage path so the file can be deleted too
create or replace function public.admin_remove_loan_document(p_doc uuid) returns text
language plpgsql security definer set search_path = public
as $$
declare v_path text;
begin
  if not public.is_admin() then raise exception 'Admin access required.'; end if;
  delete from public.loan_documents where id = p_doc returning path into v_path;
  if v_path is null then raise exception 'Document not found.'; end if;
  return v_path;
end; $$;
revoke all on function public.admin_remove_loan_document(uuid) from public, anon, authenticated;
grant execute on function public.admin_remove_loan_document(uuid) to authenticated;

-- Internal: session token → application id (not callable by clients)
create or replace function public.borrower_session_app(p_token text) returns uuid
language sql stable security definer set search_path = public
as $$ select application_id from public.borrower_sessions
       where token_hash = encode(extensions.digest(coalesce(p_token,''), 'sha256'), 'hex') and expires_at > now() $$;
revoke all on function public.borrower_session_app(text) from public, anon, authenticated;

-- Borrower: everything the dashboard needs, for a valid session token
create or replace function public.borrower_portal(p_token text) returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare v_app uuid;
begin
  select application_id into v_app from public.borrower_sessions
   where token_hash = encode(extensions.digest(coalesce(p_token,''), 'sha256'), 'hex') and expires_at > now();
  if v_app is null then return jsonb_build_object('error', 'Your session has ended. Please log in again.'); end if;

  return jsonb_build_object(
    'application', (select jsonb_build_object(
        'ref_code', a.ref_code, 'full_name', a.full_name, 'phone', a.phone, 'category', a.category,
        'requested_amount', a.requested_amount, 'created_at', a.created_at, 'reviewed_at', a.reviewed_at,
        'lender_name', a.lender_name, 'lender_reg_no', a.lender_reg_no, 'admin_note', a.admin_note,
        'contact_email', a.contact_email)
      from public.applications a where a.id = v_app),
    'payments', coalesce((select jsonb_agg(jsonb_build_object('instalment_no', p.instalment_no, 'paid_on', p.paid_on, 'amount', p.amount, 'reference', p.reference) order by p.instalment_no)
      from public.loan_payments p where p.application_id = v_app), '[]'::jsonb),
    'documents', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'kind', d.kind, 'title', d.title, 'uploaded_at', d.uploaded_at) order by d.uploaded_at desc)
      from public.loan_documents d where d.application_id = v_app), '[]'::jsonb),
    'loan', (select to_jsonb(l) - 'updated_by' from public.loans l where l.application_id = v_app),
    'site', (select jsonb_build_object(
        'lender_name', s.lender_name, 'lender_type', s.lender_type, 'lender_reg_no', s.lender_reg_no, 'lender_website', s.lender_website,
        'support_email', s.support_email, 'support_phone', s.support_phone,
        'grievance_officer', s.grievance_officer, 'grievance_email', s.grievance_email, 'grievance_phone', s.grievance_phone)
      from public.site_settings s where s.id = 1),
    'events', coalesce((select jsonb_agg(jsonb_build_object('kind', e.kind, 'note', e.note, 'created_at', e.created_at) order by e.created_at)
      from public.application_events e where e.application_id = v_app and e.kind in ('submitted','accepted','loan_updated')), '[]'::jsonb)
  );
end; $$;
revoke all on function public.borrower_portal(text) from public, anon, authenticated;
grant execute on function public.borrower_portal(text) to anon, authenticated;

create or replace function public.borrower_logout(p_token text) returns void
language sql security definer set search_path = public
as $$ delete from public.borrower_sessions where token_hash = encode(extensions.digest(coalesce(p_token,''), 'sha256'), 'hex'); $$;
revoke all on function public.borrower_logout(text) from public, anon, authenticated;
grant execute on function public.borrower_logout(text) to anon, authenticated;

-- Borrower: storage path of one of THEIR documents (the server route turns it into a 2-minute link)
create or replace function public.borrower_document_path(p_token text, p_doc uuid) returns text
language sql stable security definer set search_path = public
as $$ select d.path from public.loan_documents d
       where d.id = p_doc and d.application_id = public.borrower_session_app(p_token) $$;
revoke all on function public.borrower_document_path(text,uuid) from public, anon, authenticated;
grant execute on function public.borrower_document_path(text,uuid) to anon, authenticated;

-- Borrower: change the admin-generated password. Other sessions are signed out.
create or replace function public.borrower_change_password(p_token text, p_current text, p_new text) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare v_app uuid := public.borrower_session_app(p_token); v_hash text;
begin
  if v_app is null then return jsonb_build_object('error', 'Your session has ended. Please log in again.'); end if;
  select password_hash into v_hash from public.borrower_access where application_id = v_app for update;
  if v_hash is null or extensions.crypt(coalesce(p_current,''), v_hash) <> v_hash then
    return jsonb_build_object('error', 'Your current password is incorrect.');
  end if;
  if length(coalesce(p_new,'')) < 8 then return jsonb_build_object('error', 'New password must be at least 8 characters.'); end if;
  if p_new = p_current then return jsonb_build_object('error', 'Choose a different password.'); end if;
  update public.borrower_access set password_hash = extensions.crypt(p_new, extensions.gen_salt('bf', 10)) where application_id = v_app;
  delete from public.borrower_sessions
   where application_id = v_app and token_hash <> encode(extensions.digest(p_token, 'sha256'), 'hex');
  return jsonb_build_object('ok', true);
end; $$;
revoke all on function public.borrower_change_password(text,text,text) from public, anon, authenticated;
grant execute on function public.borrower_change_password(text,text,text) to anon, authenticated;


commit;

-- =====================================================================
-- After running: promote your administrator (replace the mobile number they signed up with):
--
--   insert into public.admin_users(user_id)
--   select id from auth.users where raw_user_meta_data->>'phone' = '9876543210'
--   on conflict do nothing;
-- =====================================================================
