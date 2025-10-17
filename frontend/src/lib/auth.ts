// src/lib/auth.ts
export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  window.location.href = '/'; // redirect to homepage
}

export function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

export function getRole() {
  return typeof window !== 'undefined' ? localStorage.getItem('role') : null;
}
