-- Create a type for set data
create type set_data as (
  id uuid,
  set_number smallint,
  weight_kg numeric,
  reps integer,
  duration_seconds integer,
  rpe smallint,
  notes text
);

-- Function to update exercise sets
create or replace function update_exercise_sets(
  p_exercise_id uuid,
  p_sets set_data[]
)
returns jsonb
language plpgsql
as $$
declare
  result jsonb;
  s set_data;
  updated_sets jsonb[] := '{}';
begin
  -- Delete sets that are not in the provided list
  delete from exercise_sets
  where 
    workout_exercise_id = p_exercise_id
    and id not in (
      select (s->>'id')::uuid
      from jsonb_array_elements(to_jsonb(p_sets)::jsonb) as s
      where (s->>'id') is not null
    );

  -- Update or insert each set
  foreach s in array p_sets
  loop
    if s.id is not null then
      -- Update existing set
      update exercise_sets
      set
        set_number = s.set_number,
        weight_kg = s.weight_kg,
        reps = s.reps,
        duration_seconds = s.duration_seconds,
        rpe = s.rpe,
        notes = s.notes,
        updated_at = now()
      where id = s.id
      and workout_exercise_id = p_exercise_id
      returning to_jsonb(es) into result;
    else
      -- Insert new set
      insert into exercise_sets (
        workout_exercise_id,
        set_number,
        weight_kg,
        reps,
        duration_seconds,
        rpe,
        notes
      )
      values (
        p_exercise_id,
        s.set_number,
        s.weight_kg,
        s.reps,
        s.duration_seconds,
        s.rpe,
        s.notes
      )
      returning to_jsonb(es) into result;
    end if;

    -- Add to result array
    updated_sets := array_append(updated_sets, result);
  end loop;

  -- Return the updated sets
  return jsonb_build_object(
    'exercise_id', p_exercise_id,
    'sets', array_to_json(updated_sets)::jsonb
  );
exception
  when others then
    raise exception 'Error updating sets: %', sqlerrm;
end;
$$;

-- Function to get workout summary
create or replace function get_workout_summary(p_workout_id uuid)
returns jsonb
language plpgsql
as $$
declare
  result jsonb;
  total_volume numeric := 0;
  total_sets integer := 0;
  total_reps integer := 0;
  total_duration interval := '0 seconds';
  exercise_count integer;
  workout_data jsonb;
begin
  -- Get basic workout info
  select to_jsonb(w) into workout_data
  from workouts w
  where w.id = p_workout_id;

  -- Get exercise count
  select count(*) into exercise_count
  from workout_exercises
  where workout_id = p_workout_id;

  -- Calculate totals
  select 
    coalesce(sum(es.weight_kg * es.reps), 0),
    count(es.id),
    coalesce(sum(es.reps), 0),
    coalesce(sum(es.duration_seconds), 0) * interval '1 second'
  into total_volume, total_sets, total_reps, total_duration
  from exercise_sets es
  join workout_exercises we on es.workout_exercise_id = we.id
  where we.workout_id = p_workout_id;

  -- Build the result
  result := jsonb_build_object(
    'workout', workout_data,
    'summary', jsonb_build_object(
      'exercise_count', exercise_count,
      'total_volume_kg', total_volume,
      'total_sets', total_sets,
      'total_reps', total_reps,
      'total_duration_seconds', extract(epoch from total_duration)::integer
    )
  );

  return result;
exception
  when others then
    raise exception 'Error getting workout summary: %', sqlerrm;
end;
$$;

-- Function to get user's workout statistics
create or replace function get_user_workout_stats(p_user_id uuid, p_days integer default 30)
returns jsonb
language plpgsql
as $$
declare
  result jsonb;
  start_date timestamp with time zone;
begin
  -- Calculate start date based on days parameter
  start_date := now() - (p_days * interval '1 day');

  -- Get workout statistics
  select jsonb_build_object(
    'total_workouts', count(distinct w.id),
    'total_exercises', count(we.id),
    'total_sets', count(es.id),
    'total_volume_kg', coalesce(sum(es.weight_kg * es.reps), 0),
    'total_duration_minutes', 
      coalesce(extract(epoch from sum(
        w.ended_at - w.started_at
      )) / 60, 0),
    'average_workout_duration_minutes',
      case 
        when count(distinct w.id) > 0 
        then extract(epoch from avg(
          w.ended_at - w.started_at
        )) / 60 
        else 0 
      end,
    'workouts_by_day', (
      select jsonb_object_agg(
        to_char(date_trunc('day', w.started_at), 'YYYY-MM-DD'),
        count(w.id)
      )
      from workouts w
      where 
        w.user_id = p_user_id
        and w.started_at >= start_date
      group by date_trunc('day', w.started_at)
    ),
    'top_exercises', (
      select jsonb_agg(
        jsonb_build_object(
          'exercise_id', e.id,
          'exercise_name', e.name,
          'total_sets', count(es.id),
          'total_volume_kg', coalesce(sum(es.weight_kg * es.reps), 0)
        )
        order by count(es.id) desc
        limit 5
      )
      from workout_exercises we
      join exercises e on we.exercise_id = e.id
      left join exercise_sets es on we.id = es.workout_exercise_id
      join workouts w on we.workout_id = w.id
      where 
        w.user_id = p_user_id
        and w.started_at >= start_date
      group by e.id, e.name
    )
  ) into result
  from workouts w
  left join workout_exercises we on w.id = we.workout_id
  left join exercise_sets es on we.id = es.workout_exercise_id
  where 
    w.user_id = p_user_id
    and w.started_at >= start_date;

  return result;
exception
  when others then
    raise exception 'Error getting user workout stats: %', sqlerrm;
end;
$$;
