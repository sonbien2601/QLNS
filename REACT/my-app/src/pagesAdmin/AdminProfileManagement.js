import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import moment from 'moment';

const MySwal = withReactContent(Swal);

const AdminProfileManagement = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const labelMap = {
        username: 'Tên đăng nhập',
        fullName: 'Tên đầy đủ',
        email: 'Email',
        phoneNumber: 'Số điện thoại',
        companyName: 'Tên công ty',
        city: 'Thành phố',
        gender: 'Giới tính',
        position: 'Chức vụ',
        role: 'Vai trò',
        basicSalary: 'Lương cơ bản',
        contractStart: 'Ngày bắt đầu hợp đồng',
        contractEnd: 'Ngày kết thúc hợp đồng',
        contractType: 'Loại hợp đồng',
        contractStatus: 'Trạng thái hợp đồng',
        employeeType: 'Loại nhân viên'
    };

    const genderOptions = ['Nam', 'Nữ', 'Khác'];
    const roleOptions = ['admin', 'user', 'manager'];
    const employeeTypeOptions = ['Thử việc', 'Chính thức'];
    const contractTypeOptions = ['Toàn thời gian', 'Bán thời gian', 'Tạm thời'];
    const contractStatusOptions = ['Kích hoạt', 'Hết hạn', 'Tạm ngưng'];


    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại.');
            }
            const response = await axios.get(`http://localhost:5000/api/auth/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data.users);
            setLoading(false);
        } catch (err) {
            console.error('Lỗi khi lấy danh sách user:', err);
            setError('Lỗi khi lấy danh sách user: ' + (err.response?.data?.message || err.message));
            setLoading(false);
        }
    };

    const handleUserSelect = (userId) => {
        const selectedUser = users.find(user => user._id === userId);
        setSelectedUser(selectedUser);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSelectedUser(prevUser => ({ ...prevUser, [name]: value }));
    };


    const handlePasswordUpdate = async () => {
        setPasswordError('');
        if (newPassword !== confirmPassword) {
            setPasswordError('Mật khẩu mới và xác nhận mật khẩu không khớp');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const userId = selectedUser._id;

            // Gọi API để cập nhật mật khẩu
            const response = await axios.put(`http://localhost:5000/api/auth/admin/user/${userId}`,
                { password: newPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Lưu token mới và cập nhật thông tin người dùng trong local storage
            localStorage.setItem('token', response.data.newToken);
            localStorage.setItem('userId', response.data.user._id);
            localStorage.setItem('role', response.data.user.role);
            localStorage.setItem('fullName', response.data.user.fullName);
            localStorage.setItem('username', response.data.user.username);

            MySwal.fire({
                icon: 'success',
                title: 'Cập nhật mật khẩu thành công',
                showConfirmButton: false,
                timer: 1500
            });

            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            console.error('Lỗi khi cập nhật mật khẩu:', err);
            let errorMessage = 'Lỗi khi cập nhật mật khẩu';
            if (err.response) {
                errorMessage += ': ' + (err.response.data.message || err.message);
            } else if (err.request) {
                errorMessage += ': Không thể kết nối đến server';
            } else {
                errorMessage += ': ' + err.message;
            }
            MySwal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: errorMessage
            });
        }
    };

    const handleUpdate = async (field) => {
        try {
            let result;
            const currentValue = selectedUser[field];

            if (['gender', 'role', 'employeeType', 'contractType', 'contractStatus'].includes(field)) {
                let options;
                switch (field) {
                    case 'gender':
                        options = genderOptions;
                        break;
                    case 'role':
                        options = roleOptions;
                        break;
                    case 'employeeType':
                        // Nếu là nhân viên chính thức, chỉ cho phép option "Chính thức"
                        options = selectedUser.employeeType === 'Chính thức'
                            ? ['Chính thức']
                            : employeeTypeOptions;
                        break;
                    case 'contractType':
                        options = contractTypeOptions;
                        break;
                    case 'contractStatus':
                        options = contractStatusOptions;
                        break;
                    default:
                        options = [];
                }

                // Kiểm tra nếu đang cố chuyển từ chính thức về thử việc
                if (field === 'employeeType' &&
                    selectedUser.employeeType === 'Chính thức') {
                    await MySwal.fire({
                        icon: 'error',
                        title: 'Không thể thay đổi',
                        text: 'Không thể chuyển nhân viên chính thức về thử việc',
                    });
                    return;
                }

                result = await MySwal.fire({
                    title: `Chỉnh sửa ${labelMap[field]}`,
                    input: 'select',
                    inputOptions: options.reduce((acc, option) => ({ ...acc, [option]: option }), {}),
                    inputValue: currentValue,
                    showCancelButton: true,
                    confirmButtonText: 'Lưu',
                    cancelButtonText: 'Hủy',
                    customClass: {
                        confirmButton: 'swal2-confirm',
                        cancelButton: 'swal2-cancel'
                    }
                });

            } else if (['contractStart', 'contractEnd'].includes(field)) {
                result = await MySwal.fire({
                    title: `Chỉnh sửa ${labelMap[field]}`,
                    html: `<input id="datepicker" class="swal2-input" type="date" value="${currentValue}">`,
                    focusConfirm: false,
                    preConfirm: () => {
                        return document.getElementById('datepicker').value;
                    },
                    showCancelButton: true,
                    confirmButtonText: 'Lưu',
                    cancelButtonText: 'Hủy',
                    customClass: {
                        confirmButton: 'swal2-confirm',
                        cancelButton: 'swal2-cancel'
                    }
                });
            } else {
                result = await MySwal.fire({
                    title: `Chỉnh sửa ${labelMap[field]}`,
                    input: 'text',
                    inputValue: currentValue,
                    showCancelButton: true,
                    confirmButtonText: 'Lưu',
                    cancelButtonText: 'Hủy',
                    customClass: {
                        confirmButton: 'swal2-confirm',
                        cancelButton: 'swal2-cancel'
                    }
                });
            }

            if (result.isConfirmed) {
                const newValue = result.value;
                const token = localStorage.getItem('token');
                const userId = selectedUser._id;
                let updateData = { [field]: newValue };

                // Xử lý đặc biệt khi chuyển từ thử việc sang chính thức
                if (field === 'employeeType' && newValue === 'Chính thức' && selectedUser.employeeType === 'Thử việc') {
                    const contractResult = await MySwal.fire({
                        title: 'Nhập thông tin hợp đồng chính thức',
                        html: `
                            <div class="form-group" style="margin-bottom: 1rem;">
                                <label style="display: block; margin-bottom: 0.5rem; text-align: left;">
                                    Loại hợp đồng:
                                </label>
                                <select id="contractType" class="swal2-input" style="width: 100%">
                                    <option value="">Chọn loại hợp đồng</option>
                                    <option value="Toàn thời gian">Toàn thời gian</option>
                                    <option value="Bán thời gian">Bán thời gian</option>
                                    <option value="Tạm thời">Tạm thời</option>
                                </select>
                            </div>
                            <div class="form-group" style="margin-bottom: 1rem;">
                                <label style="display: block; margin-bottom: 0.5rem; text-align: left;">
                                    Ngày bắt đầu hợp đồng:
                                </label>
                                <input id="contractStart" type="date" class="swal2-input" style="width: 100%">
                            </div>
                            <div class="form-group" style="margin-bottom: 1rem;">
                                <label style="display: block; margin-bottom: 0.5rem; text-align: left;">
                                    Ngày kết thúc hợp đồng:
                                </label>
                                <input id="contractEnd" type="date" class="swal2-input" style="width: 100%">
                            </div>
                        `,
                        focusConfirm: false,
                        showCancelButton: true,
                        confirmButtonText: 'Xác nhận',
                        cancelButtonText: 'Hủy',
                        preConfirm: () => {
                            const contractType = document.getElementById('contractType').value;
                            const contractStart = document.getElementById('contractStart').value;
                            const contractEnd = document.getElementById('contractEnd').value;

                            if (!contractType || !contractStart || !contractEnd) {
                                Swal.showValidationMessage('Vui lòng điền đầy đủ thông tin hợp đồng');
                                return false;
                            }

                            const startDate = new Date(contractStart);
                            const endDate = new Date(contractEnd);

                            if (endDate <= startDate) {
                                Swal.showValidationMessage('Ngày kết thúc phải sau ngày bắt đầu');
                                return false;
                            }

                            return {
                                employeeType: 'Chính thức',
                                contractType,
                                contractStart,
                                contractEnd,
                                contractStatus: 'active'
                            };
                        },
                        customClass: {
                            confirmButton: 'swal2-confirm',
                            cancelButton: 'swal2-cancel'
                        }
                    });

                    if (contractResult.isConfirmed) {
                        updateData = contractResult.value;
                    } else {
                        return;
                    }
                }

                try {
                    const response = await axios.put(
                        `http://localhost:5000/api/auth/admin/user/${userId}`,
                        updateData,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );

                    // Lấy token mới từ response header
                    const newToken = response.headers['new-token'];
                    if (newToken) {
                        localStorage.setItem('token', newToken);
                    }

                    // Cập nhật state
                    setUsers(prevUsers => prevUsers.map(user =>
                        user._id === userId ? { ...user, ...response.data.user } : user
                    ));

                    setSelectedUser(prevUser => ({
                        ...prevUser,
                        ...response.data.user
                    }));

                    await MySwal.fire({
                        icon: 'success',
                        title: 'Cập nhật thành công!',
                        showConfirmButton: false,
                        timer: 1500
                    });
                } catch (error) {
                    console.error(`Lỗi khi cập nhật ${labelMap[field]}:`, error);
                    await MySwal.fire({
                        icon: 'error',
                        title: 'Lỗi',
                        text: error.response?.data?.message || `Lỗi khi cập nhật ${labelMap[field]}`
                    });
                }
            }
        } catch (error) {
            console.error('Lỗi:', error);
            await MySwal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Đã xảy ra lỗi không mong muốn'
            });
        }
    };

    const formatDate = (dateString) => {
        return moment(dateString).format('DD/MM/YYYY');
    };

    const renderFieldValue = (key, value) => {
        if (['contractStart', 'contractEnd'].includes(key)) {
            return formatDate(value);
        }
        if (key === 'contractType') {
            return value === 'fullTime' ? 'Toàn thời gian' :
                value === 'partTime' ? 'Bán thời gian' :
                    value === 'temporary' ? 'Tạm thời' : value;
        }
        if (key === 'contractStatus') {
            return value === 'active' ? 'Kích hoạt' : value;
        }
        return value;
    };


    if (loading) return <LoadingMessage>Đang tải...</LoadingMessage>;
    if (error) return <ErrorMessage>{error}</ErrorMessage>;

    return (
        <Container>
            <Header>Quản lý Hồ sơ Nhân viên / Admin</Header>
            <MainLayout>
                <UserList>
                    {users.map(user => (
                        <UserItem
                            key={user._id}
                            selected={selectedUser?._id === user._id}
                            onClick={() => handleUserSelect(user._id)}
                        >
                            {user.fullName} - {user.position} ({user.role})
                        </UserItem>
                    ))}
                </UserList>

                {selectedUser && (
                    <UserDetails>
                        <h3>Chi tiết thông tin nhân viên:</h3>
                        <DetailsTable>
                            <thead>
                                <tr>
                                    <th>Thông tin</th>
                                    <th>Giá trị</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(selectedUser).map(([key, value]) => {
                                    // Bỏ qua các trường không cần hiển thị
                                    if (['password', '_id', '__v', 'createdAt', 'updatedAt'].includes(key)) return null;
                                    const label = labelMap[key] || key;

                                    // Kiểm tra điều kiện hiển thị các trường hợp đồng
                                    const isContractField = ['contractType', 'contractStart', 'contractEnd', 'contractStatus'].includes(key);
                                    const isTrialEmployee = selectedUser.employeeType === 'Thử việc';

                                    // Ẩn các trường hợp đồng nếu là nhân viên thử việc
                                    if (isContractField && isTrialEmployee) {
                                        return null;
                                    }

                                    return (
                                        <tr key={key}>
                                            <td>{label}</td>
                                            <td>{renderFieldValue(key, value)}</td>
                                            <td>
                                                {/* Hiển thị nút chỉnh sửa trong mọi trường hợp vì người dùng hiện tại là admin */}
                                                <Button onClick={() => handleUpdate(key)}>Chỉnh sửa</Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </DetailsTable>
                        <h4>Mật khẩu:</h4>
                        <InputContainer>
                            <Input
                                type="password"
                                placeholder="Mật khẩu mới"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                            <Input
                                type="password"
                                placeholder="Xác nhận mật khẩu mới"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            {passwordError && <ErrorMessage>{passwordError}</ErrorMessage>}
                            <Button onClick={handlePasswordUpdate}>Lưu mật khẩu</Button>
                        </InputContainer>
                    </UserDetails>
                )}
            </MainLayout>
        </Container>
    );
};




// Các thành phần CSS được nâng cấp
const Container = styled.div`
    max-width: 1200px;
    margin: 20px auto;
    padding: 40px;
    background-color: #ffffff;
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;

    @media (max-width: 768px) {
        padding: 20px;
    }
`;

const Header = styled.h2`
    font-size: 36px;
    text-align: center;
    margin-bottom: 40px;
    color: #2c3e50;
    font-weight: 700;
    position: relative;
    
    &:after {
        content: '';
        display: block;
        width: 60px;
        height: 4px;
        background-color: #3498db;
        margin: 10px auto 0;
        border-radius: 2px;
    }
`;

const MainLayout = styled.div`
    display: flex;
    gap: 40px;

    @media (max-width: 1024px) {
        flex-direction: column;
    }
`;

const UserList = styled.div`
    flex: 1;
    background-color: #f8f9fa;
    border-radius: 12px;
    padding: 25px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
    max-height: 600px;
    overflow-y: auto;

    &::-webkit-scrollbar {
        width: 8px;
    }

    &::-webkit-scrollbar-track {
        background: #f1f1f1;
    }

    &::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb:hover {
        background: #555;
    }
`;

const UserItem = styled.div`
    padding: 15px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    background-color: ${props => props.selected ? '#e3f2fd' : 'transparent'};
    margin-bottom: 10px;

    &:hover {
        background-color: #e9ecef;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
    }
`;

const UserDetails = styled.div`
    flex: 2;
    background-color: #ffffff;
    border-radius: 12px;
    padding: 30px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
`;

const DetailsTable = styled.table`
    width: 100%;
    border-collapse: separate;
    border-spacing: 0 12px;
    margin-top: 25px;

    th, td {
        padding: 18px;
        text-align: left;
    }

    th {
        background-color: #f8f9fa;
        font-weight: 600;
        color: #2c3e50;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    td {
        background-color: #ffffff;
        border-bottom: 1px solid #e9ecef;
        transition: all 0.3s ease;
    }

    tr:hover td {
        background-color: #f8f9fa;
        transform: scale(1.01);
    }
`;

const Button = styled.button`
    background-color: #3498db;
    color: #fff;
    padding: 12px 20px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 600;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);

    &:hover {
        background-color: #2980b9;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }
`;

const InputContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-top: 25px;
    background-color: #f8f9fa;
    padding: 25px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
`;

const Input = styled.input`
    padding: 14px;
    border: 2px solid #ced4da;
    border-radius: 8px;
    font-size: 16px;
    transition: all 0.3s ease;

    &:focus {
        outline: none;
        border-color: #3498db;
        box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
    }
`;

const LoadingMessage = styled.div`
    text-align: center;
    font-size: 28px;
    color: #3498db;
    margin-top: 60px;
    font-weight: 600;
`;

const ErrorMessage = styled.div`
    color: #e74c3c;
    background-color: #fdf1f0;
    padding: 18px;
    border-radius: 8px;
    margin-top: 25px;
    font-weight: 600;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
`;

// Styles mới cho SweetAlert
const SweetAlertStyles = `
    .swal2-popup {
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
    }
    .swal2-title {
        font-size: 24px;
        color: #2c3e50;
    }
    .swal2-confirm {
        background-color: #3498db !important;
        color: white !important;
        border-radius: 8px !important;
        font-weight: 600 !important;
        padding: 12px 24px !important;
        box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3) !important;
    }
    .swal2-cancel {
        background-color: #e74c3c !important;
        color: white !important;
        border-radius: 8px !important;
        font-weight: 600 !important;
        padding: 12px 24px !important;
        box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3) !important;
    }
    .swal2-input {
        border-radius: 8px !important;
        border: 2px solid #ced4da !important;
        padding: 12px !important;
        font-size: 16px !important;
    }
    .swal2-input:focus {
        border-color: #3498db !important;
        box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2) !important;
    }
`;

// Thêm styles vào head của document
const styleElement = document.createElement('style');
styleElement.innerHTML = SweetAlertStyles;
document.head.appendChild(styleElement);

export default AdminProfileManagement;