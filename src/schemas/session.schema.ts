import mongoose, { Schema, type Model } from "mongoose";

export interface ISession {
    userId: mongoose.Types.ObjectId;
    deviceId: string;
    deviceType: number;
    refreshTokenId: string;
    isRevoked: boolean;
    expiresAt: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export class SessionSchema {
    private static readonly schema = new Schema<ISession>(
        {
            userId: {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },

            deviceId: {
                type: String,
                required: true,
            },

            deviceType: {
                type: Number,
                required: true,
                enum: [1, 2, 3],
            },

            refreshTokenId: {
                type: String,
                required: true,
            },

            isRevoked: {
                type: Boolean,
                default: false,
            },

            expiresAt: {
                type: Date,
                required: true,
            },
        },
        {
            timestamps: true,
            versionKey: false,
        }
    );

    static {
        this.schema.index({ userId: 1, deviceId: 1 });
        this.schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    }

    public static readonly model: Model<ISession> =
        (mongoose.models.Session as Model<ISession>) ||
        mongoose.model<ISession>("Session", SessionSchema.schema);
}