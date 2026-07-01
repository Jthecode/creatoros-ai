-- =====================================================
-- CreatorOS AI
-- Initial Database Schema
-- =====================================================

create extension if not exists "pgcrypto";

--------------------------------------------------------
-- Profiles
--------------------------------------------------------

create table if not exists profiles (
    id uuid primary key default gen_random_uuid(),
    auth_user_id uuid unique,
    full_name text,
    email text unique,
    avatar_url text,
    plan text default 'free',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

--------------------------------------------------------
-- Businesses
--------------------------------------------------------

create table if not exists businesses (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid references profiles(id) on delete cascade,

    name text not null,
    slug text unique not null,

    tagline text,
    description text,

    industry text,
    audience text,

    logo_url text,
    banner_url text,

    brand_voice text,

    storefront_headline text,
    storefront_subheadline text,

    generated_data jsonb,

    status text default 'draft',

    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

--------------------------------------------------------
-- Products
--------------------------------------------------------

create table if not exists products (
    id uuid primary key default gen_random_uuid(),

    business_id uuid references businesses(id) on delete cascade,

    name text not null,
    description text,

    price_cents integer default 0,

    currency text default 'USD',

    type text default 'digital',

    status text default 'draft',

    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

--------------------------------------------------------
-- AI Employees
--------------------------------------------------------

create table if not exists ai_agents (
    id uuid primary key default gen_random_uuid(),

    business_id uuid references businesses(id) on delete cascade,

    name text,

    role text,

    opening_message text,

    instructions text,

    is_active boolean default true,

    created_at timestamptz default now()
);

--------------------------------------------------------
-- Orders
--------------------------------------------------------

create table if not exists orders (
    id uuid primary key default gen_random_uuid(),

    business_id uuid references businesses(id) on delete cascade,

    customer_email text,

    total_cents integer default 0,

    currency text default 'USD',

    status text default 'pending',

    created_at timestamptz default now()
);