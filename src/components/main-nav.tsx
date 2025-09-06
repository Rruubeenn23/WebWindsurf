"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"

interface NavItem {
  title: string
  href: string
  disabled?: boolean
  icon?: keyof typeof Icons
}

const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: "user",
  },
  {
    title: "Profile",
    href: "/profile",
    icon: "user",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: "settings",
  },
]

export function MainNav() {
  const pathname = usePathname()

  return (
    <div className="flex gap-6 md:gap-10">
      <nav className="flex gap-6">
        {mainNavItems.map((item, index) => {
          const Icon = item.icon ? Icons[item.icon] : null
          return (
            <Button
              key={index}
              variant="ghost"
              className={cn(
                "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                pathname?.startsWith(item.href)
                  ? "text-foreground"
                  : "text-foreground/60",
                item.disabled && "cursor-not-allowed opacity-80"
              )}
              asChild
            >
              <Link href={item.disabled ? "#" : item.href}>
                {Icon && <Icon className="h-4 w-4" />}
                <span>{item.title}</span>
              </Link>
            </Button>
          )
        })}
      </nav>
    </div>
  )
}
