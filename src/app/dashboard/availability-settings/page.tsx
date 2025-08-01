"use client";

import { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Calendar, Repeat, Settings, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Tool {
  id: string;
  name: string;
  pricing_type: string;
}

interface FlexibleAvailability {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface RecurringAvailability {
  id: number;
  pattern_type: string;
  start_date: string;
  end_date: string;
  days_of_week: number[];
  start_time: string;
  end_time: string;
  is_active: boolean;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Monday' },
  { value: 1, label: 'Tuesday' },
  { value: 2, label: 'Wednesday' },
  { value: 3, label: 'Thursday' },
  { value: 4, label: 'Friday' },
  { value: 5, label: 'Saturday' },
  { value: 6, label: 'Sunday' },
];

const PATTERN_TYPES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom' },
];

export default function AvailabilitySettingsPage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [flexibleAvailabilities, setFlexibleAvailabilities] = useState<FlexibleAvailability[]>([]);
  const [recurringAvailabilities, setRecurringAvailabilities] = useState<RecurringAvailability[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form states for flexible availability
  const [newFlexibleDay, setNewFlexibleDay] = useState<number>(0);
  const [newFlexibleStartTime, setNewFlexibleStartTime] = useState<string>('09:00');
  const [newFlexibleEndTime, setNewFlexibleEndTime] = useState<string>('17:00');

  // Form states for recurring availability
  const [newRecurringPattern, setNewRecurringPattern] = useState<string>('weekly');
  const [newRecurringStartDate, setNewRecurringStartDate] = useState<string>('');
  const [newRecurringEndDate, setNewRecurringEndDate] = useState<string>('');
  const [newRecurringDays, setNewRecurringDays] = useState<number[]>([0, 1, 2, 3, 4]);
  const [newRecurringStartTime, setNewRecurringStartTime] = useState<string>('09:00');
  const [newRecurringEndTime, setNewRecurringEndTime] = useState<string>('17:00');

  useEffect(() => {
    if (!user?.id) return;
    fetchUserTools();
  }, [user?.id]);

  useEffect(() => {
    if (selectedTool) {
      fetchAvailabilityData();
    }
  }, [selectedTool]);

  const fetchUserTools = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/tools/');
      if (response.ok) {
        const allTools = await response.json();
        // Filter tools owned by current user
        const userTools = allTools.filter((tool: any) => tool.owner?.id === user?.id);
        setTools(userTools);
        if (userTools.length > 0) {
          setSelectedTool(userTools[0].id.toString());
        }
      }
    } catch (error) {
      console.error('Error fetching tools:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchAvailabilityData = async () => {
    if (!selectedTool) return;

    try {
      // Fetch flexible availability
      const flexibleResponse = await fetch(`http://localhost:8000/api/flexible-availability/?tool=${selectedTool}`);
      if (flexibleResponse.ok) {
        const flexibleData = await flexibleResponse.json();
        setFlexibleAvailabilities(flexibleData);
      } else {
        // Endpoint doesn't exist yet, set empty array
        setFlexibleAvailabilities([]);
      }

      // Fetch recurring availability
      const recurringResponse = await fetch(`http://localhost:8000/api/recurring-availability/?tool=${selectedTool}`);
      if (recurringResponse.ok) {
        const recurringData = await recurringResponse.json();
        setRecurringAvailabilities(recurringData);
      } else {
        // Endpoint doesn't exist yet, set empty array
        setRecurringAvailabilities([]);
      }
    } catch (error) {
      console.log('Availability endpoints not available yet, setting empty arrays');
      setFlexibleAvailabilities([]);
      setRecurringAvailabilities([]);
    }
  };

  const addFlexibleAvailability = async () => {
    if (!selectedTool) return;

    try {
      const response = await fetch('http://localhost:8000/api/flexible-availability/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tool: selectedTool,
          day_of_week: newFlexibleDay,
          start_time: newFlexibleStartTime,
          end_time: newFlexibleEndTime,
          is_available: true,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Flexible availability added successfully.",
        });
        fetchAvailabilityData();
        // Reset form
        setNewFlexibleDay(0);
        setNewFlexibleStartTime('09:00');
        setNewFlexibleEndTime('17:00');
      } else {
        // Endpoint doesn't exist yet
        console.log('Flexible availability endpoint not available yet');
        toast({
          variant: "destructive",
          title: "Feature Not Available",
          description: "Flexible availability feature is not implemented yet.",
        });
      }
    } catch (error) {
      // Endpoint doesn't exist yet
      console.log('Flexible availability endpoint not available yet');
      toast({
        variant: "destructive",
        title: "Feature Not Available",
        description: "Flexible availability feature is not implemented yet.",
      });
    }
  };

  const addRecurringAvailability = async () => {
    if (!selectedTool) return;

    try {
      const response = await fetch(`http://localhost:8000/api/tools/${selectedTool}/create-recurring/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pattern_type: newRecurringPattern,
          start_date: newRecurringStartDate,
          end_date: newRecurringEndDate,
          days_of_week: newRecurringDays,
          start_time: newRecurringStartTime,
          end_time: newRecurringEndTime,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Recurring availability created successfully.",
        });
        fetchAvailabilityData();
        // Reset form
        setNewRecurringPattern('weekly');
        setNewRecurringStartDate('');
        setNewRecurringEndDate('');
        setNewRecurringDays([0, 1, 2, 3, 4]);
        setNewRecurringStartTime('09:00');
        setNewRecurringEndTime('17:00');
      } else {
        // Endpoint doesn't exist yet
        console.log('Recurring availability endpoint not available yet');
        toast({
          variant: "destructive",
          title: "Feature Not Available",
          description: "Recurring availability feature is not implemented yet.",
        });
      }
    } catch (error) {
      // Endpoint doesn't exist yet
      console.log('Recurring availability endpoint not available yet');
      toast({
        variant: "destructive",
        title: "Feature Not Available",
        description: "Recurring availability feature is not implemented yet.",
      });
    }
  };

  const deleteFlexibleAvailability = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/flexible-availability/${id}/`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Flexible availability deleted successfully.",
        });
        fetchAvailabilityData();
      } else {
        // Endpoint doesn't exist yet
        console.log('Flexible availability delete endpoint not available yet');
        toast({
          variant: "destructive",
          title: "Feature Not Available",
          description: "Flexible availability delete feature is not implemented yet.",
        });
      }
    } catch (error) {
      // Endpoint doesn't exist yet
      console.log('Flexible availability delete endpoint not available yet');
      toast({
        variant: "destructive",
        title: "Feature Not Available",
        description: "Flexible availability delete feature is not implemented yet.",
      });
    }
  };

  const deleteRecurringAvailability = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/recurring-availability/${id}/`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Recurring availability deleted successfully.",
        });
        fetchAvailabilityData();
      } else {
        // Endpoint doesn't exist yet
        console.log('Recurring availability delete endpoint not available yet');
        toast({
          variant: "destructive",
          title: "Feature Not Available",
          description: "Recurring availability delete feature is not implemented yet.",
        });
      }
    } catch (error) {
      // Endpoint doesn't exist yet
      console.log('Recurring availability delete endpoint not available yet');
      toast({
        variant: "destructive",
        title: "Feature Not Available",
        description: "Recurring availability delete feature is not implemented yet.",
      });
    }
  };

  const toggleDaySelection = (day: number) => {
    setNewRecurringDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  if (loading || loadingData) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Availability Settings</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Availability Settings</h1>
        <p className="text-muted-foreground">Configure flexible and recurring availability for your tools.</p>
      </div>

      {/* Tool Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Tool</CardTitle>
          <CardDescription>Choose a tool to configure its availability settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedTool} onValueChange={setSelectedTool}>
            <SelectTrigger>
              <SelectValue placeholder="Select a tool" />
            </SelectTrigger>
            <SelectContent>
              {tools.map((tool) => (
                <SelectItem key={tool.id} value={tool.id.toString()}>
                  {tool.name} ({tool.pricing_type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedTool && (
        <Tabs defaultValue="flexible" className="space-y-4">
          <TabsList>
            <TabsTrigger value="flexible" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Flexible Availability
            </TabsTrigger>
            <TabsTrigger value="recurring" className="flex items-center gap-2">
              <Repeat className="h-4 w-4" />
              Recurring Patterns
            </TabsTrigger>
          </TabsList>

          <TabsContent value="flexible" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add Flexible Availability</CardTitle>
                <CardDescription>Set specific time windows for each day of the week.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Day of Week</Label>
                    <Select value={newFlexibleDay.toString()} onValueChange={(value) => setNewFlexibleDay(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((day) => (
                          <SelectItem key={day.value} value={day.value.toString()}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={newFlexibleStartTime}
                      onChange={(e) => setNewFlexibleStartTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={newFlexibleEndTime}
                      onChange={(e) => setNewFlexibleEndTime(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={addFlexibleAvailability} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Flexible Availability
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Flexible Availability</CardTitle>
              </CardHeader>
              <CardContent>
                {flexibleAvailabilities.length === 0 ? (
                  <p className="text-muted-foreground">No flexible availability set.</p>
                ) : (
                  <div className="space-y-2">
                    {flexibleAvailabilities.map((availability) => (
                      <div key={availability.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Badge variant="outline">
                            {DAYS_OF_WEEK.find(d => d.value === availability.day_of_week)?.label}
                          </Badge>
                          <span className="ml-2">
                            {availability.start_time} - {availability.end_time}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteFlexibleAvailability(availability.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recurring" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add Recurring Availability</CardTitle>
                <CardDescription>Create recurring patterns for your tool availability.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Pattern Type</Label>
                    <Select value={newRecurringPattern} onValueChange={setNewRecurringPattern}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PATTERN_TYPES.map((pattern) => (
                          <SelectItem key={pattern.value} value={pattern.value}>
                            {pattern.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={newRecurringStartDate}
                      onChange={(e) => setNewRecurringStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>End Date (Optional)</Label>
                    <Input
                      type="date"
                      value={newRecurringEndDate}
                      onChange={(e) => setNewRecurringEndDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Time Range</Label>
                    <div className="flex gap-2">
                      <Input
                        type="time"
                        value={newRecurringStartTime}
                        onChange={(e) => setNewRecurringStartTime(e.target.value)}
                      />
                      <Input
                        type="time"
                        value={newRecurringEndTime}
                        onChange={(e) => setNewRecurringEndTime(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Days of Week</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <div key={day.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`day-${day.value}`}
                          checked={newRecurringDays.includes(day.value)}
                          onCheckedChange={() => toggleDaySelection(day.value)}
                        />
                        <Label htmlFor={`day-${day.value}`} className="text-sm">
                          {day.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={addRecurringAvailability} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Recurring Pattern
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Recurring Patterns</CardTitle>
              </CardHeader>
              <CardContent>
                {recurringAvailabilities.length === 0 ? (
                  <p className="text-muted-foreground">No recurring patterns set.</p>
                ) : (
                  <div className="space-y-2">
                    {recurringAvailabilities.map((availability) => (
                      <div key={availability.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Badge variant="outline">
                            {PATTERN_TYPES.find(p => p.value === availability.pattern_type)?.label}
                          </Badge>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {availability.start_date} - {availability.end_date || 'Ongoing'}
                          </div>
                          <div className="text-sm">
                            {availability.start_time} - {availability.end_time}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Days: {availability.days_of_week.map(d => DAYS_OF_WEEK.find(day => day.value === d)?.label).join(', ')}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteRecurringAvailability(availability.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
} 
