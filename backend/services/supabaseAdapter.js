"use strict";

const supabase = require("../config/supabase");

if (!supabase) {
  throw new Error(
    "Supabase client not initialised. Ensure USE_SUPABASE=true and credentials are configured."
  );
}

(async () => {
  try {
    const { data, error } = await supabase
      .from("donors")
      .select("id")
      .limit(1);

    if (error) throw error;
    console.log("✅ Supabase connection verified.");
  } catch (err) {
    console.error("❌ Supabase connection failed:", err.message || err);
  }
})();

const donorColumns = [
  "id",
  "name",
  "email",
  "password_hash",
  "phone_number",
  "address",
  "city",
  "state",
  "country",
  "pincode",
  "description",
  "website",
  "logo_url",
  "verified",
  "connected_ngos",
  "created_at",
  "updated_at",
];

const donorSelectColumns = donorColumns.join(", ");

const ngoColumns = [
  "id",
  "name",
  "email",
  "password_hash",
  "phone_number",
  "address",
  "city",
  "state",
  "country",
  "pincode",
  "works_done",
  "awards_received",
  "about",
  "gallery",
  "current_requirements",
  "future_plans",
  "awards_and_recognition",
  "recent_activities",
  "description",
  "website",
  "logo_url",
  "verified",
  "connected_donors",
  "created_at",
  "updated_at",
];

const ngoSelectColumns = ngoColumns.join(", ");

const defaultUserFields = {
  city: null,
  state: null,
  country: null,
  pincode: null,
  description: null,
  website: null,
  logo_url: null,
  works_done: null,
  awards_received: null,
  about: null,
  gallery: null,
  current_requirements: null,
  future_plans: null,
  awards_and_recognition: null,
  recent_activities: null,
  verified: false,
  connected_ngos: [],
  connected_donors: [],
};

