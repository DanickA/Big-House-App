module.exports = {
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('mocked-jwt-token'),
  })),
  jwtVerify: jest.fn().mockResolvedValue({
    payload: { userId: 'mock-user-id', nombre: 'Mock User', email: 'mock@example.com' },
  }),
};
