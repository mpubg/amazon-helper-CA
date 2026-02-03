import { GetItems } from "amazon-paapi";

function parseAsins(input) {
  // Accept: "B0199980K4" OR "B0199980K4,B000HZD168"
  if (!input) return [];
  const raw = Array.isArray(input) ? input.join(",") : String(input);
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function isValidAsin(asin) {
  return /^[A-Z0-9]{10}$/i.test(asin);
}

export default async function handler(req, res) {
  // Allow either asin=... or asins=...
  const asins = parseAsins(req.query.asins || req.query.asin);

  if (asins.length === 0) {
    return res.status(400).json({ error: "ASIN is required (asin or asins)" });
  }

  // PA-API GetItems supports up to 10 ItemIds per request
  if (asins.length > 10) {
    return res
      .status(400)
      .json({ error: "Max 10 ASINs per request (PA-API limit)" });
  }

  const invalid = asins.filter((a) => !isValidAsin(a));
  if (invalid.length) {
    return res.status(400).json({
      error: "Invalid ASIN(s)",
      invalid,
    });
  }

  try {
    const commonParameters = {
      AccessKey: process.env.PAAPI_ACCESS_KEY,
      SecretKey: process.env.PAAPI_SECRET_KEY,
      PartnerTag: process.env.PAAPI_PARTNER_TAG,
      PartnerType: "Associates",
      // Default to US since you said US
      Marketplace: process.env.PAAPI_MARKETPLACE || "www.amazon.com",
    };

    // Basic env checks (helps debugging in Vercel/Next)
    for (const k of ["AccessKey", "SecretKey", "PartnerTag"]) {
      if (!commonParameters[k]) {
        return res.status(500).json({
          error: `Missing environment variable for ${k}. Set PAAPI_ACCESS_KEY, PAAPI_SECRET_KEY, PAAPI_PARTNER_TAG.`,
        });
      }
    }

    const requestParameters = {
      ItemIds: asins,
      ItemIdType: "ASIN",
      LanguagesOfPreference: ["en_US"], // docs: currently one language supported
      Resources: [
        "Images.Primary.Large",
        "Images.Variants.Large",
        "ItemInfo.Title",
        "ItemInfo.Features",
        "ItemInfo.ByLineInfo",
        "Offers.Listings.Price",
        // Optional but helpful for monitoring:
        "Offers.Summaries.LowestPrice",
        "Offers.Summaries.HighestPrice",
        "ParentASIN",
      ],
    };

    const data = await GetItems(commonParameters, requestParameters);

    // Optional: return a simplified structure for your dashboard
    const items = data?.ItemsResult?.Items || [];
    const simplified = items.map((it) => ({
      asin: it?.ASIN,
      parentAsin: it?.ParentASIN,
      title: it?.ItemInfo?.Title?.DisplayValue,
      features: it?.ItemInfo?.Features?.DisplayValues || [],
      brand: it?.ItemInfo?.ByLineInfo?.Brand?.DisplayValue,
      primaryImage: it?.Images?.Primary?.Large?.URL,
      variantImages:
        it?.Images?.Variants?.Large?.map((x) => x?.URL).filter(Boolean) || [],
      price: it?.Offers?.Listings?.[0]?.Price?.DisplayAmount,
      currency: it?.Offers?.Listings?.[0]?.Price?.Currency,
    }));

    return res.status(200).json({
      request: { marketplace: commonParameters.Marketplace, asins },
      raw: data, // keep if you want; remove if you only want simplified
      simplified,
    });
  } catch (err) {
    // Better PA-API error extraction
    const msg =
      err?.message ||
      err?.Errors?.[0]?.Message ||
      err?.response?.data?.Errors?.[0]?.Message ||
      "PA-API request failed";

    return res.status(500).json({
      error: msg,
      // helpful debug fields
      code:
        err?.Errors?.[0]?.Code ||
        err?.response?.data?.Errors?.[0]?.Code ||
        undefined,
    });
  }
}
