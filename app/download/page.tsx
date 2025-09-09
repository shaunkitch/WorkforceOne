'use client'

import React from 'react'
import Link from 'next/link'
import { Shield, Download, Smartphone, QrCode, CheckCircle2, ArrowLeft, ExternalLink, Play } from 'lucide-react'

export default function DownloadPage() {
  const appInfo = {
    version: "1.0.0",
    size: "~25 MB",
    updated: "September 9, 2024",
    minAndroid: "Android 5.0 (API 21)",
    downloadUrl: "https://expo.dev/artifacts/eas/p9DhJojRZctkrHaJ3QgLoG.aab"
  }

  const requirements = [
    "Android 5.0 or higher",
    "Active internet connection",
    "GPS/Location services enabled",
    "Camera for QR code scanning",
    "50 MB free storage space"
  ]

  const installSteps = [
    {
      title: "Download the APK",
      description: "Click the download button below or scan the QR code with your Android device"
    },
    {
      title: "Enable Installation",
      description: "Go to Settings > Security > Enable 'Unknown Sources' (for APK installation)"
    },
    {
      title: "Install the App",
      description: "Open the downloaded file and tap 'Install'"
    },
    {
      title: "Launch WorkforceOne",
      description: "Open the app and sign in with your guard credentials"
    }
  ]

  const features = [
    "Real-time GPS patrol tracking",
    "QR code checkpoint scanning",
    "Incident reporting with photos",
    "Offline mode with auto-sync",
    "Performance dashboard",
    "Shift management"
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b">
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
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Download WorkforceOne Guard App
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get the mobile app for Android to start tracking patrols, scanning checkpoints, and managing your security operations on the go.
            </p>
          </div>

          {/* Download Options */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Direct Download */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="text-center mb-6">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Download className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Direct Download</h2>
                <p className="text-gray-600">Download the APK file directly to your device</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Version</span>
                  <span className="font-medium">{appInfo.version}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Size</span>
                  <span className="font-medium">{appInfo.size}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Updated</span>
                  <span className="font-medium">{appInfo.updated}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Requires</span>
                  <span className="font-medium">{appInfo.minAndroid}</span>
                </div>
              </div>

              <a
                href={appInfo.downloadUrl}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center space-x-2"
              >
                <Download className="w-5 h-5" />
                <span>Download APK</span>
              </a>

              <p className="text-xs text-gray-500 text-center mt-4">
                Direct download from our secure servers
              </p>
            </div>

            {/* QR Code Download */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="text-center mb-6">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <QrCode className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Scan QR Code</h2>
                <p className="text-gray-600">Scan with your Android device to download</p>
              </div>

              <div className="bg-gray-100 p-8 rounded-lg mb-6">
                <div className="aspect-square bg-white rounded-lg flex items-center justify-center">
                  {/* QR Code Placeholder */}
                  <div className="text-center">
                    <QrCode className="w-32 h-32 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-600">QR Code for:</p>
                    <p className="text-xs text-gray-500 break-all mt-2 px-4">
                      {appInfo.downloadUrl}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Open your camera app and point at the QR code
                </p>
                <p className="text-xs text-gray-500">
                  Compatible with all QR code scanners
                </p>
              </div>
            </div>
          </div>

          {/* Google Play Store (Coming Soon) */}
          <div className="max-w-5xl mx-auto mt-8">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Play className="w-8 h-8 text-green-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Google Play Store</h3>
                    <p className="text-gray-600">Official store release coming soon</p>
                  </div>
                </div>
                <button
                  disabled
                  className="bg-gray-300 text-gray-500 px-6 py-2 rounded-lg cursor-not-allowed"
                >
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Installation Instructions */}
      <section className="py-12 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            How to Install
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {installSteps.map((step, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold">
                    {index + 1}
                  </div>
                  <h3 className="ml-3 font-semibold text-gray-900">{step.title}</h3>
                </div>
                <p className="text-gray-600 text-sm">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> If you're installing the APK directly, you may need to enable "Install from Unknown Sources" in your Android settings. This is safe for our verified app.
            </p>
          </div>
        </div>
      </section>

      {/* System Requirements */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Requirements */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">System Requirements</h3>
              <ul className="space-y-3">
                {requirements.map((req, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Key Features */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Key Features</h3>
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-12 bg-blue-600 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Need Help Installing?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Our support team is here to help you get started
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@workforceone.co.za"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 flex items-center justify-center space-x-2"
            >
              <span>Email Support</span>
              <ExternalLink className="w-4 h-4" />
            </a>
            <Link
              href="/support"
              className="bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800"
            >
              View Documentation
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
            Professional Security Management Platform
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