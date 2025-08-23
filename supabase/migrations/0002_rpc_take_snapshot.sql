-- Pactoria MVP – RPC for atomic snapshot
-- Creates public.take_snapshot(...) to insert a new contract version and advance latest_version_number

create or replace function public.take_snapshot(
  p_contract_id uuid,
  p_content_json jsonb,
  p_content_md text,
  p_ydoc_state_base64 text
) returns public.contract_versions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_latest int;
  v_next int;
  v_row public.contract_versions;
begin
  -- Access control: owner or approver
  if not public.has_contract_access(auth.uid(), p_contract_id) then
    raise exception 'forbidden';
  end if;

  -- Lock the row to compute next version safely
  select latest_version_number into v_latest
  from public.contracts
  where id = p_contract_id
  for update;

  v_next := coalesce(v_latest, 0) + 1;

  insert into public.contract_versions (
    contract_id,
    version_number,
    ydoc_state,
    content_md,
    content_json,
    created_by
  ) values (
    p_contract_id,
    v_next,
    case when p_ydoc_state_base64 is null then null else decode(p_ydoc_state_base64, 'base64') end,
    p_content_md,
    p_content_json,
    auth.uid()
  ) returning * into v_row;

  -- Best-effort cache of latest version number
  update public.contracts
    set latest_version_number = v_next
  where id = p_contract_id;

  return v_row;
end;
$$;

-- Allow client roles to call the RPC
grant execute on function public.take_snapshot(uuid, jsonb, text, text) to authenticated, anon;
