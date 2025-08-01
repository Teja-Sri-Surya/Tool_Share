"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Tool } from "@/lib/data";
import Image from "next/image";

interface AddToolDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddTool: (tool: Omit<Tool, 'id' | 'isAvailable' | 'owner' | 'aiHint'>) => void;
}

export function AddToolDialog({ isOpen, onOpenChange, onAddTool }: AddToolDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pricingType, setPricingType] = useState<"hourly" | "daily" | "weekly" | "monthly">("daily");
  const [pricePerHour, setPricePerHour] = useState("");
  const [pricePerDay, setPricePerDay] = useState("");
  const [pricePerWeek, setPricePerWeek] = useState("");
  const [pricePerMonth, setPricePerMonth] = useState("");
  const [replacementValue, setReplacementValue] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = () => {
    if (!name || !description || !imagePreview) {
       toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Please fill out all fields and upload an image.",
      });
      return;
    }

    // Validate pricing based on pricing type
    if (pricingType === 'hourly' && !pricePerHour) {
      toast({
        variant: "destructive",
        title: "Missing Price",
        description: "Please enter hourly rate.",
      });
      return;
    }
    if (pricingType === 'daily' && !pricePerDay) {
      toast({
        variant: "destructive",
        title: "Missing Price",
        description: "Please enter daily rate.",
      });
      return;
    }
    if (pricingType === 'weekly' && !pricePerWeek) {
      toast({
        variant: "destructive",
        title: "Missing Price",
        description: "Please enter weekly rate.",
      });
      return;
    }
    if (pricingType === 'monthly' && !pricePerMonth) {
      toast({
        variant: "destructive",
        title: "Missing Price",
        description: "Please enter monthly rate.",
      });
      return;
    }

    onAddTool({
      name,
      description,
      pricing_type: pricingType,
      price_per_hour: pricePerHour ? parseFloat(pricePerHour) : undefined,
      dailyRate: pricePerDay ? parseFloat(pricePerDay) : 0,
      price_per_week: pricePerWeek ? parseFloat(pricePerWeek) : undefined,
      price_per_month: pricePerMonth ? parseFloat(pricePerMonth) : undefined,
      replacement_value: replacementValue ? parseFloat(replacementValue) : undefined,
      imageUrl: imagePreview,
    });

    toast({
        title: "Tool Added",
        description: `${name} has been listed for rent.`,
    });

    // Reset form and close dialog
    setName('');
    setDescription('');
    setPricingType('daily');
    setPricePerHour('');
    setPricePerDay('');
    setPricePerWeek('');
    setPricePerMonth('');
    setReplacementValue('');
    setImagePreview(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add a New Tool</DialogTitle>
          <DialogDescription>
            Fill in the details below to list your tool for rent.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} className="col-span-3" placeholder="e.g. DeWalt Cordless Drill" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} className="col-span-3" placeholder="Describe your tool..." />
          </div>
          
          {/* Pricing Type Selection */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="pricingType" className="text-right">
              Pricing Type
            </Label>
            <Select value={pricingType} onValueChange={(value: "hourly" | "daily" | "weekly" | "monthly") => setPricingType(value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dynamic Pricing Fields */}
          {pricingType === 'hourly' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pricePerHour" className="text-right">
                Hourly Rate ($)
              </Label>
              <Input id="pricePerHour" type="number" step="0.01" value={pricePerHour} onChange={e => setPricePerHour(e.target.value)} className="col-span-3" placeholder="e.g. 5.00" />
            </div>
          )}
          
          {pricingType === 'daily' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pricePerDay" className="text-right">
                Daily Rate ($)
              </Label>
              <Input id="pricePerDay" type="number" step="0.01" value={pricePerDay} onChange={e => setPricePerDay(e.target.value)} className="col-span-3" placeholder="e.g. 25.00" />
            </div>
          )}
          
          {pricingType === 'weekly' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pricePerWeek" className="text-right">
                Weekly Rate ($)
              </Label>
              <Input id="pricePerWeek" type="number" step="0.01" value={pricePerWeek} onChange={e => setPricePerWeek(e.target.value)} className="col-span-3" placeholder="e.g. 150.00" />
            </div>
          )}
          
          {pricingType === 'monthly' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pricePerMonth" className="text-right">
                Monthly Rate ($)
              </Label>
              <Input id="pricePerMonth" type="number" step="0.01" value={pricePerMonth} onChange={e => setPricePerMonth(e.target.value)} className="col-span-3" placeholder="e.g. 500.00" />
            </div>
          )}

          {/* Replacement Value */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="replacementValue" className="text-right">
              Replacement Value ($)
            </Label>
            <Input id="replacementValue" type="number" step="0.01" value={replacementValue} onChange={e => setReplacementValue(e.target.value)} className="col-span-3" placeholder="e.g. 200.00" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="picture" className="text-right">
              Picture
            </Label>
            <Input id="picture" type="file" accept="image/*" onChange={handleImageChange} className="col-span-3" />
          </div>
          {imagePreview && (
             <div className="col-span-4 flex justify-center">
                <div className="relative w-48 h-48">
                    <Image src={imagePreview} alt="Tool preview" fill className="object-cover rounded-md" />
                </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" onClick={handleSubmit}>Add Tool</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
