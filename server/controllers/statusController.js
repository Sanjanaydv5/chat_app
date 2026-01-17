const { uploadFileToCloudinary } = require("../config/cloudinaryConfig");
const Status = require("../models/Status");
const response = require("../utils/responseHandler");

exports.createStatus = async (req, res) => {
    try {
        const { content, contentType } = req.body;
        const userId = req.user.id;
        const file = req.file;

        let mediaUrl = null;
        let finalContentType = contentType || "text";

        // ================= MEDIA UPLOAD =================
        if (file) {
            const uploadedFile = await uploadFileToCloudinary(file);

            if (!uploadedFile?.secure_url) {
                return response(res, 500, false, "File upload failed");
            }

            mediaUrl = uploadedFile.secure_url;

            if (file.mimetype.startsWith("image/")) {
                finalContentType = "image";
            } else if (file.mimetype.startsWith("video/")) {
                finalContentType = "video";
            } else {
                return response(res, 400, false, "Unsupported file type");
            }
        }

        // ================= TEXT VALIDATION =================
        if (!mediaUrl && (!content || !content.trim())) {
            return response(res, 400, false, "Status content or file is required");
        }

        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const status = new Status({
            user: userId,
            content: mediaUrl || content.trim(),
            contentType: finalContentType,
            expiresAt,
        });

        await status.save();

        const populatedStatus = await Status.findById(status._id)
            .populate("user", "username profilePicture")
            .populate("viewers", "username profilePicture");

        //emit socket event
        if (req.io && req.socketUserMap) {
            //Broadcast to all connecting users except the creator
            for (const [connectedUserId, socketId] of req.socketUserMap) {
                if (connectedUserId !== userId) {
                    req.io.to(socketId).emit("new_status", populatedStatus)
                }
            }
        }

        return response(res, 201, true, "Status created successfully", populatedStatus);

    } catch (error) {
        console.error("Error creating status:", error);
        return response(res, 500, false, "Internal server error");
    }
};

// ================= GET STATUSES =================
exports.getStatuses = async (req, res) => {
    try {
        const statuses = await Status.find({
            expiresAt: { $gt: new Date() },
        })
            .populate("user", "username profilePicture")
            .populate("viewers", "username profilePicture")
            .sort({ createdAt: -1 });

        return response(res, 200, true, "Statuses fetched successfully", statuses);
    } catch (error) {
        console.error("Error fetching statuses:", error);
        return response(res, 500, false, "Internal server error");
    }
};

// ================= VIEW STATUS =================
exports.viewStatus = async (req, res) => {
    try {
        const { statusId } = req.params;
        const userId = req.user.id;

        const status = await Status.findById(statusId);
        if (!status) {
            return response(res, 404, false, "Status not found");
        }

        if (!status.viewers.includes(userId)) {
            status.viewers.push(userId);
            await status.save();
        }

        const populatedStatus = await Status.findById(statusId)
            .populate("user", "username profilePicture")
            .populate("viewers", "username profilePicture");

        //emit socket event
        if (req.io && req.socketUserMap) {
            //Broadcast to all connecting users except the creator
            const statusOwnerSocketId = req.socketUserMap.get(status.user._id.toString())
            if (statusOwnerSocketId) {
                const viewData = {
                    statusId,
                    viewerId: userId,
                    totalViewers: updateStatus.viewers.length,
                    viewers: updateStatus.viewers
                }
                res.io.to(statusOwnerSocketId).emit("status_viewed", viewData)
            } else {
                console.log('status owner not connected')
            }
        }

        return response(res, 200, true, "Status viewed successfully", populatedStatus);

    } catch (error) {
        console.error("Error viewing status:", error);
        return response(res, 500, false, "Internal server error");
    }
};

// ================= DELETE STATUS =================
exports.deleteStatus = async (req, res) => {
    try {
        const { statusId } = req.params;
        const userId = req.user.id;

        const status = await Status.findById(statusId);
        if (!status) {
            return response(res, 404, false, "Status not found");
        }

        if (status.user.toString() !== userId) {
            return response(res, 403, false, "Unauthorized to delete this status");
        }

        await status.deleteOne();

        //emit socket event
        if (req.io && req.socketUserMap) {
            //Broadcast to all connecting users except the creator
            for (const [connectedUserId, socketId] of req.socketUserMap) {
                if (connectedUserId !== userId) {
                    req.io.to(socketId).emit("status_deleted", statusId)
                }
            }
        }

        return response(res, 200, true, "Status deleted successfully");

    } catch (error) {
        console.error("Error deleting status:", error);
        return response(res, 500, false, "Internal server error");
    }
};
