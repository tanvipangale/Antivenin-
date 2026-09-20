import { supabase } from '../lib/supabase';

export async function searchHospitals(search) {
  if (!search || search.trim().length < 2) {
    return [];
  }

  const { data, error } = await supabase
    .from('healthcare_facilities')
    .select(
      'id, name, address, state, district, phone, email'
    )
    .ilike('name', `%${search.trim()}%`)
    .limit(10);

  if (error) {
    console.error('Hospital search error:', error);
    throw error;
  }

  return data || [];
}