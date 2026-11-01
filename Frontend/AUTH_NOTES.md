# Authentication prototype notes

- Login now offers separate Agent and Admin entry points.
- Public sign-up creates Agent demo accounts only. Admin accounts should be provisioned by an authorized administrator, never through public sign-up.
- The current demo stores account names, emails, and role labels in browser localStorage. It deliberately does not store passwords and therefore cannot verify credentials securely.
- The agent and admin demo credentials are hardcoded in the frontend JavaScript, so anyone who can load the site can inspect them.
- Login role matching is a UI demonstration, not an authorization boundary. The Flask backend must verify passwords with a secure password hash, issue a server-managed session, and enforce agent/admin permissions on every protected route/API before real use.
- Do not use this prototype for real accounts, financial records, or sensitive data until backend authentication and authorization are implemented.
