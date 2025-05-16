import { LandingHeader } from '@/components/landing/landing-header';
import { HeroSection } from '@/components/landing/hero-section';
import { FeaturesSection } from '@/components/landing/features-section';
import { HowItWorksSection } from '@/components/landing/how-it-works-section';
import { TherapistModesSection } from '@/components/landing/therapist-modes-section';
import { TestimonialsSection } from '@/components/landing/testimonials-section';
import { NewsletterSection } from '@/components/landing/newsletter-section';
import { LandingFooter } from '@/components/landing/landing-footer';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingHeader />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TherapistModesSection />
        <TestimonialsSection />
        <NewsletterSection />
      </main>
      <LandingFooter />
    </div>
  );
}
