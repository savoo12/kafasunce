// Cloudflare Worker for venues data
// In a production app, this would connect to a database

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // Mock venues data
  const venues = [
    {
      id: '1',
      name: 'Kafeterija',
      type: 'cafe',
      location: { lng: 20.4612, lat: 44.8186 },
      address: 'Kralja Petra 16, Belgrade',
      rating: 4.7,
      hasOutdoorSeating: true,
      photos: ['/venues/kafeterija1.jpg', '/venues/kafeterija2.jpg'],
      openingHours: {
        mon: { open: '08:00', close: '22:00' },
        tue: { open: '08:00', close: '22:00' },
        wed: { open: '08:00', close: '22:00' },
        thu: { open: '08:00', close: '22:00' },
        fri: { open: '08:00', close: '23:00' },
        sat: { open: '09:00', close: '23:00' },
        sun: { open: '10:00', close: '21:00' }
      }
    },
    {
      id: '2',
      name: 'Miners Pub',
      type: 'pub',
      location: { lng: 20.4583, lat: 44.8172 },
      address: 'Rige od Fere 16, Belgrade',
      rating: 4.5,
      hasOutdoorSeating: true,
      photos: ['/venues/miners1.jpg', '/venues/miners2.jpg'],
      openingHours: {
        mon: { open: '12:00', close: '01:00' },
        tue: { open: '12:00', close: '01:00' },
        wed: { open: '12:00', close: '01:00' },
        thu: { open: '12:00', close: '01:00' },
        fri: { open: '12:00', close: '03:00' },
        sat: { open: '12:00', close: '03:00' },
        sun: { open: '12:00', close: '00:00' }
      }
    },
    {
      id: '3',
      name: 'Aviator Coffee',
      type: 'cafe',
      location: { lng: 20.4548, lat: 44.8138 },
      address: 'Bulevar Kralja Aleksandra 32, Belgrade',
      rating: 4.8,
      hasOutdoorSeating: true,
      photos: ['/venues/aviator1.jpg', '/venues/aviator2.jpg'],
      openingHours: {
        mon: { open: '08:00', close: '22:00' },
        tue: { open: '08:00', close: '22:00' },
        wed: { open: '08:00', close: '22:00' },
        thu: { open: '08:00', close: '22:00' },
        fri: { open: '08:00', close: '22:00' },
        sat: { open: '09:00', close: '22:00' },
        sun: { open: '09:00', close: '20:00' }
      }
    },
    {
      id: '4',
      name: 'Blaznavac',
      type: 'pub',
      location: { lng: 20.4632, lat: 44.8079 },
      address: 'Kneginje Ljubice 18, Belgrade',
      rating: 4.6,
      hasOutdoorSeating: true,
      photos: ['/venues/blaznavac1.jpg', '/venues/blaznavac2.jpg'],
      openingHours: {
        mon: { open: '09:00', close: '01:00' },
        tue: { open: '09:00', close: '01:00' },
        wed: { open: '09:00', close: '01:00' },
        thu: { open: '09:00', close: '01:00' },
        fri: { open: '09:00', close: '02:00' },
        sat: { open: '09:00', close: '02:00' },
        sun: { open: '09:00', close: '00:00' }
      }
    },
    {
      id: '5',
      name: 'Greenet',
      type: 'cafe',
      location: { lng: 20.4656, lat: 44.8141 },
      address: 'Nušićeva 3, Belgrade',
      rating: 4.9,
      hasOutdoorSeating: false,
      photos: ['/venues/greenet1.jpg', '/venues/greenet2.jpg'],
      openingHours: {
        mon: { open: '07:30', close: '21:00' },
        tue: { open: '07:30', close: '21:00' },
        wed: { open: '07:30', close: '21:00' },
        thu: { open: '07:30', close: '21:00' },
        fri: { open: '07:30', close: '21:00' },
        sat: { open: '08:30', close: '21:00' },
        sun: { open: '09:30', close: '20:00' }
      }
    }
  ];
  
  // Handle specific venue request
  const venueId = url.searchParams.get('id');
  if (venueId) {
    const venue = venues.find(v => v.id === venueId);
    
    if (venue) {
      return new Response(JSON.stringify(venue), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'max-age=3600' // Cache for 1 hour
        }
      });
    } else {
      return new Response(JSON.stringify({ error: 'Venue not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
  
  // Handle filter
  const filter = url.searchParams.get('filter');
  let filteredVenues = venues;
  
  if (filter) {
    if (filter === 'cafe') {
      filteredVenues = venues.filter(v => v.type === 'cafe');
    } else if (filter === 'pub') {
      filteredVenues = venues.filter(v => v.type === 'pub');
    } else if (filter === 'outdoor') {
      filteredVenues = venues.filter(v => v.hasOutdoorSeating);
    }
  }
  
  // Return all venues
  return new Response(JSON.stringify(filteredVenues), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'max-age=3600' // Cache for 1 hour
    }
  });
} 