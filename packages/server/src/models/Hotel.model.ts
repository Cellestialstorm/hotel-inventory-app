import mongoose, { Schema, Document } from 'mongoose';
import { IHotel as ISharedHotel } from '@hotel-inventory/shared';

export interface IHotelDocument extends Document, Omit<ISharedHotel, 'hotelId'> {
    hotelId: string;
}

const HotelSchema: Schema<IHotelDocument> = new Schema(
    {
        hotelId: {
            type: String,
            required: [true, 'Hotel ID is required'],
            unique: true,
            trim: true
        },
        name: {
            type: String,
            required: [true, 'Hotel name is required'],
            unique: true,
            trim: true
        },
        location: {
            type: String,
            required: [true, 'Hotel location is required'],
            trim: true
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

const Hotel = mongoose.model<IHotelDocument>('Hotel', HotelSchema);

export default Hotel;