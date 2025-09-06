-- Enable UUID extension
create extension if not exists "uuid-ossp" with schema extensions;

-- Create a table for user profiles
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  first_name text,
  last_name text,
  username text unique,
  avatar_url text,
  date_of_birth date,
  height_cm numeric,
  weight_kg numeric,
  fitness_goal text,
  activity_level text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Create a table for food items
create table public.foods (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  brand text,
  serving_size_g numeric not null,
  calories numeric not null,
  protein_g numeric not null,
  carbs_g numeric not null,
  fat_g numeric not null,
  is_verified boolean default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Create a table for user's food diary entries
create table public.food_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  food_id uuid references public.foods(id) on delete cascade not null,
  serving_count numeric not null default 1,
  meal_type text,
  consumed_at timestamptz default now() not null,
  created_at timestamptz default now() not null
);

-- Create a table for exercises
create table public.exercises (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text,
  muscle_group text,
  is_verified boolean default false,
  created_at timestamptz default now() not null
);

-- Create a table for workout sessions
create table public.workouts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text,
  started_at timestamptz not null,
  ended_at timestamptz,
  created_at timestamptz default now() not null
);

-- Create a table for workout exercises
create table public.workout_exercises (
  id uuid primary key default uuid_generate_v4(),
  workout_id uuid references public.workouts(id) on delete cascade not null,
  exercise_id uuid references public.exercises(id) on delete cascade not null,
  set_order smallint not null,
  created_at timestamptz default now() not null
);

-- Create a table for exercise sets
create table public.exercise_sets (
  id uuid primary key default uuid_generate_v4(),
  workout_exercise_id uuid references public.workout_exercises(id) on delete cascade not null,
  set_number smallint not null,
  weight_kg numeric,
  reps integer,
  created_at timestamptz default now() not null
);

-- Create a table for water intake
create table public.water_intake (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  amount_ml integer not null,
  consumed_at timestamptz default now() not null
);

-- Create a function to update the updated_at column
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger set_foods_updated_at
  before update on public.foods
  for each row execute function public.handle_updated_at();

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.foods enable row level security;
alter table public.food_entries enable row level security;
alter table public.exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.exercise_sets enable row level security;
alter table public.water_intake enable row level security;

-- Create RLS policies for profiles
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Create RLS policies for food_entries
create policy "Users can view their own food entries"
  on public.food_entries for select
  using (auth.uid() = user_id);

create policy "Users can manage their own food entries"
  on public.food_entries for all
  using (auth.uid() = user_id);

-- Create RLS policies for workouts
create policy "Users can view their own workouts"
  on public.workouts for select
  using (auth.uid() = user_id);

create policy "Users can manage their own workouts"
  on public.workouts for all
  using (auth.uid() = user_id);

-- Create RLS policies for water intake
create policy "Users can view their own water intake"
  on public.water_intake for select
  using (auth.uid() = user_id);

create policy "Users can manage their own water intake"
  on public.water_intake for all
  using (auth.uid() = user_id);

-- Create a function to handle new user signups
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, first_name, last_name, username)
  values (
    new.id, 
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'username'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Create a trigger to handle new user signups
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
