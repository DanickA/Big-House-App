module.exports = {
  cookies: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockReturnValue({ value: 'mocked-jwt-token' }),
    set: jest.fn(),
    delete: jest.fn(),
  })),
  headers: jest.fn().mockImplementation(() => new Map()),
};
