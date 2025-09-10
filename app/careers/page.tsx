import React from 'react'
import Link from 'next/link'
import { Shield, ArrowLeft, MapPin, Clock, Users, Zap, Heart, Globe, ChevronRight, Mail } from 'lucide-react'

export default function CareersPage() {
  const benefits = [
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Health & Wellness",
      description: "Comprehensive medical aid, wellness programs, and mental health support"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Work-Life Balance",
      description: "Flexible working hours, remote work options, and generous leave policies"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Professional Growth",
      description: "Learning budgets, conference attendance, and career development programs"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Great Team Culture",
      description: "Collaborative environment, team events, and inclusive workplace"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Remote First",
      description: "Work from anywhere with our distributed team across South Africa"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Job Security",
      description: "Growing company in the expanding security technology market"
    }
  ]

  const openPositions = [
    {
      title: "Full Stack Developer",
      department: "Engineering",
      location: "Remote / Johannesburg",
      type: "Full-time",
      description: "Build and maintain our Next.js web platform and React Native mobile app",
      skills: ["React", "Next.js", "Node.js", "TypeScript", "PostgreSQL"]
    },
    {
      title: "Mobile Developer",
      department: "Engineering",
      location: "Remote / Cape Town",
      type: "Full-time",
      description: "Develop and enhance our React Native mobile app for security guards",
      skills: ["React Native", "Expo", "TypeScript", "Mobile Development", "GPS/Location APIs"]
    },
    {
      title: "DevOps Engineer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
      description: "Manage our cloud infrastructure, CI/CD pipelines, and monitoring systems",
      skills: ["Docker", "Kubernetes", "AWS/GCP", "Terraform", "Monitoring"]
    },
    {
      title: "Product Manager",
      department: "Product",
      location: "Johannesburg",
      type: "Full-time",
      description: "Drive product strategy and roadmap for our security management platform",
      skills: ["Product Strategy", "User Research", "Analytics", "Agile", "Security Industry Knowledge"]
    },
    {
      title: "Sales Executive",
      department: "Sales",
      location: "Johannesburg / Durban",
      type: "Full-time",
      description: "Drive sales growth by building relationships with security companies",
      skills: ["B2B Sales", "Security Industry", "Relationship Building", "CRM", "Presentation Skills"]
    },
    {
      title: "Customer Success Manager",
      department: "Customer Success",
      location: "Remote",
      type: "Full-time",
      description: "Ensure customer satisfaction and drive product adoption",
      skills: ["Customer Success", "Account Management", "Technical Support", "Training", "Communication"]
    }
  ]

  const values = [
    {
      title: "Innovation First",
      description: "We continuously innovate to solve real-world security challenges with cutting-edge technology."
    },
    {
      title: "Customer Obsessed",
      description: "Every decision we make is focused on creating value for our security professional customers."
    },
    {
      title: "Transparency",
      description: "We believe in open communication, honest feedback, and transparent decision-making processes."
    },
    {
      title: "Excellence",
      description: "We strive for excellence in everything we do, from code quality to customer service."
    },
    {
      title: "Team First",
      description: "We support each other, celebrate wins together, and learn from challenges as a unified team."
    },
    {
      title: "Impact Driven",
      description: "We're passionate about making the world safer through technology and empowering security professionals."
    }
  ]

  const perks = [
    "Competitive salary and equity package",
    "Annual performance bonuses",
    "Flexible working hours and remote work",
    "R15,000 annual learning and development budget",
    "Top-tier MacBook Pro and equipment",
    "Comprehensive medical aid coverage",
    "25 days annual leave plus public holidays",
    "Monthly team events and quarterly offsites",
    "Home office setup allowance",
    "Gym membership subsidy",
    "Professional conference attendance",
    "Stock option program"
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/landing" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center space-x-2">
                <Shield className="w-8 h-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">WorkforceOne</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login" className="text-gray-600 hover:text-gray-900">
                Sign In
              </Link>
              <Link href="/auth/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Join Our Mission
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Help us transform the security industry and make the world safer through innovative technology. 
            Join a growing team of passionate professionals building the future of security management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="#positions" 
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              View Open Positions
            </Link>
            <Link 
              href="/contact" 
              className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Why WorkforceOne */}
      <section className="py-16 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why WorkforceOne?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're not just building software – we're revolutionizing an entire industry and creating 
              meaningful impact for security professionals worldwide.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-gray-50 p-8 rounded-xl">
                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center text-blue-600 mb-6">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Company Values */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Our Values</h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              These values guide how we work, make decisions, and treat each other every day
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
                <h3 className="text-xl font-semibold text-white mb-3">{value.title}</h3>
                <p className="text-blue-100">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section id="positions" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Open Positions</h2>
            <p className="text-xl text-gray-600">
              Join our growing team and help shape the future of security technology
            </p>
          </div>
          <div className="grid gap-6">
            {openPositions.map((position, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-lg border hover:shadow-xl transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-semibold text-gray-900 mb-2">{position.title}</h3>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                          <span className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {position.department}
                          </span>
                          <span className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {position.location}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {position.type}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4">{position.description}</p>
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Key Skills:</h4>
                      <div className="flex flex-wrap gap-2">
                        {position.skills.map((skill, skillIndex) => (
                          <span 
                            key={skillIndex} 
                            className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 lg:mt-0 lg:ml-8">
                    <Link 
                      href={`mailto:careers@workforceone.co.za?subject=Application for ${position.title}`}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center space-x-2 whitespace-nowrap"
                    >
                      <span>Apply Now</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Perks & Benefits */}
      <section className="py-16 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Perks & Benefits</h2>
            <p className="text-xl text-gray-600">
              We take care of our team so they can focus on building amazing products
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {perks.map((perk, index) => (
              <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                <div className="bg-blue-600 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-700">{perk}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Process */}
      <section className="py-16 bg-gray-100 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Application Process</h2>
            <p className="text-xl text-gray-600">
              Our hiring process is designed to be fair, transparent, and respectful of your time
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">1</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Apply</h3>
              <p className="text-gray-600 text-sm">Submit your application with CV and cover letter</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">2</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Screen</h3>
              <p className="text-gray-600 text-sm">Initial phone/video call with our talent team</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">3</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Interview</h3>
              <p className="text-gray-600 text-sm">Technical and cultural fit interviews with the team</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">4</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Offer</h3>
              <p className="text-gray-600 text-sm">Reference checks and offer discussion</p>
            </div>
          </div>
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-6">
              Typically takes 1-2 weeks from application to offer
            </p>
          </div>
        </div>
      </section>

      {/* Contact HR */}
      <section className="py-16 bg-blue-600 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Don't See the Right Role?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            We're always looking for talented people. Send us your CV and tell us how you'd like to contribute.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:careers@workforceone.co.za"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 flex items-center justify-center space-x-2"
            >
              <Mail className="w-5 h-5" />
              <span>Email Us Your CV</span>
            </a>
            <Link 
              href="/contact" 
              className="bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </section>

      {/* Equal Opportunity */}
      <section className="py-12 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">Equal Opportunity Employer</h3>
          <p className="text-gray-600 leading-relaxed">
            WorkforceOne is committed to creating a diverse and inclusive workplace. We are an equal opportunity 
            employer and welcome applications from all qualified candidates regardless of race, gender, age, 
            religion, sexual orientation, or any other protected characteristic. We believe that diversity 
            drives innovation and makes us stronger as a team.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Shield className="w-6 h-6 text-blue-500" />
            <span className="text-lg font-semibold text-white">WorkforceOne</span>
          </div>
          <p className="text-sm mb-4">
            Join Us in Transforming Security Management
          </p>
          <div className="flex justify-center space-x-4 text-sm">
            <Link href="/landing" className="hover:text-white">Home</Link>
            <Link href="/about" className="hover:text-white">About</Link>
            <Link href="/contact" className="hover:text-white">Contact</Link>
            <Link href="/privacy-policy" className="hover:text-white">Privacy</Link>
          </div>
          <p className="text-xs mt-4">
            © 2024 WorkforceOne. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}