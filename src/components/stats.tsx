import { Icons } from "./icons"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  description?: string
  className?: string
}

export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  description,
  className,
}: StatCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {change !== undefined && (
          <div
            className={cn(
              "mt-2 inline-flex items-center text-xs font-medium",
              change >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}
          >
            {change >= 0 ? (
              <Icons.arrowUp className="mr-1 h-3 w-3" />
            ) : (
              <Icons.arrowDown className="mr-1 h-3 w-3" />
            )}
            {Math.abs(change)}% from last period
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface StatsGridProps {
  stats: Array<{
    title: string
    value: string | number
    change?: number
    icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
    description?: string
  }>
  className?: string
}

export function StatsGrid({ stats, className }: StatsGridProps) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  )
}

// Example usage:
/*
<StatsGrid
  stats={[
    {
      title: "Total Calories",
      value: "2,345",
      change: 12,
      icon: Icons.flame,
      description: "Today's intake"
    },
    {
      title: "Protein",
      value: "156g",
      change: 8,
      icon: Icons.dumbbell,
      description: "Daily goal: 180g"
    },
    {
      title: "Workouts",
      value: "4/5",
      change: 25,
      icon: Icons.activity,
      description: "This week"
    },
    {
      title: "Water",
      value: "2.1L",
      change: -5,
      icon: Icons.water,
      description: "Daily goal: 3L"
    }
  ]}
/>
*/
