import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Footer } from '@/components/landing/Footer';

export default function Privacy() {
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
          <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
          
          <div className="space-y-8 text-background/80">
            <p className="text-sm text-background/60">
              Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-background">1. Information We Collect</h2>
              <p>
                We collect information you provide directly to us, such as when you create an account, 
                set up a store, list products, or make a purchase. This may include:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Name, email address, and phone number</li>
                <li>Store information and product listings</li>
                <li>Delivery addresses and order details</li>
                <li>Payment information (processed securely by third parties)</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-background">2. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Connect sellers with customers</li>
                <li>Send you technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-background">3. Information Sharing</h2>
              <p>
                We share your information only as described in this policy:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>With sellers when you place an order (delivery details)</li>
                <li>With customers when they purchase from your store (store information)</li>
                <li>With service providers who assist in our operations</li>
                <li>When required by law or to protect rights and safety</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-background">4. Data Security</h2>
              <p>
                We take reasonable measures to help protect your personal information from loss, 
                theft, misuse, and unauthorized access. However, no internet transmission is 
                completely secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-background">5. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Access and update your personal information</li>
                <li>Request deletion of your account and data</li>
                <li>Opt out of promotional communications</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-background">6. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at{' '}
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
