"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, DollarSign, Calendar, User, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

interface Deposit {
    id: number;
    rental_transaction: {
        id: number;
        tool: {
            id: number;
            name: string;
            image: string;
        };
        owner: {
            id: number;
            username: string;
        };
        borrower: {
            id: number;
            username: string;
        };
        start_date: string;
        end_date: string;
        status: string;
    };
    amount: string;
    status: string;
    payment_date: string | null;
    return_date: string | null;
    notes: string | null;
    created_at: string;
}

export default function DepositsPage() {
    const { user, loading: authLoading } = useAuth();
    const [deposits, setDeposits] = useState<Deposit[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    // Calculate financial summaries
    const calculateFinancialSummary = () => {
        if (!deposits.length) return { totalDeposits: 0, totalRefunds: 0, totalForfeited: 0, activeDeposits: 0 };
        
        const totalDeposits = deposits.reduce((sum, deposit) => sum + parseFloat(deposit.amount), 0);
        const totalRefunds = deposits
            .filter(deposit => deposit.status === 'refunded')
            .reduce((sum, deposit) => sum + parseFloat(deposit.amount), 0);
        const totalForfeited = deposits
            .filter(deposit => deposit.status === 'forfeited')
            .reduce((sum, deposit) => sum + parseFloat(deposit.amount), 0);
        const activeDeposits = deposits
            .filter(deposit => deposit.status === 'paid' || deposit.status === 'held')
            .reduce((sum, deposit) => sum + parseFloat(deposit.amount), 0);
        
        return { totalDeposits, totalRefunds, totalForfeited, activeDeposits };
    };

    useEffect(() => {
        if (!user || authLoading) return;
        
        const fetchDeposits = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/deposits/');
                if (response.ok) {
                    const data = await response.json();
                    // Filter deposits where current user is either owner or borrower
                    const userDeposits = data.filter((deposit: Deposit) => 
                        deposit.rental_transaction.owner.id === user.id || 
                        deposit.rental_transaction.borrower.id === user.id
                    );
                    setDeposits(userDeposits);
                }
            } catch (error) {
                console.error('Error fetching deposits:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDeposits();
    }, [user, authLoading]);

    const getDepositStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'secondary';
            case 'paid': return 'default';
            case 'held': return 'default';
            case 'returned': return 'default';
            case 'forfeited': return 'destructive';
            case 'refunded': return 'default';
            default: return 'secondary';
        }
    };

    const getDepositStatusText = (status: string) => {
        switch (status) {
            case 'pending': return 'Pending Payment';
            case 'paid': return 'Paid';
            case 'held': return 'Held';
            case 'returned': return 'Returned';
            case 'forfeited': return 'Forfeited';
            case 'refunded': return 'Refunded';
            default: return status;
        }
    };

    const getUserRole = (deposit: Deposit) => {
        if (deposit.rental_transaction.owner.id === user?.id) return 'Owner';
        if (deposit.rental_transaction.borrower.id === user?.id) return 'Borrower';
        return 'Unknown';
    };

    const getOtherParty = (deposit: Deposit) => {
        if (deposit.rental_transaction.owner.id === user?.id) return deposit.rental_transaction.borrower.username;
        return deposit.rental_transaction.owner.username;
    };

    if (authLoading) {
        return (
            <div className="flex flex-col gap-6">
                <div className="text-center py-8">
                    <h2 className="text-xl font-semibold">Loading your deposits...</h2>
                    <p className="text-muted-foreground">Please wait while we fetch your information.</p>
                </div>
            </div>
        );
    }

    const financialSummary = calculateFinancialSummary();

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Deposits</h1>
                    <p className="text-muted-foreground">Track your deposit payments and returns</p>
                </div>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${financialSummary.totalDeposits.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Total money deposited</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Money Refunded</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">${financialSummary.totalRefunds.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Money returned to you</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Money Forfeited</CardTitle>
                        <DollarSign className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">${financialSummary.totalForfeited.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Money lost due to late returns</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Deposits</CardTitle>
                        <DollarSign className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">${financialSummary.activeDeposits.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Currently held deposits</p>
                    </CardContent>
                </Card>
            </div>

            {loading ? (
                <div className="text-center py-8">Loading your deposits...</div>
            ) : deposits.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-8 text-center">
                    <CardHeader>
                        <CardTitle>No Deposits Found</CardTitle>
                        <CardDescription>You don't have any deposits yet.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/dashboard/tools">Browse Tools to Rent</Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {deposits.map((deposit) => (
                        <Card key={deposit.id} className="overflow-hidden">
                            <div className="aspect-video relative">
                                <Image
                                    src={deposit.rental_transaction.tool.image || 'https://placehold.co/300x300.png'}
                                    alt={deposit.rental_transaction.tool.name}
                                    fill
                                    className="object-cover"
                                />
                                <Badge 
                                    className="absolute top-2 right-2"
                                    variant={getDepositStatusColor(deposit.status)}
                                >
                                    {getDepositStatusText(deposit.status)}
                                </Badge>
                            </div>
                            <CardHeader>
                                <CardTitle className="text-lg">{deposit.rental_transaction.tool.name}</CardTitle>
                                <CardDescription>
                                    <div className="flex items-center gap-2 text-sm">
                                        <User className="h-3 w-3" />
                                        <span>Your role: {getUserRole(deposit)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm mt-1">
                                        <User className="h-3 w-3" />
                                        <span>Other party: {getOtherParty(deposit)}</span>
                                    </div>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <DollarSign className="h-3 w-3" />
                                    <span className="font-semibold">Amount: ${deposit.amount}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="h-3 w-3" />
                                    <span>Start: {new Date(deposit.rental_transaction.start_date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="h-3 w-3" />
                                    <span>End: {new Date(deposit.rental_transaction.end_date).toLocaleDateString()}</span>
                                </div>
                                
                                {deposit.status === 'forfeited' && (
                                    <div className="flex items-center gap-2 text-sm text-red-600">
                                        <AlertCircle className="h-3 w-3" />
                                        <span>Deposit forfeited due to overdue return</span>
                                    </div>
                                )}
                                
                                {deposit.status === 'returned' && (
                                    <div className="flex items-center gap-2 text-sm text-green-600">
                                        <Clock className="h-3 w-3" />
                                        <span>Deposit returned on {deposit.return_date ? new Date(deposit.return_date).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                )}
                                
                                {deposit.notes && (
                                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                                        {deposit.notes}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
} 
