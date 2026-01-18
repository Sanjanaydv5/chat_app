import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigate } from 'react-router-dom';
import * as yup from 'yup';

import useLoginStore from '../../store/useLoginStore';
import useUserStore from '../../store/useUserStore';
import useThemeStore from '../../store/themeStore';
import countries from '../../utils/countries';
import { sendOtp, verifyOtp, updateUserProfile } from '../services/user.service';

/* =======================
   Validation Schemas
======================= */

// Login (email OR phone required)
const loginValidationSchema = yup
    .object({
        phoneNumber: yup
            .string()
            .nullable()
            .transform((value, originalValue) =>
                originalValue?.trim() === '' ? null : value
            )
            .matches(/^\d+$/, {
                message: 'Phone number must be digits only',
                excludeEmptyString: true
            }),

        email: yup
            .string()
            .nullable()
            .transform((value, originalValue) =>
                originalValue?.trim() === '' ? null : value
            )
            .email('Please enter a valid email')
    })
    .test(
        'at-least-one',
        'Either email or phone number is required',
        value => !!(value.phoneNumber || value.email)
    );

// OTP validation
const otpValidationSchema = yup.object({
    otp: yup
        .string()
        .matches(/^\d{6}$/, 'OTP must be exactly 6 digits')
        .required('OTP is required')
});

// Profile validation
const profileValidationSchema = yup.object({
    username: yup.string().required('Username is required'),
    agreed: yup
        .boolean()
        .oneOf([true], 'You must agree to the terms')
});

/* =======================
   Avatars
======================= */

const avatars = [
    'https://api.dicebear.com/6.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/6.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/6.x/avataaars/svg?seed=Mimi',
    'https://api.dicebear.com/6.x/avataaars/svg?seed=Jasper',
    'https://api.dicebear.com/6.x/avataaars/svg?seed=Luna',
    'https://api.dicebear.com/6.x/avataaars/svg?seed=Zoe'
];

/* =======================
   Component
======================= */

const Login = () => {
    const {
        step,
        setStep,
        setUserPhoneData,
        userPhoneData,
        resetLoginState
    } = useLoginStore();

    const { setUser } = useUserStore();
    const navigate = useNavigate();

    const [phoneNumber, setPhoneNumber] = useState('');
    const [selectedCountry, setSelectedCountry] = useState(countries[0]);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [email, setEmail] = useState('');
    const [profilePicture, setProfilePicture] = useState(null);
    const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
    const [profilePictureFile, setProfilePictureFile] = useState(null);
    const [error, setError] = useState('');
    const { theme, setTheme } = useThemeStore();

    /* =======================
       Forms
    ======================= */

    const {
        register: loginRegister,
        handleSubmit: handleLoginSubmit,
        formState: { errors: loginErrors }
    } = useForm({
        resolver: yupResolver(loginValidationSchema)
    });

    const {
        handleSubmit: handleOtpSubmit,
        formState: { errors: otpErrors },
        setValue: setOtpValue
    } = useForm({
        resolver: yupResolver(otpValidationSchema)
    });

    const {
        register: profileRegister,
        handleSubmit: handleProfileSubmit,
        formState: { errors: profileErrors },
        watch
    } = useForm({
        resolver: yupResolver(profileValidationSchema)
    });

    return <div className={`min-h-screen ${theme === 'dark' ? "bg-gray-900" : "bg-gradient-to-br from-green-400 to-blue-500"} flex items-center justify-center p-4 overflow-hidden`}>
        
    </div>;
};

export default Login;
