-- ==========================================================
-- CreatorOS AI
-- Phase 2 Database Upgrade
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

    email text,

    phone text,

    company text,

    source text,

    stage text default 'new',

    notes text,

    created_at timestamptz default now()

);

create index if not exists idx_leads_business
on leads(business_id);

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
-- END
-- ==========================================================