export interface IHotel {
    _id: string;
    hotelId: string;
    name: string;
    location: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICreateHotelRequest extends Omit<IHotel, 'hotelId' | 'createdAt' | 'updatedAt' | 'isActive'> {}
export interface IUpdateHotelRequest extends Partial<Omit<IHotel, 'hotelId' | 'createdAt' | 'updatedAt'>> {}