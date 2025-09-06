import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { z } from "zod"

// Schema for adding an exercise to a workout
const addExerciseSchema = z.object({
  exercise_id: z.string().uuid(),
  notes: z.string().optional(),
  set_order: z.number().int().positive().optional(),
  sets: z.array(
    z.object({
      set_number: z.number().int().positive(),
      weight_kg: z.number().positive().optional(),
      reps: z.number().int().positive().optional(),
      duration_seconds: z.number().int().positive().optional(),
      rpe: z.number().int().min(1).max(10).optional(),
      notes: z.string().optional(),
    })
  ).optional(),
})

export async function POST(
  request: Request,
  { params }: { params: { workoutId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Validate request body
    const body = await request.json()
    const validation = addExerciseSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.issues },
        { status: 400 }
      )
    }

    // Check if the user owns this workout
    const { data: workout, error: workoutError } = await supabase
      .from("workouts")
      .select("user_id")
      .eq("id", params.workoutId)
      .single()

    if (workoutError) {
      if (workoutError.code === 'PGRST116') { // Not found
        return NextResponse.json(
          { error: "Workout not found" },
          { status: 404 }
        )
      }
      
      console.error("Error fetching workout:", workoutError)
      return NextResponse.json(
        { error: "Failed to fetch workout" },
        { status: 500 }
      )
    }

    if (workout.user_id !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // Start a transaction
    const { data: exercise, error: exerciseError } = await supabase
      .from("workout_exercises")
      .insert([
        {
          workout_id: params.workoutId,
          exercise_id: validation.data.exercise_id,
          notes: validation.data.notes,
          set_order: validation.data.set_order || 0,
        },
      ])
      .select()
      .single()

    if (exerciseError) {
      console.error("Error adding exercise to workout:", exerciseError)
      return NextResponse.json(
        { error: "Failed to add exercise to workout" },
        { status: 500 }
      )
    }

    // Add sets if provided
    if (validation.data.sets && validation.data.sets.length > 0) {
      const setsToInsert = validation.data.sets.map((set) => ({
        workout_exercise_id: exercise.id,
        set_number: set.set_number,
        weight_kg: set.weight_kg,
        reps: set.reps,
        duration_seconds: set.duration_seconds,
        rpe: set.rpe,
        notes: set.notes,
      }))

      const { error: setsError } = await supabase
        .from("exercise_sets")
        .insert(setsToInsert)

      if (setsError) {
        console.error("Error adding sets to exercise:", setsError)
        // Continue even if sets fail to be added
      }
    }

    // Get the full exercise details to return
    const { data: fullExercise, error: fetchError } = await supabase
      .from("workout_exercises")
      .select(
        `
        *,
        exercise:exercises (
          id,
          name,
          category,
          muscle_group
        ),
        sets:exercise_sets (
          id,
          set_number,
          weight_kg,
          reps,
          duration_seconds,
          rpe,
          notes
        )
      `
      )
      .eq("id", exercise.id)
      .single()

    if (fetchError) {
      console.error("Error fetching full exercise details:", fetchError)
      return NextResponse.json(exercise) // Return basic exercise if we can't get full details
    }

    return NextResponse.json(fullExercise, { status: 201 })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: { workoutId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check if the user owns this workout
    const { data: workout, error: workoutError } = await supabase
      .from("workouts")
      .select("user_id")
      .eq("id", params.workoutId)
      .single()

    if (workoutError) {
      if (workoutError.code === 'PGRST116') { // Not found
        return NextResponse.json(
          { error: "Workout not found" },
          { status: 404 }
        )
      }
      
      console.error("Error fetching workout:", workoutError)
      return NextResponse.json(
        { error: "Failed to fetch workout" },
        { status: 500 }
      )
    }

    if (workout.user_id !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // Get all exercises for this workout
    const { data: exercises, error } = await supabase
      .from("workout_exercises")
      .select(
        `
        *,
        exercise:exercises (
          id,
          name,
          category,
          muscle_group
        ),
        sets:exercise_sets (
          id,
          set_number,
          weight_kg,
          reps,
          duration_seconds,
          rpe,
          notes
        )
      `
      )
      .eq("workout_id", params.workoutId)
      .order("set_order", { ascending: true })

    if (error) {
      console.error("Error fetching exercises:", error)
      return NextResponse.json(
        { error: "Failed to fetch exercises" },
        { status: 500 }
      )
    }

    return NextResponse.json(exercises)
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
