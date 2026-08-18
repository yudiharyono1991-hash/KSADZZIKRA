const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://tbuyexfeehejbfyhpygg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRidXlleGZlZWhlamJmeWhweWdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyOTc0NDUsImV4cCI6MjA5ODg3MzQ0NX0.RBk_MBcqoyYiFdDZNhn7Vlbg7M3o0Ae4vMTwlTRLMto";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkProducts() {
  console.log("Fetching products from Supabase...");
  const { data, error } = await supabase.from('products').select('*');

  if (error) {
    console.error("Error fetching products:", error);
  } else {
    console.log(`Found ${data ? data.length : 0} products.`);
    if (data && data.length > 0) {
      console.log(data[0]);
    }
  }
}

checkProducts();
