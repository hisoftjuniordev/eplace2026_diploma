import { Request, Response, NextFunction } from 'express';

type Vloga = 'SistemskiAdmin' | 'Skrbnik' | 'Uporabnik';

export function roleMiddleware(...allowedRoles: Vloga[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Neprijavljen uporabnik' });
      return;
    }
    if (!allowedRoles.includes(req.user.vloga as Vloga)) {
      res.status(403).json({ error: 'Nezadostne pravice' });
      return;
    }
    next();
  };
}
