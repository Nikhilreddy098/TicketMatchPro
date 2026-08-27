'use client';

import React from 'react';

export const OrganizationJsonLd: React.FC = () => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'TicketMatchPro',
    url: 'https://ticketmatchpro.com',
    logo: 'https://ticketmatchpro.com/logo.png',
    description: 'Commercial ticket marketplace for concerts, IPL cricket, sports, comedy shows, and cultural festivals.',
    sameAs: [
      'https://twitter.com/ticketmatchpro',
      'https://facebook.com/ticketmatchpro',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

export const EventJsonLd: React.FC<{
  name: string;
  startDate: string;
  venue: string;
  city: string;
  price: number;
  url: string;
  imageUrl?: string;
}> = ({ name, startDate, venue, city, price, url, imageUrl }) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: name,
    startDate: startDate,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: {
      '@type': 'Place',
      name: venue,
      address: {
        '@type': 'PostalAddress',
        addressLocality: city,
        addressCountry: 'IN',
      },
    },
    image: imageUrl ? [imageUrl] : undefined,
    offers: {
      '@type': 'Offer',
      url: url,
      price: price,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      validFrom: new Date().toISOString(),
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};
