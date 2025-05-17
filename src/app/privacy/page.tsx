
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto py-8 sm:py-12 px-4 md:px-6 max-w-2xl lg:max-w-3xl">
      <Card className="shadow-lg rounded-xl sm:rounded-2xl">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-2xl sm:text-3xl font-bold text-center text-foreground">Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 sm:space-y-6 text-foreground/80 p-4 sm:p-6 text-sm sm:text-base">
          <p>Your privacy is important to us. It is ThoughtReflex's policy to respect your privacy regarding any information we may collect from you across our website and application.</p>

          <h2 className="text-lg sm:text-xl font-semibold text-foreground pt-3 sm:pt-4">1. Information We Collect</h2>
          <p>Log data: When you visit our website, our servers may automatically log the standard data provided by your web browser. It may include your computer’s Internet Protocol (IP) address, your browser type and version, the pages you visit, the time and date of your visit, the time spent on each page, and other details.</p>
          <p>Personal Information: We may ask for personal information, such as your name and email address when you register for an account or subscribe to our newsletter.</p>
          <p>Journal Entries & App Data: Your journal entries, goals, AI conversations, notebook entries, and weekly recaps are considered sensitive personal data. We are committed to keeping this data secure and private. Access to this data is strictly limited and protected by Firestore Security Rules requiring user authentication.</p>
          
          <h2 className="text-lg sm:text-xl font-semibold text-foreground pt-3 sm:pt-4">2. Use of Information</h2>
          <p>We may use your information to:</p>
          <ul className="list-disc list-inside pl-4 space-y-1">
            <li>Provide, operate, and maintain our website and services.</li>
            <li>Improve, personalize, and expand our website and services.</li>
            <li>Understand and analyze how you use our website.</li>
            <li>Develop new products, services, features, and functionality.</li>
            <li>Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the website, and for marketing and promotional purposes (with your consent).</li>
            <li>Process your transactions.</li>
            <li>Find and prevent fraud.</li>
          </ul>

          <h2 className="text-lg sm:text-xl font-semibold text-foreground pt-3 sm:pt-4">3. Security of Your Personal Information</h2>
          <p>We value your trust in providing us your Personal Information, thus we are striving to use commercially acceptable means of protecting it. We use encryption (such as HTTPS) for data transmission and leverage Firebase's security features, including Firestore Security Rules, to protect data at rest. However, remember that no method of transmission over the internet, or method of electronic storage is 100% secure and reliable, and we cannot guarantee its absolute security.</p>

          <h2 className="text-lg sm:text-xl font-semibold text-foreground pt-3 sm:pt-4">4. Data Retention</h2>
          <p>We will retain your personal information only for as long as is necessary for the purposes set out in this Privacy Policy or until you choose to delete your data via the app settings. We will retain and use your information to the extent necessary to comply with our legal obligations, resolve disputes, and enforce our policies.</p>

          <h2 className="text-lg sm:text-xl font-semibold text-foreground pt-3 sm:pt-4">5. Your Data Protection Rights</h2>
          <p>Depending on your location, you may have the following rights regarding your personal data: the right to access, the right to rectification, the right to erasure (data deletion), the right to restrict processing, the right to object to processing, and the right to data portability. You can manage and export your data through your account settings or by contacting us.</p>
          
          <h2 className="text-lg sm:text-xl font-semibold text-foreground pt-3 sm:pt-4">6. Children's Privacy</h2>
          <p>Our Service does not address anyone under the age of 13. We do not knowingly collect personally identifiable information from children under 13. If you are a parent or guardian and you are aware that your child has provided us with Personal Information, please contact us.</p>

          <h2 className="text-lg sm:text-xl font-semibold text-foreground pt-3 sm:pt-4">7. Changes to This Privacy Policy</h2>
          <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.</p>

          <p className="pt-4 sm:pt-6 text-center">
            If you have any questions about this Privacy Policy, please <Link href="/contact" className="text-primary hover:underline">contact us</Link>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

    