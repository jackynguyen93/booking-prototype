'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';
import { generateId } from '@/lib/utils';
import { User, Organisation } from '@/types';
import { CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const { addUser, addOrganisation } = useApp() as any;
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    orgName: '',
    orgType: 'NON_PROFIT',
    description: '',
    services: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.orgName) errs.orgName = 'Organisation name is required';
    if (!form.contactName) errs.contactName = 'Contact name is required';
    if (!form.contactEmail) errs.contactEmail = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.contactEmail)) errs.contactEmail = 'Invalid email';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!form.address) errs.address = 'Address is required';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    await new Promise(r => setTimeout(r, 600));

    const orgId = `org_${generateId()}`;
    const userId = `u_${generateId()}`;

    const newOrg: Organisation = {
      id: orgId,
      name: form.orgName,
      type: form.orgType as any,
      contactEmail: form.contactEmail,
      contactPhone: form.contactPhone,
      address: form.address,
      description: form.description,
      services: form.services,
      openingHours: 'Mon-Fri: 9am-5pm',
      publicListing: false,
      representatives: [{ name: form.contactName, role: 'Contact', email: form.contactEmail }],
      activeUsers: 0,
      createdAt: new Date().toISOString(),
    };

    const newUser: User = {
      id: userId,
      email: form.contactEmail,
      password: form.password,
      name: form.contactName,
      role: 'MEMBER_TENANT',
      status: 'PENDING',
      orgId,
      phone: form.contactPhone,
      createdAt: new Date().toISOString(),
      avatarInitials: form.contactName.substring(0, 2).toUpperCase(),
    };

    // Add to context (organisations doesn't have addOrganisation but we update via updateOrganisation)
    // We'll add user and the org separately
    if (typeof addOrganisation === 'function') addOrganisation(newOrg);
    addUser(newUser);

    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Submitted</h2>
          <p className="text-gray-500 mb-6">
            Your organisation registration has been received. The Ross House team will review your application and be in touch within 2–3 business days.
          </p>
          <Link href="/login">
            <Button className="w-full">Return to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  const field = (name: keyof typeof form, label: string, type = 'text', required = false) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        value={form[name]}
        onChange={e => { setForm(prev => ({ ...prev, [name]: e.target.value })); setErrors(prev => ({ ...prev, [name]: '' })); }}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
      />
      {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <div className="w-12 h-12 bg-[#1e3a5f] rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">RH</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Register Your Organisation</h1>
          <p className="text-gray-500 mt-1">Apply to join the Ross House community</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">Organisation Details</h3>
              <div className="space-y-4">
                {field('orgName', 'Organisation Name', 'text', true)}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organisation Type</label>
                  <select
                    value={form.orgType}
                    onChange={e => setForm(prev => ({ ...prev, orgType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                  >
                    <option value="NON_PROFIT">Non-Profit / Charity</option>
                    <option value="COMMUNITY">Community Organisation</option>
                    <option value="GOVERNMENT">Government / Council</option>
                    <option value="COMMERCIAL">Commercial Business</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                    placeholder="Brief description of your organisation..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Services / Programs</label>
                  <input
                    type="text"
                    value={form.services}
                    onChange={e => setForm(prev => ({ ...prev, services: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                    placeholder="e.g. Community support, advocacy, workshops"
                  />
                </div>
                {field('address', 'Organisation Address', 'text', true)}
              </div>
            </div>

            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">Primary Contact</h3>
              <div className="space-y-4">
                {field('contactName', 'Full Name', 'text', true)}
                {field('contactEmail', 'Email Address', 'email', true)}
                {field('contactPhone', 'Phone Number', 'tel')}
              </div>
            </div>

            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">Account Password</h3>
              <div className="space-y-4">
                {field('password', 'Password', 'password', true)}
                {field('confirmPassword', 'Confirm Password', 'password', true)}
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" loading={loading} className="w-full" size="lg">
                Submit Registration
              </Button>
              <p className="text-center text-sm text-gray-500 mt-3">
                Already registered?{' '}
                <Link href="/login" className="text-[#1e3a5f] hover:underline">Sign in</Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
