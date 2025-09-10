'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Shield, ArrowLeft, Search, HelpCircle, Book, Video, MessageSquare, Download, ChevronRight, ChevronDown, Mail, Phone, Clock } from 'lucide-react'

export default function SupportPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const quickLinks = [
    {
      icon: <Download className="w-6 h-6" />,
      title: "Download Mobile App",
      description: "Get the WorkforceOne Guard app for Android",
      link: "/download"
    },
    {
      icon: <Book className="w-6 h-6" />,
      title: "User Guide",
      description: "Complete guide for using WorkforceOne",
      link: "#user-guide"
    },
    {
      icon: <Video className="w-6 h-6" />,
      title: "Video Tutorials",
      description: "Step-by-step video guides",
      link: "#tutorials"
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Contact Support",
      description: "Get help from our support team",
      link: "/contact"
    }
  ]

  const supportCategories = [
    {
      title: "Getting Started",
      articles: [
        "Setting up your WorkforceOne account",
        "Installing the mobile app",
        "Creating your first patrol route",
        "Adding guards to your organization",
        "Understanding the dashboard"
      ]
    },
    {
      title: "Mobile App Guide",
      articles: [
        "Logging into the mobile app",
        "GPS tracking and patrol routes",
        "Scanning QR codes for check-ins",
        "Reporting incidents with photos",
        "Working offline and data sync"
      ]
    },
    {
      title: "Dashboard & Reports",
      articles: [
        "Viewing real-time guard locations",
        "Generating attendance reports",
        "Understanding performance metrics",
        "Managing QR codes and checkpoints",
        "Setting up automated alerts"
      ]
    },
    {
      title: "Administration",
      articles: [
        "Managing user roles and permissions",
        "Setting up your organization",
        "Configuring system settings",
        "Managing billing and subscriptions",
        "Data backup and security"
      ]
    }
  ]

  const faqs = [
    {
      question: "How do I get started with WorkforceOne?",
      answer: "Getting started is easy! First, create an account at workforceone.co.za/auth/register. Then download the mobile app from our download page, set up your organization profile, and add your guards. Our setup wizard will guide you through each step."
    },
    {
      question: "Is the mobile app free to download?",
      answer: "Yes, the WorkforceOne Guard mobile app is completely free to download and install. You can get it from our download page or soon from the Google Play Store. Your organization may have different subscription plans for the web platform features."
    },
    {
      question: "Does the app work offline?",
      answer: "Yes! The mobile app is designed to work offline. Guards can continue to scan QR codes, track their location, and submit incident reports even without an internet connection. All data will automatically sync once connectivity is restored."
    },
    {
      question: "How accurate is the GPS tracking?",
      answer: "Our GPS tracking is highly accurate, typically within 3-5 meters. The app uses your device's GPS, cellular towers, and Wi-Fi networks to provide the most accurate location possible. Location accuracy may vary based on environmental factors like buildings or weather."
    },
    {
      question: "Can I integrate WorkforceOne with other systems?",
      answer: "Yes, WorkforceOne offers API integrations for common security and business systems. Contact our support team to discuss your specific integration needs and we'll help you connect your existing tools."
    },
    {
      question: "What happens if a guard's phone battery dies?",
      answer: "If a guard's phone battery dies during a shift, the last known location and activities are saved in our system. We recommend guards carry portable chargers and enable battery optimization settings in the app for maximum battery life."
    },
    {
      question: "How do I add new guards to my organization?",
      answer: "You can add new guards through the admin dashboard. Go to Administration > Guards, click 'Add New Guard', and enter their information. They'll receive an email with login instructions and can then download the mobile app."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. WorkforceOne uses enterprise-grade encryption for all data transmission and storage. We're compliant with international security standards and regularly undergo security audits. Your data is stored securely in the cloud with multiple backups."
    }
  ]

  const contactOptions = [
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Email Support",
      description: "support@workforceone.co.za",
      detail: "Response within 24 hours"
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: "Phone Support",
      description: "+27 (0) 11 123 4567",
      detail: "Mon-Fri, 9AM-5PM SAST"
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Live Chat",
      description: "Chat with support",
      detail: "Available during business hours"
    }
  ]

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

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
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Support Center
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Find answers, get help, and learn how to make the most of WorkforceOne
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for help articles, guides, or FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Quick Help</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickLinks.map((link, index) => (
              <Link key={index} href={link.link} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                  {link.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{link.title}</h3>
                <p className="text-gray-600 text-sm">{link.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Help Articles */}
      <section className="py-16 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Help Articles</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {supportCategories.map((category, index) => (
              <div key={index} className="bg-gray-50 p-8 rounded-xl">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">{category.title}</h3>
                <ul className="space-y-3">
                  {category.articles.map((article, articleIndex) => (
                    <li key={articleIndex}>
                      <Link href="#" className="flex items-center justify-between text-gray-600 hover:text-blue-600 py-2 hover:bg-white hover:px-3 hover:rounded-lg transition-all">
                        <span>{article}</span>
                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100" />
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href="#" className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium mt-4">
                  View all articles <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-900">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-16 bg-blue-600 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Still Need Help?</h2>
            <p className="text-xl text-blue-100">
              Our support team is here to help you with any questions
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {contactOptions.map((option, index) => (
              <div key={index} className="bg-white p-6 rounded-xl text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center text-blue-600 mx-auto mb-4">
                  {option.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{option.title}</h3>
                <p className="text-blue-600 font-medium mb-1">{option.description}</p>
                <p className="text-sm text-gray-600">{option.detail}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link 
              href="/contact" 
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 inline-flex items-center space-x-2"
            >
              <MessageSquare className="w-5 h-5" />
              <span>Contact Support Team</span>
            </Link>
          </div>
        </div>
      </section>

      {/* System Status */}
      <section className="py-12 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-8 rounded-xl border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">System Status</h3>
                <p className="text-gray-600">All systems are operational</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-green-600 font-medium">Operational</span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">99.9%</div>
                <div className="text-sm text-gray-600">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">&lt;2s</div>
                <div className="text-sm text-gray-600">Response Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">24/7</div>
                <div className="text-sm text-gray-600">Monitoring</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">0</div>
                <div className="text-sm text-gray-600">Active Issues</div>
              </div>
            </div>
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
            Professional Security Management Platform
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