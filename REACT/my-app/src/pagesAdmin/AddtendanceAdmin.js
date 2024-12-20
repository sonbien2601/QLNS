import React, { useEffect, useState } from 'react';
import NavigationAdmin from '../components/NavigationAdmin';
import moment from 'moment';
import 'moment/locale/vi';
import axios from 'axios';
import Swal from 'sweetalert2';
import styled from 'styled-components';
import { motion } from 'framer-motion';

// Time constants for working hours
const TIME_CONSTANTS = {
  WORKING_HOURS: {
    MORNING: {
      START: 8 * 60,      // 8:00
      END: 12 * 60,       // 12:00
      BUFFER: 15,         // 15 phút buffer
      LIMIT: '08:15'      // Thời gian giới hạn hiển thị
    },
    AFTERNOON: {
      START: 13 * 60 + 30, // 13:30
      END: 17 * 60 + 30,   // 17:30
      BUFFER: 15,          // 15 phút buffer
      LIMIT: '13:45'       // Thời gian giới hạn hiển thị
    }
  }
};

const PageContainer = styled.div`
  min-height: 100vh;
  background: #f3f4f6;
`;

const ContentContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

const CardHeader = styled.div`
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h1`
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
  margin: 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

const MonthYearSelector = styled.div`
  display: flex;
  gap: 1rem;
  color: white;

  select {
    padding: 0.5rem;
    border-radius: 6px;
    border: 1px solid white;
    background: transparent;
    color: white;
    font-size: 0.875rem;
    cursor: pointer;
    outline: none;

    option {
      background: #0ea5e9;
      color: white;
    }
  }
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  padding: 1.5rem;
  background: #f8fafc;
  margin-bottom: 1rem;
`;

const StatCard = styled.div`
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  .label {
    color: #64748b;
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
  }

  .value {
    color: #0f172a;
    font-size: 1.25rem;
    font-weight: 600;
  }
`;

const TableContainer = styled.div`
  padding: 1.5rem;
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  min-width: 1000px;

  th {
    background: #f8fafc;
    padding: 1rem;
    font-weight: 600;
    color: #1e293b;
    text-align: left;
    font-size: 0.875rem;
    text-transform: uppercase;
    border-bottom: 2px solid #e2e8f0;
  }

  td {
    padding: 1rem;
    border-bottom: 1px solid #f1f5f9;
    font-size: 0.875rem;
  }
`;

const DateRow = styled.tr`
  background-color: #f8fafc;
  font-weight: 600;
  
  td {
    background-color: #f1f5f9;
    color: #334155;
    padding: 0.75rem 1rem;
  }
`;

const AttendanceRow = styled.tr`
  background-color: white;
  border-bottom: 1px solid #e2e8f0;

  &:hover {
    background-color: #f8fafc;
  }

  td {
    padding: 1rem;
    border-bottom: none;
  }
`;

const SessionInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  .time {
    font-weight: 500;
    color: #1e293b;
  }

  .late-badge {
    font-size: 0.75rem;
    font-weight: 500;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    display: inline-block;

    /* Mặc định cho trạng thái đi muộn */
    color: #ef4444;
    background-color: #fef2f2;

    /* Style cho trạng thái đúng giờ */
    &.on-time {
      color: #15803d;
      background-color: #f0fdf4;
    }
  }
`;

const WorkingHours = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  .daily {
    color: #0ea5e9;
    font-weight: 500;
  }

  .monthly {
    color: #64748b;
    font-size: 0.875rem;
  }
`;


const StatusBadge = styled.span`
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;

  ${({ status }) => {
    switch (status) {
      case 'present':
        return `
          background: #f0fdf4;
          color: #15803d;
          border: 1px solid #bbf7d0;
        `;
      case 'late':
        return `
          background: #fef2f2;
          color: #ef4444;
          border: 1px solid #fecaca;
        `;
      default:
        return `
          background: #fefce8;
          color: #ca8a04;
          border: 1px solid #fef08a;
        `;
    }
  }}
`;

