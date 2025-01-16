import productModel from "../models/productModel";

export const getAllProducts = async () => {
    return await productModel.find();
};

export const seedIntitialProducts = async () => {
    try {
        const products = [
            { 
                title: "Domates", 
                image: "https://cdn.example.com/images/domates.jpg", 
                price: 20, 
                stockCount: 100, 
                categoryID: "sebze", 
                subcategoryID: "taze-sebze", 
                description: "Taze ve lezzetli domatesler.",
                SKU: "DOM123",
                measureUnit: "kg",
                measureValue: 1,
            },
            { 
                title: "Salatalık", 
                image: "https://cdn.example.com/images/salatalik.jpg", 
                price: 15, 
                stockCount: 80, 
                categoryID: "sebze", 
                subcategoryID: "taze-sebze", 
                description: "Taze ve çıtır salatalıklar.",
                SKU: "SAL123",
                measureUnit: "kg",
                measureValue: 1,
            },
            { 
                title: "Patlıcan", 
                image: "https://cdn.example.com/images/patlican.jpg", 
                price: 25, 
                stockCount: 60, 
                categoryID: "sebze", 
                subcategoryID: "taze-sebze", 
                description: "Taze ve kaliteli patlıcanlar.",
                SKU: "PAT123",
                measureUnit: "kg",
                measureValue: 1,
            },
        ];

        const existingProducts = await getAllProducts();

        if (existingProducts.length === 0) {
            await productModel.insertMany(products);
            console.log("Sebze ürünleri başarıyla eklendi!");
        } else {
            console.log("Ürünler zaten mevcut.");
        }
    } catch (err) {
        console.error("Veritabanına erişilemiyor:", err);
    }
};

