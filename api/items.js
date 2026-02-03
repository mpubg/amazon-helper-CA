import { GetItems } from 'amazon-paapi';

export default async function handler(req, res) {
  const { asin } = req.query;

  if (!asin) {
    return res.status(400).json({ error: "ASIN is required" });
  }

  try {
    const commonParameters = {
      AccessKey: process.env.ACCESS_KEY,
      SecretKey: process.env.SECRET_KEY,
      PartnerTag: process.env.PARTNER_TAG,
      PartnerType: 'Associates',
      Marketplace: 'www.amazon.ca',
    };

    const requestParameters = {
      ItemIds: [asin],
      Resources: ["Images.Primary.Small","ItemInfo.Title","ItemInfo.Features","Offers.Summaries.HighestPrice","ParentASIN",
                 ],
    };

    const data = await GetItems(commonParameters, requestParameters);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
