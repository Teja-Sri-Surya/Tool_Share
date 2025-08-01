"use client";

import { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, CheckCircle, XCircle, AlertTriangle, MapPin, Calendar, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BorrowRequest {
  id: number;
  tool: {
    id: number;
    name: string;
    image: string;
    pickup_location: string;
  };
  borrower: {
    id: number;
    username: string;
  };
  owner: {
    id: number;
    username: string;
  };
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  total_price: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired';
  message: string;
  owner_response: string;
  created_at: string;
  updated_at: string;
  duration_hours: number;
}

export default function BorrowRequestsPage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [borrowRequests, setBorrowRequests] = useState<{
    as_borrower: BorrowRequest[];
    as_owner: BorrowRequest[];
  }>({ as_borrower: [], as_owner: [] });
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<BorrowRequest | null>(null);
  const [responseDialog, setResponseDialog] = useState(false);
  const [ownerResponse, setOwnerResponse] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    fetchBorrowRequests();
  }, [user?.id]);

  const fetchBorrowRequests = async () => {
    try {
                  const response = await fetch('http://localhost:8000/api/borrow-requests/user/');
      if (response.ok) {
        const data = await response.json();
        setBorrowRequests(data);
      }
    } catch (error) {
      console.error('Error fetching borrow requests:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load borrow requests.",
      });
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleApprove = async (requestId: number) => {
    setActionLoading(true);
    try {
              const response = await fetch(`http://localhost:8000/api/borrow-requests/${requestId}/approve/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner_response: ownerResponse
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Borrow request approved successfully.",
        });
        fetchBorrowRequests();
        setResponseDialog(false);
        setOwnerResponse('');
      } else {
        const errorData = await response.json();
        toast({
          variant: "destructive",
          title: "Error",
          description: errorData.error || "Failed to approve request.",
        });
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to approve request.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (requestId: number) => {
    setActionLoading(true);
    try {
              const response = await fetch(`http://localhost:8000/api/borrow-requests/${requestId}/reject/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner_response: ownerResponse
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Borrow request rejected successfully.",
        });
        fetchBorrowRequests();
        setResponseDialog(false);
        setOwnerResponse('');
      } else {
        const errorData = await response.json();
        toast({
          variant: "destructive",
          title: "Error",
          description: errorData.error || "Failed to reject request.",
        });
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject request.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (requestId: number) => {
    setActionLoading(true);
    try {
              const response = await fetch(`http://localhost:8000/api/borrow-requests/${requestId}/cancel/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Borrow request cancelled successfully.",
        });
        fetchBorrowRequests();
      } else {
        const errorData = await response.json();
        toast({
          variant: "destructive",
          title: "Error",
          description: errorData.error || "Failed to cancel request.",
        });
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to cancel request.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'expired':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const openResponseDialog = (request: BorrowRequest) => {
    setSelectedRequest(request);
    setResponseDialog(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Borrow Requests</h1>
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Borrow Requests</h1>
        <p className="text-muted-foreground">Manage your tool borrowing requests and approvals.</p>
      </div>

      <Tabs defaultValue="received" className="space-y-4">
        <TabsList>
          <TabsTrigger value="received">Received Requests</TabsTrigger>
          <TabsTrigger value="sent">Sent Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="received">
          <Card>
            <CardHeader>
              <CardTitle>Requests to Approve</CardTitle>
              <CardDescription>Borrow requests for tools you own.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRequests ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : borrowRequests.as_owner.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No pending requests</p>
                  <p className="text-sm text-muted-foreground">You'll see requests here when someone wants to borrow your tools.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tool</TableHead>
                      <TableHead>Borrower</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {borrowRequests.as_owner.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{request.tool.name}</div>
                            <div className="text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3 inline mr-1" />
                              {request.tool.pickup_location}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{request.borrower.username}</div>
                          {request.message && (
                            <div className="text-sm text-muted-foreground mt-1">
                              "{request.message}"
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(request.start_date).toLocaleDateString()}
                            </div>
                            <div className="text-muted-foreground">to</div>
                            <div>{new Date(request.end_date).toLocaleDateString()}</div>
                            {request.start_time && request.end_time && (
                              <div className="text-xs text-muted-foreground">
                                {request.start_time} - {request.end_time}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-medium">{parseFloat(request.total_price).toFixed(2)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(request.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(request.status)}
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {request.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => openResponseDialog(request)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => openResponseDialog(request)}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                          {request.status !== 'pending' && request.owner_response && (
                            <div className="text-sm text-muted-foreground">
                              "{request.owner_response}"
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sent">
          <Card>
            <CardHeader>
              <CardTitle>Your Requests</CardTitle>
              <CardDescription>Requests you've sent to borrow tools.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRequests ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : borrowRequests.as_borrower.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No sent requests</p>
                  <p className="text-sm text-muted-foreground">You'll see your requests here when you ask to borrow tools.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tool</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {borrowRequests.as_borrower.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{request.tool.name}</div>
                            <div className="text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3 inline mr-1" />
                              {request.tool.pickup_location}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{request.owner.username}</div>
                          {request.owner_response && (
                            <div className="text-sm text-muted-foreground mt-1">
                              "{request.owner_response}"
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(request.start_date).toLocaleDateString()}
                            </div>
                            <div className="text-muted-foreground">to</div>
                            <div>{new Date(request.end_date).toLocaleDateString()}</div>
                            {request.start_time && request.end_time && (
                              <div className="text-xs text-muted-foreground">
                                {request.start_time} - {request.end_time}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-medium">{parseFloat(request.total_price).toFixed(2)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(request.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(request.status)}
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {request.status === 'pending' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleCancel(request.id)}
                              disabled={actionLoading}
                            >
                              Cancel
                            </Button>
                          )}
                          {request.message && (
                            <div className="text-sm text-muted-foreground">
                              "{request.message}"
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Response Dialog */}
      <Dialog open={responseDialog} onOpenChange={setResponseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedRequest && (
                selectedRequest.status === 'pending' ? 
                'Respond to Borrow Request' : 
                'Request Details'
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <>
                  <strong>{selectedRequest.tool.name}</strong> - Request from {selectedRequest.borrower.username}
                  <br />
                  {new Date(selectedRequest.start_date).toLocaleDateString()} to {new Date(selectedRequest.end_date).toLocaleDateString()}
                  <br />
                  Total: ${parseFloat(selectedRequest.total_price).toFixed(2)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && selectedRequest.status === 'pending' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Your Response (Optional)</label>
                <Textarea
                  value={ownerResponse}
                  onChange={(e) => setOwnerResponse(e.target.value)}
                  placeholder="Add a message to the borrower..."
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setResponseDialog(false);
                    setOwnerResponse('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleReject(selectedRequest.id)}
                  disabled={actionLoading}
                >
                  Reject Request
                </Button>
                <Button
                  onClick={() => handleApprove(selectedRequest.id)}
                  disabled={actionLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Approve Request
                </Button>
              </div>
            </div>
          )}
          
          {selectedRequest && selectedRequest.status !== 'pending' && (
            <DialogFooter>
              <Button onClick={() => setResponseDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 
