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

    // Get hydration data for the date range
    const { data: hydrationData, error } = await supabase
      .from("water_intake")
      .select("amount_ml, consumed_at")
      .eq("user_id", session.user.id)
      .gte("consumed_at", startDate.toISOString())
      .lte("consumed_at", endDate.toISOString())
      .order("consumed_at", { ascending: false })

    if (error) {
      console.error("Error fetching hydration data:", error)
      return NextResponse.json(
        { error: "Failed to fetch hydration data" },
        { status: 500 }
      )
    }

    // Get user's water goal
    const { data: waterGoal } = await supabase
      .from("user_goals")
      .select("target_value")
      .eq("user_id", session.user.id)
      .eq("goal_type", "water")
      .eq("is_active", true)
      .single()

    // Process the data
    const dailyTotals: Record<string, number> = {}
    const hourlyAverages: Record<string, { hour: number; amount_ml: number; count: number }> = {}
    
    let totalAmount = 0
    let dayCount = 0
    let currentDay = ""
    
    hydrationData.forEach(entry => {
      const date = new Date(entry.consumed_at)
      const dateStr = date.toISOString().split('T')[0]
      const hour = date.getHours()
      
      // Track daily totals
      if (!dailyTotals[dateStr]) {
        dailyTotals[dateStr] = 0
        dayCount++
      }
      dailyTotals[dateStr] += entry.amount_ml || 0
      totalAmount += entry.amount_ml || 0
      
      // Track hourly averages
      const hourKey = hour.toString().padStart(2, '0') + ':00'
      if (!hourlyAverages[hourKey]) {
        hourlyAverages[hourKey] = { hour, amount_ml: 0, count: 0 }
      }
      hourlyAverages[hourKey].amount_ml += entry.amount_ml || 0
      hourlyAverages[hourKey].count += 1
    })
    
    // Calculate averages
    const averageDaily = dayCount > 0 ? Math.round(totalAmount / dayCount) : 0
    
    // Format hourly averages
    const hourlyAveragesFormatted = Object.entries(hourlyAverages)
      .map(([hour, data]) => ({
        hour: data.hour,
        hour_display: hour,
        average_ml: Math.round(data.amount_ml / data.count)
      }))
      .sort((a, b) => a.hour - b.hour)
    
    // Get recent entries (last 7 days)
    const recentDays = Object.entries(dailyTotals)
      .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
      .slice(0, 7)
      .map(([date, amount_ml]) => ({
        date,
        amount_ml,
        day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
      }))

    // Prepare the response
    const result = {
      summary: {
        total_ml: totalAmount,
        average_daily_ml: averageDaily,
        goal_ml: waterGoal?.target_value || 2500, // Default to 2.5L if no goal set
        days_tracked: dayCount,
        daily_goal_met: waterGoal?.target_value 
          ? Math.round((averageDaily / waterGoal.target_value) * 100) 
          : 0
      },
      recent_days: recentDays,
      hourly_averages: hourlyAveragesFormatted,
      daily_totals: Object.entries(dailyTotals).map(([date, amount_ml]) => ({
        date,
        amount_ml,
        day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
      })).sort((a, b) => a.date.localeCompare(b.date))
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
