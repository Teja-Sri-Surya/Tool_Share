import Link from "next/link";
import { HardHat } from "lucide-react";
import { LoginForm } from "@/components/auth/Login/login-form";
import PublicHeader from "@/components/layout/public-header";

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PublicHeader />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
            <LoginForm />
        </div>
      </main>
       <footer className="flex justify-center py-4">
        <p className="text-xs text-muted-foreground">
          &copy; 2024 EquiShare. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
