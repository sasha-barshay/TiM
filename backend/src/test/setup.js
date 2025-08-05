const { server } = require('../index');

// Global test setup
beforeAll(async () => {
  // Wait for server to be ready
  await new Promise(resolve => setTimeout(resolve, 1000));
});

// Global test teardown
afterAll(async () => {
  // Close server after all tests
  if (server) {
    await new Promise(resolve => server.close(resolve));
  }
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}; 