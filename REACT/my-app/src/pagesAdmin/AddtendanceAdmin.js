import React, { useEffect, useState } from 'react';
import NavigationAdmin from '../components/NavigationAdmin';

// Utils
const formatTime = (date) => {
  return date ? new Date(date).toLocaleTimeString('vi-VN') : 'N/A';
};

const formatDate = (date) => {
  return date ? new Date(date).toLocaleDateString('vi-VN') : 'N/A';
};

const isLateCheckIn = (time, period) => {
  if (!time) return false;
  const checkInTime = new Date(time);
  const hours = checkInTime.getHours();
  const minutes = checkInTime.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  if (period === 'morning') {
    // Sáng: sau 8:15 là muộn
    return timeInMinutes > 8 * 60 + 15;
  } else if (period === 'afternoon') {
    // Chiều: sau 13:45 là muộn (13:30 + 15 phút)
    return timeInMinutes > 13 * 60 + 45;
  }
  return false;
};

const getAttendanceStatus = (record) => {
  const morningLate = isLateCheckIn(record.morningCheckIn, 'morning');
  const afternoonLate = isLateCheckIn(record.afternoonCheckIn, 'afternoon');
  
  if (!record.morningCheckIn && !record.afternoonCheckIn) {
    return 'absent';
  } else if (morningLate || afternoonLate) {
    return 'late';
  }
  return 'present';
};

// Components
const TimeBadge = ({ time, period }) => {
  if (!time) return null;
  const isLate = isLateCheckIn(time, period);
  const threshold = period === 'morning' ? '8:15' : '13:45';
  
  return isLate ? (
    <div className="late-flag">
      <span className="late-time">Sau {threshold}</span>
    </div>
  ) : null;
};

const StatusBadge = ({ status }) => {
  const statusConfig = {
    late: { text: 'Đi muộn', className: 'status-late' },
    absent: { text: 'Vắng mặt', className: 'status-absent' },
    present: { text: 'Đúng giờ', className: 'status-ontime' }
  };

  const { text, className } = statusConfig[status] || statusConfig.absent;

  return (
    <div className={`status-badge ${className}`}>
      {text}
    </div>
  );
};

const AttendanceRow = ({ record }) => {
  const status = getAttendanceStatus(record);

  return (
    <tr className="table-row">
      <td>
        <div className="employee-cell">
          <span className="employee-name">{record.userId?.fullName || 'N/A'}</span>
        </div>
      </td>
      <td>
        <div className="position-cell">
          <span className="position-text">{record.userId?.position || 'N/A'}</span>
        </div>
      </td>
      <td>
        <div className="date-cell">
          {formatDate(record.date)}
        </div>
      </td>
      <td>
        <div className="time-cell">
          <span className={isLateCheckIn(record.morningCheckIn, 'morning') ? 'late-time' : ''}>
            {formatTime(record.morningCheckIn)}
          </span>
          <TimeBadge time={record.morningCheckIn} period="morning" />
        </div>
      </td>
      <td>
        <div className="time-cell">
          {formatTime(record.morningCheckOut)}
        </div>
      </td>
      <td>
        <div className="time-cell">
          <span className={isLateCheckIn(record.afternoonCheckIn, 'afternoon') ? 'late-time' : ''}>
            {formatTime(record.afternoonCheckIn)}
          </span>
          <TimeBadge time={record.afternoonCheckIn} period="afternoon" />
        </div>
      </td>
      <td>
        <div className="time-cell">
          {formatTime(record.afternoonCheckOut)}
        </div>
      </td>
      <td>
        <div className="total-cell">
          {record.totalHours || '0 giờ 0 phút'}
        </div>
      </td>
      <td>
        <div className="status-cell">
          <StatusBadge status={status} />
        </div>
      </td>
    </tr>
  );
};

