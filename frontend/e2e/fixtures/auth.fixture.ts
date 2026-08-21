export interface MockUser {
  id: number;
  email: string;
  name: string;
  role: 'ROLE_USER' | 'ROLE_ADMIN' | 'ROLE_MANAGER';
  timezone: string;
}

export const MOCK_USER: MockUser = {
  id: 1,
  email: 'owner@launchly.app',
  name: 'Test Owner',
  role: 'ROLE_USER',
  timezone: 'UTC',
};

export const MOCK_ADMIN: MockUser = {
  id: 99,
  email: 'admin@launchly.app',
  name: 'Super Admin',
  role: 'ROLE_ADMIN',
  timezone: 'UTC',
};
