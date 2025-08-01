"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Mail, AtSign, Wrench, List, Shield, ArrowUpRight, Calendar, Clock, ChevronDown } from "lucide-react";
import { useState, useEffect } from 'react';

interface Rental {
  id: number;
  borrower_id: number;
  tool_id: number;
  start_date: string;
  end_date: string;
  total_price: number;
  status: string;
  payment_status: string;
  tool_name?: string;
  tool_image_url?: string;
  tool_daily_rate?: number;
  owner_username?: string;
}

interface Tool {
  id: number;
  name: string;
  description: string;
  daily_rate: number;
  image_url: string;
  available: boolean;
  owner_id: number;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [activeRentals, setActiveRentals] = useState<Rental[]>([]);
  const [rentalsLoading, setRentalsLoading] = useState(true);

  // Fetch active rentals for the current user
  useEffect(() => {
    const fetchActiveRentals = async () => {
      if (!user) return;

      try {
        setRentalsLoading(true);
        const response = await fetch('http://localhost:8000/api/rentaltransactions/');
        if (response.ok) {
          const allRentals = await response.json();

          // Filter active rentals where current user is the borrower
          const userActiveRentals = allRentals.filter((rental: Rental) =>
            rental.borrower_id === user.id && rental.status === 'active'
          );

          // Fetch tool details for each rental
          const rentalsWithToolDetails = await Promise.all(
            userActiveRentals.map(async (rental: Rental) => {
              try {
                const toolResponse = await fetch(`http://localhost:8000/api/tools/${rental.tool_id}/`);
                if (toolResponse.ok) {
                  const tool = await toolResponse.json();
                  return {
                    ...rental,
                    tool_name: tool.name,
                    tool_image_url: tool.image_url,
                    tool_daily_rate: tool.daily_rate
                  };
                }
                return rental;
              } catch (error) {
                console.error('Error fetching tool details:', error);
                return rental;
              }
            })
          );

          setActiveRentals(rentalsWithToolDetails);
        } else {
          console.error('Failed to fetch rentals:', response.status);
        }
      } catch (error) {
        console.error('Error fetching active rentals:', error);
      } finally {
        setRentalsLoading(false);
      }
    };

    fetchActiveRentals();
  }, [user]);



  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
             <div className="space-y-1">
         <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">Welcome Back, {user?.username}!</h1>
         <p className="text-muted-foreground">Here's a quick overview of your account.</p>
       </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rentals</CardTitle>
            <List className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rentalsLoading ? <Skeleton className="h-8 w-12" /> : activeRentals.length}
            </div>
            <p className="text-xs text-muted-foreground">tools currently checked out</p>
          </CardContent>
        </Card>
      </div>




    </div>
  );
}
