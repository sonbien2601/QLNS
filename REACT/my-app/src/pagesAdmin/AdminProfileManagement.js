import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

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
        gender: 'Giới tính  ',
        position: 'Chức vụ',    
        role: 'Vai trò',
        basicSalary: 'Lương cơ bản',
        contractStart: 'Ngày bắt đầu hợp đồng',
        contractEnd: 'Ngày kết thúc hợp đồng',
        contractType: 'Loại hợp đồng',
        contractStatus: 'Trạng thái hợp đồng'
    };

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
            await axios.put(`http://localhost:5000/api/auth/admin/user/${userId}/password`, 
                { newPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );
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
            MySwal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Lỗi khi cập nhật mật khẩu: ' + (err.response?.data?.message || err.message)
            });
        }
    };

    const handleUpdate = async (field) => {
        let result;
        if (field === 'employeeType') {
            result = await MySwal.fire({
                title: `Chỉnh sửa ${labelMap[field]}`,
                input: 'select',
                inputOptions: {
                    'thử việc': 'Thử việc',
                    'chính thức': 'Chính thức'
                },
                inputValue: selectedUser[field],
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
                inputValue: selectedUser[field],
                inputAttributes: {
                    'aria-label': 'Nhập giá trị mới',
                    style: 'width: 100%; max-width: 350px; margin: auto; margin-top: 12px;'
                },
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
            try {
                const token = localStorage.getItem('token');
                const userId = selectedUser._id;
                
                let updateData = { [field]: newValue };
    
                // Nếu đang cập nhật từ 'thử việc' sang 'chính thức'
                if (field === 'employeeType' && newValue === 'chính thức' && selectedUser.employeeType === 'thử việc') {
                    const contractResult = await MySwal.fire({
                        title: 'Nhập thông tin hợp đồng',
                        html:
                            '<select id="contractType" class="swal2-select" style="width: 100%; margin-bottom: 10px;">' +
                            '<option value="">Chọn loại hợp đồng</option>' +
                            '<option value="fullTime">Toàn thời gian</option>' +
                            '<option value="partTime">Bán thời gian</option>' +
                            '<option value="temporary">Tạm thời</option>' +
                            '</select>' +
                            '<input id="contractStart" class="swal2-input" type="date" placeholder="Ngày bắt đầu" style="width: 100%; margin-bottom: 10px;">' +
                            '<input id="contractEnd" class="swal2-input" type="date" placeholder="Ngày kết thúc" style="width: 100%; margin-bottom: 10px;">',
                        focusConfirm: false,
                        preConfirm: () => {
                            return {
                                contractType: document.getElementById('contractType').value,
                                contractStart: document.getElementById('contractStart').value,
                                contractEnd: document.getElementById('contractEnd').value,
                            }
                        },
                        showCancelButton: true,
                        confirmButtonText: 'Lưu',
                        cancelButtonText: 'Hủy',
                        customClass: {
                            confirmButton: 'swal2-confirm',
                            cancelButton: 'swal2-cancel'
                        }
                    });
    
                    if (contractResult.isConfirmed) {
                        updateData = {
                            ...updateData,
                            ...contractResult.value,
                            contractStatus: 'active'
                        };
                    } else {
                        // Nếu người dùng không nhập thông tin hợp đồng, hủy cập nhật
                        return;
                    }
                }
    
                await axios.put(`http://localhost:5000/api/auth/admin/user/${userId}`, updateData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
    
                MySwal.fire({
                    icon: 'success',
                    title: 'Cập nhật thành công!',
                    showConfirmButton: false,
                    timer: 1500
                });
    
                fetchUserData();
            } catch (err) {
                console.error(`Lỗi khi cập nhật ${labelMap[field]}:`, err);
                MySwal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: `Lỗi khi cập nhật ${labelMap[field]}: ` + (err.response?.data?.message || err.message)
                });
            }
        }
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
                                    if (key === 'password' || key === '_id' || key === '__v') return null;
                                    const label = labelMap[key] || key; 
                                    return (
                                        <tr key={key}>
                                            <td>{label}</td>
                                            <td>{value}</td>
                                            <td>
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

// Các thành phần CSS
// ... (Phần import và logic không thay đổi)

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
