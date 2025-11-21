import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "../contexts/AuthContext";
import { ROUTES } from "../constants";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, User, Lock, Eye, EyeOff, Shield } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setError("");

    const result = await login(data);

    if (result.success) {
      // Navigate based on user role
      const userRole = result.user?.role;
      if (userRole === 'admin') {
        navigate(ROUTES.ADMIN);
      } else {
        navigate(ROUTES.DIGITAL_TOURIST_ID);
      }
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg px-4 sm:px-6 lg:px-8 py-8">
      <div className="w-full max-w-md sm:max-w-lg md:max-w-xl space-y-6 sm:space-y-8">
        {/* Logo/Brand Section */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to your SafeTravels account</p>
        </div>

        {/* Login Card */}
        <Card className="glass-effect border-white/20 shadow-xl rounded-2xl md:rounded-3xl max-w-[560px] mx-auto">
          <CardHeader className="space-y-1 pb-0 sm:pb-2">
            <CardTitle className="text-3xl sm:text-4xl text-center tracking-tight">Login</CardTitle>
            <CardDescription className="text-center text-sm sm:text-base">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Username Field */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white text-sm mb-1.5 block">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    className="pl-12 pr-12 h-12 text-[15px] bg-white/10 border-white/30 text-white placeholder:text-muted-foreground focus:border-primary rounded-lg"
                    {...register("username")}
                  />
                </div>
                {errors.username && (
                  <p className="text-sm text-destructive">{errors.username.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white text-sm mb-1.5 block">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="pl-12 pr-12 h-12 text-[15px] bg-white/10 border-white/30 text-white placeholder:text-muted-foreground focus:border-primary rounded-lg"
                    {...register("password")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Eye className="h-5 w-5 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full h-12 text-base bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <User className="mr-2 h-5 w-5" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-6 sm:mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto text-primary hover:text-primary/80"
                  onClick={() => navigate(ROUTES.REGISTER)}
                >
                  Create one here
                </Button>
              </p>
            </div>

            {/* Admin Login Link */}
            <div className="mt-2 sm:mt-3 text-center">
              <Button
                variant="link"
                className="p-0 h-auto text-orange-400 hover:text-orange-300"
                onClick={() => navigate(ROUTES.ADMIN_LOGIN)}
              >
                Admin Login
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="text-center space-x-4">
          <Button variant="link" className="text-muted-foreground hover:text-white p-0 h-auto">
            About Us
          </Button>
          <Button variant="link" className="text-muted-foreground hover:text-white p-0 h-auto">
            Contact
          </Button>
          <Button variant="link" className="text-muted-foreground hover:text-white p-0 h-auto">
            Support
          </Button>
        </div>
      </div>
    </div>
  );
}
