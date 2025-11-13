"use strict";

const { isMockDb, useSupabase } = require("../utils/dbMode");
const {
  createNotification: createMockNotification,
  createNotifications: createMockNotifications,
  getConnectedDonorsForNgo: getMockConnectedDonorsForNgo,
} = require("./mockData");

let supabaseAdapter = null;
if (useSupabase()) {
  supabaseAdapter = require("./supabaseAdapter");
}

const isMockDbMode = () => isMockDb();

const truncatePreview = (text) => {
  const trimmed = typeof text === "string" ? text.trim() : "";
  if (!trimmed) {
    return "See their profile for details.";
  }
  return trimmed.length > 120 ? `${trimmed.slice(0, 117)}...` : trimmed;
};

const notifyNgo = async (ngoId, notification) => {
  try {
    if (isMockDbMode()) {
      createMockNotification({
        user_id: ngoId,
        account_type: "ngo",
        ...notification,
      });
      return;
    }

    if (useSupabase() && supabaseAdapter) {
      await supabaseAdapter.createNotification({
        user_id: ngoId,
        account_type: "ngo",
        ...notification,
      });
      return;
    }

    console.warn(
      "[notificationService] Database mode does not support NGO notifications."
    );
  } catch (error) {
    console.error("[notificationService] notifyNgo failed:", error);
  }
};

const notifyDonors = async (ngoId, buildNotificationForDonor) => {
  try {
    if (isMockDbMode()) {
      const donors = getMockConnectedDonorsForNgo(ngoId);
      if (!Array.isArray(donors) || donors.length === 0) {
        return;
      }

      const notifications = donors
        .map((donor) => {
          const payload = buildNotificationForDonor(donor);
          if (!payload) return null;
          return {
            user_id: donor.id,
            account_type: "donor",
            ...payload,
          };
        })
        .filter(Boolean);

      if (notifications.length > 0) {
        createMockNotifications(notifications);
      }
      return;
    }

    if (useSupabase() && supabaseAdapter) {
      const donors = await supabaseAdapter.getConnectedDonorsForNgo(ngoId);
      if (!Array.isArray(donors) || donors.length === 0) {
        return;
      }

      const notifications = donors
        .map((donor) => {
          const payload = buildNotificationForDonor(donor);
          if (!payload) return null;
          return {
            user_id: donor.id,
            account_type: "donor",
            ...payload,
          };
        })
        .filter(Boolean);

      if (notifications.length > 0) {
        await supabaseAdapter.createNotifications(notifications);
      }
      return;
    }

    console.warn(
      "[notificationService] Database mode does not support donor notifications."
    );
  } catch (error) {
    console.error("[notificationService] notifyDonors failed:", error);
  }
};

const notifyDonationReceived = async ({
  ngoId,
  donationId,
  donorName,
  donationType,
  amount,
  currency,
  anonymous,
}) => {
  const safeAmount =
    donationType === "money" && amount && Number(amount) > 0
      ? `${currency || "INR"} ${Number(amount)}`
      : null;

  const displayName = anonymous ? "An anonymous donor" : donorName || "A donor";
  const message = safeAmount
    ? `${displayName} contributed ${safeAmount}.`
    : `${displayName} made a ${donationType} donation.`;

  await notifyNgo(ngoId, {
    title: "New donation received",
    message,
    type: "donation",
    related_id: donationId,
    related_type: "donation",
    meta: {
      donation_type: donationType,
      amount: safeAmount ? Number(amount) : null,
    },
  });
};

const notifyRequirementPosted = async ({
  ngoId,
  requirementId,
  ngoName,
  title,
  amountNeeded,
  currency,
}) => {
  const safeAmount =
    amountNeeded && Number(amountNeeded) > 0
      ? `${currency || "INR"} ${Number(amountNeeded)}`
      : null;

  const message = safeAmount
    ? `${ngoName} requires ${safeAmount} for "${title}".`
    : `${ngoName} posted a new requirement: "${title}".`;

  await notifyDonors(ngoId, () => ({
    title: "New requirement from your connected NGO",
    message,
    type: "requirement",
    related_id: requirementId,
    related_type: "requirement",
    meta: {
      ngo_id: ngoId,
      requirement_id: requirementId,
      ngo_name: ngoName,
    },
  }));
};

const notifyCurrentRequirementsUpdated = async ({
  ngoId,
  ngoName,
  currentRequirements,
}) => {
  const preview = truncatePreview(currentRequirements);

  await notifyDonors(ngoId, () => ({
    title: "NGO updated their current requirements",
    message: `${ngoName} shared new requirements: ${preview}`,
    type: "requirement",
    related_id: ngoId,
    related_type: "ngo",
    meta: {
      ngo_id: ngoId,
      source: "profile",
    },
  }));
};

module.exports = {
  notifyDonationReceived,
  notifyRequirementPosted,
  notifyCurrentRequirementsUpdated,
};

