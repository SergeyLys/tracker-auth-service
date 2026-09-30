import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
} from 'sequelize-typescript';
import type { CreationOptional, InferCreationAttributes } from 'sequelize';

@Table({ tableName: 'refresh_tokens' })
export class RefreshTokens extends Model<
  RefreshTokens,
  InferCreationAttributes<RefreshTokens>
> {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    allowNull: false,
  })
  declare id: CreationOptional<string>;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  declare tokenHash: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare expiresAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  declare createdAt: CreationOptional<Date>;

  @Column({
    type: DataType.DATE,
  })
  declare lastUsedAt: CreationOptional<Date>;

  @Column({
    type: DataType.DATE,
  })
  declare revokedAt: CreationOptional<Date>;

  @Column({
    type: DataType.UUID,
  })
  declare replacedById: CreationOptional<string>;

  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare userId: string;
}
