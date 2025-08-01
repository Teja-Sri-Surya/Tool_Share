"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Package, ArrowRight, Home } from 'lucide-react';
import Link from 'next/link';

export default function ReturnConfirmationPage() {
    const searchParams = useSearchParams();
    const packageId = searchParams.get('packageId');
    const rentalId = searchParams.get('rentalId');
    const [countdown, setCountdown] = useState(10);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    // Redirect to dashboard after countdown
                    if (typeof window !== 'undefined') {
                        window.location.href = '/dashboard';
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleRedirectToDepartment = () => {
        // Redirect to the appropriate department page
        // You can customize this URL based on your requirements
        if (typeof window !== 'undefined') {
            window.location.href = '/dashboard/department';
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl">Return Successful!</CardTitle>
                    <CardDescription>
                        Your tool has been returned successfully. Here are your return details:
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Return Package ID:</span>
                            <Badge variant="outline" className="font-mono">
                                {packageId || 'N/A'}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Rental ID:</span>
                            <span className="text-sm text-muted-foreground">
                                {rentalId || 'N/A'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Return Date:</span>
                            <span className="text-sm text-muted-foreground">
                                {new Date().toLocaleDateString()}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Return Time:</span>
                            <span className="text-sm text-muted-foreground">
                                {new Date().toLocaleTimeString()}
                            </span>
                        </div>
                    </div>

                    <div className="pt-4 space-y-3">
                        <Button 
                            onClick={handleRedirectToDepartment}
                            className="w-full"
                            size="lg"
                        >
                            <Package className="mr-2 h-4 w-4" />
                            Go to Department
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                        
                        <Button 
                            asChild
                            variant="outline" 
                            className="w-full"
                        >
                            <Link href="/dashboard">
                                <Home className="mr-2 h-4 w-4" />
                                Back to Dashboard
                            </Link>
                        </Button>
                    </div>

                    <div className="text-center text-sm text-muted-foreground pt-4">
                        Redirecting to dashboard in {countdown} seconds...
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 
