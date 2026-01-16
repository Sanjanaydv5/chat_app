const response = (res, statusCode, success, message, data = null) => {
    if(!res) {
        console.error("Response object is required");
        return;
    }

    const responseObject = {
        status: statusCode < 400 ? 'success' : 'error',
        message: message,
    };

    if (data) {
        responseObject.data = data;
    }

    return res.status(statusCode).json(responseObject);
}

module.exports = response;