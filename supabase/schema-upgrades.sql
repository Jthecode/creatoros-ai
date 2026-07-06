-- ==========================================================
-- CreatorOS AI
-- Phase 2 Database Upgrade + Funnel System Integrity Patch
-- ==========================================================

create extension if not exists pgcrypto;

-- ==========================================================
-- FILES
-- ==========================================================

create table if not exists files (
    id uuid primary key default gen_random_uuid(),

    business_id uuid not null
        references businesses(id)
        on delete cascade,

    filename text not null,
    storage_path text not null,
    public_url text,
    mime_type text,
    size_bytes bigint default 0,

    created_at timestamptz default now()
);

create index if not exists idx_files_business
on files(business_id);

-- ==========================================================
-- CONVERSATIONS
-- ==========================================================

create table if not exists conversations (
    id uuid primary key default gen_random_uuid(),

    business_id uuid not null
        references businesses(id)
        on delete cascade,

    customer_name text,
    customer_email text,
    channel text,
    status text default 'open',
    last_message text,
    unread_count integer default 0,

    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index if not exists idx_conversations_business
on conversations(business_id);

-- ==========================================================
-- MESSAGES
-- ==========================================================

create table if not exists messages (
    id uuid primary key default gen_random_uuid(),

    conversation_id uuid not null
        references conversations(id)
        on delete cascade,

    sender text not null,
    content text not null,
    ai_generated boolean default false,

    created_at timestamptz default now()
);

create index if not exists idx_messages_conversation
on messages(conversation_id);

-- ==========================================================
-- LEADS
-- ==========================================================

create table if not exists leads (
    id uuid primary key default gen_random_uuid(),

    business_id uuid not null
        references businesses(id)
        on delete cascade,

    full_name text,
    name text,
    email text,
    phone text,
    company text,
    source text,
    stage text default 'new',
    status text default 'new',
    message text,
    notes text,
    metadata jsonb default '{}'::jsonb,

    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

alter table leads add column if not exists full_name text;
alter table leads add column if not exists name text;
alter table leads add column if not exists email text;
alter table leads add column if not exists phone text;
alter table leads add column if not exists company text;
alter table leads add column if not exists source text;
alter table leads add column if not exists stage text default 'new';
alter table leads add column if not exists status text default 'new';
alter table leads add column if not exists message text;
alter table leads add column if not exists notes text;
alter table leads add column if not exists metadata jsonb default '{}'::jsonb;
alter table leads add column if not exists updated_at timestamptz default now();

create index if not exists idx_leads_business
on leads(business_id);

create index if not exists idx_leads_email
on leads(email);

create index if not exists idx_leads_status
on leads(status);

create index if not exists idx_leads_created_at
on leads(created_at desc);

-- ==========================================================
-- AI FUNNEL BUILDER: FUNNELS
-- ==========================================================

create table if not exists funnels (
    id uuid primary key default gen_random_uuid(),

    business_id uuid not null
        references businesses(id)
        on delete cascade,

    name text not null,
    slug text not null,
    description text,
    goal text,
    target_audience text,
    offer text,

    status text not null default 'draft',
    is_published boolean not null default false,

    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint funnels_status_check check (
        status in ('draft', 'published', 'archived')
    )
);

alter table funnels add column if not exists description text;
alter table funnels add column if not exists goal text;
alter table funnels add column if not exists target_audience text;
alter table funnels add column if not exists offer text;
alter table funnels add column if not exists status text not null default 'draft';
alter table funnels add column if not exists is_published boolean not null default false;
alter table funnels add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table funnels add column if not exists updated_at timestamptz not null default now();

create unique index if not exists idx_funnels_business_slug_unique
on funnels(business_id, slug);

create index if not exists idx_funnels_business
on funnels(business_id);

create index if not exists idx_funnels_status
on funnels(status);

create index if not exists idx_funnels_is_published
on funnels(is_published);

create index if not exists idx_funnels_created_at
on funnels(created_at desc);

-- ==========================================================
-- AI FUNNEL BUILDER: FUNNEL PAGES
-- ==========================================================

create table if not exists funnel_pages (
    id uuid primary key default gen_random_uuid(),

    business_id uuid not null
        references businesses(id)
        on delete cascade,

    funnel_id uuid not null
        references funnels(id)
        on delete cascade,

    title text not null,
    slug text not null,

    type text default 'landing',
    page_type text default 'landing',

    sort_order integer not null default 1,

    headline text,
    subheadline text,
    body text,
    cta_text text,
    cta_url text,

    html_content text,
    content jsonb not null default '{}'::jsonb,

    seo_title text,
    seo_description text,

    status text not null default 'draft',
    is_published boolean not null default false,

    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint funnel_pages_status_check check (
        status in ('draft', 'published', 'archived')
    )
);

alter table funnel_pages add column if not exists business_id uuid references businesses(id) on delete cascade;
alter table funnel_pages add column if not exists funnel_id uuid references funnels(id) on delete cascade;
alter table funnel_pages add column if not exists title text;
alter table funnel_pages add column if not exists slug text;
alter table funnel_pages add column if not exists type text default 'landing';
alter table funnel_pages add column if not exists page_type text default 'landing';
alter table funnel_pages add column if not exists sort_order integer not null default 1;
alter table funnel_pages add column if not exists headline text;
alter table funnel_pages add column if not exists subheadline text;
alter table funnel_pages add column if not exists body text;
alter table funnel_pages add column if not exists cta_text text;
alter table funnel_pages add column if not exists cta_url text;
alter table funnel_pages add column if not exists html_content text;
alter table funnel_pages add column if not exists content jsonb not null default '{}'::jsonb;
alter table funnel_pages add column if not exists seo_title text;
alter table funnel_pages add column if not exists seo_description text;
alter table funnel_pages add column if not exists status text not null default 'draft';
alter table funnel_pages add column if not exists is_published boolean not null default false;
alter table funnel_pages add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table funnel_pages add column if not exists updated_at timestamptz not null default now();

create unique index if not exists idx_funnel_pages_funnel_slug_unique
on funnel_pages(funnel_id, slug);

create index if not exists idx_funnel_pages_business
on funnel_pages(business_id);

create index if not exists idx_funnel_pages_funnel
on funnel_pages(funnel_id);

create index if not exists idx_funnel_pages_status
on funnel_pages(status);

create index if not exists idx_funnel_pages_is_published
on funnel_pages(is_published);

create index if not exists idx_funnel_pages_sort_order
on funnel_pages(funnel_id, sort_order);

-- ==========================================================
-- AI FUNNEL BUILDER: LEAD FORMS
-- ==========================================================

create table if not exists lead_forms (
    id uuid primary key default gen_random_uuid(),

    business_id uuid not null
        references businesses(id)
        on delete cascade,

    funnel_id uuid
        references funnels(id)
        on delete cascade,

    funnel_page_id uuid
        references funnel_pages(id)
        on delete set null,

    name text not null,
    slug text not null,
    title text not null,

    description text,
    submit_button_text text not null default 'Submit',

    form_type text not null default 'lead_capture',
    fields jsonb not null default '[]'::jsonb,

    success_message text default 'Thanks! We received your information.',
    redirect_url text,

    ai_prompt text,

    status text not null default 'published',
    is_active boolean not null default true,
    is_published boolean not null default true,

    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint lead_forms_status_check check (
        status in ('draft', 'published', 'archived')
    )
);

alter table lead_forms add column if not exists funnel_id uuid references funnels(id) on delete cascade;
alter table lead_forms add column if not exists funnel_page_id uuid references funnel_pages(id) on delete set null;
alter table lead_forms add column if not exists name text;
alter table lead_forms add column if not exists slug text;
alter table lead_forms add column if not exists title text;
alter table lead_forms add column if not exists description text;
alter table lead_forms add column if not exists submit_button_text text not null default 'Submit';
alter table lead_forms add column if not exists form_type text not null default 'lead_capture';
alter table lead_forms add column if not exists fields jsonb not null default '[]'::jsonb;
alter table lead_forms add column if not exists success_message text default 'Thanks! We received your information.';
alter table lead_forms add column if not exists redirect_url text;
alter table lead_forms add column if not exists ai_prompt text;
alter table lead_forms add column if not exists status text not null default 'published';
alter table lead_forms add column if not exists is_active boolean not null default true;
alter table lead_forms add column if not exists is_published boolean not null default true;
alter table lead_forms add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table lead_forms add column if not exists updated_at timestamptz not null default now();

create unique index if not exists idx_lead_forms_business_slug_unique
on lead_forms(business_id, slug);

create index if not exists idx_lead_forms_business
on lead_forms(business_id);

create index if not exists idx_lead_forms_funnel
on lead_forms(funnel_id);

create index if not exists idx_lead_forms_funnel_page
on lead_forms(funnel_page_id);

create index if not exists idx_lead_forms_status
on lead_forms(status);

create index if not exists idx_lead_forms_active
on lead_forms(is_active);

-- ==========================================================
-- AI FUNNEL BUILDER: FUNNEL SUBMISSIONS
-- ==========================================================

create table if not exists funnel_submissions (
    id uuid primary key default gen_random_uuid(),

    business_id uuid not null
        references businesses(id)
        on delete cascade,

    funnel_id uuid
        references funnels(id)
        on delete set null,

    funnel_page_id uuid
        references funnel_pages(id)
        on delete set null,

    lead_form_id uuid
        references lead_forms(id)
        on delete set null,

    lead_id uuid
        references leads(id)
        on delete set null,

    name text,
    email text,
    phone text,
    company text,
    message text,

    source text default 'funnel',
    status text not null default 'new',

    form_data jsonb not null default '{}'::jsonb,
    metadata jsonb not null default '{}'::jsonb,

    page_url text,
    referrer text,
    user_agent text,
    ip_address text,

    utm_source text,
    utm_medium text,
    utm_campaign text,
    utm_term text,
    utm_content text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table funnel_submissions add column if not exists funnel_id uuid references funnels(id) on delete set null;
alter table funnel_submissions add column if not exists funnel_page_id uuid references funnel_pages(id) on delete set null;
alter table funnel_submissions add column if not exists lead_form_id uuid references lead_forms(id) on delete set null;
alter table funnel_submissions add column if not exists lead_id uuid references leads(id) on delete set null;
alter table funnel_submissions add column if not exists name text;
alter table funnel_submissions add column if not exists email text;
alter table funnel_submissions add column if not exists phone text;
alter table funnel_submissions add column if not exists company text;
alter table funnel_submissions add column if not exists message text;
alter table funnel_submissions add column if not exists source text default 'funnel';
alter table funnel_submissions add column if not exists status text not null default 'new';
alter table funnel_submissions add column if not exists form_data jsonb not null default '{}'::jsonb;
alter table funnel_submissions add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table funnel_submissions add column if not exists page_url text;
alter table funnel_submissions add column if not exists referrer text;
alter table funnel_submissions add column if not exists user_agent text;
alter table funnel_submissions add column if not exists ip_address text;
alter table funnel_submissions add column if not exists utm_source text;
alter table funnel_submissions add column if not exists utm_medium text;
alter table funnel_submissions add column if not exists utm_campaign text;
alter table funnel_submissions add column if not exists utm_term text;
alter table funnel_submissions add column if not exists utm_content text;
alter table funnel_submissions add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_funnel_submissions_business
on funnel_submissions(business_id);

create index if not exists idx_funnel_submissions_funnel
on funnel_submissions(funnel_id);

create index if not exists idx_funnel_submissions_funnel_page
on funnel_submissions(funnel_page_id);

create index if not exists idx_funnel_submissions_lead_form
on funnel_submissions(lead_form_id);

create index if not exists idx_funnel_submissions_lead
on funnel_submissions(lead_id);

create index if not exists idx_funnel_submissions_email
on funnel_submissions(email);

create index if not exists idx_funnel_submissions_status
on funnel_submissions(status);

create index if not exists idx_funnel_submissions_created_at
on funnel_submissions(created_at desc);

-- ==========================================================
-- AI FUNNEL BUILDER: CONVERSION EVENTS
-- ==========================================================

create table if not exists conversion_events (
    id uuid primary key default gen_random_uuid(),

    business_id uuid not null
        references businesses(id)
        on delete cascade,

    funnel_id uuid
        references funnels(id)
        on delete set null,

    funnel_page_id uuid
        references funnel_pages(id)
        on delete set null,

    lead_form_id uuid
        references lead_forms(id)
        on delete set null,

    funnel_submission_id uuid
        references funnel_submissions(id)
        on delete set null,

    lead_id uuid
        references leads(id)
        on delete set null,

    order_id uuid,

    event_name text not null,
    event_type text not null default 'custom',

    value_cents integer default 0,
    currency text default 'USD',

    source text default 'funnel',
    page_url text,
    referrer text,
    user_agent text,
    ip_address text,

    session_id text,
    visitor_id text,

    utm_source text,
    utm_medium text,
    utm_campaign text,
    utm_term text,
    utm_content text,

    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),

    constraint conversion_events_event_type_check check (
        event_type in (
            'page_view',
            'cta_click',
            'form_view',
            'form_submit',
            'lead_created',
            'booking_request',
            'checkout_click',
            'purchase',
            'custom'
        )
    )
);

alter table conversion_events add column if not exists funnel_id uuid references funnels(id) on delete set null;
alter table conversion_events add column if not exists funnel_page_id uuid references funnel_pages(id) on delete set null;
alter table conversion_events add column if not exists lead_form_id uuid references lead_forms(id) on delete set null;
alter table conversion_events add column if not exists funnel_submission_id uuid references funnel_submissions(id) on delete set null;
alter table conversion_events add column if not exists lead_id uuid references leads(id) on delete set null;
alter table conversion_events add column if not exists order_id uuid;
alter table conversion_events add column if not exists event_name text;
alter table conversion_events add column if not exists event_type text not null default 'custom';
alter table conversion_events add column if not exists value_cents integer default 0;
alter table conversion_events add column if not exists currency text default 'USD';
alter table conversion_events add column if not exists source text default 'funnel';
alter table conversion_events add column if not exists page_url text;
alter table conversion_events add column if not exists referrer text;
alter table conversion_events add column if not exists user_agent text;
alter table conversion_events add column if not exists ip_address text;
alter table conversion_events add column if not exists session_id text;
alter table conversion_events add column if not exists visitor_id text;
alter table conversion_events add column if not exists utm_source text;
alter table conversion_events add column if not exists utm_medium text;
alter table conversion_events add column if not exists utm_campaign text;
alter table conversion_events add column if not exists utm_term text;
alter table conversion_events add column if not exists utm_content text;
alter table conversion_events add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists idx_conversion_events_business
on conversion_events(business_id);

create index if not exists idx_conversion_events_funnel
on conversion_events(funnel_id);

create index if not exists idx_conversion_events_funnel_page
on conversion_events(funnel_page_id);

create index if not exists idx_conversion_events_lead_form
on conversion_events(lead_form_id);

create index if not exists idx_conversion_events_submission
on conversion_events(funnel_submission_id);

create index if not exists idx_conversion_events_lead
on conversion_events(lead_id);

create index if not exists idx_conversion_events_event_type
on conversion_events(event_type);

create index if not exists idx_conversion_events_created_at
on conversion_events(created_at desc);

-- ==========================================================
-- FUNNEL CONVERSION SUMMARY VIEW
-- ==========================================================

create or replace view funnel_conversion_summary as
select
    f.id as funnel_id,
    f.business_id,
    f.name as funnel_name,
    f.slug as funnel_slug,
    f.status as funnel_status,
    f.is_published,

    coalesce(count(ce.id) filter (where ce.event_type = 'page_view'), 0) as page_views,
    coalesce(count(ce.id) filter (where ce.event_type = 'cta_click'), 0) as cta_clicks,
    coalesce(count(ce.id) filter (where ce.event_type = 'form_submit'), 0) as submissions,
    coalesce(count(ce.id) filter (where ce.event_type = 'lead_created'), 0) as leads_created,
    coalesce(count(ce.id) filter (where ce.event_type = 'purchase'), 0) as purchases,
    coalesce(sum(ce.value_cents) filter (where ce.event_type = 'purchase'), 0) as revenue_cents,

    case
        when count(ce.id) filter (where ce.event_type = 'page_view') = 0 then 0
        else round(
            (
                count(ce.id) filter (where ce.event_type = 'form_submit')::numeric
                / nullif(count(ce.id) filter (where ce.event_type = 'page_view'), 0)::numeric
            ) * 100,
            2
        )
    end as submission_rate,

    max(ce.created_at) as last_activity_at
from funnels f
left join conversion_events ce
    on ce.funnel_id = f.id
group by
    f.id,
    f.business_id,
    f.name,
    f.slug,
    f.status,
    f.is_published;

-- ==========================================================
-- AUTOMATIONS
-- ==========================================================

create table if not exists automations (
    id uuid primary key default gen_random_uuid(),

    business_id uuid not null
        references businesses(id)
        on delete cascade,

    title text not null,
    name text,
    description text,
    type text,
    trigger text,
    action text,
    status text default 'active',
    runs_count integer default 0,
    is_active boolean default true,
    metadata jsonb default '{}'::jsonb,

    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

alter table automations add column if not exists name text;
alter table automations add column if not exists description text;
alter table automations add column if not exists type text;
alter table automations add column if not exists status text default 'active';
alter table automations add column if not exists runs_count integer default 0;
alter table automations add column if not exists is_active boolean default true;
alter table automations add column if not exists metadata jsonb default '{}'::jsonb;
alter table automations add column if not exists updated_at timestamptz default now();

create index if not exists idx_automations_business
on automations(business_id);

create index if not exists idx_automations_status
on automations(status);

create index if not exists idx_automations_is_active
on automations(is_active);

-- ==========================================================
-- AUTOMATION EVENTS
-- Queue follow-up tasks after funnel form submissions
-- ==========================================================

create table if not exists automation_events (
    id uuid primary key default gen_random_uuid(),

    business_id uuid not null
        references businesses(id)
        on delete cascade,

    funnel_id uuid
        references funnels(id)
        on delete set null,

    funnel_page_id uuid
        references funnel_pages(id)
        on delete set null,

    lead_form_id uuid
        references lead_forms(id)
        on delete set null,

    funnel_submission_id uuid
        references funnel_submissions(id)
        on delete set null,

    lead_id uuid
        references leads(id)
        on delete set null,

    event_type text not null default 'funnel_lead_submitted',
    status text not null default 'pending',

    recipient_email text,
    recipient_phone text,
    recipient_name text,

    subject text,
    message text,

    scheduled_for timestamptz not null default now(),
    sent_at timestamptz,

    attempts integer not null default 0,
    last_error text,

    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint automation_events_status_check check (
        status in ('pending', 'processing', 'sent', 'failed', 'cancelled')
    ),

    constraint automation_events_event_type_check check (
        event_type in (
            'funnel_lead_submitted',
            'lead_follow_up',
            'booking_request_follow_up',
            'customer_thank_you',
            'internal_notification',
            'custom'
        )
    )
);

alter table automation_events add column if not exists funnel_id uuid references funnels(id) on delete set null;
alter table automation_events add column if not exists funnel_page_id uuid references funnel_pages(id) on delete set null;
alter table automation_events add column if not exists lead_form_id uuid references lead_forms(id) on delete set null;
alter table automation_events add column if not exists funnel_submission_id uuid references funnel_submissions(id) on delete set null;
alter table automation_events add column if not exists lead_id uuid references leads(id) on delete set null;
alter table automation_events add column if not exists event_type text not null default 'funnel_lead_submitted';
alter table automation_events add column if not exists status text not null default 'pending';
alter table automation_events add column if not exists recipient_email text;
alter table automation_events add column if not exists recipient_phone text;
alter table automation_events add column if not exists recipient_name text;
alter table automation_events add column if not exists subject text;
alter table automation_events add column if not exists message text;
alter table automation_events add column if not exists scheduled_for timestamptz not null default now();
alter table automation_events add column if not exists sent_at timestamptz;
alter table automation_events add column if not exists attempts integer not null default 0;
alter table automation_events add column if not exists last_error text;
alter table automation_events add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table automation_events add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_automation_events_business
on automation_events(business_id);

create index if not exists idx_automation_events_funnel
on automation_events(funnel_id);

create index if not exists idx_automation_events_funnel_page
on automation_events(funnel_page_id);

create index if not exists idx_automation_events_lead_form
on automation_events(lead_form_id);

create index if not exists idx_automation_events_submission
on automation_events(funnel_submission_id);

create index if not exists idx_automation_events_lead
on automation_events(lead_id);

create index if not exists idx_automation_events_status
on automation_events(status);

create index if not exists idx_automation_events_event_type
on automation_events(event_type);

create index if not exists idx_automation_events_scheduled_for
on automation_events(scheduled_for);

create index if not exists idx_automation_events_created_at
on automation_events(created_at desc);

-- ==========================================================
-- AI GENERATIONS
-- ==========================================================

create table if not exists ai_generations (
    id uuid primary key default gen_random_uuid(),

    business_id uuid not null
        references businesses(id)
        on delete cascade,

    module text not null,
    prompt text,
    response jsonb,

    created_at timestamptz default now()
);

create index if not exists idx_ai_generations_business
on ai_generations(business_id);

-- ==========================================================
-- MARKETPLACE ITEMS
-- ==========================================================

create table if not exists marketplace_items (
    id uuid primary key default gen_random_uuid(),

    title text not null,
    description text,
    category text,
    icon text,
    price_cents integer default 0,
    is_active boolean default true,

    created_at timestamptz default now()
);

create index if not exists idx_marketplace_category
on marketplace_items(category);

-- ==========================================================
-- INSTALLED APPS
-- ==========================================================

create table if not exists installed_apps (
    id uuid primary key default gen_random_uuid(),

    business_id uuid not null
        references businesses(id)
        on delete cascade,

    app_name text not null,
    settings jsonb default '{}'::jsonb,

    installed_at timestamptz default now()
);

create index if not exists idx_installed_apps_business
on installed_apps(business_id);

-- ==========================================================
-- BUSINESS ANALYTICS
-- ==========================================================

create table if not exists business_analytics (
    id uuid primary key default gen_random_uuid(),

    business_id uuid not null
        references businesses(id)
        on delete cascade,

    metric text not null,
    value numeric default 0,

    recorded_at timestamptz default now()
);

create index if not exists idx_business_analytics_business
on business_analytics(business_id);

-- ==========================================================
-- AI EMPLOYEE ACTIVITY
-- ==========================================================

create table if not exists ai_employee_logs (
    id uuid primary key default gen_random_uuid(),

    business_id uuid not null
        references businesses(id)
        on delete cascade,

    ai_agent_id uuid
        references ai_agents(id)
        on delete cascade,

    activity text,
    metadata jsonb default '{}'::jsonb,

    created_at timestamptz default now()
);

create index if not exists idx_ai_logs_business
on ai_employee_logs(business_id);

-- ==========================================================
-- WEBSITE VISITS
-- ==========================================================

create table if not exists website_visits (
    id uuid primary key default gen_random_uuid(),

    business_id uuid not null
        references businesses(id)
        on delete cascade,

    visitor_ip text,
    country text,
    page text,
    referrer text,
    device text,

    created_at timestamptz default now()
);

create index if not exists idx_visits_business
on website_visits(business_id);

-- ==========================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ==========================================================

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists set_conversations_updated_at on conversations;
create trigger set_conversations_updated_at
before update on conversations
for each row
execute function set_updated_at();

drop trigger if exists set_leads_updated_at on leads;
create trigger set_leads_updated_at
before update on leads
for each row
execute function set_updated_at();

drop trigger if exists set_funnels_updated_at on funnels;
create trigger set_funnels_updated_at
before update on funnels
for each row
execute function set_updated_at();

drop trigger if exists set_funnel_pages_updated_at on funnel_pages;
create trigger set_funnel_pages_updated_at
before update on funnel_pages
for each row
execute function set_updated_at();

drop trigger if exists set_lead_forms_updated_at on lead_forms;
create trigger set_lead_forms_updated_at
before update on lead_forms
for each row
execute function set_updated_at();

drop trigger if exists set_funnel_submissions_updated_at on funnel_submissions;
create trigger set_funnel_submissions_updated_at
before update on funnel_submissions
for each row
execute function set_updated_at();

drop trigger if exists set_automations_updated_at on automations;
create trigger set_automations_updated_at
before update on automations
for each row
execute function set_updated_at();

drop trigger if exists set_automation_events_updated_at on automation_events;
create trigger set_automation_events_updated_at
before update on automation_events
for each row
execute function set_updated_at();

-- ==========================================================
-- RLS
-- Supabase service role still bypasses RLS through supabaseAdmin.
-- Current app uses API routes with supabaseAdmin.
-- ==========================================================

alter table funnels enable row level security;
alter table funnel_pages enable row level security;
alter table lead_forms enable row level security;
alter table funnel_submissions enable row level security;
alter table conversion_events enable row level security;
alter table automation_events enable row level security;

drop policy if exists "Public can read published funnels" on funnels;
create policy "Public can read published funnels"
on funnels
for select
using (status = 'published' or is_published = true);

drop policy if exists "Public can read published funnel pages" on funnel_pages;
create policy "Public can read published funnel pages"
on funnel_pages
for select
using (status = 'published' or is_published = true);

drop policy if exists "Public can read published lead forms" on lead_forms;
create policy "Public can read published lead forms"
on lead_forms
for select
using (
    is_active = true
    and (status = 'published' or is_published = true)
);

drop policy if exists "Public can create funnel submissions" on funnel_submissions;
create policy "Public can create funnel submissions"
on funnel_submissions
for insert
with check (true);

drop policy if exists "Public can create conversion events" on conversion_events;
create policy "Public can create conversion events"
on conversion_events
for insert
with check (true);

drop policy if exists "Public can create automation events" on automation_events;
create policy "Public can create automation events"
on automation_events
for insert
with check (true);

-- ==========================================================
-- END
-- ==========================================================