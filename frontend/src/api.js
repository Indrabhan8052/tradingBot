import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export const getStatus = () => axios.get(`${API_BASE}/status`).then((r) => r.data);
export const startBot = () => axios.post(`${API_BASE}/start`).then((r) => r.data);
export const stopBot = () => axios.post(`${API_BASE}/stop`).then((r) => r.data);
export const emergencyStop = () => axios.post(`${API_BASE}/emergency-stop`).then((r) => r.data);
export const resumeBot = () => axios.post(`${API_BASE}/resume`).then((r) => r.data);
export const updateConfig = (config) =>
  axios.put(`${API_BASE}/config`, config).then((r) => r.data);
export const getTrades = () => axios.get(`${API_BASE}/trades`).then((r) => r.data);
export const getPnlSummary = () => axios.get(`${API_BASE}/pnl-summary`).then((r) => r.data);
