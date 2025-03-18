import express from "express";
import { createAddress, deleteAddress, getAllAddresses, updateAddress } from "../services/addressService";

const router = express.Router();

router.post("/create", async (req, res) => {
   try {
      const { userId, type, country, city, district, subdistrict, neighborhood, street, boulevard,
         avenue, buildingNo, doorNo, floor, apartmentNo, postalCode, fullAddress, googleMapCoordinates,
         isDefaultFlag } = req.body;

      const { statusCode, data } = await createAddress({
         userId, type, country, city, district, subdistrict, neighborhood, street, boulevard,
         avenue, buildingNo, doorNo, floor, apartmentNo, postalCode, fullAddress, googleMapCoordinates,
         isDefaultFlag
      });
      res.status(statusCode).send(data);
   } catch (error) {
      console.error("Adres oluşturma hatası:", error);
      res.status(500).send("Bir hata oluştu!");
   }
});


router.post("/update", async (req, res) => {
   try {
      const { addressId, userId, type, country, city, district, subdistrict, neighborhood, street, boulevard,
         avenue, buildingNo, doorNo, floor, apartmentNo, postalCode, fullAddress, googleMapCoordinates, isDefaultFlag } = req.body;

      const { statusCode, data } = await updateAddress({
         addressId, userId, type, country, city, district, subdistrict, neighborhood, street, boulevard,
         avenue, buildingNo, doorNo, floor, apartmentNo, postalCode, fullAddress, googleMapCoordinates, isDefaultFlag
      });
      res.status(statusCode).send(data);
   } catch (error) {
      console.error("Adres güncelleme hatası:", error);
      res.status(500).send("Bir hata oluştu!");
   }
});




router.delete("/delete/:addressId", async (req, res) => {
   try {
     const { addressId } = req.params;  // Parametre olarak addressId alıyoruz
     const { userId } = req.body;  // Kullanıcı bilgisi (userId) genellikle request body'den gelir, kimlik doğrulaması sonrası alındığını varsayıyorum
 
     // Adres silme fonksiyonunu çağırıyoruz
     const { data, statusCode } = await deleteAddress({ addressId, userId });
 
     // Yanıtı gönderiyoruz
     res.status(statusCode).send(data);
   } catch (error) {
     console.error("Adres silme hatası:", error);
     res.status(500).json({ message: "Adres silinirken hata oluştu!" });
   }
 });

 
 router.get("/list-all/:userId", async (req, res) => {
   try {
     const { userId } = req.params;
 
     // Kullanıcıya ait tüm adresleri getiren fonksiyonu çağır
     const { data, statusCode } = await getAllAddresses(userId);
 
     // Yanıtı gönder
     res.status(statusCode).json(data);
   } catch (error) {
     console.error("Adresler getirilirken hata oluştu:", error);
     res.status(500).json({ message: "Adresler getirilirken hata oluştu!" });
   }
 });
export default router;









