import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
  })),
};

// Mock the location context logic (extracted from the edge function)
class LocationContextService {
  constructor(private supabase: any) {}

  async getLocationContext(userId: string, preferredLocationId?: string) {
    // Get user with group and location info
    const { data: userData, error: userError } = await this.supabase
      .from('users')
      .select(`
        id,
        group_id,
        location_id,
        groups (
          id,
          name,
          created_at,
          updated_at
        )
      `)
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      throw new Error('User not found or not assigned to a group');
    }

    // Get all locations for the user's group
    const { data: locations, error: locationsError } = await this.supabase
      .from('locations')
      .select('*')
      .eq('group_id', userData.group_id);

    if (locationsError || !locations) {
      throw new Error('Failed to fetch locations');
    }

    // Determine active location
    let activeLocation = null;

    // Priority order: preferred -> user assigned -> main -> first available
    if (preferredLocationId) {
      activeLocation = locations.find(loc => loc.id === preferredLocationId);
      if (!activeLocation) {
        throw new Error('Selected location is not part of user\'s group');
      }
    } else if (userData.location_id) {
      activeLocation = locations.find(loc => loc.id === userData.location_id);
    }

    if (!activeLocation) {
      activeLocation = locations.find(loc => loc.is_main) || locations[0];
    }

    if (!activeLocation) {
      throw new Error('No locations available for user\'s group');
    }

    return {
      group: userData.groups,
      locations,
      activeLocation,
    };
  }
}

describe('LocationContext Middleware', () => {
  let locationService: LocationContextService;
  let mockFrom: MockedFunction<any>;
  let mockSelect: MockedFunction<any>;
  let mockEq: MockedFunction<any>;
  let mockSingle: MockedFunction<any>;

  const mockUser = {
    id: 'user-123',
    group_id: 'group-456',
    location_id: 'location-assigned',
    groups: {
      id: 'group-456',
      name: 'Test Café Group',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  };

  const mockLocations = [
    {
      id: 'location-main',
      group_id: 'group-456',
      name: 'Main Café',
      address: '123 Main St',
      is_main: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'location-assigned',
      group_id: 'group-456',
      name: 'Branch Café',
      address: '456 Branch Ave',
      is_main: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'location-other',
      group_id: 'group-456',
      name: 'Other Café',
      address: '789 Other Rd',
      is_main: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock chain
    mockSingle = vi.fn();
    mockEq = vi.fn(() => ({ single: mockSingle }));
    mockSelect = vi.fn(() => ({ eq: mockEq }));
    mockFrom = vi.fn(() => ({ select: mockSelect }));
    
    mockSupabaseClient.from = mockFrom;
    locationService = new LocationContextService(mockSupabaseClient);
  });

  describe('User with multiple locations and active session', () => {
    beforeEach(() => {
      // Mock user data fetch
      mockFrom.mockImplementationOnce(() => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: mockUser, error: null })
          })
        })
      }));

      // Mock locations fetch
      mockFrom.mockImplementationOnce(() => ({
        select: () => ({
          eq: () => Promise.resolve({ data: mockLocations, error: null })
        })
      }));
    });

    it('should correctly select active location based on session preference', async () => {
      const result = await locationService.getLocationContext('user-123', 'location-other');

      expect(result.activeLocation).toEqual(mockLocations[2]); // location-other
      expect(result.locations).toEqual(mockLocations);
      expect(result.group).toEqual(mockUser.groups);
    });

    it('should select user assigned location when no preference provided', async () => {
      const result = await locationService.getLocationContext('user-123');

      expect(result.activeLocation).toEqual(mockLocations[1]); // location-assigned
      expect(result.locations).toEqual(mockLocations);
      expect(result.group).toEqual(mockUser.groups);
    });
  });

  describe('Fallback to main location', () => {
    beforeEach(() => {
      const userWithoutAssignedLocation = {
        ...mockUser,
        location_id: null,
      };

      // Mock user data fetch
      mockFrom.mockImplementationOnce(() => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: userWithoutAssignedLocation, error: null })
          })
        })
      }));

      // Mock locations fetch
      mockFrom.mockImplementationOnce(() => ({
        select: () => ({
          eq: () => Promise.resolve({ data: mockLocations, error: null })
        })
      }));
    });

    it('should fallback to main location when session location is missing', async () => {
      const result = await locationService.getLocationContext('user-123');

      expect(result.activeLocation).toEqual(mockLocations[0]); // location-main (is_main: true)
      expect(result.locations).toEqual(mockLocations);
      expect(result.group).toEqual(mockUser.groups);
    });
  });

  describe('Error handling for invalid locations', () => {
    beforeEach(() => {
      // Mock user data fetch
      mockFrom.mockImplementationOnce(() => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: mockUser, error: null })
          })
        })
      }));

      // Mock locations fetch
      mockFrom.mockImplementationOnce(() => ({
        select: () => ({
          eq: () => Promise.resolve({ data: mockLocations, error: null })
        })
      }));
    });

    it('should throw error if selected location is not part of user\'s group', async () => {
      await expect(
        locationService.getLocationContext('user-123', 'invalid-location-id')
      ).rejects.toThrow('Selected location is not part of user\'s group');
    });
  });

  describe('Error handling for missing data', () => {
    it('should throw error if user not found', async () => {
      mockFrom.mockImplementationOnce(() => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: { message: 'User not found' } })
          })
        })
      }));

      await expect(
        locationService.getLocationContext('invalid-user-id')
      ).rejects.toThrow('User not found or not assigned to a group');
    });

    it('should throw error if locations fetch fails', async () => {
      // Mock user data fetch (success)
      mockFrom.mockImplementationOnce(() => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: mockUser, error: null })
          })
        })
      }));

      // Mock locations fetch (failure)
      mockFrom.mockImplementationOnce(() => ({
        select: () => ({
          eq: () => Promise.resolve({ data: null, error: { message: 'Database error' } })
        })
      }));

      await expect(
        locationService.getLocationContext('user-123')
      ).rejects.toThrow('Failed to fetch locations');
    });

    it('should throw error if no locations available', async () => {
      // Mock user data fetch
      mockFrom.mockImplementationOnce(() => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: mockUser, error: null })
          })
        })
      }));

      // Mock locations fetch (empty array)
      mockFrom.mockImplementationOnce(() => ({
        select: () => ({
          eq: () => Promise.resolve({ data: [], error: null })
        })
      }));

      await expect(
        locationService.getLocationContext('user-123')
      ).rejects.toThrow('No locations available for user\'s group');
    });
  });

  describe('Fallback priority logic', () => {
    it('should fallback to first location if no main location exists', async () => {
      const locationsWithoutMain = mockLocations.map(loc => ({ ...loc, is_main: false }));
      const userWithoutAssignedLocation = {
        ...mockUser,
        location_id: null,
      };

      // Mock user data fetch
      mockFrom.mockImplementationOnce(() => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: userWithoutAssignedLocation, error: null })
          })
        })
      }));

      // Mock locations fetch
      mockFrom.mockImplementationOnce(() => ({
        select: () => ({
          eq: () => Promise.resolve({ data: locationsWithoutMain, error: null })
        })
      }));

      const result = await locationService.getLocationContext('user-123');

      expect(result.activeLocation).toEqual(locationsWithoutMain[0]); // First location
      expect(result.locations).toEqual(locationsWithoutMain);
    });
  });
});