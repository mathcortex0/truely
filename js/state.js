// ============================================
// TRUELY - Global State Management
// ============================================

window.TruelyState = {
  currentUser: null,
  userProfile: null,
  isInitialized: false,
  
  // Listeners for state changes
  listeners: [],
  
  // Subscribe to state changes
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  },
  
  // Notify all listeners
  notify() {
    this.listeners.forEach(listener => listener(this));
  },
  
  // Update user
  setUser(user, profile) {
    this.currentUser = user;
    this.userProfile = profile;
    this.isInitialized = true;
    this.notify();
  },
  
  // Clear user (logout)
  clearUser() {
    this.currentUser = null;
    this.userProfile = null;
    this.notify();
  }
};
