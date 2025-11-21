// Delhi NCR focused seed data
export default [
    // High severity incidents around Delhi
    {
      name: 'Rahul Sharma',
      phone: '+919876543210',
      email: 'rahul.sharma@email.com',
      touristId: 'delhi-001',
      location: [77.216721, 28.613939], // Connaught Place, Delhi
      description: 'Medical emergency - tourist collapsed in market',
      severity: 'high',
      radiusMeters: 500,
      status: 'inProgress',
      date: new Date('2024-12-15T14:30:00.000Z'),
      address: 'Connaught Place, Delhi'
    },
    {
      name: 'Priya Patel',
      phone: '+919876543211',
      email: 'priya.patel@email.com',
      touristId: 'delhi-002',
      location: [77.1025, 28.7041], // Karol Bagh, Delhi
      description: 'Pickpocket incident - passport and wallet stolen',
      severity: 'high',
      radiusMeters: 800,
      status: 'reported',
      date: new Date('2024-12-15T10:15:00.000Z'),
      address: 'Karol Bagh Market, Delhi'
    },
    {
      name: 'Amit Singh',
      phone: '+919876543212',
      email: 'amit.singh@email.com',
      touristId: 'noida-001',
      location: [77.3910, 28.5355], // Noida Sector 18
      description: 'Vehicle breakdown - stuck in heavy traffic',
      severity: 'high',
      radiusMeters: 600,
      status: 'inProgress',
      date: new Date('2024-12-15T16:45:00.000Z'),
      address: 'Sector 18 Metro Station, Noida'
    },
    // Medium severity incidents
    {
      name: 'Sneha Gupta',
      phone: '+919876543213',
      email: 'sneha.gupta@email.com',
      touristId: 'gurgaon-001',
      location: [77.0266, 28.4595], // Gurgaon
      description: 'Lost wallet in crowded shopping mall',
      severity: 'medium',
      radiusMeters: 400,
      status: 'reported',
      date: new Date('2024-12-14T11:20:00.000Z'),
      address: 'DLF Mall, Gurgaon'
    },
    {
      name: 'Vikram Joshi',
      phone: '+919876543214',
      email: 'vikram.joshi@email.com',
      touristId: 'delhi-003',
      location: [77.2090, 28.6139], // Near Red Fort
      description: 'Food poisoning after street food',
      severity: 'medium',
      radiusMeters: 300,
      status: 'resolved',
      date: new Date('2024-12-13T15:30:00.000Z'),
      address: 'Chandni Chowk, Delhi'
    },
    {
      name: 'Kavita Mehta',
      phone: '+919876543215',
      email: 'kavita.mehta@email.com',
      touristId: 'noida-002',
      location: [77.3261, 28.5672], // Noida Sector 62
      description: 'Taxi overcharged and refused to use meter',
      severity: 'medium',
      radiusMeters: 250,
      status: 'reported',
      date: new Date('2024-12-14T18:45:00.000Z'),
      address: 'Sector 62 Metro, Noida'
    },
    // Low severity incidents
    {
      name: 'Rajesh Kumar',
      phone: '+919876543216',
      email: 'rajesh.kumar@email.com',
      touristId: 'delhi-004',
      location: [77.2500, 28.6500], // Delhi Airport area
      description: 'Minor traffic violation witnessed',
      severity: 'low',
      radiusMeters: 200,
      status: 'reported',
      date: new Date('2024-12-15T08:15:00.000Z'),
      address: 'Delhi Airport Road'
    },
    {
      name: 'Meera Sharma',
      phone: '+919876543217',
      email: 'meera.sharma@email.com',
      touristId: 'faridabad-001',
      location: [77.3178, 28.4089], // Faridabad
      description: 'Noise complaint from nearby construction',
      severity: 'low',
      radiusMeters: 150,
      status: 'resolved',
      date: new Date('2024-12-12T22:30:00.000Z'),
      address: 'Nehru Ground, Faridabad'
    },
    {
      name: 'Anil Verma',
      phone: '+919876543218',
      email: 'anil.verma@email.com',
      touristId: 'ghaziabad-001',
      location: [77.4275, 28.6692], // Ghaziabad
      description: 'Street light not working in park',
      severity: 'low',
      radiusMeters: 100,
      status: 'reported',
      date: new Date('2024-12-13T20:00:00.000Z'),
      address: 'Park Street, Ghaziabad'
    },
    // Additional high severity for demo
    {
      name: 'Sunita Rao',
      phone: '+919876543219',
      email: 'sunita.rao@email.com',
      touristId: 'delhi-005',
      location: [77.1855, 28.6274], // India Gate area
      description: 'Allergic reaction to local food - severe breathing difficulty',
      severity: 'high',
      radiusMeters: 700,
      status: 'inProgress',
      date: new Date('2024-12-15T12:45:00.000Z'),
      address: 'India Gate, Delhi'
    },
    {
      name: 'Deepak Jain',
      phone: '+919876543220',
      email: 'deepak.jain@email.com',
      touristId: 'noida-003',
      location: [77.3431, 28.5742], // Noida Sector 15
      description: 'ATM card cloned while withdrawing money',
      severity: 'high',
      radiusMeters: 900,
      status: 'reported',
      date: new Date('2024-12-14T14:20:00.000Z'),
      address: 'Noida Sector 15 ATM'
    },
    // Additional medium severity
    {
      name: 'Poonam Singh',
      phone: '+919876543221',
      email: 'poonam.singh@email.com',
      touristId: 'gurgaon-002',
      location: [77.0887, 28.4817], // Cyber City, Gurgaon
      description: 'Heavy rain and flooding in hotel area',
      severity: 'medium',
      radiusMeters: 350,
      status: 'inProgress',
      date: new Date('2024-12-15T17:30:00.000Z'),
      address: 'Cyber City, Gurgaon'
    },
    {
      name: 'Rohit Agarwal',
      phone: '+919876543222',
      email: 'rohit.agarwal@email.com',
      touristId: 'delhi-006',
      location: [77.2986, 28.6431], // Mayur Vihar, Delhi
      description: 'Power outage in hotel room',
      severity: 'medium',
      radiusMeters: 280,
      status: 'resolved',
      date: new Date('2024-12-13T23:15:00.000Z'),
      address: 'Mayur Vihar Phase 1, Delhi'
    },
    // More incidents around current location area
    {
      name: 'Nisha Kapoor',
      phone: '+919876543223',
      email: 'nisha.kapoor@email.com',
      touristId: 'delhi-007',
      location: [77.2200, 28.6200], // Near current location
      description: 'Tourist guide overcharged for services',
      severity: 'low',
      radiusMeters: 180,
      status: 'reported',
      date: new Date('2024-12-14T13:00:00.000Z'),
      address: 'Rajouri Garden, Delhi'
    },
    {
      name: 'Suresh Reddy',
      phone: '+919876543224',
      email: 'suresh.reddy@email.com',
      touristId: 'noida-004',
      location: [77.3850, 28.5400], // Near current location
      description: 'Minor car accident witnessed',
      severity: 'medium',
      radiusMeters: 320,
      status: 'reported',
      date: new Date('2024-12-15T09:45:00.000Z'),
      address: 'Noida Expressway'
    },
    {
      name: 'Kiran Patel',
      phone: '+919876543225',
      email: 'kiran.patel@email.com',
      touristId: 'delhi-008',
      location: [77.2100, 28.6100], // Near current location
      description: 'Street performer blocking pedestrian path',
      severity: 'low',
      radiusMeters: 120,
      status: 'resolved',
      date: new Date('2024-12-12T16:20:00.000Z'),
      address: 'Lajpat Nagar, Delhi'
    }
];