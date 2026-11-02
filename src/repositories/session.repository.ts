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

  /**
   * Replace the refresh-token id only if the session still holds the expected one.
   * A concurrent rotation updates zero documents and returns null.
   */
  public async rotateRefreshToken(
    sessionId: string,
    expectedRefreshTokenId: string,
    nextRefreshTokenId: string
  ): Promise<ISession | null> {
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return null;
    }

    return this.sessionModel
      .findOneAndUpdate(
        {
          _id: sessionId,
          refreshTokenId: expectedRefreshTokenId,
          isRevoked: false,
        },
        { $set: { refreshTokenId: nextRefreshTokenId } },
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

  public async findActiveSessionsByUserAndDevice(
    userId: string,
    deviceId: string
  ): Promise<ISession[]> {
    return this.sessionModel.find({
      userId,
      deviceId,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    })
      .lean<ISession[]>()
      .exec();
  }
}