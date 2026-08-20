import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { IJwtPayload } from '../types/interfaces';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Manjkajoč JWT token' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as IJwtPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Neveljaven ali potekel JWT token' });
  }
}
