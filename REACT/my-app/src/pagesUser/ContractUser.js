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
                            <span style={styles.value}>{contract.startDate ? new Date(contract.startDate).toLocaleDateString() : 'Không xác định'}</span>
                        </div>
                        <div style={styles.contractDetail}>
                            <span style={styles.label}>Ngày Kết Thúc:</span>
                            <span style={styles.value}>{contract.endDate ? new Date(contract.endDate).toLocaleDateString() : 'Không xác định'}</span>
                        </div>
                        <div style={styles.contractDetail}>
                            <span style={styles.label}>Trạng Thái:</span>
                            <span style={Object.assign({}, styles.value, styles.status[contract.status.toLowerCase()])}>{contract.status}</span>
                        </div>
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
};

export default ContractUser;