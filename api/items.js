// server.js
require("dotenv").config();

const express = require("express");
const AmazonPaapi = require("amazon-paapi");

const app = express();
const port = process.env.PORT || 3000;

// Amazon PA-API config (use env vars, never hardcode secrets)
const commonParameters = {
  AccessKey: process.env.PAAPI_ACCESS_KEY,
  SecretKey: process.env.PAAPI_SECRET_KEY,
  PartnerTag: process.env.PAAPI_PARTNER_TAG, // e.g. mytag-20
  PartnerType: "Associates",
  Marketplace: process.env.PAAPI_MARKETPLACE || "www.amazon.com", // US default
};

function isValidAsin(asin) {
  return typeof asin === "string" && /^[A-Z0-9]{10}$/i.test(asin.trim());
}

app.get("/lookup", async (req, res) => {
  try {
    const asin = (req.query.asin || "").trim();

    if (!isValidAsin(asin)) {
      return res.status(400).json({ error: "Invalid or missing ASIN" });
    }

    const requestParameters = {
      ItemIds: [asin],
      ItemIdType: "ASIN",
      LanguagesOfPreference: ["en_US"],
      Resources: [
        "ItemInfo.Title",
        "ItemInfo.Features",
        "ItemInfo.ByLineInfo",
        "Offers.Listings.Price",
        "Offers.Summaries.LowestPrice",
        "Offers.Summaries.HighestPrice",
        "Images.Primary.Large",
        "Images.Variants.Large",
        "ParentASIN",
      ],
    };

    const data = await AmazonPaapi.GetItems(commonParameters, requestParameters);
    res.json(data);
  } catch (err) {
    const msg =
      err?.message ||
      err?.Errors?.[0]?.Message ||
      err?.response?.data?.Errors?.[0]?.Message ||
      "PA-API request failed";

    res.status(500).json({ error: msg });
  }
});

app.get("/health", (req, res) => res.json({ ok: true }));

app.listen(port, () => console.log(`✅ Helper running on port ${port}`));
