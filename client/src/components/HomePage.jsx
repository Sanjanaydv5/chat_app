import React from "react";
import { motion } from "framer-motion";
import Layout from "./Layout";
import ChatList from "../pages/chatSection/ChatList";
import useLayoutStore from '../store/layoutStore';
import { useState, useEffect } from "react";
import { getAllUsers } from "../pages/services/user.service";

const HomePage = () => {
    const [allUsers, setAllUsers] = useState([]);

    const fetchUsers = async () => {
        try {
            const result = await getAllUsers();
            console.log("Service Result:", result);

            // Dig into result.data.users based on your console log
            // In HomePage.jsx, make sure it's this:
            if (result.status === "success" && result.data?.users) {
                setAllUsers(result.data.users);
            } else {
                console.warn("Data structure mismatch:", result);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    useEffect(() => {
        fetchUsers(); // Correctly calling the local wrapper function
    }, []);

    return (
        <Layout>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="h-full"
            >
                {/* Check if users exist before rendering */}
                {allUsers.length > 0 ? (
                    <ChatList contacts={allUsers} />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        No contacts available
                    </div>
                )}
            </motion.div>
        </Layout>
    );
}
export default HomePage;