'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { SUBSCRIPTION_TIERS, calculatePriceWithVAT } from '@/lib/stripe/config';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [annual, setAnnual] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (tierId: string) => {
    if (!user) {
      router.push('/sign-in?redirect=/pricing');
      return;
    }

    if (tierId === 'free') {
      toast.info('You are already on the free plan');
      return;
    }

    if (tierId === 'enterprise') {
      router.push('/contact-sales');
      return;
    }

    setLoading(tierId);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tierId,
          annual,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Failed to start checkout process');
    } finally {
      setLoading(null);
    }
  };

  const tiers = Object.values(SUBSCRIPTION_TIERS);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Choose the plan that fits your business needs
          </p>
          
          {/* Annual/Monthly Toggle */}
          <div className="flex items-center justify-center gap-3">
            <Label htmlFor="annual-toggle">Monthly</Label>
            <Switch
              id="annual-toggle"
              checked={annual}
              onCheckedChange={setAnnual}
            />
            <Label htmlFor="annual-toggle">
              Annual
              <Badge variant="secondary" className="ml-2">Save 20%</Badge>
            </Label>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {tiers.map((tier) => {
            const isPopular = tier.id === 'professional';
            const price = tier.price;
            const annualPrice = price ? Math.floor(price * 0.8) : 0; // 20% discount
            const displayPrice = annual ? annualPrice : price;
            const priceWithVAT = displayPrice ? calculatePriceWithVAT(displayPrice) : null;

            return (
              <Card
                key={tier.id}
                className={`relative flex flex-col ${
                  isPopular ? 'border-primary shadow-lg scale-105' : ''
                }`}
              >
                {isPopular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}

                <CardHeader>
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                  
                  <div className="mt-4">
                    {tier.price === null ? (
                      <div className="text-3xl font-bold">Custom</div>
                    ) : (
                      <>
                        <div className="flex items-baseline">
                          <span className="text-4xl font-bold">
                            £{displayPrice}
                          </span>
                          {tier.price > 0 && (
                            <span className="text-muted-foreground ml-2">
                              /{annual ? 'year' : 'month'}
                            </span>
                          )}
                        </div>
                        {priceWithVAT && tier.price > 0 && (
                          <p className="text-sm text-muted-foreground mt-1">
                            £{priceWithVAT.gross} inc. VAT
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Limitations */}
                  {tier.id === 'free' && (
                    <div className="mt-6 pt-6 border-t">
                      <p className="text-sm font-medium mb-2">Limitations:</p>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">
                            No PDF/DOCX export
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">
                            Limited AI requests
                          </span>
                        </li>
                      </ul>
                    </div>
                  )}
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant={isPopular ? 'default' : 'outline'}
                    size="lg"
                    onClick={() => handleSubscribe(tier.id)}
                    disabled={loading !== null}
                  >
                    {loading === tier.id ? (
                      'Processing...'
                    ) : tier.id === 'enterprise' ? (
                      'Contact Sales'
                    ) : tier.price === 0 ? (
                      'Get Started'
                    ) : (
                      'Start 14-Day Trial'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Features Comparison */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-12">
            Feature Comparison
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full max-w-6xl mx-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-4 px-4">Feature</th>
                  {tiers.map((tier) => (
                    <th key={tier.id} className="text-center py-4 px-4">
                      {tier.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { 
                    name: 'Contracts per month',
                    values: ['5', '50', 'Unlimited', 'Unlimited']
                  },
                  {
                    name: 'Team members',
                    values: ['1', '3', '10', 'Unlimited']
                  },
                  {
                    name: 'AI assistance',
                    values: ['Basic', 'Advanced', 'Premium', 'Custom']
                  },
                  {
                    name: 'PDF/DOCX export',
                    values: [false, true, true, true]
                  },
                  {
                    name: 'API access',
                    values: [false, false, true, true]
                  },
                  {
                    name: 'Custom templates',
                    values: [false, false, true, true]
                  },
                  {
                    name: 'Analytics',
                    values: [false, 'Basic', 'Advanced', 'Custom']
                  },
                  {
                    name: 'Priority support',
                    values: [false, true, true, true]
                  },
                  {
                    name: 'SLA',
                    values: [false, false, '99.9%', 'Custom']
                  },
                ].map((feature, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-4 px-4 font-medium">{feature.name}</td>
                    {feature.values.map((value, tierIndex) => (
                      <td key={tierIndex} className="text-center py-4 px-4">
                        {typeof value === 'boolean' ? (
                          value ? (
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground mx-auto" />
                          )
                        ) : (
                          <span className="text-sm">{value}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            {[
              {
                q: 'Can I change plans anytime?',
                a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate the charges.'
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards, debit cards, and bank transfers for enterprise customers.'
              },
              {
                q: 'Is there a setup fee?',
                a: 'No, there are no setup fees for any of our plans. You only pay the subscription fee.'
              },
              {
                q: 'What happens when I hit my usage limits?',
                a: 'We\'ll notify you when you\'re approaching your limits. You can upgrade your plan or purchase additional capacity as needed.'
              },
              {
                q: 'Do you offer refunds?',
                a: 'We offer a 14-day free trial for paid plans. If you\'re not satisfied within the first 30 days after subscribing, we\'ll provide a full refund.'
              },
              {
                q: 'Is my data secure?',
                a: 'Yes, we use bank-level encryption and follow GDPR compliance standards. Your data is stored securely in UK data centers.'
              }
            ].map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <Card className="max-w-2xl mx-auto bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-2xl">
                Ready to streamline your contracts?
              </CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Start your 14-day free trial today. No credit card required.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => handleSubscribe('starter')}
              >
                Start Free Trial
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
