import mongoose from "mongoose";
import addressModel, { IAddress } from "../models/addressModel";
import userModel from "../models/userModel";


//Create Address fonk.
interface CreateAddressParams {
    userId: string;
    type: "ev" | "iş" | "diğer";
    country: string;
    city: string;
    district: string;
    subdistrict: string;
    neighborhood: string;
    street: string;
    boulevard?: string;
    avenue: string;
    buildingNo?: string;
    doorNo: string;
    floor: string;
    apartmentNo: string;
    postalCode: string;
    fullAddress: string;
    googleMapCoordinates?: { lat: number; lng: number };
    isDefaultFlag?: boolean;
}

export const createAddress = async ({
    userId, type, country, city, district, subdistrict, neighborhood, street, boulevard, avenue, buildingNo,
    doorNo, floor, apartmentNo, postalCode, fullAddress, googleMapCoordinates, isDefaultFlag = false
}: CreateAddressParams) => {
    try {
        // Eksik alan kontrolü
        const requiredFields = [
            userId, type, country, city, district, subdistrict, neighborhood, street,
            avenue, doorNo, floor, apartmentNo, postalCode, fullAddress
        ];
        if (requiredFields.some(field => !field)) {
            return { data: "Lütfen tüm zorunlu alanları eksiksiz doldurun!", statusCode: 400 };
        }

        // Sayısal alan kontrolü (0'dan büyük olmalı)
        const numericFields = { doorNo, floor, apartmentNo, postalCode, buildingNo };
        for (const [key, value] of Object.entries(numericFields)) {
            if (value !== undefined) {
                const numValue = Number(value);
                if (isNaN(numValue) || (key !== "floor" && numValue <= 0)) {
                    return { data: `${key} sadece pozitif bir sayı olmalıdır!`, statusCode: 400 };
                }
            }
        }

        // Geçersiz ID Kontrolleri
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return { data: "Geçersiz kullanıcı ID!", statusCode: 400 };
        }
        const userObjectId = new mongoose.Types.ObjectId(userId);

        // Kullanıcı Kontrolü
        const findUser = await userModel.findById(userObjectId);
        if (!findUser) {
            return { data: "Kullanıcı bulunamadı!", statusCode: 404 };
        }

        // Varsayılan Adres Kontrolü
        if (isDefaultFlag) {
            await addressModel.updateMany({ userId }, { isDefaultFlag: false });
        }

        // Adresin daha önce var olup olmadığını kontrol et
        const existingAddress = await addressModel.findOne({
            userId: userObjectId,
            country,
            city,
            district,
            neighborhood,
            street,
            doorNo, // Burada benzer adreslerin olup olmadığını kontrol etmek için kapı numarasını da dahil ediyorum.
            postalCode
        });

        if (existingAddress) {
            return { data: "Bu adres zaten mevcut!", statusCode: 400 };
        }

        // Yeni Adresi Kaydet
        const newAddress = new addressModel({
            userId: userObjectId, // Burada backend otomatik olarak ekler
            type,
            country,
            city,
            district,
            subdistrict,
            neighborhood,
            street,
            boulevard,
            avenue,
            buildingNo,
            doorNo,
            floor,
            apartmentNo,
            postalCode,
            fullAddress,
            googleMapCoordinates,
            validFlag: true,
            isDefaultFlag,
        });

        const savedAddress = await newAddress.save();
        return { data: { fullAddress }, statusCode: 201 }; // İstemciye sadece gerekli bilgileri gönder
    } catch (error) {
        console.error("Adres oluşturma hatası:", error);
        return { data: "Adres oluşturulurken bir hata meydana geldi!", statusCode: 500 };
    }
};

/************************************************************************* */
//Edit Address fonk.

interface UpdateAddressParams {
    addressId: string;
    userId: string;
    type?: "ev" | "iş" | "diğer";
    country?: string;
    city?: string;
    district?: string;
    subdistrict?: string;
    neighborhood?: string;
    street?: string;
    boulevard?: string;
    avenue?: string;
    buildingNo?: string;
    doorNo?: string;
    floor?: string;
    apartmentNo?: string;
    postalCode?: string;
    fullAddress?: string; // fullAddress artık opsiyonel olacak, çünkü otomatik oluşturulacak
    googleMapCoordinates?: { lat: number; lng: number };
    isDefaultFlag?: boolean;
}

