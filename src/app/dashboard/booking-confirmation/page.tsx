"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Download, Calendar, CreditCard, Package, Receipt } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Input } from '@/components/ui/input';

interface ConfirmationData {
  transactionId: string;
  packageId: string;
  rentalId: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  toolName: string;
  toolImage: string;
  toolOwner: string;
  toolId: string;
  ownerId: string;
  status: string;
}

function FeedbackForm({ toolId, transactionId, ownerId, borrowerId, onSubmitted }: {
  toolId: string;
  transactionId: string;
  ownerId: string;
  borrowerId: number;
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Tool feedback
    await fetch('/api/feedbacks/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: toolId,
        borrower: borrowerId,
        rating,
        comments,
      }),
    });
    // User-to-user review
    await fetch('/api/userreviews/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reviewer: borrowerId,
        reviewee: ownerId,
        transaction: transactionId,
        rating,
        comments,
      }),
    });
    setSubmitting(false);
    onSubmitted?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-6">
      <h3 className="font-semibold">Leave Feedback</h3>
      <div>
        <label>Rating:</label>
        <select value={rating} onChange={e => setRating(Number(e.target.value))}>
          {[5,4,3,2,1].map(val => <option key={val} value={val}>{val}</option>)}
        </select>
      </div>
      <div>
        <label>Comments:</label>
        <textarea value={comments} onChange={e => setComments(e.target.value)} />
      </div>
      <button type="submit" disabled={submitting} className="btn btn-primary">
        {submitting ? 'Submitting...' : 'Submit Feedback'}
      </button>
    </form>
  );
}

