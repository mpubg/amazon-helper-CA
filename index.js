<<<<<<< HEAD
const express = require("express");
const AmazonPaapi = require("amazon-paapi");

const app = express();
const port = process.env.PORT || 3000;

// Amazon PA-API config
const commonParameters = {
  AccessKey: "AKPACHPP681756975474",
  SecretKey: "MX5Yec7stDgLlFRTG2nPoeFelz8VQQnAKDmGtw8s",
  PartnerTag: "shreejagann0f-20", // e.g. mytag-20
  PartnerType: "Associates",
  Marketplace: "www.amazon.ca", // Change for your region
};

app.get("/lookup", async (req, res) => {
  try {
    const asin = req.query.asin;
    const requestParameters = {
      ItemIds: [asin],
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
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => console.log(`✅ Helper running on port ${port}`));
=======
const express = require("express");
const AmazonPaapi = require("amazon-paapi");

const app = express();
const port = process.env.PORT || 3000;

// Amazon PA-API config
const commonParameters = {
  AccessKey: "AKPACHPP681756975474",
  SecretKey: "MX5Yec7stDgLlFRTG2nPoeFelz8VQQnAKDmGtw8s",
  PartnerTag: "shreejagann0f-20", // e.g. mytag-20
  PartnerType: "Associates",
  Marketplace: "www.amazon.ca", // Change for your region
};

app.get("/lookup", async (req, res) => {
  try {
    const asin = req.query.asin;
    const requestParameters = {
      ItemIds: [asin],
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
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => console.log(`✅ Helper running on port ${port}`));
>>>>>>> 078fab08141f5b50e05903da324652377f7777d6