export const updateAddress = async ({
    addressId,
    userId,
    ...updateFields
}: UpdateAddressParams) => {
    try {
        // Geçersiz addressId kontrolü
        if (!mongoose.Types.ObjectId.isValid(addressId)) {
            return { data: "Geçersiz adres ID!", statusCode: 400 };
        }

        // Geçersiz userId kontrolü
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return { data: "Geçersiz kullanıcı ID!", statusCode: 400 };
        }

        // Adresin var olup olmadığını kontrol et
        const address = await addressModel.findById(addressId);
        if (!address) {
            return { data: "Adres bulunamadı!", statusCode: 404 };
        }

        // Adresin gerçekten kullanıcının mı olduğunu kontrol et
        if (address.userId.toString() !== userId) {
            return { data: "Adres size ait değil!", statusCode: 403 };
        }

        // Eğer fullAddress sağlanmamışsa, otomatik olarak oluşturulacak
        if (!updateFields.fullAddress) {
            const { country, city, district, subdistrict, neighborhood, street, avenue, buildingNo, doorNo, floor, apartmentNo } = updateFields;

            // fullAddress'ı dinamik olarak oluştur
            const fullAddress = `${neighborhood || address.neighborhood} ${street || address.street}, ${avenue || address.avenue} ${buildingNo || address.buildingNo}, Kapı No: ${doorNo || address.doorNo}, Kat: ${floor || address.floor}, Daire No: ${apartmentNo || address.apartmentNo}, ${district || address.district}, ${city || address.city}, ${country || address.country}, ${updateFields.postalCode || address.postalCode}`;

            // fullAddress'ı güncelle
            updateFields.fullAddress = fullAddress;
        }

        // Eğer isDefaultFlag true ise, diğer varsayılan adresleri sıfırla
        if (updateFields.isDefaultFlag) {
            await addressModel.updateMany({ userId }, { isDefaultFlag: false });
        }

        // Adresi Güncelle
        const updatedAddress = await addressModel.findByIdAndUpdate(addressId, updateFields, { new: true });

        return { data: updatedAddress, statusCode: 200 };
    } catch (error) {
        console.error("Adres güncelleme hatası:", error);
        return { data: "Adres güncellenirken hata oluştu!", statusCode: 500 };
    }
};

/************************************************************************* */
//Delet Address fonk.
interface DeleteAddressParams {
    addressId: string;
    userId: string;
}

export const deleteAddress = async ({ addressId, userId }: DeleteAddressParams) => {
    try {
        // Geçersiz addressId kontrolü
        if (!mongoose.Types.ObjectId.isValid(addressId)) {
            return { data: "Geçersiz adres ID!", statusCode: 400 };
        }

        // Geçersiz userId kontrolü
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return { data: "Geçersiz kullanıcı ID!", statusCode: 400 };
        }

        // Adresin var olup olmadığını kontrol et
        const address = await addressModel.findById(addressId);
        if (!address) {
            return { data: "Adres bulunamadı!", statusCode: 404 };
        }

        // Adresin gerçekten kullanıcının mı olduğunu kontrol et
        if (address.userId.toString() !== userId) {
            return { data: "Adres size ait değil userId geçersiz!", statusCode: 403 };
        }

        // Adresi sil
        await addressModel.findByIdAndDelete(addressId);

        return { data: "Adres başarıyla silindi.", statusCode: 200 };
    } catch (error) {
        console.error("Adres silme hatası:", error);
        return { data: "Adres silinirken hata oluştu!", statusCode: 500 };
    }
};

/************************************************************************* */
//list-all Address fonk.
export const getAllAddresses = async (userId: string) => {
    try {
        // Kullanıcıya ait adresleri getirirken `createdAt`, `updatedAt`, `_id` ve `userId` alanlarını hariç tut
        const addresses = await addressModel.find({ userId }).select("-createdAt -updatedAt -_id -userId");

        if (addresses.length === 0) {
            return { data: "Bu kullanıcıya ait adres bulunmamaktadır!", statusCode: 404 };
        }
        return { data: addresses, statusCode: 200 };
    } catch (error) {
        console.error("Adresler getirilirken hata oluştu:", error);
        return { data: "Adresler getirilirken hata oluştu!", statusCode: 500 };
    }
};

