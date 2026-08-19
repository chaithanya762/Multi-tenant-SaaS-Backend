import { describe, it, expect } from 'vitest';
import { getApiBaseUrl } from '../api/apiClient';

describe('getApiBaseUrl', () => {
  it('returns the default Render URL when no custom URL is set', () => {
    localStorage.removeItem('saas_api_url');
    const url = getApiBaseUrl();
    expect(url).toBe('https://multitenant-backend-4lh0.onrender.com');
  });

  it('strips trailing slashes from custom URLs', () => {
    localStorage.setItem('saas_api_url', 'http://localhost:8080/');
    const url = getApiBaseUrl();
    expect(url).toBe('http://localhost:8080');
    localStorage.removeItem('saas_api_url');
  });

  it('resets vercel URLs to Render default', () => {
    localStorage.setItem('saas_api_url', 'https://my-app.vercel.app');
    const url = getApiBaseUrl();
    expect(url).toBe('https://multitenant-backend-4lh0.onrender.com');
    localStorage.removeItem('saas_api_url');
  });
});
