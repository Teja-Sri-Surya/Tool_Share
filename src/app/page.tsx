'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench, HardHat, Drill, Users } from 'lucide-react';
import PublicHeader from '@/components/layout/public-header';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <PublicHeader />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-primary/10">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline text-primary">
                    Your Tools, On-Demand
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    EquiShare is the easiest way to rent the tools you need. From DIY projects to professional jobs, find the right equipment right here.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href="/dashboard/tools">Browse Tools</Link>
                  </Button>
                  <Button asChild variant="secondary" size="lg">
                     <Link href="/signup">Join Now</Link>
                  </Button>
                </div>
              </div>
              <Image
                src="https://placehold.co/600x400.png"
                width="600"
                height="400"
                alt="Hero"
                data-ai-hint="tools workshop"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square"
              />
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">How EquiShare Works</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform is designed for simplicity and efficiency. Get access to a wide variety of tools from your local community.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 lg:max-w-none mt-12">
              <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Wrench className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Browse & Find</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Easily search and filter through our extensive catalog of tools and equipment. Find exactly what you need for your next project.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <HardHat className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Rent with Confidence</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Securely book your rental. Our transparent system shows you availability, pricing, and user reviews.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Drill className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Work & Return</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Pick up your tools, get the job done, and return them. It's a hassle-free process from start to finish.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section> 
        <section className="w-full py-12 md:py-24 bg-white">
          <div className="container px-4 md:px-6">
            {/* Removed: <CategoryManager/> */}
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 EquiShare. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
