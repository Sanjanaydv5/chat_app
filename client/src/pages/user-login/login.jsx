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
import { motion } from 'framer-motion';
import { FaChevronDown, FaUber, FaWhatsapp } from 'react-icons/fa';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Spinner from '../../utils/Spinner'
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
  const [loading,setLoading] = useState(false);

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
  const filteredCountries = countries.filter((country) => {
    const name = country?.name ?? "";
    const dialCode = country?.dialCode ?? "";

    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dialCode.includes(searchTerm)
    );
  });

// api
  const onloginSubmit = async() => {
    try{
      setLoading(true);
        if(email) {
          const response = await sendOtp(null,null,email);
          if(response.status === "success"){
            
          }
      }
    } catch (error) {

    }
  }

  const ProgressBar = () => (
    <div className={`w-full ${theme === 'dark' ? "bg-gray-700" : "bg-gray-200"} rounded-full h-2.5 mb-6`}>
      <div className='bg-green-500 h-2.5 rounded-full transition-all duration-500 ease-in-out'
        style={{ width: `${(step / 3) * 100}%` }}>

      </div>
    </div>
  )

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 overflow-hidden ${theme === 'dark'
          ? 'bg-gray-900'
          : 'bg-gradient-to-br from-green-400 to-blue-500'
        }`}
    >
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`p-6 md:p-8 rounded-lg shadow-2xlw-full max-w-md relative z-10 ${theme === 'dark'
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
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2, type: 'spring', stiffness: 260, damping: 20 }}
          className='w-24 h-24 bg-green-500 rounded-full mx-auto mb-6 flex items-center justify-center'
        >
          <FaWhatsapp className="w-16 h-16 text-white" />
        </motion.div>
        <h1 className={`text-3xl font-bold text-center mb-6 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
          WhatsApp Login
        </h1>
        <ProgressBar />
        {error && <p className='text-red-500 text-center mb-4'>{error}</p>}

        {step === 1 && (
          <form action="" className='space-y-4'>
            <p className={`text-center ${theme === "dark" ? "text-gray-300" : "text-gray-600"}mb-4`}>
              Enter your phone number or email to receive an OTP
            </p>
            <div className='relative'>
              <div className='flex'>
                <div className='relative w-1/3'>
                  <button type='button' className={`flex-shrink-0 z-10 inline-flex items-center py-2.5 px-2 text-sm font-medium text-center ${theme === 'dark' ? 'text-white bg-gray-700' : 'text-gray-900 bg-gray-100 border-gray-300'} border rounded-s-lg hover:bg-gray-200 focus:outline-none focus:ring-gray-100`}
                    onClick={() => setShowDropdown(prev => !prev)} >
                    <span>
                      {/* {selectedCountry.flag}  */}
                      {selectedCountry.alpha2} {selectedCountry.dialCode}
                    </span>
                    <FaChevronDown className='ml-2' />
                  </button>
                  {showDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                      <div className="sticky top-0 bg-white p-2">
                        <input
                          type="text"
                          placeholder="Search countries..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className={`w-full px-2 py-1 border ${theme === 'dark' ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'} rounded-md text-sm focus:outline-none focus:ring-green-500 `}
                        />
                      </div>
                      {filteredCountries.map((country) => (
                        <button
                          key={country.alpha2}
                          type='button'
                          className={`w-full text-left px-3 py-2 ${theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-100'} focus:outline-none focus:bg-gray-100`}
                          onClick={() => {
                            setSelectedCountry(country)
                            setShowDropdown(false)
                          }} >
                          {country.flag} {(country.dialCode)} {country.name}
                        </button>
                      )
                      )}
                    </div>
                  )}
                </div>
                <input
                type='text'
                {...loginRegister("phoneNumber")}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder='Phone number'
                className={`w-2/3 px-4 py-2 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}
                rounded-md focus:outline-none focus:right-2 focus:ring-green-500
                ${loginErrors.phoneNumber ? "border-red-500" : ""}`} />
              </div>
              {loginErrors.phoneNumber && (
              <p className='text-red-500 text-sm'>{loginErrors.phoneNumber.message}</p>
)}
            </div>
            {/* divider with or */}
            <div className='flex items-center my-4'>
              <div className='flex-grow h-px bg-gray-300'/>
              <span className='mx-3 text-gray-500 text-sm font-medium'>or</span>
              <div className='flex-grow h-px bg-gray-300'/>
            </div>
            {/* Email input box */}
            <div className={`flex items-center border rounded-md px-3 py-2 ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}>
              <FaUber className={`mr-2 text-gray-400 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}/>
                                <input
                type='email'
                {...loginRegister("email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='Email (optional)'
                className={`w-full bg-transparent focus:outline-none ${theme === 'dark' ? 'text-white' : 'bg-black'}
                
                ${loginErrors.email ? "border-red-500" : ""}`} />
                {loginErrors.email && (
                  <p className='text-red-500 text-sm'>
                    {loginErrors.email.message}
                  </p>
                )}
            </div>
            <button
            type='submit'
            className='w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition'>
              {loading ? <Spinner/> : "send OTP"}
            </button>
          </form>
        )}

      </motion.div>
    </div>

  );
};

export default Login;
