const { registerUser } = require('../server/services/AuthService');
const User = require('../models/User');

jest.mock('../models/User');

jest.mock('bcrypt', () => ({
  genSaltSync: jest.fn(),
  hashSync: jest.fn(),
}));

const mockUser = {
  email: 'test@example.com',
  password: 'test12345',
  confirm_password: 'test12345',
  name: 'Test User',
  username: 'testuser',
};

describe('registerUser', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('registers a new user', async () => {
    User.countDocuments.mockResolvedValue(0);
    User.findOne = jest.fn(() => ({ lean: () => null }));
    User.save = jest.fn();
    User.create.mockResolvedValue({ _id: 'mockUserId', ...mockUser });

    const result = await registerUser(mockUser);

    expect(result.status).toBe(200);
    expect(result.user).toBeDefined();
    expect(User.findOne).toHaveBeenCalledWith({ email: mockUser.email });
    expect(User.countDocuments).toHaveBeenCalled();
  });

  it('handles validation error', async () => {
    const validationError = new Error('Validation error message');
    validationError.details = [{ message: 'Validation error message' }];

    const result = await registerUser({});

    expect(result.status).toBe(422);
    expect(result.message).toBe('"name" is required');
  });

  it('handles existing user', async () => {
    User.findOne = jest.fn(() => ({ lean: () => true }));
    const result = await registerUser(mockUser);

    expect(result.status).toBe(500);
  });

  it('handles internal error', async () => {
    User.countDocuments.mockRejectedValue(new Error('Database error'));
    User.findOne = jest.fn(() => ({ lean: () => null }));
    const result = await registerUser(mockUser);

    expect(result.status).toBe(500);
    expect(result.message).toBe('Database error');
  });
});
