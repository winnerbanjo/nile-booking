// Mock mode state management
// Shared between server.js and controllers

let MOCK_MODE = false;
const mockUsers = new Map();
const mockSchedules = new Map();

export { MOCK_MODE, mockUsers, mockSchedules };

// Setter function to enable/disable mock mode
export const setMockMode = (enabled) => {
  MOCK_MODE = enabled;
};

// Getter function for mock mode status
export const getMockMode = () => MOCK_MODE;
