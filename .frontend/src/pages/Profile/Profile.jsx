// Profile page allows the logged-in teacher to view and edit their own
// account details (name, email, contact, designation) and optionally change
// their password. On save it calls PUT /api/auth/profile then updates the
// AuthContext so the sidebar and topbar immediately reflect the new values
// without requiring a re-login.
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export default function Profile() {
  const { teacher, updateTeacher } = useAuth();
  // Pre-fill the form from AuthContext so the user sees their current values.
  // Password fields start blank; only if the user types in them will a new
  // password be sent to the server.
  const [form, setForm] = useState({
    name: teacher?.name || '',
    email: teacher?.email || '',
    contact: teacher?.contact || '',
    designation: teacher?.designation || '',
    password: '',
    confirmPassword: '',
  });
  // msg holds either a success confirmation or a validation/API error.
  const [msg, setMsg] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });

    // Client-side check before hitting the server — saves a round-trip
    // when the two password fields do not match.
    if (form.password && form.password !== form.confirmPassword) {
      setMsg({ type: 'danger', text: 'Passwords do not match' });
      return;
    }

    try {
      // Build the payload with only the fields the user is allowed to change.
      // password is omitted unless the user actually entered a new value.
      const body = {
        name: form.name,
        email: form.email,
        contact: form.contact,
        designation: form.designation,
      };
      if (form.password) body.password = form.password;

      const { data } = await api.put('/auth/profile', body);
      // Sync the returned teacher object into AuthContext + localStorage so
      // the sidebar and topbar show the updated name/email/designation.
      updateTeacher(data);
      // Clear password fields after a successful save so the user knows
      // they were applied and won't accidentally re-submit the same value.
      setForm((prev) => ({ ...prev, password: '', confirmPassword: '' }));
      setMsg({ type: 'success', text: 'Profile updated successfully' });
    } catch (err) {
      setMsg({ type: 'danger', text: err.response?.data?.message || 'Failed to update profile' });
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>My Profile</h2>

      <div className="card">
        {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Name</label>
              <input
                className="form-control"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                className="form-control"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Contact</label>
              <input
                className="form-control"
                name="contact"
                value={form.contact}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Designation</label>
              <input
                className="form-control"
                name="designation"
                value={form.designation}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="card-title" style={{ marginTop: 16 }}>Change Password</div>
          <div className="form-row">
            <div className="form-group">
              <label>New Password</label>
              <input
                className="form-control"
                name="password"
                type="password"
                placeholder="Leave blank to keep current"
                value={form.password}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                className="form-control"
                name="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={form.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}
