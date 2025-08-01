"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  Home,
  Settings,
  User,
  List,
  Shield,
  LogOut,
  Wrench,
  HardHat
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-lg">Loading...</div>
    </div>;
  }

  if (!user) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-lg">Please log in to access the dashboard.</div>
    </div>;
  }

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      active: pathname === "/dashboard"
    },
    {
      name: "Tools",
      href: "/dashboard/tools",
      icon: Wrench,
      active: pathname === "/dashboard/tools"
    },
    {
      name: "Rentals",
      href: "/dashboard/rentals",
      icon: List,
      active: pathname === "/dashboard/rentals"
    },

    {
      name: "Deposits",
      href: "/dashboard/deposits",
      icon: Shield,
      active: pathname === "/dashboard/deposits"
    },
    {
      name: "Borrow Requests",
      href: "/dashboard/borrow-requests",
      icon: List,
      active: pathname === "/dashboard/borrow-requests"
    },
    {
      name: "Profile",
      href: "/dashboard/profile",
      icon: User,
      active: pathname === "/dashboard/profile"
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
      active: pathname === "/dashboard/settings"
    }
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <HardHat className="w-8 h-8 text-green-600" />
            <span className="text-xl font-semibold text-gray-900">EquiShare</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      item.active
                        ? "bg-green-100 text-green-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200">
          <Button
            onClick={logout}
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-gray-700 hover:text-red-600"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.username}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center border-2 border-green-200">
                <User className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
