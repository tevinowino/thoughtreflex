
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Briefcase, Users, Sparkles, Lightbulb } from 'lucide-react';

const jobOpenings = [
  {
    title: 'Senior Frontend Engineer (React/Next.js)',
    location: 'Remote',
    description: 'Join us to build beautiful and performant user interfaces for ThoughtReflex. Strong experience with React, Next.js, and Tailwind CSS required.',
    link: '#',
  },
  {
    title: 'AI/ML Engineer (NLP)',
    location: 'Remote',
    description: 'Help shape the future of AI therapy. Expertise in Natural Language Processing, Large Language Models (LLMs), and Genkit preferred.',
    link: '#',
  },
  {
    title: 'Product Designer (UX/UI)',
    location: 'Remote',
    description: 'Create intuitive and empathetic user experiences. A strong portfolio showcasing user-centered design principles is essential.',
    link: '#',
  },
];

export default function CareersPage() {
  return (
    <div className="bg-background text-foreground">
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <Briefcase className="h-16 w-16 text-primary mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Join Our Team</h1>
          <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto">
            Help us build the future of mental wellness. We're looking for passionate individuals to join our mission.
          </p>
        </div>
      </section>

      {/* Why Work With Us Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Why ThoughtReflex?</h2>
            <p className="text-lg text-foreground/80 max-w-3xl mx-auto mt-4">
              Be part of a company that's making a real difference in people's lives.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="shadow-lg rounded-2xl p-6 text-center">
              <Lightbulb className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle className="text-xl mb-2">Impactful Work</CardTitle>
              <CardContent className="text-foreground/70">
                Contribute to a product that genuinely helps users improve their mental well-being.
              </CardContent>
            </Card>
            <Card className="shadow-lg rounded-2xl p-6 text-center">
              <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle className="text-xl mb-2">Innovative Culture</CardTitle>
              <CardContent className="text-foreground/70">
                Work with cutting-edge AI technologies and a forward-thinking team.
              </CardContent>
            </Card>
            <Card className="shadow-lg rounded-2xl p-6 text-center">
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle className="text-xl mb-2">Supportive Environment</CardTitle>
              <CardContent className="text-foreground/70">
                We foster a collaborative, inclusive, and remote-first culture where everyone can thrive.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Current Openings Section */}
      <section className="py-16 md:py-24 bg-muted/50" id="openings">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Current Openings</h2>
            <p className="text-lg text-foreground/80 max-w-3xl mx-auto mt-4">
              Find your next opportunity at ThoughtReflex.
            </p>
          </div>
          {jobOpenings.length > 0 ? (
            <div className="space-y-8 max-w-3xl mx-auto">
              {jobOpenings.map((job) => (
                <Card key={job.title} className="shadow-lg hover:shadow-xl transition-shadow rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-2xl">{job.title}</CardTitle>
                    <CardDescription>{job.location}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground/80 mb-4">{job.description}</p>
                    <Button asChild variant="outline">
                      <Link href={job.link}>Learn More & Apply</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-xl text-foreground/70">No open positions at the moment. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* Life at ThoughtReflex */}
       <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
             <div className="order-last md:order-first space-y-6">
              <h2 className="text-3xl font-bold">Life at ThoughtReflex</h2>
              <p className="text-foreground/80 text-lg">
                We are a passionate team dedicated to creating a product that matters. We believe in work-life balance, continuous learning, and fostering an environment where creativity and innovation flourish.
              </p>
              <p className="text-foreground/80 text-lg">
                Our remote-first approach allows for flexibility, while our collaborative tools and regular virtual get-togethers keep us connected and aligned on our shared vision.
              </p>
               <Button asChild>
                  <Link href="#openings">See Open Positions</Link>
              </Button>
            </div>
            <div className="order-first md:order-last">
              <Image
                src="/images/careers/diverse-team-meeting-visual.png"
                alt="Diverse team members collaborating effectively in a meeting"
                width={600}
                height={450}
                className="rounded-2xl shadow-xl object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

