import api from './axios';

export const breakdownTask = (data) => api.post('/ai/breakdown', data);
export const generateStandup = (data) => api.post('/ai/standup', data);
export const predictDeadline = (data) => api.post('/ai/predict-deadline', data);