import mongoose from "mongoose";
import { SessionSchema, type ISession } from "../schemas/session.schema";

export class SessionRepository {
  private readonly sessionModel = SessionSchema.model;

  public async create(
    sessionData: Partial<ISession>
  ): Promise<ISession> {
    const session = await this.sessionModel.create(sessionData);
    return session.toObject() as ISession;
  }

  public async findById(
    sessionId: string
  ): Promise<ISession | null> {
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return null;
    }

    return this.sessionModel
      .findById(sessionId)
      .lean<ISession>()
      .exec();
  }

  public async findByUserAndDevice(
    userId: string,
    deviceId: string
  ): Promise<ISession | null> {
    return this.sessionModel
      .findOne({
        userId,
        deviceId,
        isRevoked: false,
        expiresAt: { $gt: new Date() },
      })
      .lean<ISession>()
      .exec();
  }

  public async updateRefreshToken(
    sessionId: string,
    refreshTokenId: string
  ): Promise<ISession | null> {
    return this.sessionModel
      .findByIdAndUpdate(
        sessionId,
        { refreshTokenId },
        { new: true, runValidators: true }
      )
      .lean<ISession>()
      .exec();
  }

  public async revoke(sessionId: string): Promise<boolean> {
    const result = await this.sessionModel.updateOne(
      { _id: sessionId },
      { $set: { isRevoked: true } }
    );

    return result.modifiedCount > 0;
  }

  public async revokeByUserAndDevice(
    userId: string,
    deviceId: string
  ): Promise<void> {
    await this.sessionModel.updateOne(
      { userId, deviceId, isRevoked: false },
      { $set: { isRevoked: true } }
    );
  }
}