"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/icons"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  // if (!session) {
  //   redirect("/login")
  //   return null
  // }

  // Get user data
  const { data: userData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Welcome back, {userData?.full_name || 'User'}</h2>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/nutrition/add">
              <Icons.plus className="mr-2 h-4 w-4" />
              Add Food
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/workouts/new">
              <Icons.plus className="mr-2 h-4 w-4" />
              New Workout
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Your Stats
            </CardTitle>
            <Icons.logo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Coming Soon</div>
            <p className="text-xs text-muted-foreground">
              Your fitness stats will appear here
            </p>
          </CardContent>
        </Card>
        
        {/* Calories Card */}
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Calories Today</h3>
            <Icons.utensils className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">1,890</div>
            <p className="text-xs text-muted-foreground">+20.1% from yesterday</p>
          </div>
        </div>
        
        {/* Workouts Card */}
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Workouts This Week</h3>
            <Icons.plus className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">+1 from last week</p>
          </div>
        </div>
        
        {/* Protein Card */}
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Protein</h3>
            <Icons.plus className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">145g</div>
            <p className="text-xs text-muted-foreground">85% of goal</p>
          </div>
        </div>
        
        {/* Water Intake Card */}
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Water Intake</h3>
            <Icons.plus className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">2.1L</div>
            <p className="text-xs text-muted-foreground">70% of goal</p>
          </div>
        </div>
      </div>
    </div>
  )
}
