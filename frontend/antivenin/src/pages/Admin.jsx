import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const TABS = ['pending', 'approved', 'rejected'];

export default function Admin() {
  const [tab, setTab] = useState('pending');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError('');

    const { data, error: fetchError } = await supabase
      .from('staff_applications')
      .select('*')
      .eq('status', tab)
      .order('id', { ascending: false });

    if (fetchError) {
      console.error('[Admin] Failed to load applications:', fetchError);
      setError('Could not load applications.');
    }
    setApplications(data || []);
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  async function approve(application) {
    setBusyId(application.id);
    setError('');

    // Link this user to the hospital's facility row so Dashboard.jsx
    // recognizes them and hospital_stock RLS lets them write to it.
    const { error: claimError } = await supabase
      .from('healthcare_facilities')
      .update({ claimed_by: application.user_id })
      .eq('id', application.hospital_id);

    if (claimError) {
      console.error('[Admin] Failed to claim facility:', claimError);
      setError('Could not link this user to the hospital. Check if it is already claimed.');
      setBusyId(null);
      return;
    }

    const { error: statusError } = await supabase
      .from('staff_applications')
      .update({ status: 'approved' })
      .eq('id', application.id);

    if (statusError) {
      console.error('[Admin] Failed to update application status:', statusError);
      setError('Facility was linked, but updating the application status failed.');
      setBusyId(null);
      return;
    }

    setApplications((prev) => prev.filter((a) => a.id !== application.id));
    setBusyId(null);
  }

  async function reject(application) {
    setBusyId(application.id);
    setError('');

    const { error: statusError } = await supabase
      .from('staff_applications')
      .update({ status: 'rejected' })
      .eq('id', application.id);

    if (statusError) {
      console.error('[Admin] Failed to reject application:', statusError);
      setError('Could not reject this application.');
      setBusyId(null);
      return;
    }

    setApplications((prev) => prev.filter((a) => a.id !== application.id));
    setBusyId(null);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 pb-24">
      <h1 className="mb-2 text-3xl text-ink">Staff applications</h1>
      <p className="mb-8 text-ink/60">Review who gets to update hospital stock.</p>

      <div className="mb-6 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${
              tab === t ? 'bg-olive text-cream' : 'bg-cream text-ink/70 hover:bg-ink/10'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-ink/60">Loading…</p>
      ) : applications.length === 0 ? (
        <p className="rounded-[14px] border border-ink/10 bg-surface p-5 text-center text-sm text-ink/60">
          No {tab} applications.
        </p>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <div key={application.id} className="rounded-[14px] border border-ink/10 bg-surface p-5">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-ink">{application.hospital_name}</p>
                  <p className="text-sm text-ink/60">{application.address}</p>
                </div>
              </div>

              <div className="mb-4 grid grid-cols-1 gap-1 text-sm text-ink/80 sm:grid-cols-2">
                <p><span className="font-semibold">Email:</span> {application.email}</p>
                <p><span className="font-semibold">Phone:</span> {application.phone}</p>
              </div>

              {tab === 'pending' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => approve(application)}
                    disabled={busyId === application.id}
                    className="rounded-full bg-olive px-5 py-2 text-sm font-semibold text-cream disabled:opacity-50"
                  >
                    {busyId === application.id ? 'Approving…' : 'Approve'}
                  </button>
                  <button
                    onClick={() => reject(application)}
                    disabled={busyId === application.id}
                    className="rounded-full bg-clay px-5 py-2 text-sm font-semibold text-cream disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}