export default function BookingConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [confirmationData, setConfirmationData] = useState<ConfirmationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [appRating, setAppRating] = useState(0);
  const [appReview, setAppReview] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const user = { id: 1, name: 'You' }; // Replace with real user context if available

  useEffect(() => {
    const transactionId = searchParams.get('transactionId');
    const packageId = searchParams.get('packageId');

    if (!transactionId || !packageId) {
      toast({
        variant: "destructive",
        title: "Invalid Confirmation",
        description: "Missing confirmation information.",
      });
      router.push('/dashboard/tools');
      return;
    }

    const fetchConfirmationData = async () => {
      try {
        // Fetch the most recent rental transaction for this user
        const response = await fetch('http://localhost:8000/api/rentaltransactions/');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const rentals = await response.json();
        // Find the most recent rental (assuming it's the one just created)
        const latestRental = rentals[rentals.length - 1];
        
        if (latestRental) {
          const confirmationData: ConfirmationData = {
            transactionId: transactionId,
            packageId: packageId,
            rentalId: latestRental.id.toString(),
            startDate: latestRental.start_date,
            endDate: latestRental.end_date,
            totalAmount: parseFloat(latestRental.total_price),
            toolName: latestRental.tool?.name || 'Unknown Tool',
            toolImage: latestRental.tool?.image || 'https://placehold.co/300x300.png',
            toolOwner: latestRental.owner?.username || 'Unknown Owner',
            toolId: latestRental.tool?.id?.toString() || '',
            ownerId: latestRental.owner?.id?.toString() || '',
            status: latestRental.status || 'confirmed'
          };
          
          setConfirmationData(confirmationData);
        } else {
          // Fallback to mock data if no rental found
          const mockData: ConfirmationData = {
            transactionId,
            packageId,
            rentalId: 'RENT' + Date.now().toString().slice(-6),
            startDate: new Date().toLocaleDateString(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            totalAmount: 105.00,
            toolName: 'DeWalt Cordless Drill',
            toolImage: 'https://placehold.co/300x300.png',
            toolOwner: 'Tool Owner',
            toolId: '1',
            ownerId: '1',
            status: 'confirmed'
          };
          setConfirmationData(mockData);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching confirmation data:', error);
        toast({
          variant: "destructive",
          title: "Error fetching confirmation",
          description: "Failed to fetch booking confirmation data.",
        });
        router.push('/dashboard/tools');
      }
    };

    fetchConfirmationData();
  }, [searchParams, router, toast]);

  const handleDownloadReceipt = () => {
    // In a real app, this would generate and download a PDF receipt
    toast({
      title: "Receipt Downloaded",
      description: "Your rental receipt has been downloaded.",
    });
  };

  const handleViewRentals = () => {
    router.push('/dashboard/rentals');
  };

  const handleBackToTools = () => {
    router.push('/dashboard/tools');
  };

  const handleSubmitReview = async () => {
    if (!appRating) return;
    
    setSubmittingReview(true);
    try {
      // Submit application review
              const response = await fetch('http://localhost:8000/api/application-reviews/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: user.id,
          rating: appRating,
          review: appReview,
          transaction_id: confirmationData?.transactionId,
        }),
      });
      
      if (response.ok) {
        toast({
          title: "Review Submitted",
          description: "Thank you for your feedback!",
        });
        setAppRating(0);
        setAppReview('');
      } else {
        throw new Error('Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit review. Please try again.",
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">Booking Confirmation</h1>
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

  if (!confirmationData) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">Booking Confirmation</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No confirmation data available.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="bg-green-100 p-4 rounded-full">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">Booking Confirmed!</h1>
        <p className="text-muted-foreground">
          Your rental has been successfully confirmed. You will receive a confirmation email shortly.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Transaction Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Transaction Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transaction ID:</span>
              <span className="font-mono font-medium">{confirmationData.transactionId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Package ID:</span>
              <span className="font-mono font-medium">{confirmationData.packageId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rental ID:</span>
              <span className="font-mono font-medium">{confirmationData.rentalId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant="default" className="bg-green-100 text-green-800">
                {confirmationData.status.toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Rental Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Rental Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Start Date:</span>
              <span className="font-medium">{confirmationData.startDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">End Date:</span>
              <span className="font-medium">{confirmationData.endDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Amount:</span>
              <span className="font-semibold text-lg">${confirmationData.totalAmount.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tool Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Rented Tool
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20">
              <Image
                src={confirmationData.toolImage}
                alt={confirmationData.toolName}
                fill
                className="object-cover rounded-lg"
              />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{confirmationData.toolName}</h3>
              <p className="text-muted-foreground">Owner: {confirmationData.toolOwner}</p>
              <p className="text-muted-foreground">Ready for pickup</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>What's Next?</CardTitle>
          <CardDescription>
            Here's what you need to know about your rental
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium">Pickup Instructions</h4>
                <p className="text-sm text-muted-foreground">
                  Contact the tool owner to arrange pickup. Show your transaction ID for verification.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-green-100 p-2 rounded-full">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium">Return Process</h4>
                <p className="text-sm text-muted-foreground">
                  Return the tool in the same condition by the end date. Late returns may incur additional charges.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Section */}
      <Card>
        <CardHeader>
          <CardTitle>Review</CardTitle>
          <CardDescription>
            Rate your experience with our tool rental application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Application Rating:</label>
              <div className="flex items-center gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setAppRating(star)}
                    className={`text-2xl ${
                      star <= appRating ? 'text-yellow-400' : 'text-gray-300'
                    } hover:text-yellow-400 transition-colors`}
                  >
                    ★
                  </button>
                ))}
                <span className="ml-2 text-sm text-muted-foreground">
                  {appRating}/5 stars
                </span>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Your Review:</label>
              <textarea
                value={appReview}
                onChange={(e) => setAppReview(e.target.value)}
                placeholder="Share your experience with our tool rental platform..."
                className="w-full mt-2 p-3 border border-gray-300 rounded-md resize-none"
                rows={3}
              />
            </div>
            
            <Button 
              onClick={handleSubmitReview}
              disabled={!appRating || submittingReview}
              className="w-full"
            >
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {confirmationData.status === 'completed' && (
        <FeedbackForm
          toolId={confirmationData.toolId}
          transactionId={confirmationData.transactionId}
          ownerId={confirmationData.toolOwner}
          borrowerId={user.id}
          onSubmitted={() => toast({ title: 'Thank you for your feedback!' })}
        />
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        <Button
          variant="outline"
          onClick={handleDownloadReceipt}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download Receipt
        </Button>
        <Button
          onClick={handleViewRentals}
          className="flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          View My Rentals
        </Button>
        <Button
          variant="outline"
          onClick={handleBackToTools}
        >
          Back to Tools
        </Button>
      </div>
    </div>
  );
} 
