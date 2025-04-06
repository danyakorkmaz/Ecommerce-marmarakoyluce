import userModel, { IUser } from "../models/userModel";
import bcrypt from "bcrypt"; //şifreleri güvenli hale getirmek için kullanılır 
import jwt from "jsonwebtoken" //kullanıcı oturumlarını yönetmek için jwt oluşturur
import dotenv from 'dotenv'


dotenv.config();

// (REGİSTER FUNC.) Kullanıcıdan gelen kayıt verisini temsil eder.
interface RegisterParams { // bu fonk.da sadece kullanacağımız nesnesleri yazarız
  name: string;
  surname: string;
  email: string;
  password: string;
  gender: string;
  getEmailNotificationFlag: boolean;
  adminFlag: boolean;
}

export const register = async ({ //frontendden gelen veriler ancak hala veritabana kaydedilmemiş
  name,
  surname,
  email,
  password,
  gender,
  getEmailNotificationFlag,
  adminFlag
}: RegisterParams) => {
  const findUser = await userModel.findOne({ email: email.trim() });

  if (findUser) {
    return { data: "Bu e-posta adresine sahip bir kullanıcı zaten var!", statusCode: 400 };
  }

  const hashedPassword = await bcrypt.hash(password.trim(), 10);
  
  const newUser = new userModel({
    name: name.trim(),
    surname: surname.trim(),
    email: email.trim(),
    password: hashedPassword,
    gender: gender.trim(),
    getEmailNotificationFlag,
    adminFlag,
  });
  
  await newUser.save();

  return { data: generateJWT({email: email.trim(), name: name.trim(), surname: surname.trim()}), statusCode: 200 };
};

//****************************************************************************** */

interface LoginParams {
  email: string;
  password: string;
}

export const login = async ({ email, password }: LoginParams) => {
  const findUser = await userModel.findOne({ email: email.trim() });

  if (!findUser) {
    return { data: "E-posta veya şifre hatalıdır! lütfen tekrar deneyin..", statusCode: 400 };
  }

  const passwordMatch = await bcrypt.compare(password.trim(), findUser.password); //password === findUser.password;
  if (passwordMatch) {
    return { data: generateJWT({email: email.trim(), name: findUser.name.trim(), surname: findUser.surname.trim()}), statusCode: 200};
  }
  return { data: "E-posta veya şifre hatalıdır! lütfen tekrar deneyin..", statusCode: 400 };
};


//*************************************************************** */
interface UpdateinfoParams {
  user: IUser; // Kullanıcıyı tanımlamak için gerekli
  name?: string; // Güncellenebilir alanlar opsiyonel olmalı
  surname?: string;
  birthdate?: Date;
  getEmailNotificationFlag?: boolean;
}

export const updateinfo = async ({user, name, surname, birthdate, getEmailNotificationFlag}: UpdateinfoParams) => {
  
  // Güncellenecek alanları belirle
  const updateFields: Partial<UpdateinfoParams> = {};
  if (name) updateFields.name = name.trim();
  if (surname) updateFields.surname = surname.trim();
  if (birthdate) updateFields.birthdate = birthdate;
  if (getEmailNotificationFlag) updateFields.getEmailNotificationFlag = getEmailNotificationFlag;

  // Kullanıcı bilgilerini güncelle
  const updatedUser = await userModel.findOneAndUpdate(
    { email: user.email }, // Şu kullanıcıyı bul
    { $set: updateFields }, // Belirtilen alanları güncelle
    { new: true } // Güncellenmiş kullanıcıyı döndür
  );

  return { data: {email: updatedUser?.email, name: updatedUser?.name, surname: updatedUser?.surname, birthdate: updatedUser?.birthdate, getEmailNotificationFlag: updatedUser?.getEmailNotificationFlag}, statusCode: 200 }; // Güncellenmiş kullanıcıyı döndür
};


const generateJWT = (data: any) => {
  return jwt.sign(data, process.env.JWT_SECRET || '')//sign func. şifreli bir data oluşturuyor(data = iştediğimiz veri uzerine şifre, secretkey : rakam mn ajıl tşfir albayanat tabana)
}
//******************************************************************** */
