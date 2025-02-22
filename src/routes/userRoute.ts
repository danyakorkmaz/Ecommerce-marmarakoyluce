import express from "express";
import { login, register, updateinfo } from "../services/userService";

const router = express.Router();//tualej talabat http li anawen url
//Bu rota, bir istemciden (frontend) /register adresine yapılan bir POST isteğini dinler.
//Örneğin:
//Kullanıcı, bir kayıt formunda adını, e-posta adresini ve şifresini doldurup "Kaydol" butonuna tıkladığında bu bilgiler sunucuya bir POST isteğiyle gönderilir.

router.post('/register', async (request, response) => {//Router tanımı
    try {
        const { name, surname, email, password, gender, getEmailNotificationFlag, adminFlag } = request.body;//İstekten veri alma yani Kullanıcıdan gelen istek gövdesini (request body) okur.
        
        const { statusCode, data } = await register({ name, surname, email, password, gender, getEmailNotificationFlag, adminFlag }); //Kayıt fonksiyonunu çağırma
        response.status(statusCode).send(data) //Cevap gönderme yani register fonksiyonu iki şey döndürür:statusCode: HTTP durum kodu ve data: Kayıt işlemi sonucunda dönen veri (örneğin: "Kayıt başarılı!" mesajı). 
    } catch {
        response.status(500).send("Something went wrong!");
    }
});


router.post('/login', async (request, response) => { //sahb altalabat mn alfrontend
    try {
        const { email, password } = request.body;
        const { data, statusCode } = await login({ email, password })
        response.status(statusCode).send(data);
    } catch {
        response.status(500).send("Something went wrong!");
    }
})

router.post('/updateinfo', async (request, response) => { //sahb altalabat mn alfrontend
    try {
        const {email, name, surname, birthdate, getEmailNotificationFlag} = request.body;
        const { data, statusCode } = await updateinfo({email, name, surname, birthdate, getEmailNotificationFlag})
        response.status(statusCode).send(data);
    } catch {
        response.status(500).send("Something went wrong!");
    }
})


export default router;