"use client"

import Link from "next/link"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"

export function NavMenu() {
  return (
    <NavigationMenu className="hidden md:flex">
      <NavigationMenuList className="gap-0.5">
        <NavigationMenuItem>
          <NavigationMenuTrigger className="h-9 cursor-pointer px-3 text-sm font-medium">
            Explore
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[240px] gap-0.5 p-2">
              <li>
                <NavigationMenuLink asChild>
                  <Link
                    href="/trending"
                    className="block rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
                  >
                    Top Voted
                  </Link>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link
                    href="/trending?filter=trending"
                    className="block rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
                  >
                    Trending
                  </Link>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link
                    href="/trending?filter=recent"
                    className="block rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
                  >
                    Newly Listed
                  </Link>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link
                    href="/categories"
                    className="block rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
                  >
                    Categories
                  </Link>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              href="/projects/submit"
              className={`${navigationMenuTriggerStyle()} h-9 px-3 text-sm font-medium`}
            >
              Submit Coin
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link href="/pricing" className={`${navigationMenuTriggerStyle()} h-9 px-3 text-sm font-medium`}>
              Pricing
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link href="/sponsors" className={`${navigationMenuTriggerStyle()} h-9 px-3 text-sm font-medium`}>
              Sponsors
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
