'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Printer, X, Download, Share } from 'lucide-react'
import { useAuth } from '@/lib/auth/hooks'

interface IncidentReport {
  id: string
  guard_id: string
  organization_id: string
  patrol_id?: string
  incident_type: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'reported' | 'investigating' | 'resolved' | 'closed'
  incident_date: string
  location_latitude?: number
  location_longitude?: number
  location_address?: string
  photos: any[]
  actions_taken?: string
  follow_up_required: boolean
  follow_up_notes?: string
  resolved_by?: string
  resolved_at?: string
  created_at: string
  guard: {
    first_name: string
    last_name: string
    email: string
  }
  location?: {
    name: string
    address?: string
  }
}

interface IncidentReportPrintModalProps {
  report: IncidentReport
  isOpen: boolean
  onClose: () => void
}

export function IncidentReportPrintModal({ report, isOpen, onClose }: IncidentReportPrintModalProps) {
  const { user } = useAuth()

  const handlePrint = () => {
    const printContent = document.getElementById('incident-report-print-content')
    if (printContent) {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Incident Report - ${report.title}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.4; }
              .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
              .header h1 { margin: 0; color: #333; }
              .header .company { color: #666; font-size: 14px; }
              .section { margin-bottom: 20px; }
              .section h3 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
              .field { margin-bottom: 10px; }
              .field-label { font-weight: bold; color: #555; }
              .badges { margin: 10px 0; }
              .badge { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 12px; margin-right: 5px; }
              .badge-critical { background: #dc2626; color: white; }
              .badge-high { background: #ef4444; color: white; }
              .badge-medium { background: #f59e0b; color: white; }
              .badge-low { background: #10b981; color: white; }
              .badge-reported { background: #dc2626; color: white; }
              .badge-investigating { background: #6b7280; color: white; }
              .badge-resolved { background: #10b981; color: white; }
              .badge-closed { background: #9ca3af; color: white; }
              .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
              .location-box { background: #f8fafc; padding: 15px; border-radius: 5px; margin: 10px 0; }
              .photos-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 10px 0; }
              .photo-placeholder { background: #f3f4f6; border: 1px dashed #d1d5db; height: 100px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #6b7280; }
              .footer { margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px; font-size: 12px; color: #666; }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
        printWindow.close()
      }
    }
  }

  const getIncidentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'security_breach': 'Security Breach',
      'medical_emergency': 'Medical Emergency',
      'fire_hazard': 'Fire Hazard',
      'suspicious_activity': 'Suspicious Activity',
      'property_damage': 'Property Damage',
      'other': 'Other'
    }
    return types[type] || type
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Print Incident Report
            </DialogTitle>
            <div className="flex gap-2">
              <Button onClick={handlePrint} size="sm">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div id="incident-report-print-content" className="space-y-6">
          {/* Header */}
          <div className="header">
            <h1>SECURITY INCIDENT REPORT</h1>
            <div className="company">WorkforceOne Security Management System</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              Report ID: {report.id} | Generated: {new Date().toLocaleString()}
            </div>
          </div>

          {/* Status and Classification */}
          <div className="section">
            <h3>Classification</h3>
            <div className="badges">
              <span className={`badge badge-${report.status}`}>
                {report.status.toUpperCase()}
              </span>
              <span className={`badge badge-${report.severity}`}>
                {report.severity.toUpperCase()} SEVERITY
              </span>
              <span className="badge" style={{ background: '#374151', color: 'white' }}>
                {getIncidentTypeLabel(report.incident_type)}
              </span>
            </div>
          </div>

          {/* Incident Details */}
          <div className="section">
            <h3>Incident Information</h3>
            <div className="field">
              <div className="field-label">Title:</div>
              <div>{report.title}</div>
            </div>
            <div className="field">
              <div className="field-label">Description:</div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{report.description}</div>
            </div>
            <div className="grid">
              <div>
                <div className="field">
                  <div className="field-label">Incident Date & Time:</div>
                  <div>{new Date(report.incident_date).toLocaleString()}</div>
                </div>
                <div className="field">
                  <div className="field-label">Report Submitted:</div>
                  <div>{new Date(report.created_at).toLocaleString()}</div>
                </div>
              </div>
              <div>
                <div className="field">
                  <div className="field-label">Reporting Guard:</div>
                  <div>{report.guard.first_name} {report.guard.last_name}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>{report.guard.email}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Location Information */}
          {(report.location_latitude || report.location || report.location_address) && (
            <div className="section">
              <h3>Location</h3>
              <div className="location-box">
                {report.location && (
                  <div className="field">
                    <div className="field-label">Nearest Checkpoint:</div>
                    <div>{report.location.name}</div>
                    {report.location.address && (
                      <div style={{ fontSize: '12px', color: '#666' }}>{report.location.address}</div>
                    )}
                  </div>
                )}
                {report.location_address && (
                  <div className="field">
                    <div className="field-label">Location Address:</div>
                    <div>{report.location_address}</div>
                  </div>
                )}
                {report.location_latitude && report.location_longitude && (
                  <div className="field">
                    <div className="field-label">GPS Coordinates:</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                      {report.location_latitude.toFixed(6)}, {report.location_longitude.toFixed(6)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Photos */}
          {report.photos && report.photos.length > 0 && (
            <div className="section">
              <h3>Evidence Photos ({report.photos.length})</h3>
              <div className="photos-grid">
                {report.photos.slice(0, 6).map((photo: any, index: number) => (
                  <div key={index} className="photo-placeholder">
                    {photo.uri ? (
                      <img 
                        src={photo.uri} 
                        alt={`Evidence ${index + 1}`}
                        style={{ width: '100%', height: '100px', objectFit: 'cover' }}
                      />
                    ) : (
                      `Photo ${index + 1}`
                    )}
                  </div>
                ))}
              </div>
              {report.photos.length > 6 && (
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  + {report.photos.length - 6} additional photo(s) available digitally
                </div>
              )}
            </div>
          )}

          {/* Actions Taken */}
          {report.actions_taken && (
            <div className="section">
              <h3>Actions Taken</h3>
              <div style={{ whiteSpace: 'pre-wrap', background: '#f0fdf4', padding: '15px', borderRadius: '5px' }}>
                {report.actions_taken}
              </div>
            </div>
          )}

          {/* Follow-up */}
          {(report.follow_up_required || report.follow_up_notes) && (
            <div className="section">
              <h3>Follow-up Requirements</h3>
              <div className="field">
                <div className="field-label">Follow-up Required:</div>
                <div>{report.follow_up_required ? 'YES' : 'NO'}</div>
              </div>
              {report.follow_up_notes && (
                <div className="field">
                  <div className="field-label">Follow-up Notes:</div>
                  <div style={{ whiteSpace: 'pre-wrap', background: '#fffbeb', padding: '15px', borderRadius: '5px' }}>
                    {report.follow_up_notes}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Resolution */}
          {(report.status === 'resolved' || report.status === 'closed') && report.resolved_at && (
            <div className="section">
              <h3>Resolution</h3>
              <div className="field">
                <div className="field-label">Resolved Date:</div>
                <div>{new Date(report.resolved_at).toLocaleString()}</div>
              </div>
              <div className="field">
                <div className="field-label">Final Status:</div>
                <div>{report.status.toUpperCase()}</div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="footer">
            <div>This report was generated electronically by WorkforceOne Security Management System.</div>
            <div>Generated by: {user?.first_name} {user?.last_name} on {new Date().toLocaleString()}</div>
            <div>Report ID: {report.id}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}