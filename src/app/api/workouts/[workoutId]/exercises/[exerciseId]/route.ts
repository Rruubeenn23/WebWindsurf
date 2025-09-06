import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { z } from "zod"

// Schema for updating a workout exercise
const updateExerciseSchema = z.object({
  notes: z.string().optional(),
  set_order: z.number().int().positive().optional(),
})

// Schema for adding/updating sets
const setSchema = z.object({
  id: z.string().uuid().optional(),
  set_number: z.number().int().positive(),
  weight_kg: z.number().positive().optional(),
  reps: z.number().int().positive().optional(),
  duration_seconds: z.number().int().positive().optional(),
  rpe: z.number().int().min(1).max(10).optional(),
  notes: z.string().optional(),
})

// Helper function to verify workout ownership
async function verifyWorkoutOwnership(
  supabase: ReturnType<typeof createRouteHandlerClient>,
  workoutId: string,
  userId: string
) {
  const { data: workout, error } = await supabase
    .from("workouts")
    .select("user_id")
    .eq("id", workoutId)
    .single()

  if (error) {
    return { error: "Workout not found", status: 404 }
  }

  if (workout.user_id !== userId) {
    return { error: "Forbidden", status: 403 }
  }

  return { success: true }
}

export async function GET(
  request: Request,
  { params }: { params: { workoutId: string; exerciseId: string } }
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

    // Verify workout ownership
    const ownershipCheck = await verifyWorkoutOwnership(
      supabase,
      params.workoutId,
      session.user.id
    )
    
    if ('error' in ownershipCheck) {
      return NextResponse.json(
        { error: ownershipCheck.error },
        { status: ownershipCheck.status }
      )
    }

    // Get the exercise with its sets
    const { data: exercise, error } = await supabase
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
      .eq("id", params.exerciseId)
      .eq("workout_id", params.workoutId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json(
          { error: "Exercise not found in this workout" },
          { status: 404 }
        )
      }
      
      console.error("Error fetching exercise:", error)
      return NextResponse.json(
        { error: "Failed to fetch exercise" },
        { status: 500 }
      )
    }

    return NextResponse.json(exercise)
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { workoutId: string; exerciseId: string } }
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

    // Verify workout ownership
    const ownershipCheck = await verifyWorkoutOwnership(
      supabase,
      params.workoutId,
      session.user.id
    )
    
    if ('error' in ownershipCheck) {
      return NextResponse.json(
        { error: ownershipCheck.error },
        { status: ownershipCheck.status }
      )
    }

    // Validate request body
    const body = await request.json()
    const validation = updateExerciseSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.issues },
        { status: 400 }
      )
    }

    // Update the exercise
    const { data: exercise, error } = await supabase
      .from("workout_exercises")
      .update(validation.data)
      .eq("id", params.exerciseId)
      .eq("workout_id", params.workoutId)
      .select()
      .single()

    if (error) {
      console.error("Error updating exercise:", error)
      return NextResponse.json(
        { error: "Failed to update exercise" },
        { status: 500 }
      )
    }

    return NextResponse.json(exercise)
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { workoutId: string; exerciseId: string } }
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

    // Verify workout ownership
    const ownershipCheck = await verifyWorkoutOwnership(
      supabase,
      params.workoutId,
      session.user.id
    )
    
    if ('error' in ownershipCheck) {
      return NextResponse.json(
        { error: ownershipCheck.error },
        { status: ownershipCheck.status }
      )
    }

    // Delete the exercise (cascading delete will handle related sets)
    const { error } = await supabase
      .from("workout_exercises")
      .delete()
      .eq("id", params.exerciseId)
      .eq("workout_id", params.workoutId)

    if (error) {
      console.error("Error deleting exercise:", error)
      return NextResponse.json(
        { error: "Failed to delete exercise" },
        { status: 500 }
      )
    }

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

// Endpoint to update sets for an exercise
export async function PUT(
  request: Request,
  { params }: { params: { workoutId: string; exerciseId: string } }
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

    // Verify workout ownership
    const ownershipCheck = await verifyWorkoutOwnership(
      supabase,
      params.workoutId,
      session.user.id
    )
    
    if ('error' in ownershipCheck) {
      return NextResponse.json(
        { error: ownershipCheck.error },
        { status: ownershipCheck.status }
      )
    }

    // Validate request body
    const body = await request.json()
    const setsValidation = z.array(setSchema).safeParse(body)
    
    if (!setsValidation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: setsValidation.error.issues },
        { status: 400 }
      )
    }

    // Verify the exercise exists in this workout
    const { data: exercise, error: exerciseError } = await supabase
      .from("workout_exercises")
      .select("id")
      .eq("id", params.exerciseId)
      .eq("workout_id", params.workoutId)
      .single()

    if (exerciseError) {
      return NextResponse.json(
        { error: "Exercise not found in this workout" },
        { status: 404 }
      )
    }

    // Start a transaction
    const { data: result, error } = await supabase.rpc('update_exercise_sets', {
      p_exercise_id: params.exerciseId,
      p_sets: setsValidation.data.map(set => ({
        id: set.id,
        set_number: set.set_number,
        weight_kg: set.weight_kg,
        reps: set.reps,
        duration_seconds: set.duration_seconds,
        rpe: set.rpe,
        notes: set.notes
      }))
    })

    if (error) {
      console.error("Error updating sets:", error)
      return NextResponse.json(
        { error: "Failed to update sets" },
        { status: 500 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
