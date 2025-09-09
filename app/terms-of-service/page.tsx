import React from 'react'
import Link from 'next/link'
import { Shield, ArrowLeft } from 'lucide-react'

export default function TermsOfServicePage() {
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

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
          <div>
            <p className="text-gray-600 mb-6">
              <strong>Effective Date:</strong> September 9, 2024<br />
              <strong>Last Updated:</strong> September 9, 2024
            </p>
          </div>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Agreement to Terms</h2>
            <p className="text-gray-600 mb-4">
              By accessing or using the WorkforceOne platform, mobile application, and related services 
              (collectively, the "Service"), you agree to be bound by these Terms of Service ("Terms"). 
              If you disagree with any part of these terms, then you may not access the Service.
            </p>
            <p className="text-gray-600">
              These Terms apply to all visitors, users, and others who access or use the Service, including 
              security guards, security companies, administrators, and facility managers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="text-gray-600 mb-4">
              WorkforceOne provides a comprehensive security management platform that includes:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Mobile application for security guards</li>
              <li>Web-based dashboard for management and monitoring</li>
              <li>GPS patrol tracking and verification</li>
              <li>QR code checkpoint system</li>
              <li>Incident reporting and documentation</li>
              <li>Performance analytics and reporting</li>
              <li>Real-time communication tools</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Account Registration</h2>
            
            <h3 className="text-lg font-semibold text-gray-800 mb-2">3.1 Account Creation</h3>
            <p className="text-gray-600 mb-4">
              To use certain features of the Service, you must register for an account. You agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and promptly update your account information</li>
              <li>Maintain the security of your password and account</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized use</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mb-2">3.2 Account Types</h3>
            <p className="text-gray-600 mb-4">WorkforceOne offers different account types:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li><strong>Organization Account:</strong> For security companies and businesses</li>
              <li><strong>Administrator Account:</strong> For managers and supervisors</li>
              <li><strong>Guard Account:</strong> For individual security guards</li>
              <li><strong>Client Account:</strong> For facility managers and clients</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Acceptable Use</h2>
            
            <h3 className="text-lg font-semibold text-gray-800 mb-2">4.1 Permitted Use</h3>
            <p className="text-gray-600 mb-4">You may use the Service only for:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>Legitimate security management purposes</li>
              <li>Activities consistent with applicable laws and regulations</li>
              <li>Your authorized business operations</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mb-2">4.2 Prohibited Use</h3>
            <p className="text-gray-600 mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Submit false or misleading information</li>
              <li>Impersonate another person or organization</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Use automated systems to access the Service without permission</li>
              <li>Share your account credentials with unauthorized persons</li>
              <li>Use the Service to harass, abuse, or harm others</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Location Services</h2>
            <p className="text-gray-600 mb-4">
              The Service requires access to location data for core functionality. By using the Service, you consent to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Collection of GPS location data during active shifts</li>
              <li>Sharing location data with authorized supervisors and clients</li>
              <li>Storage of historical patrol route data</li>
              <li>Use of location data for safety and security purposes</li>
            </ul>
            <p className="text-gray-600 mt-4">
              Location tracking is essential for the Service and cannot be disabled during active shifts.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Ownership and Usage</h2>
            
            <h3 className="text-lg font-semibold text-gray-800 mb-2">6.1 Your Data</h3>
            <p className="text-gray-600 mb-4">
              You retain ownership of all data you submit to the Service. You grant us a license to use, 
              store, and process this data to provide and improve the Service.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-2">6.2 Service Data</h3>
            <p className="text-gray-600 mb-4">
              We may collect and use aggregated, anonymized data for:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Improving the Service</li>
              <li>Research and development</li>
              <li>Industry benchmarking</li>
              <li>Creating general statistics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Payment Terms</h2>
            
            <h3 className="text-lg font-semibold text-gray-800 mb-2">7.1 Subscription Fees</h3>
            <p className="text-gray-600 mb-4">
              Organization accounts may be subject to subscription fees based on:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>Number of active guards</li>
              <li>Selected features and modules</li>
              <li>Data storage requirements</li>
              <li>Support level</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mb-2">7.2 Payment Processing</h3>
            <p className="text-gray-600">
              Payments are processed securely through third-party payment providers. You agree to pay all 
              applicable fees and authorize us to charge your selected payment method.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Intellectual Property</h2>
            <p className="text-gray-600 mb-4">
              The Service and its original content, features, and functionality are owned by WorkforceOne 
              and are protected by international copyright, trademark, and other intellectual property laws.
            </p>
            <p className="text-gray-600">
              You may not copy, modify, distribute, sell, or lease any part of our Service without explicit 
              written permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Disclaimers and Limitations</h2>
            
            <h3 className="text-lg font-semibold text-gray-800 mb-2">9.1 Service Availability</h3>
            <p className="text-gray-600 mb-4">
              We strive for 99.9% uptime but do not guarantee uninterrupted access. The Service may be 
              unavailable due to maintenance, updates, or circumstances beyond our control.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-2">9.2 Limitation of Liability</h3>
            <p className="text-gray-600 mb-4">
              To the maximum extent permitted by law, WorkforceOne shall not be liable for any indirect, 
              incidental, special, consequential, or punitive damages resulting from your use of the Service.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-2">9.3 No Warranty</h3>
            <p className="text-gray-600">
              The Service is provided "as is" without warranties of any kind, either express or implied, 
              including but not limited to warranties of merchantability, fitness for a particular purpose, 
              or non-infringement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Indemnification</h2>
            <p className="text-gray-600">
              You agree to indemnify and hold harmless WorkforceOne, its affiliates, and their respective 
              officers, directors, employees, and agents from any claims, damages, losses, liabilities, and 
              expenses arising from your use of the Service or violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Termination</h2>
            
            <h3 className="text-lg font-semibold text-gray-800 mb-2">11.1 Termination by You</h3>
            <p className="text-gray-600 mb-4">
              You may terminate your account at any time by contacting support. Termination does not relieve 
              you of any obligations incurred prior to termination.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-2">11.2 Termination by Us</h3>
            <p className="text-gray-600 mb-4">
              We may suspend or terminate your account immediately for:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Violation of these Terms</li>
              <li>Non-payment of fees</li>
              <li>Suspected fraudulent or illegal activity</li>
              <li>Extended period of inactivity</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Governing Law</h2>
            <p className="text-gray-600">
              These Terms shall be governed by and construed in accordance with the laws of South Africa, 
              without regard to its conflict of law provisions. Any disputes shall be resolved in the courts 
              of South Africa.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Changes to Terms</h2>
            <p className="text-gray-600">
              We reserve the right to modify these Terms at any time. We will notify users of any material 
              changes via email or through the Service. Your continued use of the Service after such 
              modifications constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Contact Information</h2>
            <p className="text-gray-600">
              For questions about these Terms, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">
                <strong>WorkforceOne Security Management</strong><br />
                Email: legal@workforceone.co.za<br />
                Support: support@workforceone.co.za<br />
                Website: www.workforceone.co.za
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Entire Agreement</h2>
            <p className="text-gray-600">
              These Terms constitute the entire agreement between you and WorkforceOne regarding the use of 
              the Service, superseding any prior agreements.
            </p>
          </section>
        </div>

        {/* Additional Legal Links */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            See also: 
            <Link href="/privacy-policy" className="text-blue-600 hover:text-blue-700 ml-2">Privacy Policy</Link> | 
            <Link href="/cookies" className="text-blue-600 hover:text-blue-700 ml-2">Cookie Policy</Link> | 
            <Link href="/landing" className="text-blue-600 hover:text-blue-700 ml-2">Back to Home</Link>
          </p>
        </div>
      </div>
    </div>
  )
}