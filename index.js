// api/lookup.js
function isValidAsin(asin) {
  return typeof asin === "string" && /^[A-Z0-9]{10}$/i.test(asin.trim());
}

export default async function handler(req, res) {
  const asin = (req.query.asin || "").trim();

  if (!isValidAsin(asin)) {
    return res.status(400).json({ error: "Valid ASIN is required" });
  }

  const missing = ["PAAPI_ACCESS_KEY", "PAAPI_SECRET_KEY", "PAAPI_PARTNER_TAG"].filter(
    (k) => !process.env[k]
  );
  if (missing.length) {
    return res.status(500).json({ error: "Missing env vars", missing });
  }

  try {
    const AmazonPaapi = require("amazon-paapi");

    const commonParameters = {
      AccessKey: process.env.PAAPI_ACCESS_KEY,
      SecretKey: process.env.PAAPI_SECRET_KEY,
      PartnerTag: process.env.PAAPI_PARTNER_TAG, // your .ca tag
      PartnerType: "Associates",
      Marketplace: "www.amazon.ca",
    };

    const requestParameters = {
      ItemIds: [asin],
      ItemIdType: "ASIN",
      LanguagesOfPreference: ["en_CA"],
      Resources: [
        "ItemInfo.Title",
        "ItemInfo.Features",
        "ItemInfo.ByLineInfo",
        "Offers.Listings.Price",
        "Images.Primary.Large",
        "Images.Variants.Large",
      ],
    };

    const data = await AmazonPaapi.GetItems(commonParameters, requestParameters);
    return res.status(200).json(data);
  } catch (err) {
    const msg =
      err?.Errors?.[0]?.Message ||
      err?.response?.data?.Errors?.[0]?.Message ||
      err?.message ||
      "PA-API request failed";

    const code =
      err?.Errors?.[0]?.Code ||
      err?.response?.data?.Errors?.[0]?.Code ||
      undefined;

    return res.status(500).json({ error: msg, code });
  }
}
