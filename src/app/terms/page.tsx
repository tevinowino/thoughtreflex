
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6 max-w-3xl">
      <Card className="shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-foreground">Terms of Service</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-foreground/80">
          <p>Welcome to ThoughtReflex!</p>
          <p>These terms and conditions outline the rules and regulations for the use of ThoughtReflex's Website, located at [Your Website URL].</p>
          <p>By accessing this website we assume you accept these terms and conditions. Do not continue to use ThoughtReflex if you do not agree to take all of the terms and conditions stated on this page.</p>
          
          <h2 className="text-xl font-semibold text-foreground pt-4">1. Interpretation and Definitions</h2>
          <p>The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.</p>

          <h2 className="text-xl font-semibold text-foreground pt-4">2. Intellectual Property Rights</h2>
          <p>Other than the content you own, under these Terms, ThoughtReflex and/or its licensors own all the intellectual property rights and materials contained in this Website. You are granted limited license only for purposes of viewing the material contained on this Website.</p>

          <h2 className="text-xl font-semibold text-foreground pt-4">3. Restrictions</h2>
          <p>You are specifically restricted from all of the following:</p>
          <ul className="list-disc list-inside pl-4 space-y-1">
            <li>publishing any Website material in any other media;</li>
            <li>selling, sublicensing and/or otherwise commercializing any Website material;</li>
            <li>publicly performing and/or showing any Website material;</li>
            <li>using this Website in any way that is or may be damaging to this Website;</li>
            <li>using this Website in any way that impacts user access to this Website;</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground pt-4">4. Your Content</h2>
          <p>In these Website Standard Terms and Conditions, “Your Content” shall mean any audio, video text, images or other material you choose to display on this Website. By displaying Your Content, you grant ThoughtReflex a non-exclusive, worldwide irrevocable, sub licensable license to use, reproduce, adapt, publish, translate and distribute it in any and all media solely for the purpose of providing and improving the service.</p>
          <p>Your Content must be your own and must not be invading any third-party’s rights. ThoughtReflex reserves the right to remove any of Your Content from this Website at any time without notice.</p>

          <h2 className="text-xl font-semibold text-foreground pt-4">5. No warranties</h2>
          <p>This Website is provided “as is,” with all faults, and ThoughtReflex express no representations or warranties, of any kind related to this Website or the materials contained on this Website. Also, nothing contained on this Website shall be interpreted as advising you.</p>
          
          <h2 className="text-xl font-semibold text-foreground pt-4">6. Limitation of liability</h2>
          <p>In no event shall ThoughtReflex, nor any of its officers, directors and employees, shall be held liable for anything arising out of or in any way connected with your use of this Website whether such liability is under contract. ThoughtReflex, including its officers, directors and employees shall not be held liable for any indirect, consequential or special liability arising out of or in any way related to your use of this Website.</p>

          <h2 className="text-xl font-semibold text-foreground pt-4">7. Governing Law & Jurisdiction</h2>
          <p>These Terms will be governed by and interpreted in accordance with the laws of the State of [Your State/Country], and you submit to the non-exclusive jurisdiction of the state and federal courts located in [Your State/Country] for the resolution of any disputes.</p>

          <p className="pt-6 text-center">
            For any questions, please <Link href="/contact" className="text-primary hover:underline">contact us</Link>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
