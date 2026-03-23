'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { ToastContainer } from '@/components/ui/Toast';
import { mockRooms } from '@/data/rooms';
import { mockOrganisations } from '@/data/organisations';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ExternalLink, Monitor, RefreshCw, MessageSquare, X, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

const TODAY = new Date().toISOString().split('T')[0];

type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
type Duration = '1' | '2';

interface DisplayRequest {
  id: string;
  orgName: string;
  startDate: string;
  duration: Duration;
  title: string;
  description: string;
  status: RequestStatus;
  submittedAt: string;
}

const MOCK_REQUESTS: DisplayRequest[] = [
  {
    id: 'wr-pending-1',
    orgName: 'TechStart Community',
    startDate: '2026-04-27',
    duration: '1',
    title: 'National Volunteer Week Celebration',
    description: 'Celebrating our amazing volunteers with a display honouring their contributions.',
    status: 'PENDING',
    submittedAt: '2026-03-18T14:00:00Z',
  },
  {
    id: 'wr-pending-2',
    orgName: 'Green Space Initiative',
    startDate: '2026-05-11',
    duration: '2',
    title: 'Mental Health Awareness Month',
    description: 'Promoting mental health resources and awareness in the community during May.',
    status: 'PENDING',
    submittedAt: '2026-03-20T10:30:00Z',
  },
  {
    id: 'wr-approved-1',
    orgName: 'Green Space Initiative',
    startDate: '2026-02-23',
    duration: '2',
    title: "Women's Health Awareness Month",
    description: "Display raising awareness for women's health services available in Melbourne.",
    status: 'APPROVED',
    submittedAt: '2026-02-10T09:30:00Z',
  },
];

const statusVariant: Record<RequestStatus, 'warning' | 'success' | 'danger'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
};

function formatDisplayDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function FoyerScreenAdminPage() {
  const { currentUser } = useAuth();
  const { bookings } = useApp();
  const [customMessage, setCustomMessage] = useState('');
  const [publishedMessage, setPublishedMessage] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [displayRequests, setDisplayRequests] = useState<DisplayRequest[]>(MOCK_REQUESTS);
  const [reviewRequest, setReviewRequest] = useState<DisplayRequest | null>(null);

  if (!currentUser || currentUser.role !== 'ADMIN') return null;

  const todayBookings = bookings.filter(b => b.date === TODAY && b.status === 'CONFIRMED');
  const meetingRooms = mockRooms.filter(r => !r.adminManaged && r.type !== 'CAR_PARK' && r.type !== 'PHONE_BOOTH');
  const getOrgName = (orgId: string) => mockOrganisations.find(o => o.id === orgId)?.name || orgId;

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
    toast('Foyer screen data refreshed', 'success');
  };

  const handlePublishMessage = async () => {
    if (!customMessage.trim()) {
      toast('Please enter a message to publish', 'error');
      return;
    }
    setPublishing(true);
    await new Promise(r => setTimeout(r, 700));
    setPublishedMessage(customMessage);
    setPublishing(false);
    toast('Custom message published to foyer screen', 'success');
  };

  const handleClearMessage = () => {
    setPublishedMessage('');
    setCustomMessage('');
    toast('Custom message cleared from foyer screen', 'info');
  };

  const handleApprove = (id: string) => {
    setDisplayRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'APPROVED' as const } : r));
    setReviewRequest(null);
    toast('Display request approved', 'success');
  };

  const handleReject = (id: string) => {
    setDisplayRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'REJECTED' as const } : r));
    setReviewRequest(null);
    toast('Display request rejected', 'success');
  };

  const pendingCount = displayRequests.filter(r => r.status === 'PENDING').length;

  return (
    <PortalLayout requireAdmin>
      <ToastContainer />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Foyer Screen Management</h1>
            <p className="text-gray-500">Preview and control the foyer TV display</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" /> Refresh Preview
            </Button>
            <Link href="/foyer-screen" target="_blank">
              <Button>
                <ExternalLink className="h-4 w-4" />
                Open Full Screen
              </Button>
            </Link>
          </div>
        </div>

        {/* Custom Message Override */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-[#1e3a5f]" />
              <h2 className="font-semibold text-gray-900">Custom Message Override</h2>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            {publishedMessage && (
              <div className="flex items-start justify-between bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div>
                  <p className="text-xs font-medium text-amber-700 mb-1">Currently displayed on foyer screen:</p>
                  <p className="text-sm text-amber-800">{publishedMessage}</p>
                </div>
                <button onClick={handleClearMessage} className="ml-3 text-amber-600 hover:text-amber-800">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                rows={3}
                placeholder="e.g. Welcome to the Ross House AGM! Lifts are out of service — please use stairwell B."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
              />
              <p className="text-xs text-gray-400 mt-1">This message will be displayed prominently on the foyer screen below today&apos;s schedule.</p>
            </div>
            <div className="flex gap-3">
              <Button loading={publishing} onClick={handlePublishMessage}>
                <MessageSquare className="h-4 w-4" />
                Publish Message
              </Button>
              {publishedMessage && (
                <Button variant="secondary" onClick={handleClearMessage}>
                  Clear Message
                </Button>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Foyer Screen Preview */}
        <div>
          <h2 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Live Preview — Today&apos;s Schedule ({format(new Date(), 'EEEE d MMMM yyyy')})
          </h2>
          <div className="bg-[#1e3a5f] rounded-xl p-6 text-white" key={refreshKey}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">Ross House Association</h2>
                <p className="text-blue-300 text-sm">Today&apos;s Room Schedule — {format(new Date(), 'EEEE d MMMM yyyy')}</p>
              </div>
              <Monitor className="h-8 w-8 text-blue-300" />
            </div>

            {publishedMessage && (
              <div className="mb-5 bg-amber-400/20 border border-amber-400/40 rounded-lg px-4 py-3">
                <p className="text-amber-200 text-sm font-medium">📢 {publishedMessage}</p>
              </div>
            )}

            <div className="grid gap-4">
              {meetingRooms.map(room => {
                const roomBookings = todayBookings
                  .filter(b => b.roomId === room.id)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime));
                return (
                  <div key={room.id} className="bg-white/10 rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-2">{room.name}</h3>
                    {roomBookings.length === 0 ? (
                      <p className="text-blue-200 text-sm">Available all day</p>
                    ) : (
                      <div className="space-y-2">
                        {roomBookings.map(b => (
                          <div key={b.id} className="flex items-center gap-3 bg-white/10 rounded-md px-3 py-2">
                            <span className="font-mono text-sm text-blue-200">{b.startTime} – {b.endTime}</span>
                            <span className="text-sm">{getOrgName(b.orgId)}</span>
                            <span className="ml-auto bg-green-500/20 text-green-300 text-xs px-2 py-0.5 rounded">Booked</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-400 text-center">
          The full-screen version auto-updates every 30 seconds and is designed for display on a large TV screen.
          Use &quot;Open Full Screen&quot; to launch it on the foyer display.
        </p>

        {/* Display Requests */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-700">
              Window Display Requests
              {pendingCount > 0 && (
                <span className="ml-2 bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {pendingCount} pending
                </span>
              )}
            </h2>
          </div>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Organisation</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Start Date</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Duration</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayRequests.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No display requests</td></tr>
                  ) : displayRequests.map(req => (
                    <tr key={req.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{req.title}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[200px]">{req.description}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{req.orgName}</td>
                      <td className="px-6 py-4 text-gray-500">{formatDisplayDate(req.startDate)}</td>
                      <td className="px-6 py-4 text-gray-500">{req.duration} week{req.duration === '2' ? 's' : ''}</td>
                      <td className="px-6 py-4">
                        <Badge variant={statusVariant[req.status]}>
                          {req.status === 'PENDING' ? 'Pending Review' : req.status.charAt(0) + req.status.slice(1).toLowerCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {req.status === 'PENDING' && (
                          <Button variant="outline" size="sm" onClick={() => setReviewRequest(req)}>
                            Review
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      <Modal isOpen={!!reviewRequest} onClose={() => setReviewRequest(null)} title="Review Display Request" size="md">
        {reviewRequest && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p className="font-semibold text-gray-900">{reviewRequest.title}</p>
              <p className="text-sm text-gray-600">{reviewRequest.description}</p>
              <div className="text-xs text-gray-500 space-y-0.5 pt-1">
                <p><span className="font-medium">Organisation:</span> {reviewRequest.orgName}</p>
                <p><span className="font-medium">Requested start:</span> {formatDisplayDate(reviewRequest.startDate)}</p>
                <p><span className="font-medium">Duration:</span> {reviewRequest.duration} week{reviewRequest.duration === '2' ? 's' : ''}</p>
                <p><span className="font-medium">Submitted:</span> {formatDisplayDate(reviewRequest.submittedAt)}</p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" onClick={() => setReviewRequest(null)} className="flex-1">Cancel</Button>
              <Button
                onClick={() => handleReject(reviewRequest.id)}
                className="flex-1 bg-red-600 hover:bg-red-700 border-red-600"
              >
                <XCircle className="h-4 w-4" /> Reject
              </Button>
              <Button onClick={() => handleApprove(reviewRequest.id)} className="flex-1">
                <CheckCircle className="h-4 w-4" /> Approve
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PortalLayout>
  );
}
