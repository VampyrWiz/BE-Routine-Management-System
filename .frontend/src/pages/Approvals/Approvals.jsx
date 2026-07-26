import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

// Default form values for a new approval request submitted by a teacher
const INIT_REQUEST = { reason: '', requested_hours: 1 };

export default function Approvals() {
  const { teacher } = useAuth();
  const [approvals, setApprovals] = useState([]);
  // showRequestModal: the modal teachers use to submit new approval requests
  const [showRequestModal, setShowRequestModal] = useState(false);
  // showActionModal: the modal hod/dhod use to review and respond to a request
  const [showActionModal, setShowActionModal] = useState(false);
  // selectedApproval holds the full approval object while the action modal is open
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [requestForm, setRequestForm] = useState(INIT_REQUEST);

  const isHodOrDhod = teacher?.role === 'hod' || teacher?.role === 'dhod';

  useEffect(() => { fetchApprovals(); }, []);

  const fetchApprovals = async () => {
    try {
      const { data } = await api.get('/approvals');
      setApprovals(data);
    } catch (err) {
      console.error(err);
    }
  };

  // getTeacherName safely extracts the teacher name from a populated
  // teacher_id object. If the API returns the ID as a raw string (unpopulated),
  // this falls back to '-' since we cannot resolve it here without a lookup.
  const getTeacherName = (a) => {
    if (typeof a.teacher_id === 'object' && a.teacher_id) return a.teacher_id.name || '-';
    return '-';
  };

  // Teacher submits a new approval request via POST
  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    try {
      await api.post('/approvals', requestForm);
      setShowRequestModal(false);
      setRequestForm(INIT_REQUEST);
      fetchApprovals();
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting request');
    }
  };

  // Hod/dhod responds to a pending request: approve or reject with optional remarks.
  // The same handleAction is called with different status values ("approved" vs "rejected").
  const handleAction = async (status) => {
    try {
      await api.put(`/approvals/${selectedApproval._id}/respond`, { status, remarks });
      setShowActionModal(false);
      setSelectedApproval(null);
      setRemarks('');
      fetchApprovals();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating approval');
    }
  };

  // Maps status values to CSS class names for color-coded badges
  const statusBadge = {
    pending: 'badge-pending',
    approved: 'badge-approved',
    rejected: 'badge-rejected',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Approvals</h2>
        {/* "New Request" button visible only to teachers; hod/dhod do not
            submit requests, they review them. */}
        {teacher?.role === 'teacher' && (
          <button className="btn btn-primary" onClick={() => { setRequestForm(INIT_REQUEST); setShowRequestModal(true); }}>
            + New Request
          </button>
        )}
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Teacher Name</th>
                <th>Requested Hours</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Date</th>
                <th>Remarks</th>
                {isHodOrDhod && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {approvals.map(a => (
                <tr key={a._id}>
                  <td>{getTeacherName(a)}</td>
                  <td>{a.requested_hours}h</td>
                  <td>{a.reason}</td>
                  <td><span className={`badge ${statusBadge[a.status] || 'badge-pending'}`}>{a.status?.toUpperCase()}</span></td>
                  <td>{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '-'}</td>
                  <td>{a.remarks || '-'}</td>
                  {isHodOrDhod && (
                    <td>
                      {/* Review button only appears on pending requests — once
                          a request is approved/rejected, no further action is needed. */}
                      {a.status === 'pending' && (
                        <button className="btn btn-sm btn-primary" onClick={() => { setSelectedApproval(a); setRemarks(''); setShowActionModal(true); }}>
                          Review
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {approvals.length === 0 && (
                <tr>
                  <td colSpan={isHodOrDhod ? 7 : 6} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 24 }}>No approvals found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Teacher's "submit request" modal: simple form with reason (textarea)
          and requested hours (number input). */}
      {showRequestModal && (
        <div className="modal-overlay" onClick={() => setShowRequestModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Submit Approval Request</h3>
            <form onSubmit={handleSubmitRequest}>
              <div className="form-group">
                <label>Reason</label>
                <textarea className="form-control" rows={3} value={requestForm.reason} onChange={e => setRequestForm({ ...requestForm, reason: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Requested Hours</label>
                <input className="form-control" type="number" min={1} value={requestForm.requested_hours} onChange={e => setRequestForm({ ...requestForm, requested_hours: Number(e.target.value) })} required />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }} onClick={() => setShowRequestModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hod/dhod "review" modal: shows request details in a read-only card,
          an optional remarks textarea, and two action buttons (Approve/Reject).
          This uses the selectedApproval state set when the user clicked Review. */}
      {showActionModal && selectedApproval && (
        <div className="modal-overlay" onClick={() => setShowActionModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Review Approval Request</h3>
            <div className="card" style={{ marginBottom: 16 }}>
              <p><strong>Teacher:</strong> {getTeacherName(selectedApproval)}</p>
              <p><strong>Hours:</strong> {selectedApproval.requested_hours}h</p>
              <p><strong>Reason:</strong> {selectedApproval.reason}</p>
            </div>
            <div className="form-group">
              <label>Remarks (optional)</label>
              <textarea className="form-control" rows={3} value={remarks} onChange={e => setRemarks(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }} onClick={() => setShowActionModal(false)}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={() => handleAction('rejected')}>Reject</button>
              <button type="button" className="btn btn-success" onClick={() => handleAction('approved')}>Approve</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
