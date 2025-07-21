import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Mock the Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

// Mock data structures
interface MockUser {
  id: string;
  email: string;
  group_id: string;
  location_id?: string;
}

interface MockGroup {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface MockLocation {
  id: string;
  group_id: string;
  name: string;
  address?: string;
  is_main: boolean;
  created_at: string;
  updated_at: string;
}

// Test data setup
const mockGroups: MockGroup[] = [
  {
    id: 'group-1',
    name: 'Main Group',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'group-2', 
    name: 'Secondary Group',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }
];

const mockLocations: MockLocation[] = [
  {
    id: 'location-1',
    group_id: 'group-1',
    name: 'Main Store',
    address: '123 Main St',
    is_main: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'location-2',
    group_id: 'group-1',
    name: 'Branch Store',
    address: '456 Branch Ave',
    is_main: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'location-3',
    group_id: 'group-1',
    name: 'Express Store',
    address: '789 Express Blvd',
    is_main: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'location-4',
    group_id: 'group-2',
    name: 'Other Group Store',
    address: '999 Other St',
    is_main: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }
];

const mockUsers: MockUser[] = [
  {
    id: 'user-1',
    email: 'user1@example.com',
    group_id: 'group-1',
    location_id: 'location-2', // Assigned to Branch Store
  },
  {
    id: 'user-2',
    email: 'user2@example.com',
    group_id: 'group-1',
    location_id: undefined, // No assigned location - should fallback
  },
  {
    id: 'user-3',
    email: 'user3@example.com',
    group_id: 'group-2',
    location_id: 'location-4', // Different group
  },
  {
    id: 'user-no-group',
    email: 'usernogroup@example.com',
    group_id: '',
    location_id: undefined, // No group assigned
  }
];

// Mock Supabase client setup
const createMockSupabaseClient = () => {
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  const mockEq = vi.fn();
  const mockSingle = vi.fn();
  const mockOrder = vi.fn();
  const mockUpdate = vi.fn();
  const mockAuth = {
    setAuth: vi.fn(),
    getUser: vi.fn(),
  };

  // Chain the query builder methods
  mockFrom.mockReturnValue({ select: mockSelect });
  mockSelect.mockReturnValue({ eq: mockEq });
  mockEq.mockReturnValue({ 
    single: mockSingle,
    order: mockOrder,
  });
  mockOrder.mockReturnValue({ single: mockSingle });
  mockUpdate.mockReturnValue({ eq: mockEq });

  return {
    auth: mockAuth,
    from: mockFrom,
    mockFrom,
    mockSelect,
    mockEq,
    mockSingle,
    mockOrder,
    mockUpdate,
  };
};

// Location Context Service Mock (simulating the edge function logic)
class LocationContextService {
  private supabase: any;

  constructor(supabaseClient: any) {
    this.supabase = supabaseClient;
  }

  async getLocationContext(userId: string, preferredLocationId?: string) {
    console.log(`Getting location context for user: ${userId}, preferred: ${preferredLocationId}`);

    // Get user data
    const userData = mockUsers.find(u => u.id === userId);
    if (!userData) {
      throw new Error('User not found');
    }

    if (!userData.group_id) {
      throw new Error('User not assigned to any group');
    }

    // Get group data
    const group = mockGroups.find(g => g.id === userData.group_id);
    if (!group) {
      throw new Error('Group not found');
    }

    // Get locations for the group
    const locations = mockLocations.filter(l => l.group_id === userData.group_id);
    if (locations.length === 0) {
      throw new Error('No locations available for user group');
    }

    // Determine active location with fallback logic
    let activeLocation: MockLocation | null = null;

    // 1. Try preferred location
    if (preferredLocationId) {
      activeLocation = locations.find(loc => loc.id === preferredLocationId) || null;
      if (!activeLocation) {
        console.warn(`Preferred location ${preferredLocationId} not available for user`);
      }
    }

    // 2. Try user's assigned location
    if (!activeLocation && userData.location_id) {
      activeLocation = locations.find(loc => loc.id === userData.location_id) || null;
      if (!activeLocation) {
        console.warn(`User's assigned location ${userData.location_id} not found in available locations`);
      }
    }

    // 3. Default to main location
    if (!activeLocation) {
      activeLocation = locations.find(loc => loc.is_main === true) || null;
    }

    // 4. Fallback to first available location
    if (!activeLocation && locations.length > 0) {
      activeLocation = locations[0];
    }

    if (!activeLocation) {
      throw new Error('No accessible location found');
    }

    return {
      group,
      locations,
      activeLocation,
    };
  }

