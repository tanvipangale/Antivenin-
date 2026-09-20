import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { searchHospitals } from '../utils/hospitalDatabase';
import RegistrationTimeline from '../components/Registrationtimeline';

export default function Register() {
  const [hospitalSearch, setHospitalSearch] = useState('');
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();

  async function handleHospitalSearch(value) {
    setHospitalSearch(value);
    setSelectedHospital(null);

    if (value.trim().length < 2) {
      setHospitals([]);
      return;
    }

    try {
      const results = await searchHospitals(value);
      setHospitals(results);
    } catch {
      setError('Could not search hospitals.');
    }
  }

  function selectHospital(hospital) {
    setSelectedHospital(hospital);
    setHospitalSearch(hospital.name);
    setHospitals([]);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (!selectedHospital) {
      setError('Please select your hospital from the list.');
      return;
    }

    if (!email || !password || !phone) {
      setError('Please complete all fields.');
      return;
    }

    setLoading(true);

    try {
      const { data, error: authError } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              hospital_id: selectedHospital.id,
              hospital_name: selectedHospital.name,
              phone,
            },
            emailRedirectTo: `${window.location.origin}/login`,
          },
        });

      if (authError) {
        throw authError;
      }

      if (!data.user) {
        throw new Error('Account could not be created.');
      }

      const { error: applicationError } =
        await supabase
          .from('staff_applications')
          .insert({
            user_id: data.user.id,
            hospital_id: selectedHospital.id,
            hospital_name: selectedHospital.name,
            address: selectedHospital.address,
            email,
            phone,
            status: 'pending',
            verification_method: 'automatic',
          });

      if (applicationError) {
        console.error('[Antivenin DEBUG] staff_applications insert failed:', JSON.stringify(applicationError, null, 2));
        throw new Error('Account created, but saving your application failed.');
      }

      setSuccess('Registration successful! Your application is now being verified.');

    } catch (err) {
      console.error(err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 pb-24">
        <h1 className="mb-2 text-3xl text-ink">Application submitted</h1>
        <p className="mb-8 text-ink/70">
          Here's exactly what happens next for {selectedHospital?.name}.
        </p>
        <RegistrationTimeline activeIndex={1} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16 pb-24">
      <h1 className="mb-2 text-3xl text-ink">Register your hospital</h1>
      <p className="mb-8 text-ink/70">Register as hospital staff to manage antivenom stock.</p>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-[14px] bg-surface p-8 border border-ink/10">
        <div className="relative">
          <label className="mb-1 block text-sm font-semibold">Hospital</label>
          <input
            value={hospitalSearch}
            onChange={(e) => handleHospitalSearch(e.target.value)}
            placeholder="Search your hospital..."
            className="w-full rounded-lg border border-ink/20 bg-cream px-4 py-2.5"
          />
          {hospitals.length > 0 && (
            <div className="absolute z-50 mt-1 w-full rounded-lg border bg-white shadow-lg">
              {hospitals.map((hospital) => (
                <button
                  type="button"
                  key={hospital.id}
                  onClick={() => selectHospital(hospital)}
                  className="block w-full border-b px-4 py-3 text-left hover:bg-gray-50"
                >
                  <div className="font-semibold">{hospital.name}</div>
                  <div className="text-xs text-gray-500">
                    {hospital.district || ''}
                    {hospital.state ? `, ${hospital.state}` : ''}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedHospital && (
          <div className="rounded-lg bg-olive/10 p-3 text-sm">
            <strong>Selected hospital</strong>
            <p>{selectedHospital.name}</p>
            <p className="text-xs text-gray-500">{selectedHospital.address}</p>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-semibold">Staff work email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="staff@hospital.com"
            className="w-full rounded-lg border border-ink/20 bg-cream px-4 py-2.5"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold">Staff phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="w-full rounded-lg border border-ink/20 bg-cream px-4 py-2.5"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-lg border border-ink/20 bg-cream px-4 py-2.5"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && (
          <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{success}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-olive py-3 font-semibold text-cream disabled:opacity-50"
        >
          {loading ? 'Creating account...' : 'Register'}
        </button>
      </form>
    </div>
  );
}