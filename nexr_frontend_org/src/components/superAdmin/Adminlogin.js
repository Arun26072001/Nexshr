import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [invalidEmail, setInvalidEmail] = useState(false); // State to track invalid email

    // Email validation function
    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check email validation before proceeding
        if (!validateEmail(email)) {
            setInvalidEmail(true);
            setError('Invalid email format. Please check and try again.');
            return;
        }

        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/admin/login`, { email, password });

            // Handle successful login
            if (response.status === 200) {
                const { token } = response.data;

                // Save the token to localStorage (or any state management solution)
                localStorage.setItem('adminToken', token);

                // Navigate to admin dashboard
                toast.success('Login successful');
                navigate('/admin-dashboard');
            }
        } catch (err) {
            // Handle error response
            if (err.response) {
                const { status, data } = err.response;
                if (status === 409) {
                    setError(data.message); // Admin not found
                } else if (status === 401) {
                    setError(data.message); // Wrong password
                } else {
                    setError('Something went wrong. Please try again later.');
                }
            } else {
                setError('Network error. Please try again.');
            }
        }
    };

    return (
        <div className="d-flex justify-content-center align-items-center">
            <div className="Signin text-center" style={{ maxWidth: '448px', width: '100%' }}>
                <img
                    src="https://imagedelivery.net/r89jzjNfZziPHJz5JXGOCw/1dd59d6a-7b64-49d7-ea24-1366e2f48300/public"
                    alt="Logo"
                    className="d-block m-auto"
                    style={{ width: '100px' }}
                />
                <div className="card p-2 mt-4 b-shad">
                    <div className="card-body">
                        <h1 className="fs-5 pb-2 text-black">Admin Login</h1>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="label text-black mb-2" htmlFor="email">
                                    Email
                                </label>
                                <input
                                    className={`form-control mb-2 ${invalidEmail ? 'is-invalid' : ''}`}
                                    type="email"
                                    id="email"
                                    name="email"
                                    placeholder="Enter Email Address..."
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setInvalidEmail(false); // Reset invalid email state
                                        setError(''); // Clear error
                                    }}
                                    required
                                />
                                {invalidEmail && <div className="invalid-feedback">Invalid email format</div>}
                            </div>
                            <div className="form-group position-relative">
                                <label className="label text-black mb-2" htmlFor="password">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    placeholder="Enter password"
                                    className="form-control mb-2"
                                    id="password"
                                    name="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className="loginBtn custom-btn btn-block mt-3 w-100">
                                Login
                            </button>
                            {error && <p className="text-danger mt-2">{error}</p>}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
