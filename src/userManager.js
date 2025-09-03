/**
 * UserManager utility class
 * 
 * Provides user management functionality for the sample application.
 * This class demonstrates CRUD operations and serves as an example
 * for testing different types of changes in semantic versioning.
 */

class UserManager {
  constructor() {
    this.users = new Map();
    this.nextId = 1;
  }

  /**
   * Create a new user
   * @param {string} name - User's name
   * @param {string} email - User's email address
   * @param {Object} additionalData - Additional user data (optional)
   * @returns {Object} Created user object
   */
  createUser(name, email, additionalData = {}) {
    // Validation
    if (!name || typeof name !== 'string') {
      throw new Error('Name is required and must be a string');
    }

    if (!email || typeof email !== 'string') {
      throw new Error('Email is required and must be a string');
    }

    if (!this._isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    // Check for duplicate email
    if (this._emailExists(email)) {
      throw new Error(`User with email ${email} already exists`);
    }

    // Create user object
    const user = {
      id: this.nextId.toString(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      ...additionalData
    };

    // Store user
    this.users.set(user.id, user);
    this.nextId++;

    return { ...user }; // Return copy to prevent external modification
  }

  /**
   * Get user by ID
   * @param {string} id - User ID
   * @returns {Object|null} User object or null if not found
   */
  getUserById(id) {
    const user = this.users.get(id);
    return user ? { ...user } : null; // Return copy to prevent external modification
  }

  /**
   * Get user by email
   * @param {string} email - User email
   * @returns {Object|null} User object or null if not found
   */
  getUserByEmail(email) {
    if (!email || typeof email !== 'string') {
      return null;
    }

    const normalizedEmail = email.toLowerCase().trim();
    
    for (const user of this.users.values()) {
      if (user.email === normalizedEmail) {
        return { ...user }; // Return copy
      }
    }

    return null;
  }

  /**
   * Get all users
   * @param {Object} options - Query options
   * @param {boolean} options.activeOnly - Return only active users
   * @param {number} options.limit - Limit number of results
   * @param {number} options.offset - Offset for pagination
   * @returns {Array} Array of user objects
   */
  getAllUsers(options = {}) {
    const { activeOnly = false, limit, offset = 0 } = options;
    
    let users = Array.from(this.users.values());

    // Filter active users if requested
    if (activeOnly) {
      users = users.filter(user => user.isActive);
    }

    // Sort by creation date (newest first)
    users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply pagination
    if (limit) {
      users = users.slice(offset, offset + limit);
    } else if (offset > 0) {
      users = users.slice(offset);
    }

    // Return copies to prevent external modification
    return users.map(user => ({ ...user }));
  }

  /**
   * Update user information
   * @param {string} id - User ID
   * @param {Object} updates - Updates to apply
   * @returns {Object|null} Updated user object or null if not found
   */
  updateUser(id, updates) {
    const user = this.users.get(id);
    
    if (!user) {
      return null;
    }

    // Validate email if being updated
    if (updates.email) {
      if (!this._isValidEmail(updates.email)) {
        throw new Error('Invalid email format');
      }

      const normalizedEmail = updates.email.toLowerCase().trim();
      
      // Check for duplicate email (excluding current user)
      if (normalizedEmail !== user.email && this._emailExists(normalizedEmail)) {
        throw new Error(`User with email ${normalizedEmail} already exists`);
      }

      updates.email = normalizedEmail;
    }

    // Apply updates
    const updatedUser = {
      ...user,
      ...updates,
      id: user.id, // Prevent ID changes
      createdAt: user.createdAt, // Prevent createdAt changes
      updatedAt: new Date().toISOString()
    };

    // Validate name if being updated
    if (updates.name !== undefined) {
      if (!updates.name || typeof updates.name !== 'string') {
        throw new Error('Name must be a non-empty string');
      }
      updatedUser.name = updates.name.trim();
    }

    this.users.set(id, updatedUser);
    return { ...updatedUser }; // Return copy
  }

  /**
   * Delete user (soft delete - marks as inactive)
   * @param {string} id - User ID
   * @returns {boolean} True if user was deleted, false if not found
   */
  deleteUser(id) {
    const user = this.users.get(id);
    
    if (!user) {
      return false;
    }

    // Soft delete - mark as inactive
    user.isActive = false;
    user.updatedAt = new Date().toISOString();
    user.deletedAt = new Date().toISOString();

    return true;
  }

  /**
   * Permanently remove user from storage
   * @param {string} id - User ID
   * @returns {boolean} True if user was removed, false if not found
   */
  permanentlyDeleteUser(id) {
    return this.users.delete(id);
  }

  /**
   * Reactivate a soft-deleted user
   * @param {string} id - User ID
   * @returns {boolean} True if user was reactivated, false if not found
   */
  reactivateUser(id) {
    const user = this.users.get(id);
    
    if (!user) {
      return false;
    }

    user.isActive = true;
    user.updatedAt = new Date().toISOString();
    delete user.deletedAt; // Remove deletion timestamp

    return true;
  }

  /**
   * Get user statistics
   * @returns {Object} Statistics about users
   */
  getStatistics() {
    const allUsers = Array.from(this.users.values());
    const activeUsers = allUsers.filter(user => user.isActive);
    const inactiveUsers = allUsers.filter(user => !user.isActive);

    return {
      totalUsers: allUsers.length,
      activeUsers: activeUsers.length,
      inactiveUsers: inactiveUsers.length,
      recentUsers: allUsers
        .filter(user => {
          const daysSinceCreation = (Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24);
          return daysSinceCreation <= 7;
        })
        .length,
      oldestUser: allUsers.length > 0 ? 
        allUsers.reduce((oldest, user) => 
          new Date(user.createdAt) < new Date(oldest.createdAt) ? user : oldest
        ).createdAt : null,
      newestUser: allUsers.length > 0 ? 
        allUsers.reduce((newest, user) => 
          new Date(user.createdAt) > new Date(newest.createdAt) ? user : newest
        ).createdAt : null
    };
  }

  /**
   * Clear all users
   */
  clearAllUsers() {
    this.users.clear();
    this.nextId = 1;
  }

  /**
   * Validate email format
   * @private
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid email format
   */
  _isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check if email already exists
   * @private
   * @param {string} email - Email to check
   * @returns {boolean} True if email exists
   */
  _emailExists(email) {
    const normalizedEmail = email.toLowerCase().trim();
    
    for (const user of this.users.values()) {
      if (user.email === normalizedEmail) {
        return true;
      }
    }

    return false;
  }

  /**
   * Search users by name or email
   * @param {string} query - Search query
   * @returns {Array} Array of matching users
   */
  searchUsers(query) {
    if (!query || typeof query !== 'string') {
      return [];
    }

    const searchTerm = query.toLowerCase().trim();
    
    return this.getAllUsers()
      .filter(user => 
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
      );
  }
}

module.exports = { UserManager };