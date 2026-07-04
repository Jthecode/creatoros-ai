-- ==========================================================
-- CreatorOS AI
-- Phase 2 Database Upgrade + Step 9.1 Automation Events
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

alter table leads
add column if not exists full_name text;

alter table leads
add column if not exists name text;

alter table leads
add column if not exists email text;

alter table leads
add column if not exists phone text;

alter table leads
add column if not exists company text;

alter table leads
add column if not exists source text;

alter table leads
add column if not exists stage text default 'new';

alter table leads
add column if not exists status text default 'new';

alter table leads
add column if not exists message text;

alter table leads
add column if not exists notes text;

alter table leads
add column if not exists metadata jsonb default '{}'::jsonb;

alter table leads
add column if not exists updated_at timestamptz default now();

create index if not exists idx_leads_business
on leads(business_id);

create index if not exists idx_leads_email
on leads(email);

create index if not exists idx_leads_status
on leads(status);

create index if not exists idx_leads_created_at
on leads(created_at desc);

-- ==========================================================
-- AUTOMATIONS
-- ==========================================================

create table if not exists automations (
    id uuid primary key default gen_random_uuid(),

    business_id uuid not null
        references businesses(id)
        on delete cascade,

    title text not null,
    trigger text,
    action text,
    is_active boolean default true,

    created_at timestamptz default now()
);

create index if not exists idx_automations_business
on automations(business_id);

-- ==========================================================
-- STEP 9.1 AUTOMATION EVENTS
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

drop trigger if exists set_automation_events_updated_at on automation_events;

create trigger set_automation_events_updated_at
before update on automation_events
for each row
execute function set_updated_at();

-- ==========================================================
-- RLS
-- Supabase service role still bypasses RLS through supabaseAdmin.
-- ==========================================================

alter table automation_events enable row level security;

-- Optional public insert policy if you ever submit directly from anon client.
-- Your current app uses API routes with supabaseAdmin, so this is safe to skip,
-- but keeping it here prevents blocked inserts if anon insert is used later.

drop policy if exists "Public can create automation events" on automation_events;

create policy "Public can create automation events"
on automation_events
for insert
with check (true);

-- ==========================================================
-- END
-- ==========================================================