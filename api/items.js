// api/amazon.js

function isValidAsin(asin) {
  return typeof asin === "string" && /^[A-Z0-9]{10}$/i.test(asin.trim());
}

function parseAsins(input) {
  if (!input) return [];
  const raw = Array.isArray(input) ? input.join(",") : String(input);
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const op = (req.query.op || "items").toLowerCase(); // items | variations
  const marketplace = (req.query.marketplace || "www.amazon.ca").trim();

  // Required env vars
  const missing = ["PAAPI_ACCESS_KEY", "PAAPI_SECRET_KEY", "PAAPI_PARTNER_TAG_CA"].filter(
    (k) => !process.env[k]
  );
  if (missing.length) {
    return res.status(500).json({ error: "Missing env vars", missing });
  }

  try {
    // Use require to avoid ESM/CJS issues on Vercel
    // eslint-disable-next-line global-require
    const AmazonPaapi = require("amazon-paapi");

    const commonParameters = {
      AccessKey: process.env.PAAPI_ACCESS_KEY,
      SecretKey: process.env.PAAPI_SECRET_KEY,
      PartnerTag: process.env.PAAPI_PARTNER_TAG_CA, // Canada tag
      PartnerType: "Associates",
      Marketplace: marketplace,
    };

    if (op === "items") {
      const asins = parseAsins(req.query.asins || req.query.asin);

      if (asins.length === 0) {
        return res.status(400).json({ error: "ASIN required (asin or asins)" });
      }
      if (asins.length > 10) {
        return res.status(400).json({ error: "Max 10 ASINs per request" });
      }
      const invalid = asins.filter((a) => !isValidAsin(a));
      if (invalid.length) {
        return res.status(400).json({ error: "Invalid ASIN(s)", invalid });
      }

      const requestParameters = {
        ItemIds: asins,
        ItemIdType: "ASIN",
        LanguagesOfPreference: ["en_CA"],
        Resources: [
          "Images.Primary.Large",
          "Images.Variants.Large",
          "ItemInfo.Title",
          "ItemInfo.Features",
          "ItemInfo.ByLineInfo",
          "Offers.Listings.Price",
        ],
      };

      const data = await AmazonPaapi.GetItems(commonParameters, requestParameters);
      return res.status(200).json({ op: "items", marketplace, asins, data });
    }

    if (op === "variations") {
      const asin = (req.query.asin || "").trim();
      const variationPage = Number(req.query.page || req.query.variationPage || 1);

      if (!isValidAsin(asin)) {
        return res.status(400).json({ error: "Valid ASIN required" });
      }
      if (!Number.isInteger(variationPage) || variationPage < 1) {
        return res.status(400).json({ error: "page must be an integer >= 1" });
      }

      const requestParameters = {
        ASIN: asin,
        VariationPage: variationPage,
        Resources: [
          "VariationSummary",
          "ItemInfo.Title",
          "Offers.Listings.Price",
          "Images.Primary.Large",
        ],
      };

      const data = await AmazonPaapi.GetVariations(commonParameters, requestParameters);
      return res.status(200).json({ op: "variations", marketplace, asin, page: variationPage, data });
    }

    return res.status(400).json({ error: "Invalid op. Use op=items or op=variations" });
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
