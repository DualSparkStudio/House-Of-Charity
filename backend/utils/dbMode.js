"use strict";

const supabaseClient = require("../config/supabase");
const { useMockDb } = require("../services/mockData");

const useSupabase = () =>
  process.env.USE_SUPABASE === "true" && Boolean(supabaseClient);

module.exports = {
  isMockDb: () => useMockDb(),
  useSupabase,
  supabaseClient,
};

