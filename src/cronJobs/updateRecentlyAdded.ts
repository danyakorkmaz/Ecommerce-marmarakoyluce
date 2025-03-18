import cron from "node-cron";
import productModel from "../models/productModel";

/**
 * Eski ürünlerde recentlyAddedFlag değerini false yapar.
 */
const updateRecentlyAddedFlag = async () => {
  try {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14); // 14 gün öncesine bak

    const result = await productModel.updateMany(
      { createDate: { $lt: twoWeeksAgo }, recentlyAddedFlag: true },
      { $set: { recentlyAddedFlag: false } }
    );

    console.log(`✅ ${result.modifiedCount} ürünün recentlyAddedFlag değeri güncellendi.`);
  } catch (error) {
    console.error("❌ Cron Job Hatası: Recently Added Flag güncellenemedi!", error);
  }
};

// 🔹 Cron job her gece 00:00'da çalışacak
cron.schedule("0 0 * * *", updateRecentlyAddedFlag, {
  scheduled: true,
  timezone: "Europe/Istanbul",
});

export default updateRecentlyAddedFlag;
