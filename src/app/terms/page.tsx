
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="container mx-auto py-8 sm:py-12 px-4 md:px-6 max-w-2xl lg:max-w-3xl">
      <Card className="shadow-lg rounded-xl sm:rounded-2xl">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-2xl sm:text-3xl font-bold text-center text-foreground">Terms of Service</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 sm:space-y-6 text-foreground/80 p-4 sm:p-6 text-sm sm:text-base">
          <p>Welcome to ThoughtReflex!</p>
          <p>These terms and conditions outline the rules and regulations for the use of ThoughtReflex's Website and Application.</p>
          <p>By accessing this website and using our application, we assume you accept these terms and conditions. Do not continue to use ThoughtReflex if you do not agree to take all of the terms and conditions stated on this page.</p>
          
          <h2 className="text-lg sm:text-xl font-semibold text-foreground pt-3 sm:pt-4">1. Interpretation and Definitions</h2>
          <p>The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.</p>

          <h2 className="text-lg sm:text-xl font-semibold text-foreground pt-3 sm:pt-4">2. Intellectual Property Rights</h2>
          <p>Other than the content you own (such as your journal entries), under these Terms, ThoughtReflex and/or its licensors own all the intellectual property rights for the application's design, features, and underlying technology. You are granted limited license only for purposes of using the application as intended.</p>

          <h2 className="text-lg sm:text-xl font-semibold text-foreground pt-3 sm:pt-4">3. Restrictions</h2>
          <p>You are specifically restricted from all of the following:</p>
          <ul className="list-disc list-inside pl-4 space-y-1">
            <li>publishing any application material in any other media;</li>
            <li>selling, sublicensing and/or otherwise commercializing any application material;</li>
            <li>publicly performing and/or showing any application material;</li>
            <li>using this application in any way that is or may be damaging to this application;</li>
            <li>using this application in any way that impacts user access to this application;</li>
            <li>engaging in any data mining, data harvesting, data extracting or any other similar activity in relation to this application;</li>
            <li>using this application to engage in any advertising or marketing without express permission.</li>
          </ul>

          <h2 className="text-lg sm:text-xl font-semibold text-foreground pt-3 sm:pt-4">4. Your Content</h2>
          <p>In these Terms and Conditions, “Your Content” shall mean any text, images or other material you choose to input into the application (e.g., journal entries, goals). Your Content is your own. You grant ThoughtReflex the necessary permissions to store and process Your Content solely for the purpose of providing and improving the service to you (e.g., generating AI responses, weekly recaps, insights). ThoughtReflex will not use Your Content for any other purpose without your explicit consent.</p>
          <p>You are responsible for ensuring Your Content does not infringe on any third-party’s rights. ThoughtReflex reserves the right to remove any of Your Content if it violates these terms or applicable laws.</p>

          <h2 className="text-lg sm:text-xl font-semibold text-foreground pt-3 sm:pt-4">5. No Medical Advice</h2>
          <p>ThoughtReflex and its AI companion, Mira, are designed for self-reflection, emotional journaling, and personal growth. It is not a substitute for professional medical advice, diagnosis, or treatment from a qualified healthcare provider or mental health professional. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition or mental health concern. Never disregard professional medical advice or delay in seeking it because of something you have read or interacted with on ThoughtReflex.</p>
          
          <h2 className="text-lg sm:text-xl font-semibold text-foreground pt-3 sm:pt-4">6. Limitation of Liability</h2>
          <p>In no event shall ThoughtReflex, nor any of its officers, directors and employees, be held liable for anything arising out of or in any way connected with your use of this application whether such liability is under contract. ThoughtReflex, including its officers, directors and employees shall not be held liable for any indirect, consequential or special liability arising out of or in any way related to your use of this application.</p>
          
          <h2 className="text-lg sm:text-xl font-semibold text-foreground pt-3 sm:pt-4">7. Governing Law & Jurisdiction</h2>
          <p>These Terms will be governed by and interpreted in accordance with the laws of the jurisdiction in which ThoughtReflex operates, and you submit to the non-exclusive jurisdiction of the state and federal courts located in that jurisdiction for the resolution of any disputes.</p>

          <p className="pt-4 sm:pt-6 text-center">
            For any questions about these Terms, please <Link href="/contact" className="text-primary hover:underline">contact us</Link>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

    