  async setLocation(userId: string, locationId: string) {
    console.log(`Setting location for user: ${userId} to location: ${locationId}`);

    // Get user data
    const userData = mockUsers.find(u => u.id === userId);
    if (!userData) {
      throw new Error('User not found');
    }

    if (!userData.group_id) {
      throw new Error('User not assigned to any group');
    }

    // Verify location exists and belongs to user's group
    const location = mockLocations.find(l => l.id === locationId);
    if (!location) {
      throw new Error('Invalid location specified');
    }

    if (location.group_id !== userData.group_id) {
      throw new Error('Forbidden: Access denied to location outside your group');
    }

    // Update user's location preference (simulate)
    userData.location_id = locationId;

    // Return updated context
    return this.getLocationContext(userId);
  }
}

describe('Location Middleware Tests', () => {
  let locationService: LocationContextService;
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    (createClient as any).mockReturnValue(mockSupabase);
    locationService = new LocationContextService(mockSupabase);
  });

  describe('Mock User with Multiple Locations', () => {
    it('should handle user with assigned location correctly', async () => {
      const result = await locationService.getLocationContext('user-1');
      
      expect(result.group.id).toBe('group-1');
      expect(result.group.name).toBe('Main Group');
      expect(result.locations).toHaveLength(3); // 3 locations in group-1
      expect(result.activeLocation.id).toBe('location-2'); // User's assigned location
      expect(result.activeLocation.name).toBe('Branch Store');
    });

    it('should handle user with multiple locations and preferred location', async () => {
      const result = await locationService.getLocationContext('user-1', 'location-3');
      
      expect(result.group.id).toBe('group-1');
      expect(result.locations).toHaveLength(3);
      expect(result.activeLocation.id).toBe('location-3'); // Preferred location
      expect(result.activeLocation.name).toBe('Express Store');
    });

    it('should allow switching between available locations', async () => {
      // Initial context
      let result = await locationService.getLocationContext('user-1');
      expect(result.activeLocation.id).toBe('location-2');

      // Switch to another location in same group
      result = await locationService.setLocation('user-1', 'location-1');
      expect(result.activeLocation.id).toBe('location-1');
      expect(result.activeLocation.name).toBe('Main Store');

      // Switch to third location
      result = await locationService.setLocation('user-1', 'location-3');
      expect(result.activeLocation.id).toBe('location-3');
      expect(result.activeLocation.name).toBe('Express Store');
    });
  });

  describe('Validate activeLocation Fallback Logic', () => {
    it('should fallback to main location when user has no assigned location', async () => {
      const result = await locationService.getLocationContext('user-2');
      
      expect(result.group.id).toBe('group-1');
      expect(result.locations).toHaveLength(3);
      expect(result.activeLocation.id).toBe('location-1'); // Main location fallback
      expect(result.activeLocation.is_main).toBe(true);
    });

    it('should fallback to main location when preferred location is invalid', async () => {
      const result = await locationService.getLocationContext('user-2', 'invalid-location');
      
      expect(result.group.id).toBe('group-1');
      expect(result.activeLocation.id).toBe('location-1'); // Main location fallback
      expect(result.activeLocation.is_main).toBe(true);
    });

    it('should fallback to main location when assigned location is not available', async () => {
      // Create a user with invalid assigned location
      const userWithInvalidLocation = {
        id: 'user-invalid-location',
        email: 'invalid@example.com',
        group_id: 'group-1',
        location_id: 'invalid-location-id',
      };
      mockUsers.push(userWithInvalidLocation);

      const result = await locationService.getLocationContext('user-invalid-location');
      
      expect(result.group.id).toBe('group-1');
      expect(result.activeLocation.id).toBe('location-1'); // Main location fallback
      expect(result.activeLocation.is_main).toBe(true);
    });

    it('should fallback to first location when no main location exists', async () => {
      // Temporarily modify locations to have no main location
      const originalLocations = [...mockLocations];
      mockLocations.forEach(loc => {
        if (loc.group_id === 'group-1') {
          loc.is_main = false;
        }
      });

      try {
        const result = await locationService.getLocationContext('user-2');
        
        expect(result.group.id).toBe('group-1');
        expect(result.activeLocation.id).toBe('location-1'); // First location fallback
        expect(result.activeLocation.name).toBe('Main Store');
      } finally {
        // Restore original data
        mockLocations.splice(0, mockLocations.length, ...originalLocations);
      }
    });
  });

