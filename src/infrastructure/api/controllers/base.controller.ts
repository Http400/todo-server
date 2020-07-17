import { Router, Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../../errors/unauthorized.error';
import { AccountType } from '../../data/entities/User';

abstract class BaseController {
    protected readonly secretKey: string;

    constructor(secretKey: string) {
        this.secretKey = secretKey;
    }

    abstract init(apiRouter: Router): void;

    async verifyToken(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.headers.authorization) {
                throw new UnauthorizedError('No token provided');
            }
    
            const token = req.headers.authorization.split(' ')[1];
            const decoded = this.verify(token, this.secretKey);
            res.locals.userId = decoded.id;

            next();
        } catch (error) {
            next(error);
        }
    }

    // async verifyAccountType(req: Request, res: Response, next: NextFunction, accountType: AccountType) {
    //     console.log(accountType);console.log('accountType');
    //     try {
    //         if (!req.headers.authorization) {
    //             throw new UnauthorizedError('No token provided');
    //         }
    
    //         const token = req.headers.authorization.split(' ')[1];
    //         const decoded = this.verify(token, this.secretKey);
    //         console.log(decoded.accountType);
    //         if (decoded.accountType === accountType) {
    //             throw new UnauthorizedError('Action forbidden for account type');
    //         }

    //         next();
    //     } catch (error) {
    //         next(error);
    //     }
    // }

    async verifyAccountType(accountType: AccountType) {
        console.log(accountType);console.log('accountType');

        return (req: Request, res: Response, next: NextFunction) => {
            try {
                if (!req.headers.authorization) {
                    throw new UnauthorizedError('No token provided');
                }
        
                const token = req.headers.authorization.split(' ')[1];
                const decoded = this.verify(token, this.secretKey);
                console.log(decoded.accountType);
                if (decoded.accountType === accountType) {
                    throw new UnauthorizedError('Action forbidden for account type');
                }
    
                next();
            } catch (error) {
                next(error);
            }
        }
    }

    private verify(token: string, secretKey: string): any {
        try {
            const decoded = jwt.verify(token, secretKey);
            return decoded;
        } catch (error) {
            const message = error.name === 'TokenExpiredError' ? 'Authentication token expired' : 'Failed to authenticate token';
            throw new UnauthorizedError(message);
        }
    }
}

export default BaseController;