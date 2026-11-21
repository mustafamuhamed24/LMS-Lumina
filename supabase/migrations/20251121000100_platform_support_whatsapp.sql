-- Support contact details editable by the platform owner from
-- /admin/settings. Existing installs get the current support WhatsApp number.
alter table public.platform_settings
  add column if not exists support_whatsapp text not null default '';

update public.platform_settings
set support_whatsapp = '+201090861914'
where id = true and support_whatsapp = '';
