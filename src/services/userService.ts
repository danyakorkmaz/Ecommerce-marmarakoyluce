import userModel from "../models/userModel";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"


//Kullanıcıdan gelen kayıt verisini temsil eder.
interface RegisterParams {
  name: string;
  surname: string;
  email: string;
  password: string;
  gender: string;
  getEmailNotificationFlag: boolean;
}

export const register = async ({
  name,
  surname,
  email,
  password,
  gender,
  getEmailNotificationFlag
}: RegisterParams) => {
  const findUser = await userModel.findOne({ email });

  if (findUser) {
    return { data: "User already exsits!", statusCode: 400 };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  
  const newUser = new userModel({
    name,
    surname,
    email,
    password: hashedPassword,
    gender,
    getEmailNotificationFlag
  });
  
  await newUser.save();

  return { data: generateJWT({email, name, surname}), statusCode: 200 };
};

//*************************************************************** */

interface LoginParams {
  email: string;
  password: string;
}

export const login = async ({ email, password }: LoginParams) => {
  const findUser = await userModel.findOne({ email });

  if (!findUser) {
    return { data: "Incorrect email or password!", statusCode: 400 };
  }

  const passwordMatch = await bcrypt.compare(password, findUser.password); //password === findUser.password;
  if (passwordMatch) {
    return { data: generateJWT({email, name: findUser.name, surname: findUser.surname}), statusCode: 200};
  }
  return { data: "Incorrect email or password!", statusCode: 400 };
};


// const generateJWT = (data: any) => {
//   return jwt.sign(data, process.env.JWT_SECRET || '')//sign func. şifreli bir data oluşturuyor(data = iştediğimiz veri uzerine şifre, secretkey : rakam mn ajıl tşfir albayanat tabana)
// }


//*************************************************************** */
interface UpdateinfoParams {
  email: string; // Kullanıcıyı tanımlamak için gerekli
  name?: string; // Güncellenebilir alanlar opsiyonel olmalı
  surname?: string;
  telNumber?: string;
  birthdate?: Date;
}

export const updateinfo = async ({ email, name, surname, telNumber, birthdate}: UpdateinfoParams) => {
  // Kullanıcıyı e-posta ile bul
  const findUser = await userModel.findOne({ email });

  if (!findUser) {
    return { data: "User not found!", statusCode: 404 }; // Kullanıcı bulunamazsa hata döndür
  }

  // Güncellenecek alanları belirle
  const updateFields: Partial<UpdateinfoParams> = {};
  if (name) updateFields.name = name;
  if (surname) updateFields.surname = surname;
  if (telNumber) updateFields.telNumber = telNumber;
  if (birthdate) updateFields.birthdate = birthdate;

  // Kullanıcı bilgilerini güncelle
  const updatedUser = await userModel.findOneAndUpdate(
    { email }, // Şu kullanıcıyı bul
    { $set: updateFields }, // Belirtilen alanları güncelle
    { new: true } // Güncellenmiş kullanıcıyı döndür
  );

  return { data: generateJWT(updatedUser), statusCode: 200 }; // Güncellenmiş kullanıcıyı döndür
};

const generateJWT = (data: any) => {
  return jwt.sign(data,'fertaergrthyfjyyj')//sign func. şifreli bir data oluşturuyor(data = iştediğimiz veri uzerine şifre, secretkey : rakam mn ajıl tşfir albayanat tabana)
}
//*************************************************************** */
