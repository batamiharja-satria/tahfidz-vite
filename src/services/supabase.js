import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,

    // ✅ biar login tetap bisa dibaca dari URL callback,
    // tapi setelah itu hash-nya bisa dibersihkan manual di halaman redirect
    detectSessionInUrl: true,

    // ✅ tetap gunakan storage custom-mu (tidak diubah)
    storage: {
      getItem: (key) => {
        try {
          return localStorage.getItem(key);
        } catch (error) {
          console.error("Error getting item from storage:", error);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.error("Error setting item to storage:", error);
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error("Error removing item from storage:", error);
        }
      },
    },

    // ⚡️ Tambahan aman: arahkan redirect langsung ke halaman utama
    // (ubah ke '/app2' kalau mau langsung ke sana)
    flowType: "implicit", // tetap default Supabase OAuth
  },
});