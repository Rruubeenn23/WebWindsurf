-- Function to get nutrition summary for a date range
create or replace function get_nutrition_summary(
  p_user_id uuid,
  p_start_date timestamp with time zone,
  p_end_date timestamp with time zone
)
returns table (
  consumed_at timestamp with time zone,
  food_name text,
  food_id uuid,
  calories numeric,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric
)
language plpgsql
as $$
begin
  return query
  select 
    fe.consumed_at,
    f.name as food_name,
    f.id as food_id,
    f.calories * fe.serving_count as calories,
    f.protein_g * fe.serving_count as protein_g,
    f.carbs_g * fe.serving_count as carbs_g,
    f.fat_g * fe.serving_count as fat_g
  from food_entries fe
  join foods f on fe.food_id = f.id
  where 
    fe.user_id = p_user_id
    and fe.consumed_at between p_start_date and p_end_date
  order by fe.consumed_at desc;
end;
$$;

-- Function to get nutrition trends
create or replace function get_nutrition_trends(
  p_user_id uuid,
  p_days integer default 30
)
returns jsonb
language plpgsql
as $$
declare
  result jsonb;
  start_date timestamp with time zone;
  end_date timestamp with time zone;
  date_range text[];
  date_record record;
  daily_data jsonb := '{}';
  current_date date;
  daily_calories numeric;
  daily_protein numeric;
  daily_carbs numeric;
  daily_fat numeric;
begin
  -- Calculate date range
  end_date := now();
  start_date := end_date - (p_days * interval '1 day');
  
  -- Initialize date range array
  for i in 0..p_days-1 loop
    date_range := array_append(
      date_range, 
      to_char(end_date - (i * interval '1 day'), 'YYYY-MM-DD')
    );
  end loop;
  
  -- Get daily nutrition data
  for date_record in 
    select 
      date_trunc('day', fe.consumed_at) as date,
      sum(f.calories * fe.serving_count) as calories,
      sum(f.protein_g * fe.serving_count) as protein_g,
      sum(f.carbs_g * fe.serving_count) as carbs_g,
      sum(f.fat_g * fe.serving_count) as fat_g
    from food_entries fe
    join foods f on fe.food_id = f.id
    where 
      fe.user_id = p_user_id
      and fe.consumed_at between start_date and end_date
    group by date_trunc('day', fe.consumed_at)
    order by date
  loop
    daily_data := jsonb_set(
      daily_data,
      array[to_char(date_record.date, 'YYYY-MM-DD')],
      jsonb_build_object(
        'calories', coalesce(date_record.calories, 0),
        'protein_g', coalesce(date_record.protein_g, 0),
        'carbs_g', coalesce(date_record.carbs_g, 0),
        'fat_g', coalesce(date_record.fat_g, 0)
      )
    );
  end loop;
  
  -- Calculate weekly averages
  with weekly_avg as (
    select 
      date_trunc('week', date_trunc('day', fe.consumed_at)) as week_start,
      avg(f.calories * fe.serving_count) as avg_calories,
      avg(f.protein_g * fe.serving_count) as avg_protein_g,
      avg(f.carbs_g * fe.serving_count) as avg_carbs_g,
      avg(f.fat_g * fe.serving_count) as avg_fat_g
    from food_entries fe
    join foods f on fe.food_id = f.id
    where 
      fe.user_id = p_user_id
      and fe.consumed_at between start_date and end_date
    group by date_trunc('week', date_trunc('day', fe.consumed_at))
    order by week_start
  )
  select 
    jsonb_agg(
      jsonb_build_object(
        'week_start', to_char(week_start, 'YYYY-MM-DD'),
        'calories', avg_calories,
        'protein_g', avg_protein_g,
        'carbs_g', avg_carbs_g,
        'fat_g', avg_fat_g
      )
    ) into result
  from weekly_avg;
  
  -- Get top foods by calories
  with top_foods as (
    select 
      f.name as food_name,
      f.id as food_id,
      sum(f.calories * fe.serving_count) as total_calories,
      sum(f.protein_g * fe.serving_count) as total_protein_g,
      sum(f.carbs_g * fe.serving_count) as total_carbs_g,
      sum(f.fat_g * fe.serving_count) as total_fat_g,
      count(fe.id) as entry_count
    from food_entries fe
    join foods f on fe.food_id = f.id
    where 
      fe.user_id = p_user_id
      and fe.consumed_at between start_date and end_date
    group by f.id, f.name
    order by total_calories desc
    limit 5
  ) 
  select 
    jsonb_agg(
      jsonb_build_object(
        'food_name', food_name,
        'food_id', food_id,
        'total_calories', total_calories,
        'total_protein_g', total_protein_g,
        'total_carbs_g', total_carbs_g,
        'total_fat_g', total_fat_g,
        'entry_count', entry_count
      )
    ) into result
  from top_foods;
  
  -- Combine all results
  return jsonb_build_object(
    'date_range', to_jsonb(date_range),
    'daily_data', daily_data,
    'weekly_averages', result,
    'top_foods', result
  );
end;
$$;

-- Function to get macro distribution
create or replace function get_macro_distribution(
  p_user_id uuid,
  p_start_date timestamp with time zone,
  p_end_date timestamp with time zone
)
returns jsonb
language plpgsql
as $$
declare
  total_calories numeric;
  protein_calories numeric;
  carbs_calories numeric;
  fat_calories numeric;
  result jsonb;
begin
  -- Calculate total calories from each macronutrient
  select 
    sum(f.calories * fe.serving_count) as total_calories,
    sum(f.protein_g * 4 * fe.serving_count) as protein_calories,
    sum(f.carbs_g * 4 * fe.serving_count) as carbs_calories,
    sum(f.fat_g * 9 * fe.serving_count) as fat_calories
  into 
    total_calories,
    protein_calories,
    carbs_calories,
    fat_calories
  from food_entries fe
  join foods f on fe.food_id = f.id
  where 
    fe.user_id = p_user_id
    and fe.consumed_at between p_start_date and p_end_date;
  
  -- Calculate percentages
  result := jsonb_build_object(
    'total_calories', coalesce(total_calories, 0),
    'protein', jsonb_build_object(
      'calories', coalesce(protein_calories, 0),
      'percentage', case when total_calories > 0 
        then round((coalesce(protein_calories, 0) / total_calories) * 100, 1) 
        else 0 end,
      'grams', round(coalesce(protein_calories, 0) / 4, 1)
    ),
    'carbs', jsonb_build_object(
      'calories', coalesce(carbs_calories, 0),
      'percentage', case when total_calories > 0 
        then round((coalesce(carbs_calories, 0) / total_calories) * 100, 1) 
        else 0 end,
      'grams', round(coalesce(carbs_calories, 0) / 4, 1)
    ),
    'fat', jsonb_build_object(
      'calories', coalesce(fat_calories, 0),
      'percentage', case when total_calories > 0 
        then round((coalesce(fat_calories, 0) / total_calories) * 100, 1) 
        else 0 end,
      'grams', round(coalesce(fat_calories, 0) / 9, 1)
    )
  );
  
  return result;
exception
  when others then
    raise exception 'Error calculating macro distribution: %', sqlerrm;
end;
$$;
