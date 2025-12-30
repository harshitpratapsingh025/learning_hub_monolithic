import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CacheService } from '../cache/cache.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto';
import { Role, RoleDocument } from '../roles/schemas';
import { UserRole, UserRoleDocument } from '../user-roles/schemas';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    @InjectModel(UserRole.name) private userRoleModel: Model<UserRoleDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Check if user exists
    const existingUser = await this.userModel.findOne({
      email: registerDto.email,
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    // Create user
    const user = new this.userModel({
      ...registerDto,
      passwordHash,
    });

    await user.save();

    // Assign default 'student' role
    const studentRole = await this.roleModel.findOne({ name: 'student' });

    if (studentRole) {
      const userRole = new this.userRoleModel({
        userId: user._id,
        roleId: studentRole._id,
      });
      await userRole.save();

      user.roles.push(studentRole._id);
      await user.save();
    }

    // Get user with roles and permissions
    const userWithRoles = await this.getUserWithRolesAndPermissions(
      user._id.toString(),
    );

    this.logger.log(`User registered: ${user.email}`);

    return {
      user: this.sanitizeUser(userWithRoles),
      ...(await this.generateTokens(userWithRoles)),
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.userModel.findOne({ email: loginDto.email });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    const userWithRoles = await this.getUserWithRolesAndPermissions(
      user._id.toString(),
    );

    this.logger.log(`User logged in: ${user.email}`);

    return {
      user: this.sanitizeUser(userWithRoles),
      ...(await this.generateTokens(userWithRoles)),
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('jwt.secret'),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.userModel.findById(payload.sub);

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      const userWithRoles = await this.getUserWithRolesAndPermissions(
        user._id.toString(),
      );

      return this.generateTokens(userWithRoles);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateUser(userId: string): Promise<any> {
    // Try cache first
    const cacheKey = `user:${userId}`;
    const cached = await this.cacheService.get(cacheKey);

    if (cached) {
      return cached;
    }

    const user = await this.getUserWithRolesAndPermissions(userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Cache user for 5 minutes
    await this.cacheService.set(cacheKey, user, 300);

    return user;
  }

  private async getUserWithRolesAndPermissions(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .populate({
        path: 'roles',
        populate: {
          path: 'permissions',
        },
      })
      .lean();

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Extract role names and permissions
    const roles = user.roles.map((role: any) => role.name);
    const permissionsSet = new Set<string>();

    user.roles.forEach((role: any) => {
      role.permissions?.forEach((perm: any) => {
        permissionsSet.add(perm.name);
      });
    });

    return {
      ...user,
      id: user._id.toString(),
      roles,
      permissions: Array.from(permissionsSet),
    };
  }

  private async generateTokens(user: any) {
    const payload = {
      sub: user.id || user._id.toString(),
      email: user.email,
      roles: user.roles,
      permissions: user.permissions,
    };

    const accessToken = this.jwtService.sign(
      { ...payload, type: 'access' },
      {
        secret: this.configService.get('jwt.secret'),
        expiresIn: this.configService.get('jwt.accessTokenExpiry'),
      },
    );

    const refreshToken = this.jwtService.sign(
      { sub: user.id || user._id.toString(), type: 'refresh' },
      {
        secret: this.configService.get('jwt.secret'),
        expiresIn: this.configService.get('jwt.refreshTokenExpiry'),
      },
    );

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 1800,
    };
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }
}