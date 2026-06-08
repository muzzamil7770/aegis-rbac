# Test Plan
- [x] 1. Navigate to http://localhost:3000/register and fill out the registration form.
- [x] 2. Wait for registration success and redirect to login page (or manually navigate).
- [x] 3. Log in with the registered owner credentials.
- [x] 4. Verify dashboard loads properly.
- [x] 5. Navigate to Roles & Permissions and create "Support Manager" role.
- [x] 6. Navigate to Users Management and create "Jane Doe" user with "Support Manager" role.
- [x] 7. Navigate to Security Audit Logs and verify logs for register, login, role.create, user.create.
- [x] 8. Expand a log entry and verify JSON payload is displayed.
