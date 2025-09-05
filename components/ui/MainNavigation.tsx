// components/ui/MainNavigation.tsx
import Link from "next/link";
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

export function MainNavigation() {
  return (
    <div className="flex justify-between items-center py-4 px-4 border-b border-slate-100">
      <div>
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link href="/" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Chess Rating History
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
      
      <div className="flex items-center space-x-4">
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <SignedIn>
                <Link href="/daily" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Daily Puzzles
                  </NavigationMenuLink>
                </Link>
              </SignedIn>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        
        {/* Authentication UI */}
        <div className="flex items-center">
          <SignedOut>
            <SignInButton>
              <Button variant="primary-green">Sign In</Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8"
                }
              }}
            />
          </SignedIn>
        </div>
      </div>
    </div>
  );
}
