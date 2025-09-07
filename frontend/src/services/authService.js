import api from './axiosConfig';

export const register = (data) => {
  return api.post('/register', data);
};

export const login = (data) => {
  return api.post('/login', data);
};

export const getProfile = () => {
  return api.get('/profile');
};

export const verifyOtp = (data) => {
  return api.post('/verify-otp', data);
};
