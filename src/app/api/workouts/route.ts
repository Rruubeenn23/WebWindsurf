import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { z } from "zod"

// Schema for creating a workout
const createWorkoutSchema = z.object({
  name: z.string().optional(),
  notes: z.string().optional(),
  started_at: z.string().datetime().optional(),
  ended_at: z.string().datetime().optional(),
})

export async function POST(request: Request) {
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
    const validation = createWorkoutSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.issues },
        { status: 400 }
      )
    }

    // Create the workout
    const { data, error } = await supabase
      .from("workouts")
      .insert([
        {
          user_id: session.user.id,
          name: validation.data.name,
          notes: validation.data.notes,
          started_at: validation.data.started_at || new Date().toISOString(),
          ended_at: validation.data.ended_at,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating workout:", error)
      return NextResponse.json(
        { error: "Failed to create workout" },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "10")
    const offset = parseInt(searchParams.get("offset") || "0")
    
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get paginated workouts with exercise count
    const { data: workouts, error, count } = await supabase
      .from("workouts")
      .select(
        `
        *,
        workout_exercises (
          id
        )
      `,
        { count: 'exact' }
      )
      .eq("user_id", session.user.id)
      .order("started_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching workouts:", error)
      return NextResponse.json(
        { error: "Failed to fetch workouts" },
        { status: 500 }
      )
    }

    // Transform data to include exercise count
    const workoutsWithExerciseCount = workouts.map(workout => ({
      ...workout,
      exercise_count: workout.workout_exercises?.length || 0
    }))

    return NextResponse.json({
      data: workoutsWithExerciseCount,
      total: count,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