// Utils
const timeToMinutes = (timeString) => {
  if (!timeString) return null;
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

const formatTime = (timeString) => {
  if (!timeString) return 'N/A';
  try {
    if (timeString.length <= 8 && timeString.includes(':')) {
      return timeString;
    }
    const parsedTime = moment(timeString).format('HH:mm:ss');
    return parsedTime === 'Invalid date' ? 'N/A' : parsedTime;
  } catch (error) {
    console.error('Error formatting time:', error, timeString);
    return 'N/A';
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const formattedDate = moment(dateString).format('DD/MM/YYYY');
    return formattedDate === 'Invalid date' ? 'N/A' : formattedDate;
  } catch (error) {
    console.error('Error formatting date:', error, dateString);
    return 'N/A';
  }
};

const checkLateStatus = (checkInTime, session) => {
  if (!checkInTime) return false;

  try {
    const time = moment(checkInTime, 'HH:mm:ss');
    const limit = moment(TIME_CONSTANTS.WORKING_HOURS[session].LIMIT, 'HH:mm');

    return time.isAfter(limit);
  } catch (error) {
    console.error('Error checking late status:', error);
    return false;
  }
};

const formatWorkHours = (timeString) => {
  if (!timeString || timeString === 'undefined' || timeString === null) return '0 giờ 0 phút';

  try {
    // Nếu timeString đã là dạng "X giờ Y phút"
    if (typeof timeString === 'string' && timeString.includes('giờ')) {
      return timeString;
    }

    // Nếu là số thập phân (ví dụ: 7.5 giờ)
    if (typeof timeString === 'number') {
      const hours = Math.floor(timeString);
      const minutes = Math.round((timeString - hours) * 60);
      return `${hours} giờ ${minutes} phút`;
    }

    return '0 giờ 0 phút';
  } catch (error) {
    console.error('Error formatting work hours:', error);
    return '0 giờ 0 phút';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'present': return 'Đúng giờ';
    case 'late': return 'Đi muộn';
    case 'absent': return 'Vắng mặt';
    default: return 'N/A';
  }
};

// Check if a session is late based on check-in time
const isLate = (checkInTime, session) => {
  if (!checkInTime) return false;

  const checkInMinutes = timeToMinutes(checkInTime);
  if (checkInMinutes === null) return false;

  if (session === 'morning') {
    const lateThreshold = TIME_CONSTANTS.WORKING_HOURS.MORNING.START + TIME_CONSTANTS.WORKING_HOURS.MORNING.BUFFER;
    return checkInMinutes > lateThreshold;
  } else if (session === 'afternoon') {
    const lateThreshold = TIME_CONSTANTS.WORKING_HOURS.AFTERNOON.START + TIME_CONSTANTS.WORKING_HOURS.AFTERNOON.BUFFER;
    return checkInMinutes > lateThreshold;
  }

  return false;
};

const formatBufferTime = (session) => {
  const { START, BUFFER } = TIME_CONSTANTS.WORKING_HOURS[session];
  const totalMinutes = START + BUFFER;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const AttendanceAdmin = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(moment().month() + 1);
  const [currentYear, setCurrentYear] = useState(moment().year());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/auth/attendance/all', {
        headers: { Authorization: `Bearer ${token}` },
        params: { month: currentMonth, year: currentYear }
      });

      setAttendanceRecords(response.data.attendanceRecords || []);
      setMonthlyStats(response.data.summary || null);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setError(error.response?.data?.message || 'Không thể tải dữ liệu chấm công');
      Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Không thể tải dữ liệu chấm công'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [currentMonth, currentYear]);

  const renderStats = () => (
    <StatsContainer>
      <StatCard>
        <div className="label">Tổng số ngày làm việc</div>
        <div className="value">{monthlyStats?.workingDays || 0} ngày</div>
      </StatCard>
      <StatCard>
        <div className="label">Số lần đi muộn</div>
        <div className="value">{monthlyStats?.totalLateRecords || 0}</div>
      </StatCard>
      <StatCard>
        <div className="label">Tổng giờ làm việc</div>
        <div className="value">{formatWorkHours(monthlyStats?.totalWorkHours || 0)}</div>
      </StatCard>
      <StatCard>
        <div className="label">Trung bình giờ làm/người</div>
        <div className="value">{formatWorkHours(monthlyStats?.averageWorkHours || 0)}</div>
      </StatCard>
    </StatsContainer>
  );

  const renderAttendanceRow = (record) => {
    // Kiểm tra trạng thái đi muộn cho từng ca
    const isMorningLate = record.morningSession?.isLate || checkLateStatus(record.morningSession?.checkIn, 'MORNING');
    const isAfternoonLate = record.afternoonSession?.isLate || checkLateStatus(record.afternoonSession?.checkIn, 'AFTERNOON');

    // Xác định trạng thái tổng thể
    let status = 'present';
    if (isMorningLate || isAfternoonLate) {
      status = 'late';
    } else if (!record.morningSession?.checkIn && !record.afternoonSession?.checkIn) {
      status = 'absent';
    }

    return (
      <AttendanceRow key={record._id}>
        <td>{record.userId?.fullName || 'N/A'}</td>
        <td>{record.userId?.position || 'N/A'}</td>
        <td>
          <SessionInfo>
            <span className="time">
              {formatTime(record.morningSession?.checkIn)}
            </span>
            {record.morningSession?.checkIn && (
              <span className={`late-badge ${!isMorningLate ? 'on-time' : ''}`}>
                {isMorningLate ? 'Đi muộn' : 'Đúng giờ'}
              </span>
            )}
          </SessionInfo>
        </td>
        <td>
          <SessionInfo>
            <span className="time">
              {formatTime(record.morningSession?.checkOut)}
            </span>
          </SessionInfo>
        </td>
        <td>
          <SessionInfo>
            <span className="time">
              {formatTime(record.afternoonSession?.checkIn)}
            </span>
            {record.afternoonSession?.checkIn && (
              <span className={`late-badge ${!isAfternoonLate ? 'on-time' : ''}`}>
                {isAfternoonLate ? 'Đi muộn' : 'Đúng giờ'}
              </span>
            )}
          </SessionInfo>
        </td>
        <td>
          <SessionInfo>
            <span className="time">
              {formatTime(record.afternoonSession?.checkOut)}
            </span>
          </SessionInfo>
        </td>
        <td>
          <WorkingHours>
            <span className="daily">
              {formatWorkHours(record.workingHours?.daily)}
            </span>
            <span className="monthly">
              Tháng: {formatWorkHours(record.workingHours?.monthly)}
            </span>
          </WorkingHours>
        </td>
        <td>
          <StatusBadge status={status}>
            {getStatusText(status)}
          </StatusBadge>
        </td>
      </AttendanceRow>
    );
  };

  if (error) {
    return (
      <PageContainer>
        <ContentContainer>
          <Card>
            <CardHeader>
              <Title>Lỗi</Title>
            </CardHeader>
            <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
              {error}
            </div>
          </Card>
        </ContentContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <NavigationAdmin />
      <ContentContainer>
        <Card>
          <CardHeader>
            <Title>Tổng Hợp Chấm Công</Title>
            <MonthYearSelector>
              <select
                value={currentMonth}
                onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                ))}
              </select>
              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(parseInt(e.target.value))}
              >
                {Array.from({ length: 5 }, (_, i) => (
                  <option key={currentYear - 2 + i} value={currentYear - 2 + i}>
                    Năm {currentYear - 2 + i}
                  </option>
                ))}
              </select>
            </MonthYearSelector>
          </CardHeader>

          {monthlyStats && renderStats()}

          <TableContainer>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải dữ liệu...</div>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <th>Tên Nhân Viên</th>
                    <th>Chức Vụ</th>
                    <th>Check In Sáng</th>
                    <th>Check Out Sáng</th>
                    <th>Check In Chiều</th>
                    <th>Check Out Chiều</th>
                    <th>Tổng Thời Gian</th>
                    <th>Trạng Thái</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(
                    attendanceRecords.reduce((acc, record) => {
                      const date = formatDate(record.date);
                      if (!acc[date]) acc[date] = [];
                      acc[date].push(record);
                      return acc;
                    }, {})
                  ).map(([date, records]) => (
                    <React.Fragment key={date}>
                      <DateRow>
                        <td colSpan={8}>
                          {date} - {moment(records[0].date).format('dddd')}
                        </td>
                      </DateRow>
                      {records.map(renderAttendanceRow)}
                    </React.Fragment>
                  ))}
                </tbody>
              </Table>
            )}
          </TableContainer>
        </Card>
      </ContentContainer>
    </PageContainer>
  );
};

export default AttendanceAdmin;