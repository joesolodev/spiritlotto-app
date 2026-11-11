// The five California games covered by the research, with current rules.
// lowLimit = how many main numbers of 31 and under a filtered ticket may contain.
export const GAMES = {
  powerball: {
    key: "powerball", name: "Powerball", price: 2,
    main: { count: 5, min: 1, max: 69 },
    special: { name: "Powerball", min: 1, max: 26 },
    lowLimit: 0,
  },
  megamillions: {
    key: "megamillions", name: "Mega Millions", price: 5,
    main: { count: 5, min: 1, max: 70 },
    special: { name: "Mega Ball", min: 1, max: 24 },
    lowLimit: 0,
  },
  superlotto: {
    key: "superlotto", name: "SuperLotto Plus", price: 1,
    main: { count: 5, min: 1, max: 47 },
    special: { name: "Mega", min: 1, max: 27 },
    lowLimit: 1,
  },
  fantasy5: {
    key: "fantasy5", name: "Fantasy 5", price: 1,
    main: { count: 5, min: 1, max: 39 },
    special: null,
    lowLimit: 2,
  },
  daily3: {
    key: "daily3", name: "Daily 3", price: 1,
    digits: 3,
  },
};

export const GAME_ORDER = ["powerball", "megamillions", "superlotto", "fantasy5", "daily3"];
export const CHEAPEST_PRICE = Math.min(...Object.values(GAMES).map((g) => g.price));
