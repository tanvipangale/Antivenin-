import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import RegistrationTimeline from '../components/Registrationtimeline';
import { COMMON_ANTIVENOMS } from '../data/AntivenomTypes';

export default function Dashboard() {
  const { user, logout } = useAuth();

  const [facility, setFacility] = useState(null);
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newType, setNewType] = useState({ name: '', quantity: '' });

  const loadData = useCallback(async () => {
    const { data: facilityRow, error: facilityError } = await supabase
      .from('healthcare_facilities')
      .select('*')
      .eq('claimed_by', user.id)
      .maybeSingle();

    if (facilityError) {
      console.error('[Antivenin] Failed to load facility:', facilityError);
    }
    setFacility(facilityRow || null);

    if (facilityRow) {
      const { data: stockRows, error: stockError } = await supabase
        .from('hospital_stock')
        .select('*')
        .eq('facility_id', facilityRow.id);

      if (stockError) {
        console.error('[Antivenin] Failed to load stock:', stockError);
      }
      setStock(stockRows || []);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadData().finally(() => setLoading(false));
  }, [user, loadData]);

  async function refresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  async function updateQuantity(id, quantity) {
    const q = Math.max(0, Number(quantity) || 0);

    const { error } = await supabase
      .from('hospital_stock')
      .update({ quantity: q, updated_at: new Date().toISOString(), updated_by: user.id })
      .eq('id', id);

    if (error) {
      console.error('[Antivenin] Failed to update stock:', error);
      return;
    }

    setStock((prev) => prev.map((item) => (item.id === id ? { ...item, quantity: q } : item)));
  }

  async function adjust(id, delta) {
    const item = stock.find((s) => s.id === id);
    if (!item) return;
    await updateQuantity(id, item.quantity + delta);
  }

  async function addType(e) {
    e.preventDefault();
    if (!newType.name.trim() || !facility) return;

    const { data, error } = await supabase
      .from('hospital_stock')
      .insert({
        facility_id: facility.id,
        name: newType.name.trim(),
        quantity: Math.max(0, Number(newType.quantity) || 0),
        updated_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('[Antivenin] Failed to add stock type:', error);
      return;
    }

    setStock((prev) => [...prev, data]);
    setNewType({ name: '', quantity: '' });
  }

  if (loading) {
    return <p className="mx-auto max-w-3xl px-6 py-16 text-center text-ink/60">Loading…</p>;
  }

  // Account exists but hasn't been linked to a hospital record yet — an
  // admin needs to set healthcare_facilities.claimed_by for this user.
  if (!facility) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 pb-32">
        <h1 className="mb-2 text-3xl text-ink">Application pending</h1>
        <p className="mb-8 text-ink/70">Here's where things stand.</p>
        <RegistrationTimeline activeIndex={1} />
        <button onClick={logout} className="mt-8 text-sm font-semibold text-clay hover:underline">
          Log out
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 pb-24">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-ink">{facility.name}</h1>
          <p className="text-ink/60">Manage your antivenom stock</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={refresh}
            disabled={refreshing}
            className="text-sm font-semibold text-olive hover:underline disabled:opacity-50"
          >
            {refreshing ? 'Refreshing…' : '↻ Refresh'}
          </button>
          <button onClick={logout} className="text-sm font-semibold text-clay hover:underline">
            Log out
          </button>
        </div>
      </div>

      <div className="mb-8 space-y-4">
        {stock.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-4 rounded-[14px] border border-ink/10 bg-surface p-5"
          >
            <div>
              <p className={`font-semibold ${item.quantity > 0 ? 'text-olive' : 'text-clay'}`}>{item.name}</p>
              <p className="text-xs text-ink/50">Updated {new Date(item.updated_at).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => adjust(item.id, -1)}
                className="h-8 w-8 rounded-full bg-cream text-ink hover:bg-ink/10"
              >
                −
              </button>
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => updateQuantity(item.id, e.target.value)}
                className="w-16 rounded-lg border border-ink/20 bg-cream px-2 py-1 text-center"
              />
              <button
                onClick={() => adjust(item.id, 1)}
                className="h-8 w-8 rounded-full bg-cream text-ink hover:bg-ink/10"
              >
                +
              </button>
            </div>
          </div>
        ))}

        {stock.length === 0 && (
          <p className="rounded-[14px] border border-ink/10 bg-surface p-5 text-center text-sm text-ink/60">
            No antivenom types added yet — add your first one below.
          </p>
        )}
      </div>

      <form onSubmit={addType} className="rounded-[14px] border border-ink/10 bg-surface p-6">
        <h2 className="mb-4 text-lg font-semibold text-ink">Add a new antivenom type</h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            list="antivenom-types"
            placeholder="Antivenom name — pick a suggestion or type your own"
            value={newType.name}
            onChange={(e) => setNewType((f) => ({ ...f, name: e.target.value }))}
            className="flex-1 rounded-lg border border-ink/20 bg-cream px-4 py-2.5 outline-none focus:border-select"
          />
          <datalist id="antivenom-types">
            {COMMON_ANTIVENOMS.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          <input
            type="number"
            placeholder="Starting quantity"
            value={newType.quantity}
            onChange={(e) => setNewType((f) => ({ ...f, quantity: e.target.value }))}
            className="w-full rounded-lg border border-ink/20 bg-cream px-4 py-2.5 outline-none focus:border-select sm:w-40"
          />
          <button
            type="submit"
            className="btn-press rounded-full bg-olive px-6 py-2.5 font-semibold text-cream hover:bg-olive-dark"
          >
            Add
          </button>
        </div>
      </form>
    </div>
  );
}