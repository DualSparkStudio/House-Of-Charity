"use strict";

const path = require("path");
const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

const shouldLoadLocalEnv = !process.env.VERCEL && !process.env.CI;
const envPath = path.resolve(__dirname, "../config.env");
if (shouldLoadLocalEnv && fs.existsSync(envPath)) {
  require("dotenv").config({ path: envPath });
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabaseClient = null;

if (process.env.USE_SUPABASE === "true") {
  if (!supabaseUrl || !supabaseKey) {
    console.warn(
      "[Supabase] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/ANON_KEY. Supabase integration disabled."
    );
  } else {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
    });
  }
}

module.exports = supabaseClient;

