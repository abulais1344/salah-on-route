const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

export const SITE_URL = (rawAppUrl && rawAppUrl.length > 0
  ? rawAppUrl
  : "https://masjidroute.com").replace(/\/$/, "");

export const SITE_NAME = "MasjidRoute";
export const SITE_ALT_NAME = "Namaz Route";
export const SITE_DESCRIPTION =
  "Find nearby masjids and namaz/jamaat timings during travel across India, with route-aware guidance for Maharashtra and Telangana highways.";

