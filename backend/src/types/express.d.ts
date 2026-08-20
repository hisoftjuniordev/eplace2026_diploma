import { IJwtPayload } from './interfaces';

declare global {
  namespace Express {
    interface Request {
      user?: IJwtPayload;
    }
  }
}
