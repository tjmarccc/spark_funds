import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Zap, Shield, Globe, Fingerprint, User as UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/dashboard';

  const { user, profile, connectWallet, createProfile, connecting, loading } = useAuth();
  const { toast } = useToast();

  const [showRegistration, setShowRegistration] = useState(false);
  const [registrationData, setRegistrationData] = useState({
    name: '',
    email: '',
    isCreator: false,
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (loading || connecting) return;
    if (user && profile) {
      navigate(redirectTo, { replace: true });
    }
  }, [user, profile, loading, connecting, navigate, redirectTo]);

  const handleWalletConnect = async () => {
    try {
      const result = await connectWallet();

      if (result.error) {
        toast({
          title: "Connection Failed",
          description: "Unable to connect wallet. Please try again.",
          variant: "destructive"
        });
        return;
      }

      if (result.isNewUser) {
        setShowRegistration(true);
        setRegistrationData(prev => ({
          ...prev,
          email: result.principalId ? `${result.principalId.substring(0, 8)}@icp.local` : ''
        }));
        toast({
          title: "Wallet Connected",
          description: "Please complete your profile to continue"
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "Wallet connected successfully"
        });
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRegistration = async () => {
    if (!registrationData.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your name",
        variant: "destructive"
      });
      return;
    }

    const { error } = await createProfile(
      registrationData.name.trim(),
      registrationData.email.trim(),
      registrationData.isCreator
    );

    if (error) {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create profile",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Profile Created!",
        description: "Welcome to Spark Funds"
      });
      // Redirect after successful registration
      navigate(redirectTo, { replace: true });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (showRegistration) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-2xl bg-gradient-primary bg-clip-text text-transparent">
              Complete Your Profile
            </CardTitle>
            <CardDescription>Set up your Spark Funds account on ICP</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  className="pl-10"
                  value={registrationData.name}
                  onChange={(e) =>
                    setRegistrationData((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={registrationData.email}
                onChange={(e) =>
                  setRegistrationData((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isCreator"
                checked={registrationData.isCreator}
                onCheckedChange={(checked) =>
                  setRegistrationData((prev) => ({
                    ...prev,
                    isCreator: checked as boolean
                  }))
                }
              />
              <Label htmlFor="isCreator" className="text-sm">
                I want to create campaigns and receive donations
              </Label>
            </div>

            <Button
              onClick={handleRegistration}
              className="w-full bg-gradient-primary hover:bg-gradient-primary/90"
            >
              Complete Registration
            </Button>

            <Button variant="outline" onClick={() => setShowRegistration(false)} className="w-full">
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl bg-gradient-primary bg-clip-text text-transparent">
            Spark Funds
          </CardTitle>
          <CardDescription>Join the micro-donation revolution on ICP</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="bg-accent/10 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <Globe className="h-5 w-5 text-primary" />
                <span className="font-medium">Internet Computer Protocol</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Secure, decentralized authentication powered by ICP
              </p>
            </div>

            <Button onClick={handleWalletConnect} disabled={connecting} className="w-full h-12 btn-web3">
              {connecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting Wallet...
                </>
              ) : (
                <>
                  <Fingerprint className="mr-2 h-4 w-4" />
                  Connect ICP Wallet
                </>
              )}
            </Button>

            <div className="text-xs text-muted-foreground space-y-2">
              <p>
                Internet Identity provides secure, anonymous authentication without passwords or
                personal data.
              </p>
              <div className="flex items-center justify-center space-x-4 text-primary">
                <span className="flex items-center space-x-1">
                  <Shield className="h-3 w-3" />
                  <span>Secure</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Globe className="h-3 w-3" />
                  <span>Decentralized</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Fingerprint className="h-3 w-3" />
                  <span>Anonymous</span>
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
