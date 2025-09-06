import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { z } from "zod"

// Schema for updating a workout
const updateWorkoutSchema = z.object({
  name: z.string().optional(),
  notes: z.string().optional(),
  started_at: z.string().datetime().optional(),
  ended_at: z.string().datetime().optional(),
})

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
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

    // Get the workout with exercises and sets
    const { data: workout, error } = await supabase
      .from("workouts")
      .select(
        `
        *,
        workout_exercises (
          id,
          set_order,
          notes,
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
        )
      `
      )
      .eq("id", params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json(
          { error: "Workout not found" },
          { status: 404 }
        )
      }
      
      console.error("Error fetching workout:", error)
      return NextResponse.json(
        { error: "Failed to fetch workout" },
        { status: 500 }
      )
    }

    // Check if the user owns this workout
    if (workout.user_id !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    return NextResponse.json(workout)
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
  { params }: { params: { id: string } }
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
    const validation = updateWorkoutSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.issues },
        { status: 400 }
      )
    }

    // Check if the user owns this workout
    const { data: existingWorkout, error: fetchError } = await supabase
      .from("workouts")
      .select("user_id")
      .eq("id", params.id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') { // Not found
        return NextResponse.json(
          { error: "Workout not found" },
          { status: 404 }
        )
      }
      
      console.error("Error fetching workout:", fetchError)
      return NextResponse.json(
        { error: "Failed to fetch workout" },
        { status: 500 }
      )
    }

    if (existingWorkout?.user_id !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // Update the workout
    const { data, error } = await supabase
      .from("workouts")
      .update(validation.data)
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating workout:", error)
      return NextResponse.json(
        { error: "Failed to update workout" },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
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
  { params }: { params: { id: string } }
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
    const { data: existingWorkout, error: fetchError } = await supabase
      .from("workouts")
      .select("user_id")
      .eq("id", params.id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') { // Not found
        return NextResponse.json(
          { error: "Workout not found" },
          { status: 404 }
        )
      }
      
      console.error("Error fetching workout:", fetchError)
      return NextResponse.json(
        { error: "Failed to fetch workout" },
        { status: 500 }
      )
    }

    if (existingWorkout?.user_id !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // Delete the workout (cascading delete will handle related records)
    const { error } = await supabase
      .from("workouts")
      .delete()
      .eq("id", params.id)

    if (error) {
      console.error("Error deleting workout:", error)
      return NextResponse.json(
        { error: "Failed to delete workout" },
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
