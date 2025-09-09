import React from 'react'
import Link from 'next/link'
import { Shield, ArrowLeft } from 'lucide-react'

export default function PrivacyPolicyPage() {
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
            <Link href="/auth/login" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
          <div>
            <p className="text-gray-600 mb-6">
              <strong>Effective Date:</strong> September 9, 2024<br />
              <strong>Last Updated:</strong> September 9, 2024
            </p>
          </div>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-600 mb-4">
              WorkforceOne ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
              explains how we collect, use, disclose, and safeguard your information when you use our mobile 
              application and web platform (collectively, the "Service").
            </p>
            <p className="text-gray-600">
              By using our Service, you agree to the collection and use of information in accordance with this 
              Privacy Policy. If you do not agree with the terms of this policy, please do not use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-lg font-semibold text-gray-800 mb-2">2.1 Personal Information</h3>
            <p className="text-gray-600 mb-4">We may collect the following personal information:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>Name and contact information (email address, phone number)</li>
              <li>Account credentials (username and encrypted password)</li>
              <li>Employment information (company name, employee ID, role)</li>
              <li>Profile photo (optional)</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mb-2">2.2 Location Information</h3>
            <p className="text-gray-600 mb-4">
              When you use our mobile app, we collect precise location data to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>Track patrol routes and verify checkpoint visits</li>
              <li>Ensure guard safety through real-time location monitoring</li>
              <li>Generate patrol reports and analytics</li>
              <li>Verify attendance at assigned locations</li>
            </ul>
            <p className="text-gray-600 mb-4">
              Location tracking only occurs during active shifts and can be disabled by the user or administrator.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-2">2.3 Device Information</h3>
            <p className="text-gray-600 mb-4">We automatically collect:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>Device type and model</li>
              <li>Operating system and version</li>
              <li>Unique device identifiers</li>
              <li>Mobile network information</li>
              <li>App version and crash reports</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mb-2">2.4 Usage Data</h3>
            <p className="text-gray-600 mb-4">We collect information about how you interact with our Service:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Features used and actions taken</li>
              <li>Time, frequency, and duration of activities</li>
              <li>QR codes scanned and checkpoints visited</li>
              <li>Incident reports and photos submitted</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-600 mb-4">We use the collected information for:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Providing and maintaining our Service</li>
              <li>Managing your account and authentication</li>
              <li>Tracking patrol activities and generating reports</li>
              <li>Monitoring and improving guard performance</li>
              <li>Ensuring compliance with security protocols</li>
              <li>Sending important notifications and alerts</li>
              <li>Analyzing usage patterns to improve our Service</li>
              <li>Preventing fraud and enhancing security</li>
              <li>Complying with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
            <p className="text-gray-600 mb-4">We may share your information with:</p>
            
            <h3 className="text-lg font-semibold text-gray-800 mb-2">4.1 Your Employer</h3>
            <p className="text-gray-600 mb-4">
              If you use WorkforceOne as part of your employment, your employer will have access to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>Your attendance and patrol records</li>
              <li>Location data during work hours</li>
              <li>Performance metrics and reports</li>
              <li>Incident reports you submit</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mb-2">4.2 Service Providers</h3>
            <p className="text-gray-600 mb-4">
              We may share information with third-party service providers who assist us in operating our Service, 
              including cloud storage providers, analytics services, and technical support.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-2">4.3 Legal Requirements</h3>
            <p className="text-gray-600 mb-4">
              We may disclose information if required by law or in response to valid requests by public authorities.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-2">4.4 Business Transfers</h3>
            <p className="text-gray-600">
              In the event of a merger, acquisition, or sale of assets, your information may be transferred to the 
              acquiring entity.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
            <p className="text-gray-600 mb-4">
              We implement appropriate technical and organizational measures to protect your information against 
              unauthorized access, alteration, disclosure, or destruction. These measures include:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Encryption of data in transit and at rest</li>
              <li>Secure authentication mechanisms</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and employee training</li>
              <li>Secure cloud infrastructure with redundancy</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Retention</h2>
            <p className="text-gray-600 mb-4">
              We retain your information for as long as necessary to provide our Service and comply with legal 
              obligations. Specifically:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Active account data: Retained while your account is active</li>
              <li>Patrol and attendance records: Retained for 3 years or as required by law</li>
              <li>Location data: Retained for 90 days for operational purposes</li>
              <li>Incident reports: Retained for 5 years for compliance purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Rights and Choices</h2>
            <p className="text-gray-600 mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Access and receive a copy of your personal information</li>
              <li>Correct inaccurate or incomplete information</li>
              <li>Request deletion of your personal information (subject to legal requirements)</li>
              <li>Object to or restrict certain processing activities</li>
              <li>Withdraw consent for optional data collection</li>
              <li>Disable location tracking (may affect app functionality)</li>
            </ul>
            <p className="text-gray-600 mt-4">
              To exercise these rights, please contact us at privacy@workforceone.co.za
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Children's Privacy</h2>
            <p className="text-gray-600">
              Our Service is not intended for individuals under the age of 18. We do not knowingly collect 
              personal information from children. If you believe we have collected information from a child, 
              please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. International Data Transfers</h2>
            <p className="text-gray-600">
              Your information may be transferred to and processed in countries other than your country of 
              residence. We ensure appropriate safeguards are in place to protect your information in accordance 
              with applicable data protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Updates to This Policy</h2>
            <p className="text-gray-600">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
              the new Privacy Policy on this page and updating the "Last Updated" date. We encourage you to review 
              this Privacy Policy periodically.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Us</h2>
            <p className="text-gray-600">
              If you have any questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">
                <strong>WorkforceOne Security Management</strong><br />
                Email: privacy@workforceone.co.za<br />
                Website: www.workforceone.co.za<br />
                Support: support@workforceone.co.za
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Consent</h2>
            <p className="text-gray-600">
              By using our Service, you consent to this Privacy Policy and agree to its terms. If you do not 
              agree to this policy, please do not use our Service.
            </p>
          </section>
        </div>

        {/* Additional Legal Links */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            See also: 
            <Link href="/terms-of-service" className="text-blue-600 hover:text-blue-700 ml-2">Terms of Service</Link> | 
            <Link href="/cookies" className="text-blue-600 hover:text-blue-700 ml-2">Cookie Policy</Link> | 
            <Link href="/security" className="text-blue-600 hover:text-blue-700 ml-2">Security</Link>
          </p>
        </div>
      </div>
    </div>
  )
}