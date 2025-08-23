'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { generateHomeStructuredData } from './metadata'
import { 
  ArrowRight, 
  Check, 
  FileText, 
  Users, 
  Shield, 
  Zap,
  BarChart3,
  Lock,
  Sparkles,
  Star,
  Menu,
  X,
  Github,
  Twitter,
  Linkedin,
  Play,
  Bot,
  Clock,
  TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function Home() {
  const { user } = useAuth()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  // Generate structured data
  const structuredData = generateHomeStructuredData()

  const features = [
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Smart Contract Creation",
      description: "AI-powered contract generation with customizable templates and clauses"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Real-time Collaboration",
      description: "Work together seamlessly with team members and stakeholders"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Risk Analysis",
      description: "Automated risk assessment and compliance checking"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Lightning Fast",
      description: "Create, review, and sign contracts in minutes, not days"
    },
    {
      icon: <Lock className="h-6 w-6" />,
      title: "Bank-Level Security",
      description: "End-to-end encryption and secure document storage"
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Analytics Dashboard",
      description: "Track contract lifecycle and team performance metrics"
    }
  ]

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Legal Director, TechCorp",
      content: "Pactoria has transformed our contract management process. We've reduced turnaround time by 70%.",
      rating: 5,
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
    },
    {
      name: "Michael Rodriguez",
      role: "CEO, StartupHub",
      content: "The AI-powered features save us hours every week. It's like having a legal assistant 24/7.",
      rating: 5,
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael"
    },
    {
      name: "Emily Watson",
      role: "Operations Manager, GlobalTrade",
      content: "Best contract management platform we've used. The collaboration features are game-changing.",
      rating: 5,
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily"
    }
  ]

  const pricingPlans = [
    {
      name: "Starter",
      price: "Free",
      description: "Perfect for individuals and small teams",
      features: [
        "Up to 5 contracts/month",
        "Basic templates",
        "2 team members",
        "Email support",
        "7-day version history"
      ],
      cta: "Start Free",
      highlighted: false
    },
    {
      name: "Professional",
      price: "$49",
      period: "/month",
      description: "For growing teams and businesses",
      features: [
        "Unlimited contracts",
        "Premium templates",
        "10 team members",
        "Priority support",
        "Advanced analytics",
        "API access",
        "30-day version history"
      ],
      cta: "Start Trial",
      highlighted: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For large organizations",
      features: [
        "Everything in Pro",
        "Unlimited team members",
        "Custom integrations",
        "Dedicated support",
        "SLA guarantee",
        "On-premise option",
        "Unlimited version history"
      ],
      cta: "Contact Sales",
      highlighted: false
    }
  ]

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center shadow-sm">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-xl text-slate-900">Pactoria</span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-slate-600 hover:text-slate-900 transition">
                Features
              </Link>
              <Link href="#pricing" className="text-slate-600 hover:text-slate-900 transition">
                Pricing
              </Link>
              <Link href="#testimonials" className="text-slate-600 hover:text-slate-900 transition">
                Testimonials
              </Link>
              <Link href="/login" className="text-slate-600 hover:text-slate-900 transition">
                Sign In
              </Link>
              <Link href="/signup">
                <Button className="bg-primary-600 hover:bg-primary-700 text-white">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden text-slate-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-200">
            <div className="px-4 py-4 space-y-3">
              <Link href="#features" className="block py-2 text-slate-600">Features</Link>
              <Link href="#pricing" className="block py-2 text-slate-600">Pricing</Link>
              <Link href="#testimonials" className="block py-2 text-slate-600">Testimonials</Link>
              <Link href="/login" className="block py-2 text-slate-600">Sign In</Link>
              <Link href="/signup" className="block">
                <Button className="w-full bg-primary-600 text-white">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8" itemScope itemType="https://schema.org/SoftwareApplication">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <Badge className="mb-4 bg-primary-50 text-primary-700 border border-primary-200">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Powered Contract Management
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
              <span itemProp="headline">Contracts Made</span>
              <span className="bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent"> Simple</span>
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto" itemProp="description">
              Create, collaborate, and close deals faster with AI-powered contract management. 
              Join thousands of teams streamlining their legal workflows.
            </p>
            <meta itemProp="name" content="Pactoria" />
            <meta itemProp="applicationCategory" content="BusinessApplication" />
            <meta itemProp="operatingSystem" content="Web Browser" />
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/signup">
                <Button size="lg" className="bg-primary-600 hover:bg-primary-700 text-white px-8">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="group border-slate-300 text-slate-700 hover:bg-slate-50">
                <Play className="mr-2 h-5 w-5 text-primary-600 group-hover:text-primary-700" />
                Watch Demo
              </Button>
            </div>
            <div className="flex items-center justify-center space-x-8 text-sm text-slate-500">
              <div className="flex items-center">
                <Check className="h-4 w-4 text-green-600 mr-1" />
                No credit card required
              </div>
              <div className="flex items-center">
                <Check className="h-4 w-4 text-green-600 mr-1" />
                14-day free trial
              </div>
              <div className="flex items-center">
                <Check className="h-4 w-4 text-green-600 mr-1" />
                Cancel anytime
              </div>
            </div>
          </div>

          {/* Hero Image/Demo */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-700 blur-3xl opacity-10"></div>
            <div className="relative bg-white rounded-2xl shadow-xl p-2 border border-slate-200">
              <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                    <Bot className="h-8 w-8 text-primary-600 mb-3" />
                    <h3 className="font-semibold mb-2 text-slate-900">AI Contract Generation</h3>
                    <p className="text-sm text-slate-600">Generate contracts in seconds with our AI assistant</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                    <Clock className="h-8 w-8 text-primary-600 mb-3" />
                    <h3 className="font-semibold mb-2 text-slate-900">70% Faster Turnaround</h3>
                    <p className="text-sm text-slate-600">Reduce contract cycle time dramatically</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                    <TrendingUp className="h-8 w-8 text-green-600 mb-3" />
                    <h3 className="font-semibold mb-2 text-slate-900">Real-time Analytics</h3>
                    <p className="text-sm text-slate-600">Track performance and optimize workflows</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-white text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10K+</div>
              <div className="text-primary-100">Active Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">500K+</div>
              <div className="text-primary-100">Contracts Created</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-primary-100">Uptime SLA</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">4.9/5</div>
              <div className="text-primary-100">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50" aria-labelledby="features-heading">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary-50 text-primary-700 border-primary-200">Features</Badge>
            <h2 id="features-heading" className="text-4xl font-bold text-slate-900 mb-4">
              Everything you need to manage contracts
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Powerful features designed to streamline your entire contract lifecycle
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group hover:shadow-lg transition-all duration-300 bg-white rounded-xl p-6 border border-slate-200 hover:border-primary-300">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <div className="text-primary-600">{feature.icon}</div>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-slate-900">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-white" aria-labelledby="testimonials-heading">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary-50 text-primary-700 border-primary-200">Testimonials</Badge>
            <h2 id="testimonials-heading" className="text-4xl font-bold text-slate-900 mb-4">
              Loved by legal teams worldwide
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              See what our customers have to say about Pactoria
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                  ))}
                </div>
                <p className="text-slate-700 mb-4 italic">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-3 border-2 border-slate-200"
                  />
                  <div>
                    <div className="font-semibold text-slate-900">{testimonial.name}</div>
                    <div className="text-sm text-slate-500">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50" aria-labelledby="pricing-heading">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary-50 text-primary-700 border-primary-200">Pricing</Badge>
            <h2 id="pricing-heading" className="text-4xl font-bold text-slate-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Choose the perfect plan for your team
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div 
                key={index} 
                className={`rounded-2xl p-8 ${plan.highlighted 
                  ? 'bg-gradient-to-br from-primary-600 to-primary-700 text-white scale-105 shadow-xl' 
                  : 'bg-white border border-slate-200'}`}
              >
                {plan.highlighted && (
                  <Badge className="mb-4 bg-white text-primary-700">Most Popular</Badge>
                )}
                <h3 className={`text-2xl font-bold mb-2 ${plan.highlighted ? 'text-white' : 'text-slate-900'}`}>
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className={`text-4xl font-bold ${plan.highlighted ? 'text-white' : 'text-slate-900'}`}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className={plan.highlighted ? 'text-primary-100' : 'text-slate-500'}>
                      {plan.period}
                    </span>
                  )}
                </div>
                <p className={`mb-6 ${plan.highlighted ? 'text-primary-100' : 'text-slate-600'}`}>
                  {plan.description}
                </p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className={`h-5 w-5 mr-2 mt-0.5 ${plan.highlighted ? 'text-white' : 'text-green-600'}`} />
                      <span className={plan.highlighted ? 'text-white' : 'text-slate-700'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className={`w-full ${plan.highlighted 
                    ? 'bg-white text-primary-700 hover:bg-gray-100' 
                    : 'bg-primary-600 text-white hover:bg-primary-700'}`}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary-700 to-primary-800">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-4">
            Ready to transform your contract management?
          </h2>
          <p className="text-xl mb-8 text-primary-100">
            Join thousands of teams already using Pactoria to close deals faster
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-primary-700 hover:bg-gray-100 border-0">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-slate-200 mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="hover:text-slate-100 transition">Features</Link></li>
                <li><Link href="#" className="hover:text-slate-100 transition">Pricing</Link></li>
                <li><Link href="#" className="hover:text-slate-100 transition">Security</Link></li>
                <li><Link href="#" className="hover:text-slate-100 transition">Roadmap</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200 mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="hover:text-slate-100 transition">About</Link></li>
                <li><Link href="#" className="hover:text-slate-100 transition">Blog</Link></li>
                <li><Link href="#" className="hover:text-slate-100 transition">Careers</Link></li>
                <li><Link href="#" className="hover:text-slate-100 transition">Press</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200 mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="hover:text-slate-100 transition">Documentation</Link></li>
                <li><Link href="#" className="hover:text-slate-100 transition">API Reference</Link></li>
                <li><Link href="#" className="hover:text-slate-100 transition">Support</Link></li>
                <li><Link href="#" className="hover:text-slate-100 transition">Status</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200 mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="hover:text-slate-100 transition">Privacy</Link></li>
                <li><Link href="#" className="hover:text-slate-100 transition">Terms</Link></li>
                <li><Link href="#" className="hover:text-slate-100 transition">Cookie Policy</Link></li>
                <li><Link href="#" className="hover:text-slate-100 transition">Licenses</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm mb-4 md:mb-0">
              © 2024 Pactoria. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link href="#" className="hover:text-slate-100 transition">
                <Github className="h-5 w-5" />
              </Link>
              <Link href="#" className="hover:text-slate-100 transition">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="hover:text-slate-100 transition">
                <Linkedin className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </footer>
      </main>
    </>
  )
}
