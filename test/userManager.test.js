/**
 * UserManager utility tests
 *
 * Unit tests for the UserManager class
 */

const { UserManager } = require('../src/userManager');

describe('UserManager', () => {
  let userManager;

  beforeEach(() => {
    userManager = new UserManager();
  });

  describe('User Creation', () => {
    it('should create a new user with valid data', () => {
      const user = userManager.createUser('John Doe', 'john@example.com');

      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name', 'John Doe');
      expect(user).toHaveProperty('email', 'john@example.com');
      expect(user).toHaveProperty('createdAt');
      expect(user).toHaveProperty('updatedAt');
      expect(user).toHaveProperty('isActive', true);
      expect(typeof user.id).toBe('string');
    });

    it('should create user with additional data', () => {
      const additionalData = { role: 'admin', department: 'IT' };
      const user = userManager.createUser('Jane Doe', 'jane@example.com', additionalData);

      expect(user).toHaveProperty('role', 'admin');
      expect(user).toHaveProperty('department', 'IT');
    });

    it('should normalize email to lowercase', () => {
      const user = userManager.createUser('John Doe', 'JOHN@EXAMPLE.COM');
      expect(user.email).toBe('john@example.com');
    });

    it('should trim whitespace from name and email', () => {
      const user = userManager.createUser('  John Doe  ', '  john@example.com  ');
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
    });

    it('should assign incremental IDs', () => {
      const user1 = userManager.createUser('User 1', 'user1@example.com');
      const user2 = userManager.createUser('User 2', 'user2@example.com');

      expect(parseInt(user1.id)).toBeLessThan(parseInt(user2.id));
    });

    it('should throw error for missing name', () => {
      expect(() => userManager.createUser('', 'john@example.com')).toThrow(
        'Name is required and must be a string'
      );

      expect(() => userManager.createUser(null, 'john@example.com')).toThrow(
        'Name is required and must be a string'
      );
    });

    it('should throw error for missing email', () => {
      expect(() => userManager.createUser('John Doe', '')).toThrow(
        'Email is required and must be a string'
      );

      expect(() => userManager.createUser('John Doe', null)).toThrow(
        'Email is required and must be a string'
      );
    });

    it('should throw error for invalid email format', () => {
      expect(() => userManager.createUser('John Doe', 'invalid-email')).toThrow(
        'Invalid email format'
      );

      expect(() => userManager.createUser('John Doe', 'john@')).toThrow('Invalid email format');

      expect(() => userManager.createUser('John Doe', '@example.com')).toThrow(
        'Invalid email format'
      );
    });

    it('should throw error for duplicate email', () => {
      userManager.createUser('User 1', 'duplicate@example.com');

      expect(() => userManager.createUser('User 2', 'duplicate@example.com')).toThrow(
        'User with email duplicate@example.com already exists'
      );
    });

    it('should detect duplicate email case-insensitively', () => {
      userManager.createUser('User 1', 'case@example.com');

      expect(() => userManager.createUser('User 2', 'CASE@example.com')).toThrow('already exists');
    });
  });

  describe('User Retrieval', () => {
    beforeEach(() => {
      userManager.createUser('John Doe', 'john@example.com');
      userManager.createUser('Jane Smith', 'jane@example.com');
    });

    describe('getUserById', () => {
      it('should retrieve user by valid ID', () => {
        const user = userManager.getUserById('1');
        expect(user).not.toBeNull();
        expect(user.name).toBe('John Doe');
        expect(user.email).toBe('john@example.com');
      });

      it('should return null for non-existent ID', () => {
        const user = userManager.getUserById('999');
        expect(user).toBeNull();
      });

      it('should return copy to prevent external modification', () => {
        const user1 = userManager.getUserById('1');
        const user2 = userManager.getUserById('1');

        expect(user1).not.toBe(user2);

        user1.name = 'Modified';
        expect(user2.name).toBe('John Doe');
      });
    });

    describe('getUserByEmail', () => {
      it('should retrieve user by valid email', () => {
        const user = userManager.getUserByEmail('jane@example.com');
        expect(user).not.toBeNull();
        expect(user.name).toBe('Jane Smith');
      });

      it('should be case insensitive', () => {
        const user = userManager.getUserByEmail('JOHN@EXAMPLE.COM');
        expect(user).not.toBeNull();
        expect(user.name).toBe('John Doe');
      });

      it('should return null for non-existent email', () => {
        const user = userManager.getUserByEmail('nonexistent@example.com');
        expect(user).toBeNull();
      });

      it('should return null for invalid input', () => {
        expect(userManager.getUserByEmail(null)).toBeNull();
        expect(userManager.getUserByEmail('')).toBeNull();
        expect(userManager.getUserByEmail(123)).toBeNull();
      });
    });

    describe('getAllUsers', () => {
      it('should return all users', () => {
        const users = userManager.getAllUsers();
        expect(users).toHaveLength(2);
        expect(users[0].name).toBe('Jane Smith'); // Newest first
        expect(users[1].name).toBe('John Doe');
      });

      it('should return copies to prevent external modification', () => {
        const users = userManager.getAllUsers();
        users[0].name = 'Modified';

        const users2 = userManager.getAllUsers();
        expect(users2[0].name).not.toBe('Modified');
      });

      it('should filter active users only', () => {
        userManager.deleteUser('1'); // Soft delete

        const allUsers = userManager.getAllUsers();
        const activeUsers = userManager.getAllUsers({ activeOnly: true });

        expect(allUsers).toHaveLength(2);
        expect(activeUsers).toHaveLength(1);
        expect(activeUsers[0].name).toBe('Jane Smith');
      });

      it('should support pagination with limit', () => {
        userManager.createUser('User 3', 'user3@example.com');

        const users = userManager.getAllUsers({ limit: 2 });
        expect(users).toHaveLength(2);
      });

      it('should support pagination with offset', () => {
        userManager.createUser('User 3', 'user3@example.com');

        const users = userManager.getAllUsers({ offset: 1, limit: 2 });
        expect(users).toHaveLength(2);
        expect(users[0].name).toBe('Jane Smith');
      });
    });
  });

  describe('User Updates', () => {
    let userId;

    beforeEach(() => {
      const user = userManager.createUser('John Doe', 'john@example.com');
      userId = user.id;
    });

    it('should update user name', () => {
      const updatedUser = userManager.updateUser(userId, { name: 'John Smith' });

      expect(updatedUser).not.toBeNull();
      expect(updatedUser.name).toBe('John Smith');
      expect(updatedUser.email).toBe('john@example.com');
      expect(updatedUser.updatedAt).not.toBe(updatedUser.createdAt);
    });

    it('should update user email', () => {
      const updatedUser = userManager.updateUser(userId, { email: 'johnsmith@example.com' });

      expect(updatedUser.email).toBe('johnsmith@example.com');
    });

    it('should update multiple fields', () => {
      const updates = {
        name: 'John Smith',
        email: 'johnsmith@example.com',
        department: 'Engineering',
      };

      const updatedUser = userManager.updateUser(userId, updates);

      expect(updatedUser.name).toBe('John Smith');
      expect(updatedUser.email).toBe('johnsmith@example.com');
      expect(updatedUser.department).toBe('Engineering');
    });

    it('should return null for non-existent user', () => {
      const result = userManager.updateUser('999', { name: 'Test' });
      expect(result).toBeNull();
    });

    it('should prevent ID changes', () => {
      const updatedUser = userManager.updateUser(userId, { id: '999', name: 'Test' });
      expect(updatedUser.id).toBe(userId);
    });

    it('should prevent createdAt changes', () => {
      const originalUser = userManager.getUserById(userId);
      const updatedUser = userManager.updateUser(userId, {
        createdAt: '2020-01-01T00:00:00.000Z',
        name: 'Test',
      });

      expect(updatedUser.createdAt).toBe(originalUser.createdAt);
    });

    it('should throw error for invalid name update', () => {
      expect(() => userManager.updateUser(userId, { name: '' })).toThrow(
        'Name must be a non-empty string'
      );

      expect(() => userManager.updateUser(userId, { name: null })).toThrow(
        'Name must be a non-empty string'
      );
    });

    it('should throw error for invalid email format', () => {
      expect(() => userManager.updateUser(userId, { email: 'invalid' })).toThrow(
        'Invalid email format'
      );
    });

    it('should throw error for duplicate email', () => {
      userManager.createUser('Jane Doe', 'jane@example.com');

      expect(() => userManager.updateUser(userId, { email: 'jane@example.com' })).toThrow(
        'already exists'
      );
    });

    it('should allow updating to same email', () => {
      const updatedUser = userManager.updateUser(userId, {
        email: 'john@example.com',
        name: 'John Updated',
      });

      expect(updatedUser.email).toBe('john@example.com');
      expect(updatedUser.name).toBe('John Updated');
    });
  });

  describe('User Deletion', () => {
    let userId;

    beforeEach(() => {
      const user = userManager.createUser('John Doe', 'john@example.com');
      userId = user.id;
    });

    it('should soft delete user', () => {
      const result = userManager.deleteUser(userId);
      expect(result).toBe(true);

      const user = userManager.getUserById(userId);
      expect(user.isActive).toBe(false);
      expect(user).toHaveProperty('deletedAt');
    });

    it('should return false for non-existent user', () => {
      const result = userManager.deleteUser('999');
      expect(result).toBe(false);
    });

    it('should permanently delete user', () => {
      const result = userManager.permanentlyDeleteUser(userId);
      expect(result).toBe(true);

      const user = userManager.getUserById(userId);
      expect(user).toBeNull();
    });

    it('should reactivate soft-deleted user', () => {
      userManager.deleteUser(userId);
      const result = userManager.reactivateUser(userId);
      expect(result).toBe(true);

      const user = userManager.getUserById(userId);
      expect(user.isActive).toBe(true);
      expect(user).not.toHaveProperty('deletedAt');
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      userManager.createUser('John Doe', 'john@example.com');
      userManager.createUser('Jane Smith', 'jane@example.com');
      userManager.createUser('Bob Johnson', 'bob@company.com');
    });

    it('should search by name', () => {
      const results = userManager.searchUsers('john');
      expect(results).toHaveLength(2); // John Doe and Bob Johnson

      const names = results.map((user) => user.name);
      expect(names).toContain('John Doe');
      expect(names).toContain('Bob Johnson');
    });

    it('should search by email', () => {
      const results = userManager.searchUsers('example.com');
      expect(results).toHaveLength(2);
    });

    it('should be case insensitive', () => {
      const results = userManager.searchUsers('JOHN');
      expect(results).toHaveLength(2);
    });

    it('should return empty array for no matches', () => {
      const results = userManager.searchUsers('nonexistent');
      expect(results).toHaveLength(0);
    });

    it('should return empty array for invalid input', () => {
      expect(userManager.searchUsers(null)).toHaveLength(0);
      expect(userManager.searchUsers('')).toHaveLength(0);
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      userManager.createUser('User 1', 'user1@example.com');
      userManager.createUser('User 2', 'user2@example.com');
      userManager.deleteUser('1'); // Soft delete first user
    });

    it('should return accurate statistics', () => {
      const stats = userManager.getStatistics();

      expect(stats.totalUsers).toBe(2);
      expect(stats.activeUsers).toBe(1);
      expect(stats.inactiveUsers).toBe(1);
    });

    it('should calculate recent users', () => {
      const stats = userManager.getStatistics();
      expect(stats.recentUsers).toBe(2); // Both created within last 7 days
    });

    it('should track oldest and newest users', () => {
      const stats = userManager.getStatistics();
      expect(stats.oldestUser).toBeTruthy();
      expect(stats.newestUser).toBeTruthy();
    });

    it('should handle empty user list', () => {
      userManager.clearAllUsers();
      const stats = userManager.getStatistics();

      expect(stats.totalUsers).toBe(0);
      expect(stats.activeUsers).toBe(0);
      expect(stats.inactiveUsers).toBe(0);
      expect(stats.oldestUser).toBeNull();
      expect(stats.newestUser).toBeNull();
    });
  });

  describe('Utility Methods', () => {
    it('should clear all users', () => {
      userManager.createUser('User 1', 'user1@example.com');
      userManager.createUser('User 2', 'user2@example.com');

      expect(userManager.getAllUsers()).toHaveLength(2);

      userManager.clearAllUsers();

      expect(userManager.getAllUsers()).toHaveLength(0);

      // Should reset ID counter
      const newUser = userManager.createUser('New User', 'new@example.com');
      expect(newUser.id).toBe('1');
    });
  });
});
