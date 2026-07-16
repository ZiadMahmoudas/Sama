-- =============================================================
-- SAMA CMS - Supabase database, security policies and starter data
-- Run this file in Supabase SQL Editor AFTER creating the admin user
-- in Authentication > Users. Default admin email expected below:
-- admin@gmail.com
-- Change that email near the end of this file if you use another one.
-- =============================================================

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  number text,
  title text not null,
  description text not null default '',
  features text[] not null default '{}',
  icon_url text,
  enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pricing (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subtitle text,
  amount text,
  period text,
  features text[] not null default '{}',
  is_featured boolean not null default false,
  enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolio (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  tags text[] not null default '{}',
  image_url text,
  link_url text default '#contact',
  gradient text default 'linear-gradient(145deg,rgba(139,92,246,.5),rgba(109,40,217,.4))',
  enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.faq (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.process_steps (
  id uuid primary key default gen_random_uuid(),
  number text,
  title text not null,
  description text not null default '',
  enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  quote text not null,
  rating smallint not null default 5 check (rating between 1 and 5),
  avatar_text text,
  enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_logos (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key in ('navbar','preloader','hero','footer')),
  url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id smallint primary key default 1 check (id = 1),
  hero_badge text,
  hero_title text,
  hero_highlight text,
  hero_description text,
  primary_cta_text text,
  secondary_cta_text text,
  stat_1_value text,
  stat_1_label text,
  stat_2_value text,
  stat_2_label text,
  stat_3_value text,
  stat_3_label text,
  stat_4_value text,
  stat_4_label text,
  contact_phone_display text,
  contact_phone_href text,
  contact_email text,
  whatsapp_url text,
  twitter_url text,
  instagram_url text,
  linkedin_url text,
  footer_description text,
  marquee_items text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (char_length(email) between 5 and 254),
  phone text check (phone is null or char_length(phone) <= 40),
  plan text check (plan is null or char_length(plan) <= 120),
  message text not null check (char_length(message) between 2 and 5000),
  source text check (source is null or char_length(source) <= 500),
  status text not null default 'new' check (status in ('new','read','contacted','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Recreate update triggers safely.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'services','pricing','portfolio','faq','process_steps','testimonials',
    'site_logos','site_settings','contact_messages'
  ] loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I', table_name, table_name);
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end $$;

-- Enable RLS.
alter table public.admin_users enable row level security;
alter table public.services enable row level security;
alter table public.pricing enable row level security;
alter table public.portfolio enable row level security;
alter table public.faq enable row level security;
alter table public.process_steps enable row level security;
alter table public.testimonials enable row level security;
alter table public.site_logos enable row level security;
alter table public.site_settings enable row level security;
alter table public.contact_messages enable row level security;

-- Grants required by the Data API; RLS remains the security boundary.
grant usage on schema public to anon, authenticated;
grant select on public.services, public.pricing, public.portfolio, public.faq,
  public.process_steps, public.testimonials, public.site_logos, public.site_settings
  to anon, authenticated;
grant insert on public.contact_messages to anon, authenticated;
grant select, insert, update, delete on public.services, public.pricing,
  public.portfolio, public.faq, public.process_steps, public.testimonials,
  public.site_logos, public.site_settings, public.contact_messages
  to authenticated;
grant select on public.admin_users to authenticated;

-- Admin users policies.
drop policy if exists "admin can read own admin row" on public.admin_users;
create policy "admin can read own admin row"
on public.admin_users for select to authenticated
using (user_id = auth.uid());

-- Public content policies.
do $$
declare
  table_name text;
begin
  foreach table_name in array array['services','pricing','portfolio','faq','process_steps','testimonials'] loop
    execute format('drop policy if exists "public read enabled" on public.%I', table_name);
    execute format('create policy "public read enabled" on public.%I for select to anon, authenticated using (enabled = true)', table_name);
    execute format('drop policy if exists "admins manage content" on public.%I', table_name);
    execute format('create policy "admins manage content" on public.%I for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', table_name);
  end loop;
end $$;

-- Public read, admin write for logos/settings.
drop policy if exists "public read logos" on public.site_logos;
create policy "public read logos" on public.site_logos for select to anon, authenticated using (true);
drop policy if exists "admins manage logos" on public.site_logos;
create policy "admins manage logos" on public.site_logos for all to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "public read settings" on public.site_settings;
create policy "public read settings" on public.site_settings for select to anon, authenticated using (true);
drop policy if exists "admins manage settings" on public.site_settings;
create policy "admins manage settings" on public.site_settings for all to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

-- Contact form: visitors can only create a fresh message. Admins can manage all messages.
drop policy if exists "visitors submit contact messages" on public.contact_messages;
create policy "visitors submit contact messages"
on public.contact_messages for insert to anon, authenticated
with check (
  status = 'new'
  and char_length(name) between 2 and 120
  and char_length(email) between 5 and 254
  and char_length(message) between 2 and 5000
);

drop policy if exists "admins manage contact messages" on public.contact_messages;
create policy "admins manage contact messages"
on public.contact_messages for all to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

-- Public media bucket for icons, logos and portfolio images.
insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', true, 10485760)
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit;

drop policy if exists "public read media" on storage.objects;
create policy "public read media"
on storage.objects for select to anon, authenticated
using (bucket_id = 'media');

drop policy if exists "admins upload media" on storage.objects;
create policy "admins upload media"
on storage.objects for insert to authenticated
with check (bucket_id = 'media' and (select public.is_admin()));

drop policy if exists "admins update media" on storage.objects;
create policy "admins update media"
on storage.objects for update to authenticated
using (bucket_id = 'media' and (select public.is_admin()))
with check (bucket_id = 'media' and (select public.is_admin()));

drop policy if exists "admins delete media" on storage.objects;
create policy "admins delete media"
on storage.objects for delete to authenticated
using (bucket_id = 'media' and (select public.is_admin()));

-- Starter settings.
insert into public.site_settings (
  id, hero_badge, hero_title, hero_highlight, hero_description,
  primary_cta_text, secondary_cta_text,
  stat_1_value, stat_1_label, stat_2_value, stat_2_label,
  stat_3_value, stat_3_label, stat_4_value, stat_4_label,
  contact_phone_display, contact_phone_href, contact_email,
  whatsapp_url, twitter_url, instagram_url, linkedin_url,
  footer_description, marquee_items
) values (
  1,
  '🚀 أكثر من 150 عميل يثقون بنا',
  'نمنح مشروعك',
  'سِمته الخاصة',
  'وكالة تسويق رقمي متكاملة نقدم حلولاً إبداعية ومبتكرة لتحويل أفكارك إلى قصة نجاح ملموسة. نحن شريكك في رحلة التميز.',
  'ابدأ مشروعك الآن',
  'شاهد أعمالنا',
  '150+', 'عميل راضٍ',
  '500+', 'مشروع منجز',
  '98%', 'نسبة الرضا',
  '24/7', 'دعم مستمر',
  '+966 50 XXX XXXX', '+966500000000', 'info@sima.sa',
  'https://wa.me/966500000000', '#', '#', '#',
  'وكالة تسويق رقمي متكاملة نساعدك في بناء حضور رقمي قوي ومؤثر ينقل مشروعك للمستوى التالي.',
  array['إدارة السوشيال ميديا','هوية بصرية متكاملة','تصميم وتطوير المواقع','تطبيقات الموبايل','SEO وتسويق بالمحتوى']
)
on conflict (id) do nothing;

-- Starter services.
insert into public.services (number,title,description,features,sort_order)
select * from (values
  ('01','إدارة السوشيال ميديا','نخطط وننشئ محتوى يجذب جمهورك ويحوّل التفاعل إلى عملاء فعليين.',array['محتوى إبداعي','جدول نشر','تفاعل مستمر'],1),
  ('02','الهوية البصرية','نصمم هوية تعبر عن مشروعك وتجعلك مميزاً وسهل التذكر.',array['تصميم شعار','دليل هوية','مواد طباعة'],2),
  ('03','تصميم المواقع','نطور مواقع سريعة ومتجاوبة تعكس احترافية مشروعك وتوفر تجربة مستخدم سلسة.',array['تصميم متجاوب','سرعة عالية','SEO جاهز'],3),
  ('04','تطوير تطبيقات الموبايل','نصمم ونطور تطبيقات تساعدك على تقديم خدماتك بشكل أسهل وأسرع لعملائك.',array['تجربة مستخدم','أداء عالٍ','iOS & Android'],4),
  ('05','تحسين محركات البحث','نحسّن ظهور موقعك في نتائج البحث بشكل مستدام لزيادة الزيارات العضوية وجذب عملاء مهتمين.',array['SEO تقني','محتوى محسّن','بناء روابط'],5),
  ('06','التسويق بالمحتوى','نكتب ونصمم محتوى إبداعياً يروي قصة علامتك ويبني علاقة قوية مع جمهورك.',array['مقالات','فيديوهات','إنفوجرافيك'],6)
) as seed(number,title,description,features,sort_order)
where not exists (select 1 from public.services);

-- Starter pricing.
insert into public.pricing (name,subtitle,amount,period,features,is_featured,sort_order)
select * from (values
  ('باقة الانطلاق','للمشاريع الناشئة','1,500','ر.س/شهر',array['إدارة منصتين تواصل','12 منشور شهرياً','تصميم بصري أساسي','تقرير شهري','دعم عبر الواتساب'],false,1),
  ('باقة النمو','للشركات المتوسطة','3,500','ر.س/شهر',array['إدارة 4 منصات تواصل','24 منشور شهرياً','حملة إعلانية شهرية','تقرير أسبوعي','مدير حساب مخصص','تصميم بصري متقدم'],true,2),
  ('باقة الريادة','للشركات الكبرى','7,500','ر.س/شهر',array['جميع المنصات','محتوى غير محدود','استراتيجية شاملة','فريق متخصص كامل','تقارير آنية','أولوية الدعم'],false,3)
) as seed(name,subtitle,amount,period,features,is_featured,sort_order)
where not exists (select 1 from public.pricing);

-- Starter portfolio.
insert into public.portfolio (title,description,tags,gradient,link_url,sort_order)
select * from (values
  ('متجر أونلاين','هوية بصرية + متجر إلكتروني متكامل',array['براندينج','E-commerce'],'linear-gradient(145deg,rgba(139,92,246,.5),rgba(109,40,217,.4))','#contact',1),
  ('مطعم راقٍ','حملة تسويقية شاملة + إدارة سوشيال',array['سوشيال','إعلانات'],'linear-gradient(145deg,rgba(167,139,250,.5),rgba(139,92,246,.4))','#contact',2),
  ('شركة تقنية','موقع + SEO + تسويق بالمحتوى',array['موقع','SEO'],'linear-gradient(145deg,rgba(196,181,253,.5),rgba(167,139,250,.4))','#contact',3),
  ('عيادة طبية','هوية + موقع حجوزات + إعلانات',array['براندينج','موقع'],'linear-gradient(145deg,rgba(109,40,217,.5),rgba(139,92,246,.4))','#contact',4),
  ('علامة أزياء','تصوير + محتوى + حملات إعلانية',array['محتوى','إعلانات'],'linear-gradient(145deg,rgba(124,58,237,.5),rgba(167,139,250,.4))','#contact',5),
  ('شركة ناشئة','استراتيجية + هوية + إطلاق',array['استراتيجية','إطلاق'],'linear-gradient(145deg,rgba(91,33,182,.5),rgba(139,92,246,.4))','#contact',6)
) as seed(title,description,tags,gradient,link_url,sort_order)
where not exists (select 1 from public.portfolio);

-- Starter FAQs.
insert into public.faq (question,answer,sort_order)
select * from (values
  ('كيف أبدأ العمل مع سِمة؟','أرسل لنا رسالة عبر نموذج التواصل أو واتساب، وسنتواصل معك خلال 24 ساعة لفهم احتياجاتك واقتراح الحل المناسب لمشروعك.',1),
  ('هل يمكنني تعديل الباقة حسب احتياجي؟','نعم، جميع خدماتنا مرنة ويمكن تخصيصها حسب أهداف مشروعك.',2),
  ('كم يستغرق تنفيذ المشروع؟','يعتمد على نوع وحجم المشروع، لكن المشاريع الصغيرة تستغرق غالباً من 7 إلى 14 يوماً.',3),
  ('هل تقدمون تقارير عن الأداء؟','نعم، نقدم تقارير دورية تتضمن تحليلاً شاملاً للأداء والنتائج مع توصيات للتحسين المستمر.',4),
  ('ما الذي يميز سِمة عن غيرها؟','نقدم حلولاً مخصصة لكل مشروع مع تركيز على تحقيق نتائج فعلية تدعم نمو الأعمال.',5),
  ('هل خدماتكم مناسبة للمشاريع الصغيرة؟','نعم، نقدم حلولاً وباقات تناسب المشاريع الناشئة والكبيرة.',6)
) as seed(question,answer,sort_order)
where not exists (select 1 from public.faq);

-- Starter process steps.
insert into public.process_steps (number,title,description,sort_order)
select * from (values
  ('1','الاستشارة','نستمع لاحتياجاتك وأهدافك ونساعدك في تحديد أفضل الحلول المناسبة لمشروعك.',1),
  ('2','التخطيط','نضع استراتيجية مخصصة وخطة عمل واضحة مع جدول زمني محدد للتنفيذ.',2),
  ('3','التنفيذ','فريقنا المتخصص ينفذ الخطة باحترافية عالية مع متابعة مستمرة للجودة.',3),
  ('4','النتائج','نقدم تقارير شفافة عن النتائج مع توصيات للتحسين المستمر والنمو.',4)
) as seed(number,title,description,sort_order)
where not exists (select 1 from public.process_steps);

-- Starter testimonials.
insert into public.testimonials (name,role,quote,rating,avatar_text,sort_order)
select * from (values
  ('أحمد المحمد','مؤسس متجر إلكتروني','تعاملت مع سِمة لمدة سنة كاملة والنتائج كانت مذهلة. زادت مبيعاتي 300% خلال 6 أشهر فقط!',5,'أ',1),
  ('سارة العتيبي','صاحبة مطعم','فريق مبدع ومحترف، ساعدوني في بناء هوية بصرية مميزة وزيادة المتابعين بشكل ملحوظ.',5,'س',2),
  ('محمد الغامدي','مدير شركة تقنية','أفضل استثمار قمت به لشركتي. فهموا احتياجاتي وقدموا حلولاً مخصصة تناسب ميزانيتي.',5,'م',3)
) as seed(name,role,quote,rating,avatar_text,sort_order)
where not exists (select 1 from public.testimonials);

-- Local fallback logos. You can replace them from the dashboard after deployment.
insert into public.site_logos (key,url) values
  ('navbar','images/Logo1.svg'),
  ('preloader','images/Logo1.svg'),
  ('hero','images/Logoicon.svg'),
  ('footer','images/Logo1.svg')
on conflict (key) do nothing;

-- Add the Auth user to the admin allow-list.
-- IMPORTANT: Create this user first in Authentication > Users.
insert into public.admin_users (user_id)
select id from auth.users where lower(email) = lower('admin@gmail.com')
on conflict (user_id) do nothing;

-- Helpful verification result shown after running the script.
select
  (select count(*) from public.services) as services,
  (select count(*) from public.pricing) as pricing,
  (select count(*) from public.portfolio) as portfolio,
  (select count(*) from public.admin_users) as admins;
