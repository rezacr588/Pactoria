'use client';

import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuth();

  const features = [
    'Unlimited contract creation',
    'AI-powered template generation',
    'Risk analysis and recommendations',
    'Real-time collaboration',
    'Version history and tracking',
    'Export to PDF and DOCX',
    'Email notifications',
    'Analytics and reporting'
  ];

  return (
    <div className="container mx-auto px-4 py-16 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">
          Simple Pricing
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Get full access to Pactoria's AI-powered contract management platform. 
          All features included, no hidden fees.
        </p>
      </div>

      {/* Pricing Card */}
      <div className="flex justify-center mb-16">
        <Card className="w-full max-w-lg border-2 border-primary/20">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-2xl mb-2">Free Plan</CardTitle>
            <CardDescription className="text-lg">
              Everything you need to manage contracts with AI
            </CardDescription>
            <div className="mt-4">
              <span className="text-5xl font-bold">£0</span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </CardContent>
          
          <CardFooter className="pt-8">
            <Button
              className="w-full"
              size="lg"
              onClick={() => {
                if (user) {
                  router.push('/dashboard');
                } else {
                  router.push('/signup');
                }
              }}
            >
              {user ? 'Go to Dashboard' : 'Get Started Free'}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">
          Frequently Asked Questions
        </h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Is Pactoria really free?</h3>
            <p className="text-muted-foreground">
              Yes! We've made all features completely free to help businesses manage contracts more effectively with AI assistance.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Are there any usage limits?</h3>
            <p className="text-muted-foreground">
              Currently, there are no usage limits. You can create unlimited contracts and use all AI features without restrictions.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">How does the AI contract generation work?</h3>
            <p className="text-muted-foreground">
              Our AI analyzes your requirements and generates professional contract templates, provides risk analysis, and suggests improvements based on best practices.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Can I export my contracts?</h3>
            <p className="text-muted-foreground">
              Yes, you can export your contracts in multiple formats including PDF and DOCX for sharing and printing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}