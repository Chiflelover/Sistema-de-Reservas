const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

const authMiddleware = (req, res, next) => {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
        return res.status(401).json({ error: 'No hay token, autorización denegada' });
    }

    const token = authHeader.replace('Bearer ', '');

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { id_usuario, rol }
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token no es válido' });
    }
};

module.exports = authMiddleware;
