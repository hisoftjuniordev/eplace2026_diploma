import { Request, Response, NextFunction } from 'express';
import { IJwtPayload } from '../types/interfaces';

type Vloga = IJwtPayload['vloga'];

export function requireRole(...roles: Vloga[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user as IJwtPayload | undefined;
    if (!user || !roles.includes(user.vloga)) {
      res.status(403).json({ error: 'Nezadostne pravice' });
      return;
    }
    next();
  };
}
