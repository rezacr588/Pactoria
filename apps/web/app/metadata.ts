import { Metadata } from 'next'

export const generateHomeMetadata = (): Metadata => {
  return {
    title: 'AI-Powered Contract Management Platform - Pactoria',
    description: 'Transform your contract management with AI-powered automation. Create, collaborate, and close deals 70% faster with Pactoria. Trusted by 10,000+ teams worldwide. Start your free trial today.',
    keywords: [
      'contract management software',
      'AI contract generation',
      'legal document automation',
      'contract lifecycle management',
      'collaborative contract editing',
      'contract analytics',
      'digital contract signing',
      'legal tech platform',
      'contract templates',
      'business contract software',
      'enterprise contract management',
      'legal workflow automation',
      'contract negotiation software',
      'document collaboration platform',
      'legal document management'
    ],
    openGraph: {
      title: 'Pactoria - AI-Powered Contract Management Platform',
      description: 'Transform your contract management with AI. Create, collaborate, and close deals 70% faster. Trusted by 10,000+ teams worldwide.',
      type: 'website',
      locale: 'en_US',
      url: 'https://web-one-mauve-40.vercel.app',
      siteName: 'Pactoria',
      images: [
        {
          url: '/og-image-home.jpg',
          width: 1200,
          height: 630,
          alt: 'Pactoria AI-Powered Contract Management Dashboard',
          type: 'image/jpeg',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@Pactoria',
      creator: '@Pactoria',
      title: 'Pactoria - AI-Powered Contract Management Platform',
      description: 'Transform your contract management with AI. Create, collaborate, and close deals 70% faster.',
      images: [
        {
          url: '/twitter-card-home.jpg',
          alt: 'Pactoria AI-Powered Contract Management Dashboard',
        },
      ],
    },
    alternates: {
      canonical: 'https://web-one-mauve-40.vercel.app',
    },
    other: {
      'application-name': 'Pactoria',
      'msapplication-TileColor': '#2563eb',
      'theme-color': '#2563eb',
    },
  }
}

// JSON-LD structured data for the homepage
export const generateHomeStructuredData = () => {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://web-one-mauve-40.vercel.app/#organization',
        name: 'Pactoria',
        url: 'https://web-one-mauve-40.vercel.app',
        logo: {
          '@type': 'ImageObject',
          url: 'https://web-one-mauve-40.vercel.app/logo.png',
          width: 512,
          height: 512,
        },
        description: 'AI-powered contract management platform helping teams create, collaborate, and close deals faster.',
        foundingDate: '2024',
        sameAs: [
          'https://twitter.com/Pactoria',
          'https://linkedin.com/company/pactoria',
          'https://github.com/pactoria',
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          email: 'support@pactoria.com',
          availableLanguage: 'English',
        },
      },
      {
        '@type': 'WebSite',
        '@id': 'https://web-n7k5wf74y-reza-zeraats-projects.vercel.app/#website',
        url: 'https://web-one-mauve-40.vercel.app',
        name: 'Pactoria - AI-Powered Contract Management Platform',
        description: 'Transform your contract management with AI-powered automation. Create, collaborate, and close deals 70% faster.',
        publisher: {
          '@id': 'https://web-one-mauve-40.vercel.app/#organization',
        },
        inLanguage: 'en-US',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://web-n7k5wf74y-reza-zeraats-projects.vercel.app/search?q={search_term_string}',
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'WebPage',
        '@id': 'https://web-n7k5wf74y-reza-zeraats-projects.vercel.app/#webpage',
        url: 'https://web-one-mauve-40.vercel.app',
        name: 'AI-Powered Contract Management Platform - Pactoria',
        isPartOf: {
          '@id': 'https://web-n7k5wf74y-reza-zeraats-projects.vercel.app/#website',
        },
        about: {
          '@id': 'https://web-one-mauve-40.vercel.app/#organization',
        },
        description: 'Transform your contract management with AI-powered automation. Create, collaborate, and close deals 70% faster with Pactoria.',
        inLanguage: 'en-US',
      },
      {
        '@type': 'SoftwareApplication',
        name: 'Pactoria',
        applicationCategory: 'BusinessApplication',
        applicationSubCategory: 'Contract Management',
        operatingSystem: 'Web Browser',
        offers: [
          {
            '@type': 'Offer',
            name: 'Free Plan',
            price: '0',
            priceCurrency: 'USD',
            description: 'Up to 5 contracts per month with basic features',
          },
          {
            '@type': 'Offer',
            name: 'Professional Plan',
            price: '49',
            priceCurrency: 'USD',
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              price: '49',
              priceCurrency: 'USD',
              unitText: 'MONTH',
            },
            description: 'Unlimited contracts with advanced features for growing teams',
          },
        ],
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          ratingCount: '156',
          bestRating: '5',
          worstRating: '1',
        },
        featureList: [
          'AI-powered contract generation',
          'Real-time collaboration',
          'Risk analysis and compliance',
          'Digital signatures',
          'Contract templates',
          'Analytics dashboard',
          'Version control',
          'Approval workflows',
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is Pactoria?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Pactoria is an AI-powered contract management platform that helps teams create, collaborate on, and close deals faster. It offers intelligent contract generation, real-time collaboration, risk analysis, and comprehensive analytics.',
            },
          },
          {
            '@type': 'Question',
            name: 'How does AI help with contract management?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Our AI assists with contract generation, risk assessment, clause optimization, and compliance checking. It can analyze contracts for potential issues and suggest improvements, reducing the time spent on manual review.',
            },
          },
          {
            '@type': 'Question',
            name: 'Is there a free trial available?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes, we offer a 14-day free trial with no credit card required. You can access all features during the trial period to evaluate if Pactoria is right for your team.',
            },
          },
          {
            '@type': 'Question',
            name: 'How secure is Pactoria?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Pactoria uses bank-level security with end-to-end encryption, secure document storage, and SOC 2 compliance. Your contracts and data are protected with the highest security standards.',
            },
          },
        ],
      },
    ],
  }
}