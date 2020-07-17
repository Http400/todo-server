import { Router, NextFunction } from 'express';
import { Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

import BaseController from "./base.controller";
import { UserService } from '../../services/user.service';
import { BadRequestError } from '../../errors/badRequest.error';
import { NotFoundError } from '../../errors/notFound.error';
import Request from '../utils/Request';
import Response from '../utils/Response';
import { SignUpRequest, SignUpResponse } from '../../../common/models/SignUp';
import { SignInRequest, SignInResponse } from '../../../common/models/SignIn';
import { RefreshTokenRequest, RefreshTokenResponse } from '../../../common/models/RefreshToken';
import { ChangePasswordRequest, ChangePasswordResponse } from '../../../common/models/ChangePassword';


class AuthorizationController extends BaseController {
    private readonly userService: UserService;
    private readonly url: string = '/auth';
    private readonly refreshTokenSecretKey: string;

    constructor(userService: UserService, secretKey: string, refreshTokenSecretKey: string) {
        super(secretKey);
        this.userService = userService;
        this.refreshTokenSecretKey = refreshTokenSecretKey;
    }

    init(router: Router) {
        router.post(this.url + '/login', this.login);
        router.post(this.url + '/register', this.register);
        router.post(this.url + '/refresh-token', this.refreshToken);
        router.patch(this.url + '/change-password', this.verifyToken.bind(this), this.changePassword);
        // // router.post(this.url + '/change-account-type', this.changeAccountType.bind(this));
        // router.get(this.url + '/test-auth', this.verifyToken.bind(this), this.testAuth.bind(this));
    }

    register = async (req: Request<SignUpRequest>, res: Response<SignUpResponse>, next: NextFunction) => {
        try {
            await this.userService.register(req.body.username, req.body.password);
            res.send({ message: 'Account has been created.' });
        } catch(error) {
            next(error);
        } 
    }

    login = async (req: Request<SignInRequest>, res: Response<SignInResponse>, next: NextFunction) => {
        try {
            const { authToken, refreshToken } = await this.userService.login(req.body.username, req.body.password);
            res.send({ authToken, refreshToken });
        } catch (error) {
            next(error);
        }
    }

    refreshToken = async (req: Request<RefreshTokenRequest>, res: Response<RefreshTokenResponse>, next: NextFunction) => {
        try {
            const token = await this.userService.refreshToken(req.body.userId, req.body.refreshToken);
            res.send({ token });
        } catch (error) {
            next(error);
        }
    }

    changePassword = async (req: Request<ChangePasswordRequest>, res: Response<ChangePasswordResponse>, next: NextFunction) => {
        try {
            await this.userService.changePassword(res.locals.userId, req.body.currentPassword, req.body.newPassword);
            res.send({ message: 'Password has been changed.' });
        } catch (error) {
            next(error);
        }
    }

    // async changeAccountType(req: Request, res: Response, next: NextFunction) {
    //     try {
    //         await this.userService.changeAccountType(req.body.userId, req.body.accountType);
    //         res.send({ message: 'Account type has been changed.' });
    //     } catch (error) {
    //         next(error);
    //     }
    // }

    // async testAuth(req: Request, res: Response, next: NextFunction) {
    //     try {
    //         res.send({ data: 'Superb', userId: res.locals.userId });
    //     } catch (error) {
    //         next(error);
    //     }
    // }
}

export default AuthorizationController;