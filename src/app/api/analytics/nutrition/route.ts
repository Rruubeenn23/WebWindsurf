import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get("days") || "30")
    
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get nutrition data for the date range
    const { data: nutritionData, error } = await supabase
      .rpc('get_nutrition_summary', {
        p_user_id: session.user.id,
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString()
      })

    if (error) {
      console.error("Error fetching nutrition stats:", error)
      return NextResponse.json(
        { error: "Failed to fetch nutrition statistics" },
        { status: 500 }
      )
    }

    // Get user's goals
    const { data: goals } = await supabase
      .from("user_goals")
      .select("goal_type, target_value")
      .eq("user_id", session.user.id)
      .eq("is_active", true)

    // Format the response
    const result = {
      summary: {
        total_calories: 0,
        total_protein_g: 0,
        total_carbs_g: 0,
        total_fat_g: 0,
        average_daily_calories: 0,
        average_daily_protein_g: 0,
        average_daily_carbs_g: 0,
        average_daily_fat_g: 0,
        goals: {},
        days_with_data: 0
      },
      daily_data: {},
      top_foods: []
    }

    // Process the data if we have any
    if (nutritionData && nutritionData.length > 0) {
      // Calculate totals and averages
      const daysWithData = new Set()
      
      nutritionData.forEach(entry => {
        const date = new Date(entry.consumed_at).toISOString().split('T')[0]
        daysWithData.add(date)
        
        result.summary.total_calories += entry.calories || 0
        result.summary.total_protein_g += entry.protein_g || 0
        result.summary.total_carbs_g += entry.carbs_g || 0
        result.summary.total_fat_g += entry.fat_g || 0
        
        // Group by date
        if (!result.daily_data[date]) {
          result.daily_data[date] = {
            date,
            calories: 0,
            protein_g: 0,
            carbs_g: 0,
            fat_g: 0
          }
        }
        
        result.daily_data[date].calories += entry.calories || 0
        result.daily_data[date].protein_g += entry.protein_g || 0
        result.daily_data[date].carbs_g += entry.carbs_g || 0
        result.daily_data[date].fat_g += entry.fat_g || 0
      })
      
      // Calculate averages
      const dayCount = daysWithData.size || 1
      result.summary.average_daily_calories = Math.round(result.summary.total_calories / dayCount)
      result.summary.average_daily_protein_g = Math.round(result.summary.total_protein_g / dayCount * 10) / 10
      result.summary.average_daily_carbs_g = Math.round(result.summary.total_carbs_g / dayCount * 10) / 10
      result.summary.average_daily_fat_g = Math.round(result.summary.total_fat_g / dayCount * 10) / 10
      result.summary.days_with_data = dayCount
      
      // Add goals to the response
      if (goals) {
        result.summary.goals = goals.reduce((acc, goal) => {
          acc[goal.goal_type] = goal.target_value
          return acc
        }, {} as Record<string, number>)
      }
      
      // Get top foods by frequency
      const foodCounts = nutritionData.reduce((acc: Record<string, {name: string, count: number}>, entry) => {
        if (entry.food_name) {
          if (!acc[entry.food_name]) {
            acc[entry.food_name] = { name: entry.food_name, count: 0 }
          }
          acc[entry.food_name].count += 1
        }
        return acc
      }, {})
      
      result.top_foods = Object.values(foodCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
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
