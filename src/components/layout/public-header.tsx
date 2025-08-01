"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HardHat } from "lucide-react";

export default function PublicHeader() {
  return (
    <header className="px-4 lg:px-6 h-14 flex items-center bg-background border-b">
      <Link className="flex items-center justify-center" href="/">
        <HardHat className="h-6 w-6 text-primary" />
        <span className="ml-2 text-lg font-semibold">EquiShare</span>
      </Link>
      <nav className="ml-auto flex gap-4 sm:gap-6">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/tools">Tools</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/login">Login</Link>
        </Button>
        <Button asChild>
          <Link href="/signup">Sign Up</Link>
        </Button>
      </nav>
    </header>
  );
}
