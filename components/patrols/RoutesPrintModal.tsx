'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MapPin, Clock, QrCode, Printer, X } from 'lucide-react'

interface Location {
  id: string
  name: string
  description?: string
  address?: string
  latitude?: number
  longitude?: number
  metadata?: {
    qr_code?: string
    nfc_tag_id?: string
    special_instructions?: string
  }
}

interface PatrolRoute {
  id: string
  name: string
  description?: string
  checkpoints: string[]
  estimated_duration?: number
}

interface RoutesPrintModalProps {
  isOpen: boolean
  onClose: () => void
  route: PatrolRoute | null
  organizationId: string
}

export default function RoutesPrintModal({
  isOpen,
  onClose,
  route,
  organizationId
}: RoutesPrintModalProps) {
  const [checkpointDetails, setCheckpointDetails] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)
  const [organizationName, setOrganizationName] = useState<string>('')

  useEffect(() => {
    if (isOpen && route) {
      loadCheckpointDetails()
      loadOrganizationDetails()
    }
  }, [isOpen, route])

  const loadCheckpointDetails = async () => {
    if (!route?.checkpoints.length) return
    
    setLoading(true)
    try {
      // Fetch all checkpoints once and filter
      const response = await fetch(`/api/checkpoints?organization_id=${organizationId}`)
      if (response.ok) {
        const data = await response.json()
        const allCheckpoints = data.checkpoints || []
        
        // Filter and order checkpoints according to the route's checkpoint order
        const orderedCheckpoints = route.checkpoints.map(checkpointId => 
          allCheckpoints.find((cp: Location) => cp.id === checkpointId)
        ).filter(Boolean)
        
        setCheckpointDetails(orderedCheckpoints)
      }
    } catch (error) {
      console.error('Error loading checkpoint details:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadOrganizationDetails = async () => {
    try {
      // You might want to add an API endpoint to get organization details
      // For now, we'll use a placeholder
      setOrganizationName('WorkforceOne Security')
    } catch (error) {
      console.error('Error loading organization details:', error)
      setOrganizationName('Security Organization')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const generateQRCodeURL = (qrCode: string) => {
    // Generate QR code using a service like QR Server API
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrCode)}`
  }

  if (!route) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:overflow-visible">
        <DialogHeader className="print:hidden">
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Print Route Details - {route.name}
          </DialogTitle>
        </DialogHeader>

        <div className="print:p-0">
          {/* Print Header */}
          <div className="text-center mb-8 print:mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {organizationName}
            </h1>
            <h2 className="text-xl text-gray-700 mb-1">
              Patrol Route: {route.name}
            </h2>
            {route.description && (
              <p className="text-gray-600">{route.description}</p>
            )}
            <div className="flex justify-center gap-6 mt-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {route.checkpoints.length} Checkpoints
              </div>
              {route.estimated_duration && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  ~{route.estimated_duration} minutes
                </div>
              )}
            </div>
            <div className="text-sm text-gray-500 mt-2">
              Generated on: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
              Loading checkpoint details...
            </div>
          ) : (
            <>
              {/* Instructions */}
              <div className="mb-8 p-4 bg-blue-50 border-l-4 border-blue-400 print:bg-gray-50">
                <h3 className="font-semibold text-blue-900 mb-2">Deployment Instructions</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Place QR codes at each checkpoint location in a visible, accessible position</li>
                  <li>• Ensure QR codes are protected from weather and damage</li>
                  <li>• If NFC tags are available, place them near the QR codes for backup scanning</li>
                  <li>• Test each checkpoint with the mobile app before deployment</li>
                  <li>• Keep this printout as a reference for checkpoint locations</li>
                </ul>
              </div>

              {/* Checkpoints Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
                {checkpointDetails.map((checkpoint, index) => (
                  <div key={checkpoint.id} className="border border-gray-300 rounded-lg p-4 break-inside-avoid">
                    {/* Checkpoint Header */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          #{index + 1} {checkpoint.name}
                        </h3>
                      </div>
                      {checkpoint.address && (
                        <p className="text-sm text-gray-600 mb-2">
                          <MapPin className="h-3 w-3 inline mr-1" />
                          {checkpoint.address}
                        </p>
                      )}
                      {checkpoint.metadata?.special_instructions && (
                        <p className="text-sm text-blue-700 bg-blue-50 p-2 rounded">
                          {checkpoint.metadata.special_instructions}
                        </p>
                      )}
                    </div>

                    {/* QR Code Section */}
                    {checkpoint.metadata?.qr_code && (
                      <div className="mb-4">
                        <div className="text-center">
                          <div className="mb-2">
                            <img
                              src={generateQRCodeURL(checkpoint.metadata.qr_code)}
                              alt={`QR Code for ${checkpoint.name}`}
                              className="mx-auto border border-gray-200"
                              width="150"
                              height="150"
                            />
                          </div>
                          <div className="text-xs font-mono text-gray-700 break-all">
                            {checkpoint.metadata.qr_code}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* NFC Tag Section */}
                    {checkpoint.metadata?.nfc_tag_id && (
                      <div className="mb-3">
                        <div className="bg-gray-100 p-3 rounded text-center">
                          <div className="text-sm font-semibold text-gray-700 mb-1">NFC Tag ID</div>
                          <div className="text-xs font-mono text-gray-600">
                            {checkpoint.metadata.nfc_tag_id}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Location Coordinates */}
                    {checkpoint.latitude && checkpoint.longitude && (
                      <div className="text-xs text-gray-500 mt-2">
                        <strong>Coordinates:</strong><br />
                        Lat: {checkpoint.latitude.toFixed(6)}<br />
                        Lng: {checkpoint.longitude.toFixed(6)}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-8 pt-4 border-t border-gray-300 text-center text-sm text-gray-600 print:mt-6">
                <p>This document contains security-sensitive information. Handle with care.</p>
                <p>For support, contact your system administrator.</p>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons - Hidden in print */}
        <div className="flex justify-end gap-3 mt-6 print:hidden">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
          <Button onClick={handlePrint} disabled={loading}>
            <Printer className="h-4 w-4 mr-2" />
            Print Route
          </Button>
        </div>
      </DialogContent>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 1cm;
          }
          
          body * {
            visibility: hidden;
          }
          
          [role="dialog"] * {
            visibility: visible;
          }
          
          [role="dialog"] {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: 100% !important;
            transform: none !important;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:block {
            display: block !important;
          }
          
          .break-inside-avoid {
            break-inside: avoid;
          }
        }
      `}</style>
    </Dialog>
  )
}