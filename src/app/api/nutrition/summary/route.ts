import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date") || new Date().toISOString().split('T')[0]
    
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Calculate start and end of the requested day
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    // Get all food entries for the day with their food details
    const { data: foodEntries, error: entriesError } = await supabase
      .from("food_entries")
      .select(
        `
        serving_count,
        food:foods (
          calories,
          protein_g,
          carbs_g,
          fat_g
        )
      `
      )
      .eq("user_id", session.user.id)
      .gte("consumed_at", startOfDay.toISOString())
      .lte("consumed_at", endOfDay.toISOString())

    if (entriesError) {
      console.error("Error fetching food entries:", entriesError)
      return NextResponse.json(
        { error: "Failed to fetch food entries" },
        { status: 500 }
      )
    }

    // Calculate totals
    const summary = foodEntries.reduce(
      (acc, entry) => {
        const multiplier = entry.serving_count || 1
        return {
          calories: acc.calories + (entry.food?.calories || 0) * multiplier,
          protein_g: acc.protein_g + (entry.food?.protein_g || 0) * multiplier,
          carbs_g: acc.carbs_g + (entry.food?.carbs_g || 0) * multiplier,
          fat_g: acc.fat_g + (entry.food?.fat_g || 0) * multiplier,
          entry_count: acc.entry_count + 1,
        }
      },
      { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, entry_count: 0 }
    )

    // Get user's goals
    const { data: goals, error: goalsError } = await supabase
      .from("user_goals")
      .select("goal_type, target_value")
      .eq("user_id", session.user.id)
      .eq("is_active", true)

    if (!goalsError) {
      // Add goals to the response
      const goalsMap = goals.reduce((acc, goal) => {
        acc[goal.goal_type] = goal.target_value
        return acc
      }, {} as Record<string, number>)

      // Calculate percentages of goals met
      return NextResponse.json({
        ...summary,
        goals: goalsMap,
        percentages: {
          calories: goalsMap.calories ? Math.min(100, Math.round((summary.calories / goalsMap.calories) * 100)) : null,
          protein: goalsMap.protein ? Math.min(100, Math.round((summary.protein_g / goalsMap.protein) * 100)) : null,
          carbs: goalsMap.carbs ? Math.min(100, Math.round((summary.carbs_g / goalsMap.carbs) * 100)) : null,
          fat: goalsMap.fat ? Math.min(100, Math.round((summary.fat_g / goalsMap.fat) * 100)) : null,
        },
      })
    }

    return NextResponse.json(summary)
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
