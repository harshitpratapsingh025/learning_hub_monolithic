import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../users/schemas/user.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.secret'),
    });
  }

  async validate(payload: any) {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.userModel
      .findById(payload.sub)
      .populate({
        path: 'roles',
        populate: {
          path: 'permissions',
        },
      })
      .lean();

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Extract roles and permissions
    const roles = user.roles.map((role: any) => role.name);
    const permissionsSet = new Set<string>();

    user.roles.forEach((role: any) => {
      role.permissions?.forEach((perm: any) => {
        permissionsSet.add(perm.name);
      });
    });

    return {
      id: user._id.toString(),
      email: user.email,
      roles,
      permissions: Array.from(permissionsSet),
    };
  }
}