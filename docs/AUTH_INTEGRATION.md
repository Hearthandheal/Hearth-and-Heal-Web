Frontend integration examples for Hearth & Heal auth API

1) Register (POST)

fetch(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/auth/register`, {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Alice', email: 'alice@example.com', password: 'safepassword' }),
})
.then(r => r.json()).then(console.log);

2) Login (POST)

fetch('/api/auth/login', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'alice@example.com', password: 'safepassword' }),
}).then(r => r.json()).then(console.log);

3) Get current user (GET)

fetch('/api/auth/me', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log);

4) Forgot password (POST)

fetch('/api/auth/forgot-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'alice@example.com' }),
}).then(r => r.json()).then(console.log);

5) Reset password (POST)

fetch('/api/auth/reset-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token: 'token-from-email', password: 'newpassword' }),
}).then(r => r.json()).then(console.log);

Notes:
- Use credentials: 'include' on fetch calls if using cookies for auth.
- In production with cross-site cookies, set FRONTEND_URL to your frontend domain and ensure cookieOptions.secure and sameSite are configured appropriately.
