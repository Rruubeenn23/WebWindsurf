import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { z } from "zod"

// Schema for updating food entry
export const updateFoodEntrySchema = z.object({
  serving_count: z.number().positive().optional(),
  meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional(),
  consumed_at: z.string().datetime().optional(),
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

    // Get the specific food entry
    const { data, error } = await supabase
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
      .eq("id", params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json(
          { error: "Food entry not found" },
          { status: 404 }
        )
      }
      
      console.error("Error fetching food entry:", error)
      return NextResponse.json(
        { error: "Failed to fetch food entry" },
        { status: 500 }
      )
    }

    // Check if the user owns this food entry
    const { data: entry } = await supabase
      .from("food_entries")
      .select("user_id")
      .eq("id", params.id)
      .single()

    if (entry?.user_id !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
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
    const validation = updateFoodEntrySchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.issues },
        { status: 400 }
      )
    }

    // Check if the user owns this food entry
    const { data: entry, error: fetchError } = await supabase
      .from("food_entries")
      .select("user_id")
      .eq("id", params.id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') { // Not found
        return NextResponse.json(
          { error: "Food entry not found" },
          { status: 404 }
        )
      }
      
      console.error("Error fetching food entry:", fetchError)
      return NextResponse.json(
        { error: "Failed to fetch food entry" },
        { status: 500 }
      )
    }

    if (entry?.user_id !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // Update the food entry
    const { data, error } = await supabase
      .from("food_entries")
      .update(validation.data)
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating food entry:", error)
      return NextResponse.json(
        { error: "Failed to update food entry" },
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

    // Check if the user owns this food entry
    const { data: entry, error: fetchError } = await supabase
      .from("food_entries")
      .select("user_id")
      .eq("id", params.id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') { // Not found
        return NextResponse.json(
          { error: "Food entry not found" },
          { status: 404 }
        )
      }
      
      console.error("Error fetching food entry:", fetchError)
      return NextResponse.json(
        { error: "Failed to fetch food entry" },
        { status: 500 }
      )
    }

    if (entry?.user_id !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // Delete the food entry
    const { error } = await supabase
      .from("food_entries")
      .delete()
      .eq("id", params.id)

    if (error) {
      console.error("Error deleting food entry:", error)
      return NextResponse.json(
        { error: "Failed to delete food entry" },
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
