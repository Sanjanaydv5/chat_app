import React from "react";
import useLayoutStore from '../store/layoutStore';
import { useState, useEffect } from 'react';
import useThemeStore from '../store/themeStore';
import Sidebar from "./Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import ChatWindow from "../pages/chatSection/ChatWindow";

const Layout = ({ children, isThemeDialogOpen, toogleThemeDialog, isStatusPreviewOpen, statusPreviewContent }) => {
    const selectedContact = useLayoutStore(state => state.selectedContact);
    const setSelectedContact = useLayoutStore(state => state.setSelectedContact);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const { theme, setTheme } = useThemeStore();

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#111b21] text-white' : 'bg-gray-100 text-black'} flex relative`}>
            {!isMobile && <Sidebar />}
            <div className={`flex-1 flex overflow-hidden ${isMobile ? 'flex-col' : ''}`}>
                <AnimatePresence initial={false}>
                    {(!selectedContact || !isMobile) && (
                        <motion.div
                            key="chatList"
                            initial={{ x: isMobile ? "-100%" : 0 }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "tween" }}
                            className={`w-full md:w-2/5 h-full ${isMobile ? "pb-16" : ""}`}
                        >
                            {children}
                        </motion.div>
                    )}


                    {(selectedContact || !isMobile) && (
                        <motion.div
                            key="chatWindow"
                            initial={{ x: isMobile ? "-100%" : 0 }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "tween" }}
                            className="w-full h-full"
                        >
                            <ChatWindow
                                selectedContact={selectedContact}
                                setSelectedContact={setSelectedContact}
                                isMobile={isMobile}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            {isMobile && <Sidebar />}

            {isThemeDialogOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20" onClick={toogleThemeDialog}>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-lg mb-4">Select Theme</h2>
                        <div className="space-y-4">
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input type="radio"
                                    value="light"
                                    checked={theme === 'light'}
                                    onChange={() => setTheme('light')}
                                    className="from-radio text-blue-600"
                                />
                                <span>Light Theme</span>
                            </label>

                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input type="radio"
                                    value="light"
                                    checked={theme === 'dark'}
                                    onChange={() => setTheme('dark')}
                                    className="from-radio text-blue-600"
                                />
                                <span>Dark Theme</span>
                            </label>
                        </div>
                        <button
                            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200"
                            onClick={toogleThemeDialog}>
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* status preview */}
            {isStatusPreviewOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20" onClick={toogleThemeDialog}>
                    {statusPreviewContent}
                </div>
            )}
        </div>
    );
}
export default Layout;