export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    // Quyidagi yo'llarni himoyalash (faqat login bo'lganlar ko'ra oladi)
    "/(uz|ru|en|zh)/:path*",
    "/contacts",
    "/contacts/:path*",
  ],
};
