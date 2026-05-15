interface User {
  public_id: string;
  username: string;
  email: string;
}

interface LoginData {
  username: string;
  email: string;
  password: string;
  rememberMe: boolean;
}

interface AnalyticsByDate {
  date: string;
  clicks: number;
}

interface AnalyticsByBrowser {
  browser: string;
  clicks: number;
}

interface AnalyticsByCountry {
  country: string;
  clicks: number;
}

interface AnalyticsData {
  clicks_over_time: AnalyticsByDate[];
  clicks_by_country: AnalyticsByCountry[];
  clicks_by_browser: AnalyticsByBrowser[];
}

interface LinkData {
  id: number;
  name: string;
  original_link: string;
  short_code: string | null;
  status: "scanning" | "active" | "malicious" | "expired" | "failed";
  created_at: string;
  expires_at: string;
}

interface LinkCreate {
  name: string;
  original_link: string;
  lifetime: number;
}

interface LinkUpdate {
  name: string;
  original_link: string;
}
