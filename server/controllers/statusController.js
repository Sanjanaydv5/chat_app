const { uploadFileToCloudinary } = require("../config/cloudinaryConfig");
const Status = require("../models/Status");
const response = require("../utils/responseHandler");
const Message = require("../models/Message");

exports.createStatus = async (req, res) => {
    try {
        const { content, contentType } = req.body;
        const userId = req.user.id;
        const file = req.file;

        let mediaUrl = null;
        let finalContentType = contentType || "text";
        //handle media upload
        if (file) {
            const uploadFile = await uploadFileToCloudinary(file);

            if (!uploadFile?.secure_url) {
                return response(res, 500, false, "File upload failed");
            }
            mediaUrl = uploadFile?.secure_url;

            if (file.mimetype.startsWith("image/")) {
                finalContentType = "image";
            } else if (file.mimetype.startsWith("video/")) {
                finalContentType = "video";
            } else {
                return response(res, 400, false, "Unsupported file type");
            }
        } else if (!content?.trim()) {
            finalContentType = "text";
        } else {
            return response(res, 400, false, "Status content or file is required");
        }

        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Status expires in 24 hours

        const status = new Status({
            user: userId,
            content: mediaUrl || content,
            contentType: finalContentType,
            imageOrVideoUrl: mediaUrl,
            messageStatus,
        });

        await status.save();

        const populatedStatus = await Status.findOne(status?._id).populate("user", "username profilePicture")
            .populate("viewers", "username profilePicture");

        return response(res, 201, true, "Status created successfully", populatedStatus);
    } catch (error) {
        console.error("Error creating status:", error);
        return response(res, 500, false, "Internal server error");
    }
};

exports.getStatuses = async (req, res) => {
    try {
        const statuses = await Status.find({ expiresAt: { $gt: new Date() } })
            .populate("user", "username profilePicture")
            .populate("viewers", "username profilePicture")
            .sort({ createdAt: -1 });
        return response(res, 200, true, "Statuses fetched successfully", statuses);
    } catch (error) {
        console.error("Error fetching statuses:", error);
        return response(res, 500, false, "Internal server error");
    }
};

exports.viewStatus = async (req, res) => {
    const { statusId } = req.params;
    const userId = req.user.id;
    try {
        const status = await Status.findById(statusId);
        if (!status) {
            return response(res, 404, false, "Status not found");
        }
        //add viewer if not already viewed
        if (!status.viewers.includes(userId)) {
            status.viewers.push(userId);
            await status.save();

            const updateStatus = await Status.findById(statusId)
                .populate("user", "username profilePicture")
                .populate("viewers", "username profilePicture");
        } else {
            console.log("User has already viewed this status");
        }
        return response(res, 200, true, "Status viewed successfully", status);
    } catch (error) {
        console.error("Error viewing status:", error);
        return response(res, 500, false, "Internal server error");
    }
};

exports.deleteStatus = async (req, res) => {
    const { statusId } = req.params;
    const userId = req.user.id;
    try {
        const status = await Status.findById(statusId);
        if (!status) {
            return response(res, 404, false, "Status not found");
        }
        if (status.user.toString() !== userId) {
            return response(res, 403, false, "Unauthorized to delete this status");
        }
        await status.deleteOne();
        return response(res, 200, true, "Status deleted successfully");
    } catch (error) {
        console.error("Error deleting status:", error);
        return response(res, 500, false, "Internal server error");
    }
};
