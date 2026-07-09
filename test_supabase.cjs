const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://tbuyexfeehejbfyhpygg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRidXlleGZlZWhlamJmeWhweWdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyOTc0NDUsImV4cCI6MjA5ODg3MzQ0NX0.RBk_MBcqoyYiFdDZNhn7Vlbg7M3o0Ae4vMTwlTRLMto";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const defaultUsers = [
  { id: 'usr_1', name: 'Kasir Asy', username: 'asy.23.kk', password: 'kasir123!', role: 'CASHIER', created_at: new Date().toISOString(), is_active: true, is_approved: true },
  { id: 'usr_2', name: 'Superadmin BA', username: 'superadmin.23kk', password: 'admin123!', role: 'ADMIN', created_at: new Date().toISOString(), is_active: true, is_approved: true },
  { id: 'usr_3', name: 'Owner BA', username: 'owner.23kk', password: 'owner123!', role: 'OWNER', created_at: new Date().toISOString(), is_active: true, is_approved: true }
];

async function seedDefaultUsers() {
  console.log("Seeding default users to Supabase...");
  const { data, error } = await supabase.from('ksa_users').upsert(defaultUsers);

  if (error) {
    console.error("Error seeding users:", error);
  } else {
    console.log("Successfully seeded default users.");
  }
}

seedDefaultUsers();
