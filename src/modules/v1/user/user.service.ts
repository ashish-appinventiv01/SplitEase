import { AppError } from "../../../common/errors";
import { ErrorCode } from "../../../enum/enum";
import { UserRepository } from "../../../repositories/user.repository";
import { SessionRepository } from "../../../repositories/session.repository";
import { RedisSessionManager } from "../../../providers/redis/redis-session.manager";

import type {
    UpdateUserPayload,
    UserResponse,
} from "./interfaces/user.interface";

export class UserService {
    private readonly userRepository = new UserRepository();
    private readonly sessionRepository = new SessionRepository();
    private readonly redisSessionManager = new RedisSessionManager();

    public async getProfile(userId: string): Promise<UserResponse> {
        const user = await this.userRepository.findById(userId);

        if (!user || !user.isActive) {
            throw new AppError(
                "User not found",
                404,
                ErrorCode.NOT_FOUND
            );
        }

        return {
            id: String(
                (user as typeof user & { _id?: unknown })._id ?? ""
            ),
            name: user.name,
            email: user.email,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }

    public async updateProfile(
        userId: string,
        payload: UpdateUserPayload
    ): Promise<UserResponse> {
        if (!payload.name) {
            throw new AppError(
                "At least one field is required",
                400,
                ErrorCode.VALIDATION_ERROR
            );
        }

        const user = await this.userRepository.updateById(userId, {
            name: payload.name.trim(),
        });

        if (!user) {
            throw new AppError(
                "User not found",
                404,
                ErrorCode.NOT_FOUND
            );
        }

        return {
            id: String(
                (user as typeof user & { _id?: unknown })._id ?? ""
            ),
            name: user.name,
            email: user.email,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }

    public async deactivateAccount(userId: string): Promise<void> {
        const user = await this.userRepository.findById(userId);

        if (!user || !user.isActive) {
            throw new AppError(
                "User not found or already deactivated",
                404,
                ErrorCode.NOT_FOUND
            );
        }

        const activeSessions =
            await this.sessionRepository.findActiveSessionsByUser(userId);

        for (const session of activeSessions) {
            const sessionId = String(
                (session as typeof session & { _id?: unknown })._id ?? ""
            );

            if (sessionId) {
                await this.redisSessionManager.deleteSession(sessionId);
            }
        }

        await this.sessionRepository.revokeAllByUser(userId);

        await this.userRepository.deactivateById(userId);
    }
}