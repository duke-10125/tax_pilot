import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
    constructor(private supabaseService: SupabaseService) { }

    async use(req: Request, res: Response, next: NextFunction) {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('No token provided');
        }

        const token = authHeader.split(' ')[1];

        try {
            const { data: { user }, error } = await this.supabaseService
                .getClient()
                .auth.getUser(token);

            if (error || !user) {
                console.error('Supabase Auth Error:', error?.message);
                throw new UnauthorizedException(`Invalid token: ${error?.message || 'User not found'}`);
            }

            req['user'] = user;
            next();
        } catch (err) {
            console.error('Auth Middleware Error:', err.message);
            throw new UnauthorizedException(`Authentication failed: ${err.message}`);
        }
    }
}
