import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NavigationUser from '../components/NavigationUser';

const ContractUser = () => {
    const [contract, setContract] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchUserContract();
    }, []);

    const fetchUserContract = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const userId = localStorage.getItem('userId');
            
            if (!userId) {
                throw new Error('User ID not found. Please log in again.');
            }

            const response = await axios.get(`http://localhost:5000/api/auth/user-contract/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setContract(response.data);
        } catch (error) {
            setError(error.response?.data?.message || 'Không thể tải thông tin hợp đồng. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };


        // Thêm hàm kiểm tra trạng thái hợp đồng
        const getContractStatus = (startDate, endDate) => {
            const today = new Date();
            const contractStart = new Date(startDate);
            const contractEnd = new Date(endDate);
    
            // Reset time phần để so sánh chỉ dựa trên ngày
            today.setHours(0, 0, 0, 0);
            contractStart.setHours(0, 0, 0, 0);
            contractEnd.setHours(0, 0, 0, 0);
    
            if (today < contractStart) {
                return "Chưa có hiệu lực";
            } else if (today > contractEnd) {
                return "Hết hiệu lực";
            } else {
                return "Còn hiệu lực";
            }
        };

    const getContractTypeDisplay = (type) => {
        switch(type) {
            case 'fullTime':
                return 'Toàn thời gian';
            case 'partTime':
                return 'Bán thời gian';
            case 'temporary':
                return 'Tạm thời';
            default:
                return type;
        }
    };

                    // Thêm hàm helper để tính thời gian còn lại
                const getTimeRemaining = (endDate) => {
                    const today = new Date();
                    const end = new Date(endDate);
                    const diffTime = Math.abs(end - today);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    if (diffDays > 30) {
                        const months = Math.floor(diffDays / 30);
                        const remainingDays = diffDays % 30;
                        return `${months} tháng ${remainingDays} ngày`;
                    }
                    return `${diffDays} ngày`;
                };

    return (
        <div style={styles.page}>
            <NavigationUser />
            <div style={styles.container}>
                <h2 style={styles.title}>Thông tin Hợp đồng</h2>
                {loading && <div style={styles.loading}>
                    <div style={styles.spinner}></div>
                    <p>Đang tải dữ liệu...</p>
                </div>}
                {error && <p style={styles.error}>{error}</p>}
                {!loading && !error && contract && (
                    <div style={styles.contractInfo}>
                        <div style={styles.contractDetail}>
                            <span style={styles.label}>Loại Hợp Đồng:</span>
                            <span style={styles.value}>{getContractTypeDisplay(contract.contractType)}</span>
                        </div>
                        <div style={styles.contractDetail}>
                            <span style={styles.label}>Ngày Bắt Đầu:</span>
                            <span style={styles.value}>
                                {contract.startDate ? new Date(contract.startDate).toLocaleDateString('vi-VN') : 'Không xác định'}
                            </span>
                        </div>
                        <div style={styles.contractDetail}>
                            <span style={styles.label}>Ngày Kết Thúc:</span>
                            <span style={styles.value}>
                                {contract.endDate ? new Date(contract.endDate).toLocaleDateString('vi-VN') : 'Không xác định'}
                            </span>
                        </div>
                        <div style={styles.contractDetail}>
                            <span style={styles.label}>Trạng Thái:</span>
                            <span style={Object.assign({}, styles.value, 
                                styles.status[getContractStatus(contract.startDate, contract.endDate).toLowerCase()]
                            )}>
                                {getContractStatus(contract.startDate, contract.endDate)}
                            </span>
                        </div>
                        {/* Thêm hiển thị thời gian còn lại của hợp đồng nếu còn hiệu lực */}
                        {getContractStatus(contract.startDate, contract.endDate) === "Còn hiệu lực" && (
                            <div style={styles.contractDetail}>
                                <span style={styles.label}>Thời gian còn lại:</span>
                                <span style={styles.value}>
                                    {getTimeRemaining(contract.endDate)}
                                </span>
                            </div>
                        )}
                    </div>
                )}
                {!loading && !error && !contract && (
                    <p style={styles.noContract}>Không tìm thấy thông tin hợp đồng.</p>
                )}
            </div>
        </div>
    );
};

const styles = {
    page: {
        backgroundColor: '#f4f7f9',
        minHeight: '100vh',
    },
    container: {
        padding: '40px',
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 6px 30px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
    },
    title: {
        fontSize: '32px',
        marginBottom: '30px',
        color: '#2c3e50',
        fontWeight: '700',
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: '1px',
    },
    loading: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        color: '#3498db',
    },
    spinner: {
        width: '40px',
        height: '40px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #3498db',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '10px',
    },
    contractInfo: {
        backgroundColor: '#ffffff',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
    },
    contractDetail: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '18px',
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        transition: 'all 0.3s ease',
    },
    label: {
        fontWeight: '600',
        color: '#34495e',
    },
    value: {
        color: '#2c3e50',
    },
    error: {
        color: '#e74c3c',
        fontSize: '18px',
        marginBottom: '15px',
        padding: '15px',
        backgroundColor: '#fde8e8',
        borderRadius: '8px',
        textAlign: 'center',
    },
    noContract: {
        fontSize: '18px',
        color: '#7f8c8d',
        textAlign: 'center',
        padding: '20px',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
    },
    status: {
        'còn hiệu lực': {
            color: '#27ae60',
            fontWeight: '600',
        },
        'hết hiệu lực': {
            color: '#e74c3c',
            fontWeight: '600',
        },
    },
    status: {
        'còn hiệu lực': {
            color: '#27ae60',
            fontWeight: '600',
        },
        'hết hiệu lực': {
            color: '#e74c3c',
            fontWeight: '600',
        },
        'chưa có hiệu lực': {
            color: '#f39c12',
            fontWeight: '600',
        }
    },
};

export default ContractUser;