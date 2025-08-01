"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Clock, CreditCard, FileText, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';
import type { Tool } from '@/lib/data';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RentalBookingData {
  toolId: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  totalHours?: number;
  totalDays: number;
  totalAmount: number;
  tool: Tool;
}

export default function RentalBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [bookingData, setBookingData] = useState<RentalBookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [packageId, setPackageId] = useState('');
  const [selectedRange, setSelectedRange] = useState<{ from: Date | undefined, to: Date | undefined }>({ from: undefined, to: undefined });
  const [unavailableDates, setUnavailableDates] = useState<Date[]>([]);
  const [availabilityData, setAvailabilityData] = useState<any>(null);
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('17:00');

  // Generate time options for select dropdowns
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(time);
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  useEffect(() => {
    const toolId = searchParams.get('toolId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!toolId || !startDate || !endDate) {
      toast({
        variant: "destructive",
        title: "Invalid Booking",
        description: "Missing booking information. Please try again.",
      });
      router.push('/dashboard/tools');
      return;
    }

    // Fetch tool details and calculate booking
    const fetchBookingData = async () => {
      try {
        // Fetch the actual tool from the API
        const response = await fetch(`http://localhost:8000/api/tools/${toolId}/`);
        if (!response.ok) {
          console.error('Tool fetch failed:', response.status, response.statusText);
          throw new Error(`Failed to fetch tool: ${response.status} ${response.statusText}`);
        }
        
        const apiTool = await response.json();
        console.log('Fetched tool data:', apiTool);
        
        // Transform API tool to match Tool interface
        const tool: Tool = {
          id: apiTool.id.toString(),
          name: apiTool.name,
          description: apiTool.description,
          imageUrl: apiTool.image || 'https://placehold.co/300x300.png',
          pricing_type: apiTool.pricing_type || 'daily',
          price_per_hour: apiTool.price_per_hour ? parseFloat(apiTool.price_per_hour) : undefined,
          dailyRate: apiTool.price_per_day ? parseFloat(apiTool.price_per_day) : 50.00, // Default to 50 if null
          price_per_week: apiTool.price_per_week ? parseFloat(apiTool.price_per_week) : undefined,
          price_per_month: apiTool.price_per_month ? parseFloat(apiTool.price_per_month) : undefined,
          isAvailable: apiTool.available,
          owner: apiTool.owner?.username || 'Unknown',
          owner_id: apiTool.owner?.id || 1,
          aiHint: apiTool.name.toLowerCase(),
          replacement_value: apiTool.replacement_value ? parseFloat(apiTool.replacement_value) : 100.00 // Default to 100 if null
        };

        const start = new Date(startDate);
        const end = new Date(endDate);
        const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const totalAmount = totalDays * tool.dailyRate;

        setBookingData({
          toolId,
          startDate,
          endDate,
          totalDays,
          totalAmount,
          tool: tool
        });

        // Set initial date range
        setSelectedRange({ from: start, to: end });

        // Fetch availability data
        await fetchAvailability(toolId);
      } catch (error) {
        console.error('Error fetching booking data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load booking information.",
        });
        router.push('/dashboard/tools');
      } finally {
        setLoading(false);
      }
    };

    fetchBookingData();
  }, [searchParams, router, toast]);

  const fetchAvailability = async (toolId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/tools/${toolId}/availability/`);
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched availability data:', data);
        setAvailabilityData(data);
        
        // Convert booked dates to Date objects for calendar
        const unavailableDatesList: Date[] = [];
        if (data.booked_dates && Array.isArray(data.booked_dates)) {
          data.booked_dates.forEach((booking: any) => {
            const start = new Date(booking.start_date);
            const end = new Date(booking.end_date);
            
            // Add all dates in the range
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
              unavailableDatesList.push(new Date(d));
            }
          });
        }
        
        setUnavailableDates(unavailableDatesList);
      } else {
        // Availability endpoint doesn't exist yet, so we'll skip this for now
        console.log('Availability endpoint not available, skipping availability check');
        setAvailabilityData(null);
      }
    } catch (error) {
      // Availability endpoint doesn't exist yet, so we'll skip this for now
      console.log('Availability endpoint not available, skipping availability check');
      setAvailabilityData(null);
    }
  };

  // Add a function to calculate rental details from selected dates
  const calculateRentalDetails = (from: Date | undefined, to: Date | undefined) => {
    if (!from || !to || !bookingData || !bookingData.tool) return null;
    
    const totalDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    const dailyRate = bookingData.tool.dailyRate || 50.00; // Default to 50 if not set
    const totalAmount = totalDays * dailyRate;
    
    return {
      startDate: from.toISOString().split('T')[0],
      endDate: to.toISOString().split('T')[0],
      totalDays,
      totalAmount
    };
  };

  // Update booking data when calendar selection changes
  useEffect(() => {
    if (selectedRange?.from && selectedRange?.to && bookingData && bookingData.tool) {
      const details = calculateRentalDetails(selectedRange.from, selectedRange.to);
      if (details) {
        setBookingData({
          ...bookingData,
          startDate: details.startDate,
          endDate: details.endDate,
          totalDays: details.totalDays,
          totalAmount: details.totalAmount
        });
      }
    }
  }, [selectedRange, bookingData?.tool?.dailyRate]);

  const generateTransactionId = () => {
    return 'TXN' + Date.now().toString().slice(-8) + Math.random().toString(36).substr(2, 4).toUpperCase();
  };

  const generatePackageId = () => {
    return 'PKG' + Date.now().toString().slice(-6) + Math.random().toString(36).substr(2, 3).toUpperCase();
  };

  // Update the handleConfirmBooking function to use Django backend
  const handleConfirmBooking = async () => {
    console.log('handleConfirmBooking called');
    console.log('bookingData:', bookingData);
    console.log('selectedRange:', selectedRange);
    
    if (!bookingData || !selectedRange?.from || !selectedRange?.to) {
      toast({
        variant: "destructive",
        title: "Invalid Selection",
        description: "Please select valid dates for your rental.",
      });
      return;
    }

    if (!agreementAccepted) {
      toast({
        variant: "destructive",
        title: "Agreement Required",
        description: "Please accept the rental agreement to continue.",
      });
      return;
    }

    setProcessing(true);

    try {
      // First, check for availability conflicts
              const conflictCheckResponse = await fetch('http://localhost:8000/api/check-availability-conflict/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tool_id: bookingData.toolId,
          start_date: selectedRange.from.toISOString().split('T')[0],
          end_date: selectedRange.to.toISOString().split('T')[0],
        }),
      });

      if (conflictCheckResponse.ok) {
        const conflictData = await conflictCheckResponse.json();
        
        if (conflictData.has_conflict) {
          toast({
            variant: "destructive",
            title: "Booking Conflict",
            description: "This tool is not available for the selected dates. Please choose different dates.",
          });
          setProcessing(false);
          return;
        }
      }

      // Generate transaction and package IDs
      const newTransactionId = generateTransactionId();
      const newPackageId = generatePackageId();
      setTransactionId(newTransactionId);
      setPackageId(newPackageId);

      // Use a fixed borrower user ID (different from tool owner)
      // Tool owner is ID 1, so we'll use ID 2 as borrower
      const borrowerUserId = 2; // tool_borrower
      const userData = {
        id: borrowerUserId,
        username: 'tool_borrower',
        email: 'borrower@example.com'
      };
      console.log('Using borrower user data:', userData);

      // Validate and format dates
      const startDate = selectedRange.from.toISOString().split('T')[0];
      const endDate = selectedRange.to.toISOString().split('T')[0];
      
      console.log('Formatted dates - start:', startDate, 'end:', endDate);
      
      console.log('Tool owner ID:', bookingData.tool.owner_id);
      console.log('Borrower user ID:', userData.id);
      
             const requestData = {
         owner_id: parseInt((bookingData.tool.owner_id || 1).toString()),
         borrower_id: parseInt(userData.id.toString()),
         tool_id: parseInt(bookingData.toolId.toString()),
         start_date: startDate,
         end_date: endDate,
         total_price: parseFloat(bookingData.totalAmount.toString()),
         payment_status: 'pending',
         status: 'active'
       };

             // Validate the request data
       if (!requestData.owner_id || !requestData.borrower_id || !requestData.tool_id) {
         throw new Error('Missing required rental data: owner, borrower, or tool ID');
       }
      
      if (!requestData.start_date || !requestData.end_date) {
        throw new Error('Missing required rental dates');
      }
      
      if (requestData.total_price <= 0) {
        throw new Error('Invalid rental price');
      }
      
      console.log('Sending rental request data:', requestData);
      console.log('User data for borrower:', userData);
      console.log('Selected date range:', selectedRange);
      console.log('Booking data:', bookingData);

      // Create the rental transaction
              const response = await fetch('http://localhost:8000/api/rentaltransactions/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        let errorMessage = `Failed to create rental: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          console.error('Rental creation failed:', errorData);
          
          // Extract specific error messages from Django validation errors
          if (errorData && typeof errorData === 'object') {
            if (errorData.non_field_errors && errorData.non_field_errors.length > 0) {
              const error = errorData.non_field_errors[0];
              // Check for specific error types and provide user-friendly messages
              if (error.includes('not available for rental')) {
                errorMessage = "This tool is currently not available for rental. It may be already rented or temporarily unavailable.";
              } else if (error.includes('already booked')) {
                errorMessage = "This tool is already booked for the selected dates. Please choose different dates.";
              } else if (error.includes('cannot rent your own tool')) {
                errorMessage = "You cannot rent your own tool. Please select a different tool.";
              } else if (error.includes('pending approved requests')) {
                errorMessage = "This tool has pending approved requests for the selected dates.";
              } else {
                errorMessage = error;
              }
            } else if (errorData.detail) {
              errorMessage = errorData.detail;
            } else {
              // Try to extract first error message from any field
              const firstError = Object.values(errorData)[0];
              if (Array.isArray(firstError) && firstError.length > 0) {
                const error = firstError[0];
                // Check for specific error types and provide user-friendly messages
                if (error.includes('not available for rental')) {
                  errorMessage = "This tool is currently not available for rental. It may be already rented or temporarily unavailable.";
                } else if (error.includes('already booked')) {
                  errorMessage = "This tool is already booked for the selected dates. Please choose different dates.";
                } else if (error.includes('cannot rent your own tool')) {
                  errorMessage = "You cannot rent your own tool. Please select a different tool.";
                } else if (error.includes('pending approved requests')) {
                  errorMessage = "This tool has pending approved requests for the selected dates.";
                } else {
                  errorMessage = error;
                }
              }
            }
          }
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Rental created successfully:', result);

      // Redirect to confirmation page
      router.push(`/dashboard/booking-confirmation?transactionId=${newTransactionId}&packageId=${newPackageId}`);

    } catch (error) {
      console.error('Error creating rental:', error);
      toast({
        variant: "destructive",
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "Failed to create rental. Please try again.",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">Rental Booking</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">Rental Booking</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No booking data available.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const calculateTotalHours = () => {
    if (!selectedRange?.from || !selectedRange?.to) return 0;
    const start = new Date(selectedRange.from);
    const end = new Date(selectedRange.to);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    return diffHours;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">Complete Your Rental</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Tool Details */}
        <Card>
          <CardHeader>
            <CardTitle>Tool Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20">
                <Image
                  src={bookingData.tool.imageUrl}
                  alt={bookingData.tool.name}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
              <div>
                <h3 className="font-semibold">{bookingData.tool.name}</h3>
                <p className="text-sm text-muted-foreground">Tool Rental</p>
                <p className="text-sm text-muted-foreground">${bookingData.tool.dailyRate}/day</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Date Selection */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="dates">Select Rental Dates</Label>
            <div className="mt-2">
              <CalendarComponent
                mode="range"
                selected={selectedRange}
                onSelect={(range) => setSelectedRange(range as { from: Date | undefined; to: Date | undefined })}
                disabled={(date) => {
                  // Disable past dates
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  if (date < today) return true;
                  
                  // Disable unavailable dates
                  return unavailableDates.some(unavailableDate => {
                    const unavailable = new Date(unavailableDate);
                    unavailable.setHours(0, 0, 0, 0);
                    const checkDate = new Date(date);
                    checkDate.setHours(0, 0, 0, 0);
                    return unavailable.getTime() === checkDate.getTime();
                  });
                }}
                className="rounded-md border"
              />
            </div>
          </div>

          {/* Time Selection for Hourly Rentals */}
          {bookingData?.tool.pricing_type === 'hourly' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-time">Start Time</Label>
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select start time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="end-time">End Time</Label>
                <Select value={endTime} onValueChange={setEndTime}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select end time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Availability Information */}
          {availabilityData && availabilityData.booked_dates.length > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">Unavailable Dates</h4>
              <div className="space-y-1">
                {availabilityData.booked_dates.map((booking: any, index: number) => (
                  <div key={index} className="text-sm text-yellow-700">
                    <span className="font-medium">
                      {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                    </span>
                    <span className="ml-2 text-xs bg-yellow-200 px-2 py-1 rounded">
                      {booking.type === 'rental' ? 'Rented' : booking.type === 'request' ? 'Requested' : 'Unavailable'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedRange?.from && selectedRange?.to && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Selected Dates</h4>
              <div className="text-sm text-blue-700">
                <div>From: {selectedRange.from.toLocaleDateString()}</div>
                <div>To: {selectedRange.to.toLocaleDateString()}</div>
                <div className="mt-2 font-medium">
                  Total Days: {Math.ceil((selectedRange.to.getTime() - selectedRange.from.getTime()) / (1000 * 60 * 60 * 24))}
                </div>
                {bookingData?.tool.pricing_type === 'hourly' && (
                  <div className="mt-2 font-medium">
                    <div>Start Time: {startTime}</div>
                    <div>End Time: {endTime}</div>
                    <div>Total Hours: {calculateTotalHours()}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Rental Details - Update to show dynamic values */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Rental Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pricing Type:</span>
              <span className="font-medium capitalize">{bookingData?.tool.pricing_type}</span>
            </div>
            
            {bookingData?.tool.pricing_type === 'hourly' ? (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hourly Rate:</span>
                  <span className="font-medium">${bookingData?.tool.price_per_hour?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Hours:</span>
                  <span className="font-medium">{calculateTotalHours()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rental Total:</span>
                  <span className="font-semibold text-lg">
                    ${((bookingData?.tool.price_per_hour || 0) * calculateTotalHours()).toFixed(2)}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {bookingData?.tool.pricing_type === 'daily' ? 'Daily Rate:' :
                     bookingData?.tool.pricing_type === 'weekly' ? 'Weekly Rate:' :
                     bookingData?.tool.pricing_type === 'monthly' ? 'Monthly Rate:' : 'Rate:'}
                  </span>
                  <span className="font-medium">
                    ${bookingData?.tool.pricing_type === 'daily' ? bookingData?.tool.dailyRate.toFixed(2) :
                      bookingData?.tool.pricing_type === 'weekly' ? bookingData?.tool.price_per_week?.toFixed(2) :
                      bookingData?.tool.pricing_type === 'monthly' ? bookingData?.tool.price_per_month?.toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Number of {bookingData?.tool.pricing_type === 'daily' ? 'Days' :
                    bookingData?.tool.pricing_type === 'weekly' ? 'Weeks' :
                    bookingData?.tool.pricing_type === 'monthly' ? 'Months' : 'Units'}:</span>
                  <span className="font-medium">{selectedRange?.from && selectedRange?.to ? 
                    Math.ceil((selectedRange.to.getTime() - selectedRange.from.getTime()) / (1000 * 60 * 60 * 24)) : 
                    bookingData?.totalDays || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rental Total:</span>
                  <span className="font-semibold text-lg">
                    ${selectedRange?.from && selectedRange?.to ? 
                      (Math.ceil((selectedRange.to.getTime() - selectedRange.from.getTime()) / (1000 * 60 * 60 * 24)) * (bookingData?.tool.dailyRate || 0)).toFixed(2) : 
                      bookingData?.totalAmount.toFixed(2) || '0.00'}
                  </span>
                </div>
              </>
            )}
            
            {/* Deposit Information */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Deposit Amount:</span>
                <span className="font-medium text-orange-600">$50.00</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                This $50 deposit will be held and returned when the tool is returned in good condition
              </div>
            </div>
            
            <div className="flex justify-between border-t pt-4">
              <span className="text-muted-foreground font-semibold">Total Amount Due:</span>
              <span className="font-bold text-xl text-primary">
                ${(() => {
                  const rentalTotal = bookingData?.tool.pricing_type === 'hourly' ? 
                    ((bookingData?.tool.price_per_hour || 0) * calculateTotalHours()) :
                    (selectedRange?.from && selectedRange?.to ? 
                      (Math.ceil((selectedRange.to.getTime() - selectedRange.from.getTime()) / (1000 * 60 * 60 * 24)) * (bookingData?.tool.dailyRate || 0)) : 
                      (bookingData?.totalAmount || 0));
                  const deposit = 50.00; // Fixed deposit amount
                  return (rentalTotal + deposit).toFixed(2);
                })()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rental Agreement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Rental Agreement
          </CardTitle>
          <CardDescription>
            Please read and accept the terms and conditions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg max-h-40 overflow-y-auto text-sm">
            <h4 className="font-semibold mb-2">EquiShare Rental Agreement</h4>
            <p className="mb-2">
              This agreement is made between the renter and the tool owner for the rental period specified.
            </p>
            <p className="mb-2">
              <strong>Terms and Conditions:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>The renter is responsible for the safe return of the tool in the same condition</li>
              <li>Late returns will incur additional charges</li>
              <li>Damages must be reported immediately</li>
              <li>The tool owner reserves the right to cancel the rental</li>
              <li>Payment is due in full at the time of booking</li>
            </ul>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="agreement"
              checked={agreementAccepted}
              onCheckedChange={(checked) => setAgreementAccepted(checked as boolean)}
            />
            <Label htmlFor="agreement" className="text-sm">
              I have read and agree to the rental agreement terms and conditions
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-primary/5 p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Rental Cost:</span>
              <span className="font-medium">${bookingData.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Deposit:</span>
              <span className="font-medium text-green-600">$50.00</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total Amount Due:</span>
                <span className="text-2xl font-bold text-primary">${(bookingData.totalAmount + 50).toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Includes ${bookingData.totalAmount.toFixed(2)} rental + $50.00 deposit
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>Payment will be processed securely upon confirmation</span>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/tools')}
          disabled={processing}
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirmBooking}
          disabled={!agreementAccepted || processing}
          className="min-w-[150px]"
        >
          {processing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Processing...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm Booking
            </>
          )}
        </Button>
      </div>
    </div>
  );
} 
