'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Shield, Smartphone, MapPin, Camera, BarChart3, Clock, CheckCircle2, Download, ChevronRight, Users, Globe, Zap, Lock, Cloud, QrCode } from 'lucide-react'

export default function LandingPage() {
  const features = [
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "GPS Patrol Tracking",
      description: "Real-time location tracking ensures guards complete their patrol routes"
    },
    {
      icon: <QrCode className="w-6 h-6" />,
      title: "QR Code Check-in",
      description: "Quick and secure checkpoint verification with QR code scanning"
    },
    {
      icon: <Camera className="w-6 h-6" />,
      title: "Incident Reporting",
      description: "Capture photos and document incidents instantly from the field"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Performance Analytics",
      description: "Comprehensive KPI dashboard for monitoring guard performance"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Shift Management",
      description: "Automated attendance tracking and shift scheduling"
    },
    {
      icon: <Cloud className="w-6 h-6" />,
      title: "Cloud Sync",
      description: "Offline capability with automatic cloud synchronization"
    }
  ]

  const benefits = [
    {
      title: "For Security Companies",
      items: [
        "Monitor all guards in real-time",
        "Reduce operational costs by 40%",
        "Improve client satisfaction",
        "Generate compliance reports instantly"
      ]
    },
    {
      title: "For Security Guards",
      items: [
        "Easy-to-use mobile interface",
        "Track your performance metrics",
        "Submit reports on-the-go",
        "Never miss a checkpoint"
      ]
    },
    {
      title: "For Facility Managers",
      items: [
        "Verify security coverage 24/7",
        "Access detailed patrol reports",
        "Respond to incidents faster",
        "Ensure compliance standards"
      ]
    }
  ]

  const stats = [
    { value: "10,000+", label: "Active Guards" },
    { value: "500+", label: "Security Companies" },
    { value: "99.9%", label: "Uptime" },
    { value: "24/7", label: "Support" }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">WorkforceOne</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-gray-900">Features</Link>
              <Link href="#benefits" className="text-gray-600 hover:text-gray-900">Benefits</Link>
              <Link href="#download" className="text-gray-600 hover:text-gray-900">Download</Link>
              <Link href="/privacy-policy" className="text-gray-600 hover:text-gray-900">Privacy</Link>
              <Link href="/auth/login" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Professional Security
              <span className="text-blue-600"> Management Platform</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Transform your security operations with real-time patrol tracking, incident reporting, 
              and performance analytics. Trusted by leading security companies worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/download"
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 flex items-center justify-center space-x-2"
              >
                <Download className="w-5 h-5" />
                <span>Download for Android</span>
              </Link>
              <Link
                href="/auth/register"
                className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 flex items-center justify-center space-x-2"
              >
                <span>Get Started Free</span>
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Available on Google Play Store • iOS coming soon
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white">{stat.value}</div>
                <div className="text-blue-100 mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Modern Security
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to manage, monitor, and optimize your security operations
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Built for Everyone in Security
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Whether you're a guard, manager, or company owner, WorkforceOne has you covered
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-lg">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6">{benefit.title}</h3>
                <ul className="space-y-3">
                  {benefit.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start space-x-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile App Showcase */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Mobile App for Guards
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Our intuitive mobile app makes it easy for guards to manage their duties, 
                track patrols, and submit reports from anywhere.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center space-x-3">
                  <Smartphone className="w-6 h-6 text-blue-600" />
                  <span className="text-gray-700">Works offline with automatic sync</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Zap className="w-6 h-6 text-blue-600" />
                  <span className="text-gray-700">Fast and responsive interface</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Lock className="w-6 h-6 text-blue-600" />
                  <span className="text-gray-700">Secure authentication and data protection</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Globe className="w-6 h-6 text-blue-600" />
                  <span className="text-gray-700">Real-time updates and notifications</span>
                </li>
              </ul>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="https://play.google.com/store"
                  className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 flex items-center justify-center space-x-2"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                  <span>Get it on Google Play</span>
                </a>
                <button
                  disabled
                  className="bg-gray-300 text-gray-500 px-6 py-3 rounded-lg cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z"/>
                  </svg>
                  <span>Coming Soon on iOS</span>
                </button>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-8 shadow-2xl">
              <div className="bg-white rounded-xl p-4">
                <div className="aspect-[9/16] bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src="/images/app-screenshot.jpg"
                    alt="WorkforceOne Dashboard Screenshot"
                    width={400}
                    height={711}
                    className="w-full h-full object-cover"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section id="download" className="py-20 bg-blue-600 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Security Operations?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of security professionals using WorkforceOne
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/download"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 flex items-center justify-center space-x-2"
            >
              <Download className="w-5 h-5" />
              <span>Download Android App</span>
            </Link>
            <Link
              href="/auth/register"
              className="bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-800 flex items-center justify-center space-x-2"
            >
              <Users className="w-5 h-5" />
              <span>Create Company Account</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="w-8 h-8 text-blue-500" />
                <span className="text-xl font-bold text-white">WorkforceOne</span>
              </div>
              <p className="text-sm">
                Professional security management platform for modern security companies.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="#features" className="hover:text-white">Features</Link></li>
                <li><Link href="#benefits" className="hover:text-white">Benefits</Link></li>
                <li><Link href="#download" className="hover:text-white">Download</Link></li>
                <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/support" className="hover:text-white">Support</Link></li>
                <li><Link href="/careers" className="hover:text-white">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="/privacy-policy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms-of-service" className="hover:text-white">Terms of Service</Link></li>
                <li><Link href="/cookies" className="hover:text-white">Cookie Policy</Link></li>
                <li><Link href="/security" className="hover:text-white">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-sm">
              © 2024 WorkforceOne. All rights reserved. | 
              <Link href="/privacy-policy" className="ml-2 hover:text-white">Privacy</Link> | 
              <Link href="/terms-of-service" className="ml-2 hover:text-white">Terms</Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}