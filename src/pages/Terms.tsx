import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Footer } from '@/components/landing/Footer';

export default function Terms() {
  return (
    <div className="min-h-screen flex flex-col bg-foreground text-background">
      {/* Header */}
      <header className="py-6 border-b border-background/10">
        <div className="container">
          <div className="flex items-center gap-4">
            <Link 
              to="/" 
              className="flex items-center gap-2 text-background/60 hover:text-background transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <Link to="/" className="text-xl font-bold tracking-tight">
              happy2buy
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 py-12">
        <div className="container max-w-3xl">
          <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
          
          <div className="space-y-8 text-background/80">
            <p className="text-sm text-background/60">
              Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-background">1. Acceptance of Terms</h2>
              <p>
                By accessing or using happy2buy, you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-background">2. Description of Service</h2>
              <p>
                happy2buy is a platform that enables sellers to create online stores and sell 
                products to customers. We provide the technology and platform; sellers are 
                responsible for their products, pricing, and fulfillment.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-background">3. User Accounts</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials 
                and for all activities that occur under your account. You must provide accurate 
                and complete information when creating an account.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-background">4. Seller Responsibilities</h2>
              <p>As a seller on happy2buy, you agree to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide accurate product descriptions and pricing</li>
                <li>Fulfill orders in a timely manner</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Handle customer inquiries and complaints professionally</li>
                <li>Not sell prohibited or illegal items</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-background">5. Customer Responsibilities</h2>
              <p>As a customer, you agree to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide accurate delivery information</li>
                <li>Complete payment for orders placed</li>
                <li>Communicate respectfully with sellers</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-background">6. Prohibited Activities</h2>
              <p>You may not:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Use the service for any illegal purpose</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on the rights of others</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with the proper functioning of the service</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-background">7. Limitation of Liability</h2>
              <p>
                happy2buy is a platform that connects sellers and customers. We are not responsible 
                for the quality, safety, or legality of products sold through our platform. 
                Transactions are between sellers and customers, and we are not a party to these 
                transactions.
              </p>
              <p>
                To the maximum extent permitted by law, happy2buy shall not be liable for any 
                indirect, incidental, special, consequential, or punitive damages arising from 
                your use of the service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-background">8. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. We will notify users of 
                any material changes. Your continued use of the service after changes constitutes 
                acceptance of the new terms.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-background">9. Contact Us</h2>
              <p>
                If you have any questions about these Terms of Service, please contact us at{' '}
                <a 
                  href="mailto:support@happy2buy.in" 
                  className="text-primary hover:underline"
                >
                  support@happy2buy.in
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer dark />
    </div>
  );
}
