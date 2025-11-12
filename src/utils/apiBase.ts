const DEPLOYED_API_BASE = 'https://house-of-charity.vercel.app/api';

const normalize = (url: string) => url.replace(/\/+$/, '');

export const getApiBaseUrl = () => {
  const envUrl = process.env.REACT_APP_API_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return normalize(envUrl);
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = normalize(window.location.origin);
    if (origin.includes('localhost')) {
      return normalize(DEPLOYED_API_BASE);
    }
    return `${origin}/api`;
  }

  return normalize(DEPLOYED_API_BASE);
};


