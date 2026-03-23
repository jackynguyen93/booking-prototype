'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { ToastContainer } from '@/components/ui/Toast';
import { mockOrganisations } from '@/data/organisations';
import { generateId, formatDateTime } from '@/lib/utils';
import { ParcelAlert } from '@/types';
import { Package, Bell } from 'lucide-react';

export default function AdminParcelsPage() {
  const { currentUser } = useAuth();
  const { parcelAlerts, addParcelAlert, addNotification } = useApp();
  const [form, setForm] = useState({ orgId: 'org2', description: '' });
  const [sending, setSending] = useState(false);

  if (!currentUser || currentUser.role !== 'ADMIN') return null;

  const getOrgName = (orgId: string) => mockOrganisations.find(o => o.id === orgId)?.name || orgId;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 600));

    const alert: ParcelAlert = {
      id: generateId(),
      orgId: form.orgId,
      description: form.description,
      sentAt: new Date().toISOString(),
      sentBy: currentUser.id,
    };
    addParcelAlert(alert);

    // Send notification to org users
    addNotification({
      id: generateId(),
      userId: form.orgId === 'org2' ? 'u2' : form.orgId === 'org3' ? 'u3' : 'u2',
      type: 'PARCEL_ALERT',
      title: `Parcel Received — ${getOrgName(form.orgId)}`,
      body: `A parcel has arrived at reception: ${form.description}. Please collect during opening hours.`,
      read: false,
      createdAt: new Date().toISOString(),
    });

    setSending(false);
    setForm(p => ({ ...p, description: '' }));
    toast(`Parcel alert sent to ${getOrgName(form.orgId)}`, 'success');
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]";

  return (
    <PortalLayout requireAdmin>
      <ToastContainer />
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parcel Alerts</h1>
          <p className="text-gray-500">Notify tenants when parcels arrive at reception</p>
        </div>

        {/* Send alert form */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Send Parcel Alert</h2>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organisation</label>
                <select value={form.orgId} onChange={e => setForm(p => ({ ...p, orgId: e.target.value }))} className={inputClass}>
                  {mockOrganisations.filter(o => o.id !== 'org1').map(o => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parcel Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="e.g. Medium box from Australia Post, Registered letter from ATO..."
                  className={inputClass}
                  required
                />
              </div>
              <Button type="submit" loading={sending}>
                <Bell className="h-4 w-4" />
                Send Alert
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* Recent alerts */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Recent Alerts</h2>
          </CardHeader>
          <CardBody>
            {parcelAlerts.length === 0 ? (
              <div className="text-center py-6">
                <Package className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No parcel alerts sent yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {parcelAlerts.map(alert => (
                  <div key={alert.id} className="flex gap-3 py-3 border-b border-gray-50 last:border-0">
                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                      <Package className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">{getOrgName(alert.orgId)}</p>
                      <p className="text-sm text-gray-500">{alert.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(alert.sentAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </PortalLayout>
  );
}
