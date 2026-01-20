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
import {motion} from 'framer-motion';
import { FaChevronDown, FaWhatsapp } from 'react-icons/fa';
import ProgressBar from 'react-bootstrap/ProgressBar';
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
    value => Boolean(value?.phoneNumber || value?.email)
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
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [error, setError] = useState('');
 const [showDropdown, setShowDropdown] = useState(false);
 const [searchTerm, setSearchTerm] = useState("");

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


  //for country dropdown
  const filterCountries = countries.filter(
    (country) =>
      country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.dialCode.includes(searchTerm)
  )

  const ProgressBar = () =>(
    <div className={`w-full ${theme ==='dark' ? "bg-gray-700" : "bg-gray-200"} rounded-full h-2.5 mb-6`}>
      <div className='bg-green-500 h-2.5 rounded-full transition-all duration-500 ease-in-out'
      style={{width: `${(step/3) * 100}%`}}>

      </div>
    </div>
  )

  return (
    <div
  className={`min-h-screen flex items-center justify-center p-4 overflow-hidden ${
    theme === 'dark'
      ? 'bg-gray-900'
      : 'bg-gradient-to-br from-green-400 to-blue-500'
  }`}
>
  <motion.div
    initial={{ opacity: 0, y: -50 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className={`p-6 md:p-8 rounded-lg shadow-2xlw-full max-w-md relative z-10 ${
      theme === 'dark'
        ? 'bg-gray-800 text-white'
        : 'bg-white text-gray-900'
    }`}
  >
    {/* <div className="flex justify-end mb-4">
      <button
        onClick={toggleTheme}
        className={`p-2 rounded-full ${
          theme === 'dark'
            ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600'
            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
        }`}
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
    </div>
    <h1 className="text-2xl font-bold text-center mb-4">
      Login
    </h1>

    <p
      className={`text-center ${
        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
      }`}
    >
      Welcome back 👋
    </p> */}

     <motion.div
    initial={{ scale:0 }}
    animate={{ scale:1 }}
    transition={{ duration: 0.2, type:'spring',stiffness:260,damping:20 }}
    className='w-24 h-24 bg-green-500 rounded-full mx-auto mb-6 flex items-center justify-center'
  >
    <FaWhatsapp className="w-16 h-16 text-white"/>
  </motion.div>
  <h1 className={`text-3xl font-bold text-center mb-6 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
    Whatsapp Login
      </h1>
    <ProgressBar/>
    {error && <p className='text-red-500 text-center mb-4'>{error}</p>}
    
  {step === 1 && (
    <form action="" className='space-y-4'>
      <p className={`text-center ${theme === "dark" ? "text-gray-300" : "text-gray-600"}mb-4`}>
        Enter your phone number or email to receive an OTP
      </p>
      <div className='relative'>
        <div className='flex'>
          <div className='relative w-1/3'>
            <button type='button' className={`flex-shrink-0 z-10 inline-flex items-center py-2.5 px-4 text-sm font-medium text-center ${theme === 'dark' ? 'text-white bg-gray-700' : 'text-gray-900 bg-gray-100 border-gray-300'} border rounded-s-lg hover:bg-gray-200 focus:outline-none focus:ring-gray-100`}
            onClick={() => setShowDropdown} >
              <span>
                {/* {selectedCountry.flag}  */}
                {selectedCountry.alpha2} {selectedCountry.dialCode} 
              </span>
              <FaChevronDown className='ml-2'/>
            </button>
            {showDropdown && (
              <div className={`absolute z-10 w-full mt-1 ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}border rounded-md shadow-lg max-h-60 overflow-auto`}>
               <div className={`sticky top-0 ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'} p-2`}>
                <input type='text' placeholder='search countries...'/>
               </div>
                </div>
            )}
          </div>
        </div>
      </div>
    </form>
  )}

  </motion.div>
</div>

  );
};

export default Login;