const LoadingSpinner = () => (
  <div className="loading-overlay">
    <div className="spinner"></div>
    <span className="loading-text">Đang tải dữ liệu...</span>
  </div>
);

const ErrorMessage = ({ message }) => (
  <div className="error-container">
    <div className="error-icon">⚠️</div>
    <div className="error-message">{message}</div>
  </div>
);

const EmptyState = () => (
  <div className="empty-state">
    <div className="empty-icon">📊</div>
    <div className="empty-text">Chưa có dữ liệu chấm công</div>
  </div>
);

const AttendanceAdmin = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/auth/attendance/all', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });

        if (!response.ok) throw new Error('Lỗi kết nối máy chủ');

        const data = await response.json();
        if (Array.isArray(data.attendanceRecords)) {
          setAttendanceRecords(data.attendanceRecords.filter(record => record && record.userId));
        } else {
          throw new Error('Dữ liệu không hợp lệ');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="admin-container">
      <NavigationAdmin />
      <div className="content-wrapper">
        <div className="attendance-card">
          <div className="card-header">
            <h1 className="header-title">Tổng Hợp Chấm Công</h1>
          </div>
          
          <div className="card-body">
            {attendanceRecords.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="table-responsive">
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th>Tên Nhân Viên</th>
                      <th>Chức Vụ</th>
                      <th>Ngày</th>
                      <th>Check In Sáng</th>
                      <th>Check Out Sáng</th>
                      <th>Check In Chiều</th>
                      <th>Check Out Chiều</th>
                      <th>Tổng Thời Gian</th>
                      <th>Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceRecords.map((record) => (
                      <AttendanceRow key={record._id} record={record} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Styles
const styles = `
.admin-container {
  min-height: 100vh;
  background: #f3f4f6;
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.attendance-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.card-header {
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-title {
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
  margin: 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.card-body {
  padding: 1.5rem;
}

.table-responsive {
  overflow-x: auto;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.attendance-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.attendance-table th {
  background: #f8fafc;
  padding: 1rem;
  font-weight: 600;
  color: #1e293b;
  text-align: left;
  font-size: 0.875rem;
  text-transform: uppercase;
  border-bottom: 2px solid #e2e8f0;
}

.attendance-table td {
  padding: 1rem;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.875rem;
}

.table-row {
  transition: background-color 0.2s;
}

.table-row:hover {
  background-color: #f8fafc;
}

.employee-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.employee-name {
  font-weight: 600;
  color: #0f172a;
}

.position-text {
  color: #64748b;
  font-size: 0.875rem;
}

.date-cell {
  color: #475569;
  font-weight: 500;
}

.time-cell {
  position: relative;
  color: #475569;
}

.late-time {
  color: #ef4444;
  font-weight: 500;
}

.late-flag {
  position: absolute;
  top: -0.5rem;
  right: -0.5rem;
  background: #fef2f2;
  color: #ef4444;
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
}

.total-cell {
  font-weight: 500;
  color: #0f172a;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.status-late {
  background: #fef2f2;
  color: #ef4444;
  border: 1px solid #fecaca;
}

.status-ontime {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.status-absent {
  background: #fefce8;
  color: #ca8a04;
  border: 1px solid #fef08a;
}

/* Loading State */
.loading-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #0ea5e9;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  color: #64748b;
  font-size: 0.875rem;
}

/* Error State */
.error-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #fef2f2;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #fecaca;
  margin: 1rem 0;
}

.error-message {
  color: #ef4444;
  font-size: 0.875rem;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  background: #f8fafc;
  border-radius: 8px;
  gap: 1rem;
}

.empty-icon {
  font-size: 2rem;
}

.empty-text {
  color: #64748b;
  font-size: 0.875rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1024px) {
  .content-wrapper {
    padding: 1rem;
  }
  
  .card-header {
    padding: 1rem;
  }
  
  .header-title {
    font-size: 1.25rem;
  }
}
`;

const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default AttendanceAdmin;