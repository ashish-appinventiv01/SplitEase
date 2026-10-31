import { UserSchema, type IUser } from "../schemas/user.schema";
import mongoose from "mongoose";

export class UserRepository {
  private readonly userModel = UserSchema.model;

  public async create(userData: Partial<IUser>): Promise<IUser> {
    const user = await this.userModel.create(userData);
    return user.toObject() as IUser;
  }

  public async findByEmail(email: string): Promise<IUser | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase() })
      .select("+passwordHash")
      .lean<IUser>()
      .exec();
  }

  public async findById(
    userId: string
  ): Promise<IUser | null> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return null;
    }

    return this.userModel
      .findById(userId)
      .lean<IUser>()
      .exec();
  }

  public async existsByEmail(email: string): Promise<boolean> {
    const user = await this.userModel.exists({
      email: email.toLowerCase(),
    });

    return Boolean(user);
  }
}