  describe('Test Invalid Location Access (403)', () => {
    it('should deny access to location outside user group', async () => {
      await expect(
        locationService.setLocation('user-1', 'location-4')
      ).rejects.toThrow('Forbidden: Access denied to location outside your group');
    });

    it('should deny access to non-existent location', async () => {
      await expect(
        locationService.setLocation('user-1', 'non-existent-location')
      ).rejects.toThrow('Invalid location specified');
    });

    it('should deny access when user has no group', async () => {
      await expect(
        locationService.getLocationContext('user-no-group')
      ).rejects.toThrow('User not assigned to any group');
    });

    it('should deny access when user does not exist', async () => {
      await expect(
        locationService.getLocationContext('non-existent-user')
      ).rejects.toThrow('User not found');
    });

    it('should handle cross-group location access attempts', async () => {
      // User from group-2 trying to access group-1 location
      await expect(
        locationService.setLocation('user-3', 'location-1')
      ).rejects.toThrow('Forbidden: Access denied to location outside your group');

      // User from group-1 trying to access group-2 location
      await expect(
        locationService.setLocation('user-1', 'location-4')
      ).rejects.toThrow('Forbidden: Access denied to location outside your group');
    });

    it('should validate preferred location belongs to user group', async () => {
      // User-1 (group-1) requesting location from group-2 as preferred
      const result = await locationService.getLocationContext('user-1', 'location-4');
      
      // Should ignore invalid preferred location and use fallback
      expect(result.activeLocation.id).toBe('location-2'); // User's assigned location
      expect(result.activeLocation.group_id).toBe('group-1');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty locations array', async () => {
      // Temporarily remove all locations for group-1
      const originalLocations = [...mockLocations];
      const filteredLocations = mockLocations.filter(loc => loc.group_id !== 'group-1');
      mockLocations.splice(0, mockLocations.length, ...filteredLocations);

      try {
        await expect(
          locationService.getLocationContext('user-1')
        ).rejects.toThrow('No locations available for user group');
      } finally {
        // Restore original data
        mockLocations.splice(0, mockLocations.length, ...originalLocations);
      }
    });

    it('should handle missing group data', async () => {
      // Create user with non-existent group
      const userWithInvalidGroup = {
        id: 'user-invalid-group',
        email: 'invalidgroup@example.com',
        group_id: 'non-existent-group',
        location_id: undefined,
      };
      mockUsers.push(userWithInvalidGroup);

      await expect(
        locationService.getLocationContext('user-invalid-group')
      ).rejects.toThrow('Group not found');
    });

    it('should maintain data consistency during location switches', async () => {
      // Get initial state
      const initial = await locationService.getLocationContext('user-1');
      expect(initial.activeLocation.id).toBe('location-2');

      // Switch location
      const switched = await locationService.setLocation('user-1', 'location-3');
      expect(switched.activeLocation.id).toBe('location-3');
      expect(switched.locations).toHaveLength(3);
      expect(switched.group.id).toBe('group-1');

      // Verify the change persisted
      const final = await locationService.getLocationContext('user-1');
      expect(final.activeLocation.id).toBe('location-3');
    });
  });

  describe('Multi-user Scenarios', () => {
    it('should handle multiple users in same group independently', async () => {
      const user1Context = await locationService.getLocationContext('user-1');
      const user2Context = await locationService.getLocationContext('user-2');

      expect(user1Context.group.id).toBe(user2Context.group.id);
      expect(user1Context.locations).toEqual(user2Context.locations);
      expect(user1Context.activeLocation.id).toBe('location-2'); // User 1's assigned
      expect(user2Context.activeLocation.id).toBe('location-1'); // Fallback to main
    });

    it('should handle users from different groups correctly', async () => {
      const user1Context = await locationService.getLocationContext('user-1'); // group-1
      const user3Context = await locationService.getLocationContext('user-3'); // group-2

      expect(user1Context.group.id).toBe('group-1');
      expect(user3Context.group.id).toBe('group-2');
      expect(user1Context.locations).toHaveLength(3);
      expect(user3Context.locations).toHaveLength(1);
      expect(user1Context.activeLocation.group_id).toBe('group-1');
      expect(user3Context.activeLocation.group_id).toBe('group-2');
    });
  });
});