import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Shield,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Key,
  CheckCircle,
  Home,
  AlertTriangle,
  LogOut
} from "lucide-react";

const TouristID = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Try to get user data from localStorage first
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setUserData(user);
          setLoading(false);
          return;
        }

        // If not in localStorage, try to fetch from backend
        const response = await axios.get('http://localhost:3000/users/profile', {
          withCredentials: true
        });

        if (response.data.success) {
          setUserData(response.data.data);
          localStorage.setItem('user', JSON.stringify(response.data.data));
        } else {
          setError("Failed to load user data");
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError("Failed to load user data. Please login again.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const generateDigitalId = () => {
    if (!userData) return "";
    // Generate a simple digital ID based on user data
    const timestamp = new Date().getTime();
    const random = Math.random().toString(36).substring(2, 8);
    return `DT${timestamp.toString(36)}${random}`.toUpperCase();
  };

  const generateSignature = () => {
    if (!userData) return "";
    // Generate a simple signature based on user data
    const data = `${userData.name}${userData.email}${userData.phone}`;
    return btoa(data).substring(0, 20);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen gradient-bg">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-white">Loading your Digital Tourist ID...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg p-4">
        <Card className="w-full max-w-md glass-effect border-white/20">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-white">Error Loading Profile</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate("/login")}
              className="w-full bg-primary hover:bg-primary/90"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/20 px-3 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="flex h-16 items-center px-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 ml-1.5">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold">Digital Tourist ID</span>
            </div>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => navigate("/safe")}>
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button variant="destructive" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-6 sm:py-8 px-0">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Welcome Section */}
          <div className="text-center space-y-2">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
              <Shield className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Your Digital Tourist ID</h1>
            <p className="text-muted-foreground">
              Your official SafeTravels identification and safety credentials
            </p>
          </div>

          {/* Main ID Card */}
          <Card className="glass-effect border-white/20 shadow-xl">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userData?.name}`} />
                  <AvatarFallback>
                    {userData?.name?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{userData?.name || "N/A"}</CardTitle>
                  <Badge variant="default" className="mt-1">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Verified Tourist
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 p-4 sm:p-6 md:p-8">
              {/* ID Information Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                      <p className="text-lg font-semibold">{userData?.name || "N/A"}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Key className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Digital ID</p>
                      <p className="text-lg font-semibold font-mono">{generateDigitalId()}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Phone</p>
                      <p className="text-lg font-semibold">{userData?.phone || "N/A"}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p className="text-sm">{userData?.email || "N/A"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Issue Date</p>
                      <p className="text-lg font-semibold">{new Date().toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Expiration</p>
                      <p className="text-lg font-semibold">
                        {new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <Badge variant="default">Active</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Emergency Contacts */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Emergency Contacts</h3>
                {userData?.emergencyContacts?.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {userData.emergencyContacts.map((contact, index) => (
                      <Card key={index} className="bg-muted/50">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                {contact.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{contact.name}</p>
                              <p className="text-sm text-muted-foreground">{contact.relation}</p>
                              <p className="text-sm">{contact.phone}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      No emergency contacts configured. Please add emergency contacts for better safety coverage.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <Separator />

              {/* Technical Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Technical Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Public Key</p>
                    <p className="text-xs font-mono bg-muted p-2 rounded break-all">
                      {generateDigitalId()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Digital Signature</p>
                    <div className="bg-muted p-3 rounded">
                      <p className="text-sm font-mono italic">
                        {generateSignature()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Important Information */}
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> This digital ID is your official identification within the SafeTravels network.
                  Keep this information secure and present it to authorities when required during emergencies.
                </AlertDescription>
              </Alert>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90"
                  onClick={() => navigate("/safe")}
                >
                  <Home className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.print()}
                >
                  Print ID Card
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto border-t bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">
                © 2024 SafeTravels. All rights reserved.
              </span>
            </div>
            <div className="flex space-x-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-primary transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TouristID;
