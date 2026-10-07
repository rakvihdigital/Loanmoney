-- Existing installations: run this migration after the original schema.
-- Fresh installations: schema.sql already includes this migration.
begin;
alter table public.applications add column if not exists kyc_verified boolean not null default false;
create table if not exists public.application_kyc (
  application_id uuid primary key references public.applications(id) on delete cascade,
  dob date not null,
  address text not null check (length(trim(address)) between 10 and 500),
  city text not null check (length(trim(city)) between 2 and 100),
  state text not null check (length(trim(state)) between 2 and 100),
  pincode text not null check (pincode ~ '^[1-9][0-9]{5}$'),
  identity_type text not null check (identity_type in ('Voter ID','Passport','Driving licence')),
  identity_last4 text not null check (identity_last4 ~ '^[A-Za-z0-9]{4}$'),
  institution text,
  identity_path text not null,
  identity_back_path text,
  address_path text not null,
  student_path text,
  consent_at timestamptz not null default now()
);
alter table public.application_kyc enable row level security;
revoke all on public.application_kyc from anon, authenticated;
grant select on public.application_kyc to authenticated;
drop policy if exists "Read own KYC or admin" on public.application_kyc;
create policy "Read own KYC or admin" on public.application_kyc for select to authenticated using (
  public.is_admin() or exists(select 1 from public.applications a where a.id = application_id and a.user_id = auth.uid())
);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('kyc-documents','kyc-documents',false,5242880,array['image/png','image/jpeg','image/webp','application/pdf'])
on conflict(id) do update set public=false, file_size_limit=5242880, allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "Applicants upload own KYC" on storage.objects;
create policy "Applicants upload own KYC" on storage.objects for insert to authenticated with check (
  bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = auth.uid()::text
);
drop policy if exists "Read own KYC documents or admin" on storage.objects;
create policy "Read own KYC documents or admin" on storage.objects for select to authenticated using (
  bucket_id = 'kyc-documents' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);
-- Disable legacy RPCs so old clients cannot bypass the KYC requirement.
revoke execute on function public.submit_application(text,text,text,integer,text,text,text) from public, anon, authenticated;
revoke execute on function public.review_application(uuid,text,boolean,text) from public, anon, authenticated;

create or replace function public.submit_application_kyc(
  p_full_name text, p_phone text, p_category text, p_requested_amount integer,
  p_transaction_id text, p_proof_path text, p_expected_qr text, p_kyc jsonb
) returns uuid language plpgsql security definer set search_path = public
as $$
declare payment public.payment_settings; new_id uuid; birthdate date; document_path text;
begin
  if auth.uid() is null then raise exception 'Please sign in.'; end if;
  if p_kyc is null or coalesce(p_kyc->>'consent','') <> 'true' then raise exception 'KYC consent is required.'; end if;
  birthdate := (p_kyc->>'dob')::date;
  if birthdate is null or birthdate > (current_date - interval '18 years')::date
    or birthdate < (current_date - interval '120 years')::date then
    raise exception 'Applicant must be between 18 and 120 years old.';
  end if;
  if p_category = 'Driver' and (p_kyc->>'identity_type') is distinct from 'Driving licence' then
    raise exception 'Drivers must upload a driving licence.';
  end if;
  if p_category = 'Student' and (nullif(trim(p_kyc->>'institution'),'') is null
    or length(trim(p_kyc->>'institution')) not between 2 and 150
    or nullif(p_kyc->>'student_path','') is null) then
    raise exception 'Students must provide their institution and student ID.';
  end if;
  foreach document_path in array array[p_kyc->>'identity_path',p_kyc->>'address_path'] loop
    if document_path is null or not exists(select 1 from storage.objects where bucket_id='kyc-documents'
      and name=document_path and (storage.foldername(name))[1]=auth.uid()::text) then
      raise exception 'Upload your identity document and address proof.';
    end if;
  end loop;
  foreach document_path in array array[p_kyc->>'identity_back_path',p_kyc->>'student_path'] loop
    if nullif(document_path,'') is not null and not exists(select 1 from storage.objects where bucket_id='kyc-documents'
      and name=document_path and (storage.foldername(name))[1]=auth.uid()::text) then
      raise exception 'A supporting document does not belong to this applicant.';
    end if;
  end loop;
  select * into payment from public.payment_settings where id=1 for share;
  if payment.qr_path is null or payment.payee_name='' or payment.upi_id='' then raise exception 'Payments are not configured yet.'; end if;
  if payment.qr_path is distinct from p_expected_qr then raise exception 'Payment details changed. Reload and verify your payment before submitting.'; end if;
  if not exists(select 1 from storage.objects where bucket_id='payment-proofs' and name=p_proof_path
    and (storage.foldername(name))[1]=auth.uid()::text) then raise exception 'Upload your payment screenshot.'; end if;
  insert into public.applications(user_id,full_name,phone,category,requested_amount,transaction_id,proof_path,fee,payee_name,upi_id,qr_path)
  values(auth.uid(),trim(p_full_name),p_phone,p_category,p_requested_amount,upper(trim(p_transaction_id)),p_proof_path,299,payment.payee_name,payment.upi_id,payment.qr_path)
  returning id into new_id;
  insert into public.application_kyc(application_id,dob,address,city,state,pincode,identity_type,identity_last4,institution,identity_path,identity_back_path,address_path,student_path)
  values(new_id,birthdate,trim(p_kyc->>'address'),trim(p_kyc->>'city'),trim(p_kyc->>'state'),p_kyc->>'pincode',
    p_kyc->>'identity_type',upper(p_kyc->>'identity_last4'),
    case when p_category='Student' then trim(p_kyc->>'institution') else null end,
    p_kyc->>'identity_path',nullif(p_kyc->>'identity_back_path',''),p_kyc->>'address_path',
    case when p_category='Student' then p_kyc->>'student_path' else null end);
  return new_id;
end; $$;
revoke all on function public.submit_application_kyc(text,text,text,integer,text,text,text,jsonb) from public, anon;
grant execute on function public.submit_application_kyc(text,text,text,integer,text,text,text,jsonb) to authenticated;

create or replace function public.review_application_kyc(
  p_id uuid,p_status text,p_payment_verified boolean,p_kyc_verified boolean,p_note text
) returns void language plpgsql security definer set search_path=public
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required.'; end if;
  if p_status is null or p_status not in ('accepted','rejected') then raise exception 'Invalid decision.'; end if;
  if p_status='accepted' and (not coalesce(p_payment_verified,false) or not coalesce(p_kyc_verified,false)
    or not exists(select 1 from public.application_kyc where application_id=p_id)) then
    raise exception 'Verify payment and review KYC documents before accepting.';
  end if;
  if p_status='rejected' and coalesce(length(trim(p_note)),0)<3 then raise exception 'Provide a rejection reason.'; end if;
  if length(p_note)>1000 then raise exception 'Note is too long.'; end if;
  update public.applications set status=p_status,payment_verified=coalesce(p_payment_verified,false),
    kyc_verified=coalesce(p_kyc_verified,false),admin_note=trim(coalesce(p_note,'')),reviewed_by=auth.uid(),reviewed_at=now()
  where id=p_id and status='pending';
  if not found then raise exception 'Application already reviewed or not found.'; end if;
end; $$;
revoke all on function public.review_application_kyc(uuid,text,boolean,boolean,text) from public, anon;
grant execute on function public.review_application_kyc(uuid,text,boolean,boolean,text) to authenticated;
commit;

