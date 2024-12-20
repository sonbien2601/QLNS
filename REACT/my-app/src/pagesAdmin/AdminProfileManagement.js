import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import moment from 'moment';
import { jwtDecode } from 'jwt-decode';

const MySwal = withReactContent(Swal);

// Định nghĩa các styled-components cơ bản trước
const FormGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 15px;
`;

const Label = styled.label`
    font-weight: 600;
    color: #2d3748;
    font-size: 14px;
`;

const Select = styled.select`
    padding: 12px;
    border: 2px solid ${props => props.$hasError ? '#e74c3c' : '#ced4da'};
    border-radius: 8px;
    font-size: 14px;
    background-color: white;
    transition: all 0.3s ease;

    &:focus {
        outline: none;
        border-color: #3498db;
        box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
    }
`;

const Input = styled.input`
    padding: 14px;
    border: 2px solid ${props => props.$hasError ? '#e74c3c' : '#ced4da'};
    border-radius: 8px;
    font-size: 16px;
    transition: all 0.3s ease;

    &:focus {
        outline: none;
        border-color: #3498db;
        box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
    }
`;

const ErrorText = styled.span`
    color: #e74c3c;
    font-size: 12px;
    margin-top: 5px;
    display: block;
`;

const AdminProfileManagement = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [errors, setErrors] = useState({});

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
        contractDisplayStatus: 'Trạng thái hợp đồng',
        employeeType: 'Loại nhân viên',
        status: 'Trạng thái',
        // Thêm labels cho câu hỏi bảo mật
        securityQuestion1: 'Câu hỏi bảo mật 1',
        securityAnswer1: 'Câu trả lời 1',
        securityQuestion2: 'Câu hỏi bảo mật 2',
        securityAnswer2: 'Câu trả lời 2',
        securityQuestion3: 'Câu hỏi bảo mật 3',
        securityAnswer3: 'Câu trả lời 3'
    };


    // Thêm danh sách câu hỏi bảo mật
    const securityQuestions = [
        "Tên trường tiểu học đầu tiên của bạn là gì?",
        "Con vật đầu tiên bạn nuôi là gì?",
        "Họ và tên đệm của mẹ bạn là gì?",
        "Biệt danh thời thơ ấu của bạn là gì?",
        "Người bạn thân nhất thời phổ thông của bạn là ai?",
        "Món ăn yêu thích thời thơ ấu của bạn là gì?"
    ];


    const genderOptions = ['Nam', 'Nữ', 'Khác'];
    const roleOptions = ['admin', 'user', 'manager'];
    const employeeTypeOptions = ['Thử việc', 'Chính thức'];
    const contractTypeOptions = ['Toàn thời gian', 'Bán thời gian', 'Tạm thời'];
    const contractStatusOptions = ['Kích hoạt', 'Hết hạn', 'Tạm ngưng'];


    useEffect(() => {
        const init = async () => {
            try {
                // Kiểm tra token và phân quyền 
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại.');
                }

                // Decode token để lấy role
                const decodedToken = jwtDecode(token);
                const userRole = decodedToken.role;

                // Kiểm tra quyền truy cập
                if (!['admin', 'hr'].includes(userRole)) {
                    MySwal.fire({
                        icon: 'error',
                        title: 'Không có quyền truy cập!',
                        text: 'Bạn không có quyền truy cập trang này.',
                        confirmButtonColor: '#d33',
                    }).then(() => {
                        navigate('/');
                    });
                    return;
                }

                // Hiển thị thông báo cho HR
                if (userRole === 'hr') {
                    MySwal.fire({
                        icon: 'info',
                        title: 'Lưu ý!',
                        text: 'Các thay đổi thông tin nhân viên sẽ cần được Admin phê duyệt trước khi có hiệu lực.',
                        confirmButtonColor: '#3085d6',
                    });
                }

                // Fetch dữ liệu người dùng
                setLoading(true);
                const response = await axios.get(`http://localhost:5000/api/auth/users`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.headers['new-token']) {
                    localStorage.setItem('token', response.headers['new-token']);
                }

                setUsers(response.data.users);

            } catch (err) {
                console.error('Lỗi khởi tạo:', err);
                let errorMessage = 'Lỗi khi lấy danh sách user: ';

                if (err.response) {
                    switch (err.response.status) {
                        case 401:
                            errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
                            localStorage.removeItem('token');
                            navigate('/login');
                            break;
                        case 403:
                            errorMessage = 'Bạn không có quyền truy cập trang này';
                            navigate('/');
                            break;
                        default:
                            errorMessage += err.response.data.message || err.message;
                    }
                } else if (err.request) {
                    errorMessage = 'Không thể kết nối đến server';
                } else {
                    errorMessage += err.message;
                }

                setError(errorMessage);

                if (err.response?.status !== 401) {
                    MySwal.fire({
                        icon: 'error',
                        title: 'Lỗi',
                        text: errorMessage,
                        confirmButtonColor: '#d33',
                    });
                }
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [navigate]);

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


    // Thêm hàm xử lý cập nhật câu hỏi bảo mật
    const handleSaveSecurityQuestions = async () => {
        try {
            // Validate câu hỏi và câu trả lời
            const securityData = {
                securityQuestion1: selectedUser.securityQuestion1,
                securityAnswer1: selectedUser.securityAnswer1,
                securityQuestion2: selectedUser.securityQuestion2,
                securityAnswer2: selectedUser.securityAnswer2,
                securityQuestion3: selectedUser.securityQuestion3,
                securityAnswer3: selectedUser.securityAnswer3,
            };

            const newErrors = {};
            // Kiểm tra trống
            Object.keys(securityData).forEach(key => {
                if (!securityData[key]) {
                    newErrors[key] = `${labelMap[key]} không được để trống`;
                }
            });

            // Kiểm tra câu hỏi trùng nhau
            const questions = [
                securityData.securityQuestion1,
                securityData.securityQuestion2,
                securityData.securityQuestion3
            ];
            const uniqueQuestions = new Set(questions);
            if (uniqueQuestions.size !== questions.length) {
                newErrors.general = 'Các câu hỏi bảo mật không được trùng nhau';
            }

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                MySwal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: 'Vui lòng kiểm tra lại thông tin'
                });
                return;
            }

            const token = localStorage.getItem('token');
            const response = await axios.put(
                `http://localhost:5000/api/auth/admin/user/${selectedUser._id}`,
                securityData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.headers['new-token']) {
                localStorage.setItem('token', response.headers['new-token']);
            }

            setUsers(prevUsers => prevUsers.map(user =>
                user._id === selectedUser._id ? { ...user, ...response.data.user } : user
            ));

            setSelectedUser(prevUser => ({
                ...prevUser,
                ...response.data.user
            }));

            await MySwal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: 'Câu hỏi bảo mật đã được cập nhật',
                showConfirmButton: false,
                timer: 1500
            });

            setErrors({});
        } catch (error) {
            console.error('Lỗi khi cập nhật câu hỏi bảo mật:', error);
            MySwal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: error.response?.data?.message || 'Đã xảy ra lỗi khi cập nhật câu hỏi bảo mật'
            });
        }
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
            // Lấy token và kiểm tra role
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Không tìm thấy thông tin đăng nhập');
            }

            const decodedToken = jwtDecode(token);
            const userRole = decodedToken.role;
            let result;
            const currentValue = selectedUser[field];

            // Logic hiển thị form chỉnh sửa dựa trên loại field
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

                // Validation đặc biệt cho employeeType
                if (field === 'employeeType' && selectedUser.employeeType === 'Chính thức') {
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
                    cancelButtonText: 'Hủy'
                });

            } else if (field.startsWith('securityQuestion')) {
                result = await MySwal.fire({
                    title: `Chỉnh sửa ${labelMap[field]}`,
                    input: 'select',
                    inputOptions: securityQuestions.reduce((acc, question) => ({
                        ...acc,
                        [question]: question
                    }), {}),
                    inputValue: currentValue || "",
                    showCancelButton: true,
                    confirmButtonText: 'Lưu',
                    cancelButtonText: 'Hủy'
                });
            } else if (field.startsWith('securityAnswer')) {
                result = await MySwal.fire({
                    title: `Chỉnh sửa ${labelMap[field]}`,
                    input: 'text',
                    inputValue: currentValue || "",
                    inputValidator: (value) => {
                        if (!value) return 'Vui lòng nhập câu trả lời';
                    },
                    showCancelButton: true,
                    confirmButtonText: 'Lưu',
                    cancelButtonText: 'Hủy'
                });
            } else if (['contractStart', 'contractEnd'].includes(field)) {
                result = await MySwal.fire({
                    title: `Chỉnh sửa ${labelMap[field]}`,
                    html: `<input id="datepicker" class="swal2-input" type="date" value="${currentValue}">`,
                    focusConfirm: false,
                    preConfirm: () => document.getElementById('datepicker').value,
                    showCancelButton: true,
                    confirmButtonText: 'Lưu',
                    cancelButtonText: 'Hủy'
                });
            } else {
                result = await MySwal.fire({
                    title: `Chỉnh sửa ${labelMap[field]}`,
                    input: 'text',
                    inputValue: currentValue,
                    showCancelButton: true,
                    confirmButtonText: 'Lưu',
                    cancelButtonText: 'Hủy'
                });
            }

            // Xử lý sau khi người dùng chọn xong
            if (result.isConfirmed) {
                const newValue = result.value;
                const userId = selectedUser._id;
                let updateData = { [field]: newValue };

                // Validate câu hỏi bảo mật
                if (field.startsWith('securityQuestion')) {
                    const otherQuestions = [
                        selectedUser.securityQuestion1,
                        selectedUser.securityQuestion2,
                        selectedUser.securityQuestion3
                    ].filter((q, i) => `securityQuestion${i + 1}` !== field);

                    if (otherQuestions.includes(newValue)) {
                        await MySwal.fire({
                            icon: 'error',
                            title: 'Lỗi',
                            text: 'Câu hỏi bảo mật không được trùng nhau'
                        });
                        return;
                    }
                }

                // Xử lý đặc biệt cho chuyển từ thử việc sang chính thức
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
                        }
                    });

                    if (contractResult.isConfirmed) {
                        updateData = contractResult.value;
                    } else {
                        return;
                    }
                }

                try {
                    // Xử lý khác nhau cho HR và Admin
                    if (userRole === 'hr') {
                        const approvalResponse = await axios.post(
                            'http://localhost:5000/api/auth/approval-request',
                            {
                                requestType: 'update_user',
                                requestData: {
                                    userId: selectedUser._id,
                                    updateData: updateData,
                                    oldData: {
                                        [field]: currentValue
                                    }
                                }
                            },
                            { headers: { Authorization: `Bearer ${token}` } }
                        );

                        await MySwal.fire({
                            icon: 'success',
                            title: 'Đã gửi yêu cầu!',
                            text: 'Yêu cầu thay đổi thông tin đã được gửi đến Admin để phê duyệt.',
                            confirmButtonColor: '#3085d6'
                        });
                    } else {
                        // Admin cập nhật trực tiếp
                        const response = await axios.put(
                            `http://localhost:5000/api/auth/admin/user/${userId}`,
                            updateData,
                            { headers: { Authorization: `Bearer ${token}` } }
                        );

                        // Xử lý token mới nếu có
                        if (response.headers['new-token']) {
                            localStorage.setItem('token', response.headers['new-token']);
                        }

                        // Cập nhật UI
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
                    }
                } catch (error) {
                    let errorMessage = `Lỗi khi cập nhật ${labelMap[field]}`;
                    if (error.response?.status === 401) {
                        localStorage.removeItem('token');
                        navigate('/login');
                        errorMessage = 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.';
                    } else if (error.response?.data?.message) {
                        errorMessage = error.response.data.message;
                    }

                    await MySwal.fire({
                        icon: 'error',
                        title: 'Lỗi',
                        text: errorMessage
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
                                    if (['password', '_id', 'id', '__v', 'createdAt', 'updatedAt'].includes(key)) return null;
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
                                                <Button onClick={() => handleUpdate(key)}>Chỉnh sửa</Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </DetailsTable>

                        <SecuritySection>
                            <h4>Câu hỏi bảo mật</h4>
                            <SecurityDescription>
                                Những câu hỏi này được sử dụng để xác thực khi khôi phục mật khẩu
                            </SecurityDescription>
                            <SecurityQuestionsContainer>
                                {[1, 2, 3].map((num) => (
                                    <SecurityQuestionGroup key={num}>
                                        <FormGroup>
                                            <Label>{labelMap[`securityQuestion${num}`]}:</Label>
                                            <Select
                                                name={`securityQuestion${num}`}
                                                value={selectedUser[`securityQuestion${num}`] || ""}
                                                onChange={handleInputChange}
                                                $hasError={!!errors[`securityQuestion${num}`]}
                                            >
                                                <option value="">Chọn câu hỏi bảo mật</option>
                                                {securityQuestions.map((question, index) => (
                                                    <option key={index} value={question}>
                                                        {question}
                                                    </option>
                                                ))}
                                            </Select>
                                            {errors[`securityQuestion${num}`] &&
                                                <ErrorText>{errors[`securityQuestion${num}`]}</ErrorText>
                                            }
                                        </FormGroup>
                                        <FormGroup>
                                            <Label>{labelMap[`securityAnswer${num}`]}:</Label>
                                            <Input
                                                type="text"
                                                name={`securityAnswer${num}`}
                                                value={selectedUser[`securityAnswer${num}`] || ""}
                                                onChange={handleInputChange}
                                                placeholder="Nhập câu trả lời của bạn"
                                                $hasError={!!errors[`securityAnswer${num}`]}
                                            />
                                            {errors[`securityAnswer${num}`] &&
                                                <ErrorText>{errors[`securityAnswer${num}`]}</ErrorText>
                                            }
                                        </FormGroup>
                                    </SecurityQuestionGroup>
                                ))}
                            </SecurityQuestionsContainer>
                            {errors.general && <ErrorText style={{ textAlign: 'center' }}>{errors.general}</ErrorText>}
                            <SecuritySaveButton onClick={handleSaveSecurityQuestions}>
                                Lưu câu hỏi bảo mật
                            </SecuritySaveButton>
                        </SecuritySection>

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
    padding: 6px 12px; // Giảm padding
    border: none;
    border-radius: 6px; // Giảm border-radius
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 500;
    font-size: 14px; // Giảm font-size
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    white-space: nowrap; // Ngăn chữ xuống dòng
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: fit-content; // Đảm bảo nút chỉ rộng vừa đủ với nội dung
    line-height: 1.2; // Giảm line-height

    &:hover {
        background-color: #2980b9;
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }

    &.view-btn {
        background-color: #2563eb;
        &:hover {
            background-color: #1d4ed8;
        }
    }

    &.approve-btn {
        background-color: #22c55e;
        &:hover {
            background-color: #16a34a;
        }
    }

    &.reject-btn {
        background-color: #ef4444;
        &:hover {
            background-color: #dc2626;
        }
    }

    &.delete-btn {
        background-color: #64748b;
        &:hover {
            background-color: #475569;
        }
    }

    &:disabled {
        background-color: #e2e8f0;
        cursor: not-allowed;
        &:hover {
            background-color: #e2e8f0;
            transform: none;
        }
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


const SecurityDescription = styled.p`
    color: #718096;
    font-size: 14px;
    margin-bottom: 20px;
    line-height: 1.5;
`;

const SecurityQuestionsContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

const SecurityQuestionGroup = styled.div`
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    ${FormGroup} + ${FormGroup} {
        margin-top: 15px;
    }
`;

const SecuritySection = styled.div`
    background-color: #f8fafc;
    padding: 25px;
    border-radius: 12px;
    margin: 20px 0;
    border: 1px solid #e2e8f0;

    h4 {
        color: #2d3748;
        margin-bottom: 10px;
        font-size: 18px;
        font-weight: 600;
    }
`;

const SecuritySaveButton = styled(Button)`
    margin-top: 20px;
    width: 100%;
    background-color: #2ecc71;
    
    &:hover {
        background-color: #27ae60;
    }
`;

// Styles mới cho SweetAlert
const SweetAlertStyles = `
    .swal2-popup {
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        padding: 2rem;
        width: auto !important;
        min-width: 320px;
        max-width: 500px;
    }
    .swal2-title {
        font-size: 24px;
        color: #2c3e50;
        font-weight: 600;
        padding: 1rem 0;
    }
    /* Styles cho cả input và select */
    .swal2-input, 
    .swal2-select {
        width: 100% !important;
        max-width: none !important;
        border-radius: 8px !important;
        border: 2px solid #ced4da !important;
        padding: 12px !important;
        font-size: 16px !important;
        margin: 1rem 0 !important;
        box-sizing: border-box !important;
        background-color: white !important;
    }

    /* Styles riêng cho select */
    .swal2-select {
        -webkit-appearance: none !important;
        -moz-appearance: none !important;
        appearance: none !important;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23333' viewBox='0 0 16 16'%3E%3Cpath d='M8 11.5l-5-5h10l-5 5z'/%3E%3C/svg%3E") !important;
        background-repeat: no-repeat !important;
        background-position: right 12px center !important;
        padding-right: 36px !important;
    }

    .swal2-input:focus,
    .swal2-select:focus {
        border-color: #3498db !important;
        box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2) !important;
        outline: none !important;
    }

    .swal2-html-container {
        margin: 1rem 0 !important;
    }

    .swal2-actions {
        margin-top: 1.5rem !important;
    }

    .swal2-confirm,
    .swal2-cancel {
        margin: 0.25rem !important;
        white-space: nowrap !important;
        padding: 12px 24px !important;
        font-weight: 600 !important;
        border-radius: 8px !important;
    }

    .swal2-confirm {
        background-color: #3498db !important;
        color: white !important;
    }

    .swal2-cancel {
        background-color: #e74c3c !important;
        color: white !important;
    }

    @media (max-width: 500px) {
        .swal2-popup {
            margin: 0 10px !important;
            width: auto !important;
            min-width: 280px !important;
        }
    }
`;

// Thêm styles vào head của document
const styleElement = document.createElement('style');
styleElement.innerHTML = SweetAlertStyles;
document.head.appendChild(styleElement);

export default AdminProfileManagement;