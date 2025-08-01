"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tool } from '@/lib/data';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { MapPin } from 'lucide-react';



function ToolCard({ tool }: { tool: Tool }) {
  const router = useRouter();
  const { user } = useAuth();

  const handleRequestBorrow = () => {
    // For demo purposes, set default dates (today to 7 days from now)
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    router.push(`/dashboard/rental-booking?toolId=${tool.id}&startDate=${startDate}&endDate=${endDate}&mode=request`);
  };

  const handleRentNow = () => {
    // For demo purposes, set default dates (today to 7 days from now)
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    router.push(`/dashboard/rental-booking?toolId=${tool.id}&startDate=${startDate}&endDate=${endDate}`);
  };

  // Check if user owns this tool
  const isOwner = user?.id === tool.owner_id;

  return (
    <Card className="flex flex-col">
      <CardHeader className="p-0">
        <div className="relative aspect-video">
            <Image
                src={tool.imageUrl}
                alt={tool.name}
                fill
                className="object-cover rounded-t-lg"
                data-ai-hint={tool.aiHint}
            />
            <Badge
                className="absolute top-2 right-2"
                variant={tool.isAvailable ? 'default' : 'destructive'}
                style={tool.isAvailable ? { backgroundColor: 'hsl(var(--primary))' } : {}}
                >
                {tool.isAvailable ? 'Available' : 'Rented Out'}
            </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <h3 className="text-lg font-bold">{tool.name}</h3>
        <p className="text-sm text-muted-foreground">Tool</p>
        <p className="text-sm mt-2">{tool.description}</p>
        <div className="mt-2 text-sm text-muted-foreground">
          <p>Owner: {tool.owner}</p>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <div>
          <p className="text-lg font-semibold">
            ${tool.pricing_type === 'hourly' ? tool.price_per_hour?.toFixed(2) : tool.dailyRate.toFixed(2)}
            <span className="text-sm font-normal text-muted-foreground">
              /{tool.pricing_type === 'hourly' ? 'hour' : tool.pricing_type === 'daily' ? 'day' : tool.pricing_type === 'weekly' ? 'week' : 'month'}
            </span>
          </p>
          {tool.replacement_value && (
            <p className="text-xs text-muted-foreground">
              Deposit: ${tool.replacement_value.toFixed(2)}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {isOwner ? (
            <Button variant="outline" disabled>
              Your Tool
            </Button>
          ) : (
            <Button 
              disabled={!tool.isAvailable} 
              onClick={handleRequestBorrow}
            >
              Request to Borrow
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}



export default function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Fetch tools from backend API
  const fetchTools = async () => {
    try {
              const response = await fetch('http://localhost:8000/api/tools/');
      console.log('API Response status:', response.status);
      
      if (response.ok) {
        const apiTools = await response.json();
        console.log('API Response data:', apiTools);
        
        // Check if apiTools is an array
        if (!Array.isArray(apiTools)) {
          console.error('API response is not an array:', apiTools);
          setTools([]);
          return;
        }
        
        // Transform API tools to match Tool interface with proper Django IDs
        const transformedTools = apiTools.map((tool: any) => ({
          id: tool.id.toString(),
          name: tool.name,
          // category removed
          description: tool.description,
          imageUrl: tool.image || 'https://placehold.co/300x300.png',
          pricing_type: tool.pricing_type || 'daily',
          price_per_hour: tool.price_per_hour ? parseFloat(tool.price_per_hour) : undefined,
          dailyRate: parseFloat(tool.price_per_day),
          price_per_week: tool.price_per_week ? parseFloat(tool.price_per_week) : undefined,
          price_per_month: tool.price_per_month ? parseFloat(tool.price_per_month) : undefined,
          isAvailable: tool.available,
          owner: tool.owner?.username || 'Unknown',
          owner_id: tool.owner?.id || 1, // Add owner ID for rental transactions
          replacement_value: tool.replacement_value ? parseFloat(tool.replacement_value) : undefined,
          aiHint: tool.name.toLowerCase()
        }));
        
        // Set tools directly from API since initial tools are now empty
        setTools(transformedTools);
      } else {
        console.error('API response not ok:', response.status, response.statusText);
        setTools([]);
      }
    } catch (error) {
      console.error('Error fetching tools:', error);
      // Fallback to localStorage if API fails
      const storedTools = localStorage.getItem('tools');
      if (storedTools) {
        const newTools = JSON.parse(storedTools);
        setTools(newTools);
      } else {
        setTools([]); // Set empty array if no tools available
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTools();
  }, []);

  // Refresh tools when page becomes visible (e.g., when returning from booking)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchTools();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);



  // Enhanced filter tools by name and description based on searchTerm
  const filteredTools = tools.filter(tool => {
    const searchLower = searchTerm.toLowerCase();
    return (
      tool.name.toLowerCase().includes(searchLower) ||
      tool.description.toLowerCase().includes(searchLower)
    );
  });

  const availableTools = filteredTools.filter(t => t.isAvailable);
  const unavailableTools = filteredTools.filter(t => !t.isAvailable);

  return (
    <div className="flex flex-col gap-6">
               <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">Tool Library</h1>
          <p className="text-muted-foreground">Browse all available tools and equipment.</p>
        </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="p-0">
                <div className="aspect-video bg-muted rounded-t-lg"></div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Tabs defaultValue="all" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                             <TabsList>
                   <TabsTrigger value="all">All Tools</TabsTrigger>
                   <TabsTrigger value="available">Available</TabsTrigger>
                   <TabsTrigger value="rented">Rented Out</TabsTrigger>
               </TabsList>
              <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                      placeholder="Search tools..."
                      className="pl-8 w-full sm:w-[300px]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
          </div>
          <TabsContent value="all" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTools.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm ? `No tools found matching "${searchTerm}"` : 'No tools available'}
                </p>
              </div>
            ) : (
              filteredTools.map(tool => (
                <ToolCard key={tool.id} tool={tool} />
              ))
            )}
          </TabsContent>
          <TabsContent value="available" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {availableTools.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm ? `No available tools found matching "${searchTerm}"` : 'No available tools'}
                </p>
              </div>
            ) : (
              availableTools.map(tool => (
                <ToolCard key={tool.id} tool={tool} />
              ))
            )}
          </TabsContent>
          <TabsContent value="rented" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {unavailableTools.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm ? `No rented tools found matching "${searchTerm}"` : 'No rented tools'}
                </p>
              </div>
            ) : (
              unavailableTools.map(tool => (
                <ToolCard key={tool.id} tool={tool} />
              ))
            )}
          </TabsContent>
          
                </Tabs>
      )}


    </div>
  ); 
}
