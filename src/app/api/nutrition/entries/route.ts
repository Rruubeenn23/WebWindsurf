import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { z } from "zod"

// Schema for validating food entry data
const foodEntrySchema = z.object({
  food_id: z.string().uuid(),
  serving_count: z.number().positive(),
  meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional(),
  consumed_at: z.string().datetime().optional(),
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
    const validation = foodEntrySchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.issues },
        { status: 400 }
      )
    }

    const { food_id, serving_count, meal_type, consumed_at } = validation.data

    // Insert the food entry
    const { data, error } = await supabase
      .from("food_entries")
      .insert([
        {
          user_id: session.user.id,
          food_id,
          serving_count,
          meal_type,
          consumed_at: consumed_at || new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error adding food entry:", error)
      return NextResponse.json(
        { error: "Failed to add food entry" },
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
    const date = searchParams.get("date")
    
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Build the query
    let query = supabase
      .from("food_entries")
      .select(
        `
        id,
        serving_count,
        meal_type,
        consumed_at,
        food:foods (
          id,
          name,
          brand,
          serving_size_g,
          calories,
          protein_g,
          carbs_g,
          fat_g
        )
      `
      )
      .eq("user_id", session.user.id)
      .order("consumed_at", { ascending: false })

    // Filter by date if provided
    if (date) {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)
      
      query = query
        .gte("consumed_at", startOfDay.toISOString())
        .lte("consumed_at", endOfDay.toISOString())
    }

    // Execute the query
    const { data, error } = await query

    if (error) {
      console.error("Error fetching food entries:", error)
      return NextResponse.json(
        { error: "Failed to fetch food entries" },
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