const mapDonor = (row) => ({
  id: row.id,
  email: row.email,
  user_type: "donor",
  name: row.name,
  phone: row.phone_number,
  address: row.address,
  city: row.city ?? defaultUserFields.city,
  state: row.state ?? defaultUserFields.state,
  country: row.country ?? defaultUserFields.country,
  pincode: row.pincode ?? defaultUserFields.pincode,
  description: row.description ?? defaultUserFields.description,
  website: row.website ?? defaultUserFields.website,
  logo_url: row.logo_url ?? defaultUserFields.logo_url,
  verified: row.verified ?? defaultUserFields.verified,
  connected_ngos: Array.isArray(row.connected_ngos)
    ? row.connected_ngos
    : defaultUserFields.connected_ngos,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const mapNgo = (row) => ({
  id: row.id,
  email: row.email,
  user_type: "ngo",
  name: row.name,
  phone: row.phone_number,
  address: row.address,
  city: row.city ?? defaultUserFields.city,
  state: row.state ?? defaultUserFields.state,
  country: row.country ?? defaultUserFields.country,
  pincode: row.pincode ?? defaultUserFields.pincode,
  description: row.description ?? defaultUserFields.description,
  website: row.website ?? defaultUserFields.website,
  logo_url: row.logo_url ?? defaultUserFields.logo_url,
  works_done: row.works_done ?? defaultUserFields.works_done,
  awards_received: row.awards_received ?? defaultUserFields.awards_received,
  about: row.about ?? defaultUserFields.about,
  gallery: row.gallery ?? defaultUserFields.gallery,
  current_requirements:
    row.current_requirements ?? defaultUserFields.current_requirements,
  future_plans: row.future_plans ?? defaultUserFields.future_plans,
  awards_and_recognition:
    row.awards_and_recognition ?? defaultUserFields.awards_and_recognition,
  recent_activities:
    row.recent_activities ?? defaultUserFields.recent_activities,
  verified: row.verified ?? defaultUserFields.verified,
  connected_donors: Array.isArray(row.connected_donors)
    ? row.connected_donors
    : defaultUserFields.connected_donors,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

async function getSingle(queryBuilder) {
  const { data, error } = await queryBuilder.limit(1);
  if (error) throw error;
  if (!data || data.length === 0) return null;
  return data[0];
}

async function findUserByEmail(email) {
  const donor = await getSingle(
    supabase.from("donors").select(donorSelectColumns).eq("email", email)
  );
  if (donor) {
    return { record: donor, type: "donor", mapped: mapDonor(donor) };
  }

  const ngo = await getSingle(
    supabase.from("ngos").select(ngoSelectColumns).eq("email", email)
  );
  if (ngo) {
    return { record: ngo, type: "ngo", mapped: mapNgo(ngo) };
  }

  return null;
}

async function findUserById(id) {
  const donor = await getSingle(
    supabase.from("donors").select(donorSelectColumns).eq("id", id)
  );
  if (donor) {
    return { record: donor, type: "donor", mapped: mapDonor(donor) };
  }

  const ngo = await getSingle(
    supabase.from("ngos").select(ngoSelectColumns).eq("id", id)
  );
  if (ngo) {
    return { record: ngo, type: "ngo", mapped: mapNgo(ngo) };
  }

  return null;
}

async function createUser(type, payload) {
  const table = type === "donor" ? "donors" : "ngos";
  const columns =
    type === "donor" ? donorSelectColumns : ngoSelectColumns;

  const { data, error } = await supabase
    .from(table)
    .insert(payload)
    .select(columns)
    .single();

  if (error) throw error;

  return type === "donor"
    ? { record: data, mapped: mapDonor(data), type }
    : { record: data, mapped: mapNgo(data), type };
}

async function updateUser(type, id, updates) {
  const table = type === "donor" ? "donors" : "ngos";
  const columns =
    type === "donor" ? donorSelectColumns : ngoSelectColumns;

  const { data, error } = await supabase
    .from(table)
    .update(updates)
    .eq("id", id)
    .select(columns)
    .single();

  if (error) throw error;

  return type === "donor"
    ? { record: data, mapped: mapDonor(data), type }
    : { record: data, mapped: mapNgo(data), type };
}

async function listNgos() {
  const { data, error } = await supabase
    .from("ngos")
    .select(ngoSelectColumns)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data.map(mapNgo);
}

async function getDonorStats(donorId) {
  const { data, error } = await supabase
    .from("donations")
    .select("*")
    .eq("donor_id", donorId);
  if (error) throw error;

  const totalDonations = data.length;
  const totalAmount = data.reduce(
    (sum, donation) => sum + Number(donation.amount || 0),
    0
  );
  const completed = data.filter((donation) => donation.status === "completed");

  return {
    total_donations: totalDonations,
    total_amount: totalAmount,
    average_amount: totalDonations ? totalAmount / totalDonations : 0,
    completed_donations: completed.length,
  };
}

async function getNgoStats(ngoId) {
  const [{ data: donations, error: donationError }, { data: requirements, error: requirementError }] =
    await Promise.all([
      supabase
        .from("donations")
        .select("*")
        .eq("ngo_id", ngoId)
        .eq("status", "completed"),
      supabase.from("requirements").select("*").eq("ngo_id", ngoId),
    ]);

  if (donationError) throw donationError;
  if (requirementError) throw requirementError;

  const totalDonations = donations.length;
  const totalAmount = donations.reduce(
    (sum, donation) => sum + Number(donation.amount || 0),
    0
  );

  return {
    total_donations_received: totalDonations,
    total_amount_received: totalAmount,
    average_donation: totalDonations ? totalAmount / totalDonations : 0,
    total_requirements: requirements.length,
    active_requirements: requirements.filter(
      (req) => req.status === "active" || req.status === "partially_fulfilled"
    ).length,
    fulfilled_requirements: requirements.filter(
      (req) => req.status === "fulfilled"
    ).length,
  };
}

async function linkDonorNgo(donorId, ngoId) {
  const [{ data: donorRow, error: donorError }, { data: ngoRow, error: ngoError }] =
    await Promise.all([
      supabase
        .from("donors")
        .select("connected_ngos")
        .eq("id", donorId)
        .single(),
      supabase
        .from("ngos")
        .select("connected_donors")
        .eq("id", ngoId)
        .single(),
    ]);

  if (donorError) throw donorError;
  if (!donorRow) throw new Error("Donor not found");
  if (ngoError) throw ngoError;
  if (!ngoRow) throw new Error("NGO not found");

  const donorConnections = Array.isArray(donorRow.connected_ngos)
    ? donorRow.connected_ngos
    : [];
  const ngoConnections = Array.isArray(ngoRow.connected_donors)
    ? ngoRow.connected_donors
    : [];

  if (!donorConnections.includes(ngoId)) {
    const { error: updateDonorError } = await supabase
      .from("donors")
      .update({ connected_ngos: [...donorConnections, ngoId] })
      .eq("id", donorId);
    if (updateDonorError) throw updateDonorError;
  }

  if (!ngoConnections.includes(donorId)) {
    const { error: updateNgoError } = await supabase
      .from("ngos")
      .update({ connected_donors: [...ngoConnections, donorId] })
      .eq("id", ngoId);
    if (updateNgoError) throw updateNgoError;
  }

  const { error: linkError } = await supabase
    .from("donor_ngo_links")
    .upsert(
      {
        donor_id: donorId,
        ngo_id: ngoId,
      },
      { onConflict: "donor_id,ngo_id" }
    );
  if (linkError) throw linkError;

  const donor = await findUserById(donorId);
  const ngo = await findUserById(ngoId);

  return {
    donor: donor?.mapped,
    ngo: ngo?.mapped,
  };
}

async function unlinkDonorNgo(donorId, ngoId) {
  const [{ data: donorRow, error: donorError }, { data: ngoRow, error: ngoError }] =
    await Promise.all([
      supabase
        .from("donors")
        .select("connected_ngos")
        .eq("id", donorId)
        .single(),
      supabase
        .from("ngos")
        .select("connected_donors")
        .eq("id", ngoId)
        .single(),
    ]);

  if (donorError) throw donorError;
  if (!donorRow) throw new Error("Donor not found");
  if (ngoError) throw ngoError;
  if (!ngoRow) throw new Error("NGO not found");

  const donorConnections = Array.isArray(donorRow.connected_ngos)
    ? donorRow.connected_ngos.filter((id) => id !== ngoId)
    : [];
  const ngoConnections = Array.isArray(ngoRow.connected_donors)
    ? ngoRow.connected_donors.filter((id) => id !== donorId)
    : [];

  const [{ error: updateDonorError }, { error: updateNgoError }, { error: unlinkError }] =
    await Promise.all([
      supabase
        .from("donors")
        .update({ connected_ngos: donorConnections })
        .eq("id", donorId),
      supabase
        .from("ngos")
        .update({ connected_donors: ngoConnections })
        .eq("id", ngoId),
      supabase
        .from("donor_ngo_links")
        .delete()
        .eq("donor_id", donorId)
        .eq("ngo_id", ngoId),
    ]);

  if (updateDonorError) throw updateDonorError;
  if (updateNgoError) throw updateNgoError;
  if (unlinkError) throw unlinkError;

  const donor = await findUserById(donorId);
  const ngo = await findUserById(ngoId);

  return {
    donor: donor?.mapped,
    ngo: ngo?.mapped,
  };
}

async function getConnectedDonorsForNgo(ngoId) {
  const { data, error } = await supabase
    .from("ngos")
    .select("connected_donors")
    .eq("id", ngoId)
    .single();

  if (error) throw error;
  const ids = Array.isArray(data?.connected_donors)
    ? data.connected_donors.filter((value) => !!value)
    : [];

  if (ids.length === 0) {
    return [];
  }

  const { data: donors, error: donorsError } = await supabase
    .from("donors")
    .select(donorSelectColumns)
    .in("id", ids);

  if (donorsError) throw donorsError;

  const orderMap = new Map(ids.map((value, index) => [value, index]));

  return donors
    .map(mapDonor)
    .sort(
      (a, b) =>
        (orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
        (orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER)
    );
}

async function getConnectedNgosForDonor(donorId) {
  const { data, error } = await supabase
    .from("donors")
    .select("connected_ngos")
    .eq("id", donorId)
    .single();

  if (error) throw error;
  const ids = Array.isArray(data?.connected_ngos)
    ? data.connected_ngos.filter((value) => !!value)
    : [];

  if (ids.length === 0) {
    return [];
  }

  const { data: ngos, error: ngosError } = await supabase
    .from("ngos")
    .select(ngoSelectColumns)
    .in("id", ids);

  if (ngosError) throw ngosError;

  const orderMap = new Map(ids.map((value, index) => [value, index]));

  return ngos
    .map(mapNgo)
    .sort(
      (a, b) =>
        (orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
        (orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER)
    );
}

async function createDonation(payload) {
  const { data, error } = await supabase
    .from("donations")
    .insert(payload)
    .select(
      `
      *,
      donor:donors (
        id,
        name,
        email
      ),
      ngo:ngos (
        id,
        name,
        email
      )
    `
    )
    .single();

  if (error) throw error;
  return data;
}

async function listDonations(filter = {}) {
  let query = supabase
    .from("donations")
    .select(
      `
      *,
      donor:donors (
        id,
        name,
        email
      ),
      ngo:ngos (
        id,
        name,
        email
      )
    `
    )
    .order("created_at", { ascending: false });

  if (filter.donor_id) query = query.eq("donor_id", filter.donor_id);
  if (filter.ngo_id) query = query.eq("ngo_id", filter.ngo_id);
  if (filter.status) query = query.eq("status", filter.status);
  if (filter.limit) query = query.limit(filter.limit);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function findDonationById(id) {
  return await getSingle(
    supabase
      .from("donations")
      .select(
        `
        *,
        donor:donors (
          id,
          name,
          email
        ),
        ngo:ngos (
          id,
          name,
          email
        )
      `
      )
      .eq("id", id)
  );
}

async function updateDonation(id, updates) {
  const { data, error } = await supabase
    .from("donations")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

async function createRequirement(payload) {
  const { data, error } = await supabase
    .from("requirements")
    .insert(payload)
    .select(
      `
      *,
      ngo:ngos (
        id,
        name,
        description,
        city,
        state,
        website
      )
    `
    )
    .single();
  if (error) throw error;
  return data;
}

async function listRequirements(filter = {}) {
  let query = supabase
    .from("requirements")
    .select(
      `
      *,
      ngo:ngos (
        id,
        name,
        description,
        city,
        state,
        website
      )
    `
    )
    .order("created_at", { ascending: false });

  if (filter.ngo_id) query = query.eq("ngo_id", filter.ngo_id);
  if (filter.status) query = query.eq("status", filter.status);
  if (filter.category) query = query.eq("category", filter.category);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function findRequirementById(id) {
  return await getSingle(
    supabase
      .from("requirements")
      .select(
        `
        *,
        ngo:ngos (
          id,
          name,
          description,
          city,
          state,
          website
        )
      `
      )
      .eq("id", id)
  );
}

async function updateRequirement(id, updates) {
  const { data, error } = await supabase
    .from("requirements")
    .update(updates)
    .eq("id", id)
    .select(
      `
      *,
      ngo:ngos (
        id,
        name,
        description,
        city,
        state,
        website
      )
    `
    )
    .single();
  if (error) throw error;
  return data;
}

async function deleteRequirement(id) {
  const { error } = await supabase
    .from("requirements")
    .delete()
    .eq("id", id);
  if (error) throw error;
  return true;
}

module.exports = {
  supabase,
  findUserByEmail,
  findUserById,
  createUser,
  updateUser,
  listNgos,
  getDonorStats,
  getNgoStats,
  createDonation,
  listDonations,
  findDonationById,
  updateDonation,
  createRequirement,
  listRequirements,
  findRequirementById,
  updateRequirement,
  deleteRequirement,
  mapDonor,
  mapNgo,
  linkDonorNgo,
  unlinkDonorNgo,
  getConnectedDonorsForNgo,
  getConnectedNgosForDonor,
};

