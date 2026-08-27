import { MetadataRoute } from 'next';
import { supabase } from '../lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://ticketmatchpro.com';

  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/browse`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/sell`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/exchanges`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  try {
    const { data: tickets } = await supabase
      .from('tickets')
      .select('id, updated_at')
      .eq('status', 'active')
      .limit(100);

    if (tickets) {
      tickets.forEach((ticket) => {
        routes.push({
          url: `${baseUrl}/ticket/${ticket.id}`,
          lastModified: ticket.updated_at ? new Date(ticket.updated_at) : new Date(),
          changeFrequency: 'daily',
          priority: 0.8,
        });
      });
    }
  } catch (e) {
    console.warn('Sitemap ticket query error:', e);
  }

  return routes;
}
