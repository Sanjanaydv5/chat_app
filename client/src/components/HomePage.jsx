import React from "react";
import { motion } from "framer-motion";
import Layout from "./Layout";
import { useState, useEffect } from "react";
import { getAllUsers } from "../services/user.service";

const HomePage = () => {
    const [allUsers, setAllUsers] = useState([]);

    const fetchUsers = async () => {
        try {
            const result = await getAllUsers();

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
        <Layout contacts={allUsers} onContactAdded={fetchUsers}>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="h-full"
            >
                {/* Content can be added here if needed */}
            </motion.div>
        </Layout>
    );
}
export default HomePage;
