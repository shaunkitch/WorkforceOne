import React from 'react'
import Link from 'next/link'
import { Shield, ArrowLeft, Users, Target, Award, Globe, Clock, Zap, CheckCircle2, MapPin, Phone, Mail } from 'lucide-react'

export default function AboutPage() {
  const stats = [
    { value: "10,000+", label: "Active Guards", icon: <Users className="w-6 h-6" /> },
    { value: "500+", label: "Security Companies", icon: <Shield className="w-6 h-6" /> },
    { value: "99.9%", label: "System Uptime", icon: <Clock className="w-6 h-6" /> },
    { value: "24/7", label: "Support Available", icon: <Zap className="w-6 h-6" /> }
  ]

  const values = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Security First",
      description: "We prioritize the security and safety of all users, implementing enterprise-grade encryption and security protocols."
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "People Focused",
      description: "Our platform is designed with real security professionals in mind, making their daily work more efficient and effective."
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Innovation Driven",
      description: "We continuously innovate to provide cutting-edge solutions that transform the security industry."
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Global Impact",
      description: "Our platform serves security companies worldwide, creating a safer environment for communities everywhere."
    }
  ]

  const team = [
    {
      name: "Leadership Team",
      description: "Experienced executives from security and technology industries",
      expertise: "Strategic Vision & Industry Knowledge"
    },
    {
      name: "Engineering Team",
      description: "Full-stack developers, mobile specialists, and DevOps engineers",
      expertise: "Technical Excellence & Innovation"
    },
    {
      name: "Security Experts",
      description: "Former security professionals who understand real-world challenges",
      expertise: "Industry Insight & User Experience"
    },
    {
      name: "Support Team",
      description: "Dedicated customer success and technical support specialists",
      expertise: "Customer Service & Training"
    }
  ]

  const milestones = [
    {
      year: "2023",
      title: "Company Founded",
      description: "WorkforceOne was founded with the vision to revolutionize security management through technology."
    },
    {
      year: "2024",
      title: "Platform Launch",
      description: "Launched comprehensive security management platform with mobile app and web dashboard."
    },
    {
      year: "2024",
      title: "Market Expansion",
      description: "Expanded to serve security companies across multiple regions with 24/7 support."
    },
    {
      year: "2024",
      title: "Google Play Store",
      description: "Mobile app launched on Google Play Store, making it accessible to thousands of guards."
    }
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
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            About WorkforceOne
          </h1>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-8">
            We're revolutionizing the security industry with cutting-edge technology that empowers security 
            professionals to work more efficiently, safely, and effectively. Our mission is to create a 
            safer world through intelligent security management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/contact" 
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              Contact Us
            </Link>
            <Link 
              href="/careers" 
              className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50"
            >
              Join Our Team
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center text-blue-600 mx-auto mb-4">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-gray-600 mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 text-white">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-xl mb-6 text-blue-100">
                To transform the security industry by providing innovative, reliable, and user-friendly 
                technology solutions that enhance safety, improve efficiency, and deliver measurable results.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="w-6 h-6 text-blue-300 mt-0.5 flex-shrink-0" />
                  <span className="text-blue-100">Empower security professionals with cutting-edge tools</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="w-6 h-6 text-blue-300 mt-0.5 flex-shrink-0" />
                  <span className="text-blue-100">Improve operational efficiency and accountability</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="w-6 h-6 text-blue-300 mt-0.5 flex-shrink-0" />
                  <span className="text-blue-100">Create safer environments for communities worldwide</span>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Vision</h2>
              <p className="text-xl mb-6 text-blue-100">
                To be the global leader in security management technology, setting the standard for 
                innovation, reliability, and user experience in the security industry.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="w-6 h-6 text-blue-300 mt-0.5 flex-shrink-0" />
                  <span className="text-blue-100">Global platform trusted by security companies worldwide</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="w-6 h-6 text-blue-300 mt-0.5 flex-shrink-0" />
                  <span className="text-blue-100">Continuous innovation driving industry transformation</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="w-6 h-6 text-blue-300 mt-0.5 flex-shrink-0" />
                  <span className="text-blue-100">Contributing to a safer, more secure world</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Core Values</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              These values guide everything we do, from product development to customer service
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-lg text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center text-blue-600 mx-auto mb-6">
                  {value.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Journey</h2>
            <p className="text-xl text-gray-600">
              Key milestones in our mission to transform security management
            </p>
          </div>
          <div className="relative">
            <div className="absolute left-4 md:left-1/2 h-full w-0.5 bg-blue-200 transform md:-translate-x-0.5"></div>
            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <div key={index} className={`relative flex items-center ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  <div className={`w-full md:w-5/12 ${index % 2 === 0 ? 'md:pr-8' : 'md:pl-8'}`}>
                    <div className="bg-white p-6 rounded-lg shadow-lg border">
                      <div className="text-blue-600 font-bold text-lg mb-2">{milestone.year}</div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">{milestone.title}</h3>
                      <p className="text-gray-600">{milestone.description}</p>
                    </div>
                  </div>
                  <div className="absolute left-4 md:left-1/2 w-8 h-8 bg-blue-600 rounded-full transform md:-translate-x-1/2 flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Team</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A diverse group of professionals united by our passion for security technology and innovation
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {team.map((group, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-lg">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">{group.name}</h3>
                <p className="text-gray-600 mb-4">{group.description}</p>
                <div className="border-t pt-4">
                  <div className="text-sm text-blue-600 font-semibold">Core Expertise</div>
                  <div className="text-gray-800">{group.expertise}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 bg-blue-600 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Security Operations?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of security professionals who trust WorkforceOne to manage their operations
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/auth/register" 
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100"
            >
              Start Free Trial
            </Link>
            <Link 
              href="/contact" 
              className="bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-800"
            >
              Contact Sales
            </Link>
          </div>
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
            Transforming Security Management Through Technology
          </p>
          <div className="flex justify-center space-x-4 text-sm">
            <Link href="/landing" className="hover:text-white">Home</Link>
            <Link href="/privacy-policy" className="hover:text-white">Privacy</Link>
            <Link href="/terms-of-service" className="hover:text-white">Terms</Link>
            <Link href="/contact" className="hover:text-white">Contact</Link>
          </div>
          <p className="text-xs mt-4">
            © 2024 WorkforceOne. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}