import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
    constructor(private configService: ConfigService) { }

    use(req: Request, res: Response, next: NextFunction) {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('No token provided');
        }

        const token = authHeader.split(' ')[1];
        const secret = this.configService.get<string>('SUPABASE_JWT_SECRET');

        if (!secret) {
            throw new Error('SUPABASE_JWT_SECRET is not defined');
        }

        try {
            const decoded = jwt.verify(token, secret);
            req['user'] = decoded;
            next();
        } catch (err) {
            throw new UnauthorizedException('Invalid token');
        }
    }
}
