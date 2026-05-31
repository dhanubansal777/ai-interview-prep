// Middleware to require authentication on a route
export const requireAuth = (req, res, next) => {
    const { userId } = req.auth();

    if (!userId) {
        return res.status(401).json({
            error: 'Unauthorized — please sign in'
        });
    }

    // Attach userId to req for easy access in route handlers
    req.userId = userId;
    next();
};