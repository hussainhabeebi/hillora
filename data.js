/*
 * Hillora Tales Vagamon — site content.
 * Update stays, rates and contact details here; the page renders from this file.
 * Photos are Google Drive file IDs (files must be shared as "Anyone with the link can view").
 */
window.HILLORA = {
  whatsapp: "919846796773",
  phoneDisplay: "+91 98467 96773",

  // Indicative rates (per unit, per night). The team confirms the final rate on WhatsApp.
  rates: {
    weekday: 4500,
    weekend: 5200, // Friday & Saturday nights, and holidays
    extraGuest: 900, // per person, subject to confirmation
  },

  checkIn: "2:00 PM",

  stays: [
    {
      id: "amrutham",
      name: "Amrutham Villa",
      type: "Villa",
      tagline: "Independent 3-bedroom villa",
      description:
        "Independent 3-bedroom villa featuring a living area, balcony with bar counter, and dining room.",
      story:
        "Made for big families and old friends: a spacious living hall, a long dining table and a balcony bar for long talks after dark.",
      bedrooms: 3,
      adults: 6,
      children: 6,
      pool: true,
      amenities: [
        "🛋️ Hall / Living area",
        "🍽️ Dining area",
        "🌿 Balcony",
        "🏊 Swimming pool",
        "🍽️ Restaurant",
        "🔥 BBQ & campfire",
        "🍳 Complimentary breakfast",
        "🛝 Kids play area",
      ],
      photos: [
        "1i7YBjfp-YmIyBggwglyLLGT056H8-MM3",
        "11-mZDLcG-wxY2yToSP1y1CDOGzjHf7Gt",
        "1kcffS9TZ5f2kF9zjjlErDN1LEOvWeP5B",
        "1y3kjq5kmN4TD60gVTvJ-joOvy6rEL7sD",
      ],
    },
    {
      id: "aranyam",
      name: "Aranyam Villa",
      type: "Villa",
      tagline: "Independent 3-bedroom villa",
      description:
        "Independent 3-bedroom villa featuring a living area, sofa-cum-bed, and balcony with bar counter.",
      story:
        "'Aranyam' means forest. Watch the valley from your balcony, raise a glass at the bar counter, and fit the whole gang in.",
      bedrooms: 3,
      adults: 8,
      children: 8,
      childrenNote: "Children's capacity is confirmed by our team",
      pool: true,
      amenities: [
        "🌄 Valley view balcony",
        "🍹 Bar counter",
        "🛏️ King-size sofa-cum-bed",
        "🏊 Swimming pool",
        "🍽️ Restaurant",
        "🔥 BBQ & campfire",
        "🍳 Complimentary breakfast",
        "🛝 Kids play area",
      ],
      photos: [
        "1xbyyTCjKLM94f1RikmZjh6E9cp1Rf3sj",
        "1QM639RghjV2eLmNtz2tABfjxC_wOwPaj",
        "1sgJKiY_NazWJh0lIS15jQtgEeVBIsyUm",
        "1MLEimaNoblw-BpHgGCFR_rJi46o9XTAB",
      ],
    },
    {
      id: "cleopatra",
      name: "Cleopatra",
      type: "A-frame Cottage",
      tagline: "A-frame cottage with a glass balcony",
      description:
        "A-frame cottage featuring 2 separate rooms, an enclosed glass balcony, and mountain and valley views.",
      story:
        "Our most photographed stay. Sip your morning chai in the glass balcony while the clouds roll across the mountains.",
      bedrooms: 2,
      adults: 4,
      children: 4,
      pool: true,
      amenities: [
        "🏊 Swimming pool",
        "🍽️ Restaurant",
        "🔥 BBQ & campfire",
        "🍳 Complimentary breakfast",
        "🛝 Kids play area",
        "🚙 Jeep trekking & sightseeing",
      ],
      photos: [
        "1PPWoFKMxS179_Wu36Q_2FrWf2l__NwrK",
        "1QlIeFYlvHMJbm3srffoWDpfOBLcY_QUC",
        "1vXi6OoKUqZ0wLMAzA_JgCXwg6wNdmEYE",
        "1qUYf8bw-a28NQYqyTJWFN6FFUI7HKXpj",
      ],
    },
    {
      id: "pooldeck",
      name: "The Pool Deck",
      type: "Apartment",
      tagline: "2-bedroom apartment by the pool",
      description:
        "2-bedroom apartment offering pool, meadow, mountain, and valley views.",
      story:
        "Step out to the pool, look past the meadow to the mountains, and let the day take its time.",
      bedrooms: 2,
      adults: 4,
      children: 4,
      pool: true,
      amenities: [
        "🏊 Swimming pool",
        "🍽️ Restaurant",
        "🔥 BBQ & campfire",
        "🍳 Complimentary breakfast",
        "🛝 Kids play area",
        "🚙 Jeep trekking & sightseeing",
      ],
      photos: [
        "1i8BAmNhdvlurhQP-9MakbACEyN2VWKK1",
        "1qMq6E3UJF3e44IzuY2klB84qqmpp09Dk",
        "1BWdN3CCjSNcLiqdQBUnsoRf4bpfDLIUe",
        "1p4nSo-2KFctlRZ9-NfbaHYKkHKX-9kNp",
      ],
    },
  ],
};
