import React from "react";
import { motion } from "framer-motion";
import Layout from "./Layout";
import ChatList from "../pages/chatSection/ChatList";

const HomePage = () => {
    return (
        <Layout>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="h-full"
            >
                <ChatList/>
            </motion.div>
        </Layout>
    );
}
export default HomePage;