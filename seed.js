import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'db.json');

const defaultSeedData = {
categories: [
    { id: 1, name: "Cleaning", nameAr: "التنظيف", icon: "🧹", description: "Home and office cleaning", descriptionAr: "تنظيف المنزل والمكتب", color: "#3b82f6", activationDate: "2025-01-01", familyId: 1, isActive: true },
    { id: 2, name: "Plumbing", nameAr: "السباكة", icon: "🪠", description: "Pipe and leak repairs", descriptionAr: "إصلاح الأنابيب والتسريبات", color: "#10b981", activationDate: "2025-01-01", familyId: 1, isActive: true },
    { id: 3, name: "Electrical", nameAr: "الكهرباء", icon: "⚡", description: "Electrical installations and repairs", descriptionAr: "تركيبات وإصلاحات كهربائية", color: "#f59e0b", activationDate: "2025-01-01", familyId: 1, isActive: true },
    { id: 4, name: "Handyman", nameAr: "أعمال الصيانة", icon: "🛠️", description: "General repairs and assembly", descriptionAr: "إصلاحات عامة وتجميع", color: "#6366f1", activationDate: "2025-01-01", familyId: 1, isActive: true },
    { id: 5, name: "Painting", nameAr: "الدهان", icon: "🎨", description: "Interior and exterior painting", descriptionAr: "دهان داخلي وخارجي", color: "#ec4899", activationDate: "2025-01-01", familyId: 1, isActive: true },
    { id: 6, name: "Landscaping", nameAr: "تنسيق الحدائق", icon: "🌿", description: "Garden and yard maintenance", descriptionAr: "صيانة الحدائق والساحات", color: "#14b8a6", activationDate: "2025-01-01", familyId: 1, isActive: true }
  ],
serviceFamilies: [
    { id: 1, name: "Home Services", nameAr: "خدمات المنزل", description: "Professional home maintenance, repair, and improvement", descriptionAr: "صيانة وإصلاح وتحسين المنزل الاحترافية", icon: "Home", color: "#3b82f6", isActive: true, sortOrder: 1, createdAt: "2025-01-01" },
    { id: 2, name: "Instant Delivery", nameAr: "التوصيل الفوري", description: "Fast on-demand delivery of goods, food, and parcels", descriptionAr: "توصيل سريع عند الطلب للبضائع والطعام والطرود", icon: "Truck", color: "#f59e0b", isActive: false, sortOrder: 2, createdAt: "2025-01-01" },
    { id: 3, name: "Scheduled Services", nameAr: "الخدمات المجدولة", description: "Recurring and appointment-based professional services", descriptionAr: "خدمات مهنية متكررة وقائمة على المواعيد", icon: "Calendar", color: "#10b981", isActive: true, sortOrder: 3, createdAt: "2025-01-01" }
  ],
  users: [
    { id: 1, name: "Admin User", email: "admin@srvio.com", password: "demo123", phone: "555-0000", role: "ADMIN", preferredLanguage: "en", isVerified: true, joinDate: "2025-01-01T00:00:00Z" },
    { id: 2, name: "Mike Provider", email: "mike@email.com", password: "demo123", phone: "555-1111", role: "PROVIDER", preferredLanguage: "en", isVerified: true, joinDate: "2025-01-01T00:00:00Z" },
    { id: 3, name: "John Customer", email: "john@email.com", password: "demo123", phone: "555-2222", role: "CUSTOMER", preferredLanguage: "en", isVerified: true, joinDate: "2025-01-01T00:00:00Z" },
    { id: 4, name: "Sarah Expert", email: "sarah@email.com", password: "demo123", phone: "555-3333", role: "PROVIDER", preferredLanguage: "en", isVerified: true, joinDate: "2025-01-02T00:00:00Z" },
    { id: 5, name: "David Handyman", email: "david@email.com", password: "demo123", phone: "555-4444", role: "PROVIDER", preferredLanguage: "en", isVerified: true, joinDate: "2025-01-03T00:00:00Z" },
    { id: 6, name: "Alice Customer", email: "alice@email.com", password: "demo123", phone: "555-5555", role: "CUSTOMER", preferredLanguage: "en", isVerified: true, joinDate: "2025-01-05T00:00:00Z" },
  ],
  services: [
    { id: 1, name: "Deep House Cleaning", nameAr: "تنظيف منزلي عميق", description: "Complete house deep cleaning service.", descriptionAr: "خدمة تنظيف منزلي شاملة وعميقة.", categoryId: 1, providerId: 2, providerName: "Mike Provider", providerNameAr: "الفتح للخدمات المنزلية", price: 150, priceUnit: "per job", duration: "3 hours", isActive: true, rating: 4.8, createdAt: "2025-01-01T00:00:00Z", verificationStatus: "approved", image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=400&fit=crop" },
    { id: 2, name: "Standard Office Cleaning", nameAr: "تنظيف مكتبي عادي", description: "Regular office cleaning and sanitization.", descriptionAr: "تنظيف وتعقيم المكتب بشكل دوري.", categoryId: 1, providerId: 2, providerName: "Mike Provider", providerNameAr: "الفتح للخدمات المنزلية", price: 80, priceUnit: "per job", duration: "2 hours", isActive: true, rating: 4.5, createdAt: "2025-01-02T00:00:00Z", verificationStatus: "approved", image: "https://images.unsplash.com/photo-1584697964358-3e14ca57658b?w=600&h=400&fit=crop" },
    { id: 3, name: "Leaky Pipe Repair", nameAr: "إصلاح تسريب الأنابيب", description: "Fixing under-sink leaks and pipe bursts.", descriptionAr: "إصلاح التسريبات تحت الحوض وانفجارات الأنابيب.", categoryId: 2, providerId: 4, providerName: "Sarah Expert", providerNameAr: "", price: 120, priceUnit: "per job", duration: "1.5 hours", isActive: true, rating: 4.9, createdAt: "2025-01-03T00:00:00Z", verificationStatus: "approved", image: "https://images.unsplash.com/photo-1621905251189-08b45d6a26c7?w=600&h=400&fit=crop" },
    { id: 4, name: "Toilet Installation", nameAr: "تركيب مرحاض", description: "Complete installation of new toilet fixtures.", descriptionAr: "تركيب كامل لمعدات المرحاض الجديدة.", categoryId: 2, providerId: 4, providerName: "Sarah Expert", providerNameAr: "", price: 200, priceUnit: "per job", duration: "2.5 hours", isActive: true, rating: 5.0, createdAt: "2025-01-04T00:00:00Z", verificationStatus: "approved", image: "https://images.unsplash.com/photo-1584622650111-993b4264bf4b?w=600&h=400&fit=crop" },
    { id: 5, name: "Electrical Panel Upgrade", nameAr: "ترقية لوحة الكهرباء", description: "Upgrading home electrical panels to modern standards.", descriptionAr: "ترقية لوحات الكهرباء المنزلية إلى المعايير الحديثة.", categoryId: 3, providerId: 5, providerName: "David Handyman", providerNameAr: "", price: 500, priceUnit: "per job", duration: "4 hours", isActive: true, rating: 4.7, createdAt: "2025-01-05T00:00:00Z", verificationStatus: "approved", image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&h=400&fit=crop" },
    { id: 6, name: "Light Fixture Installation", nameAr: "تركيب إضاءة", description: "Installing ceiling lights and chandeliers.", descriptionAr: "تركيب إضاءة السقف والثريات.", categoryId: 3, providerId: 5, providerName: "David Handyman", providerNameAr: "", price: 60, priceUnit: "per hour", duration: "1 hour", isActive: true, rating: 4.6, createdAt: "2025-01-06T00:00:00Z", verificationStatus: "approved", image: "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=600&h=400&fit=crop" },
    { id: 7, name: "Furniture Assembly", nameAr: "تجميع الأثاث", description: "IKEA and other brand furniture assembly.", descriptionAr: "تجميع أثاث أيكيا والعلامات التجارية الأخرى.", categoryId: 4, providerId: 5, providerName: "David Handyman", providerNameAr: "", price: 45, priceUnit: "per hour", duration: "2 hours", isActive: true, rating: 4.9, createdAt: "2025-01-07T00:00:00Z", verificationStatus: "approved", image: "https://images.unsplash.com/photo-1583845112203-29329902332e?w=600&h=400&fit=crop" },
    { id: 8, name: "TV Mounting", nameAr: "تثبيت شاشة التلفاز", description: "Secure wall mounting for TVs of all sizes.", descriptionAr: "تثبيت آمن على الجدران لشاشات التلفاز بجميع الأحجام.", categoryId: 4, providerId: 5, providerName: "David Handyman", providerNameAr: "", price: 80, priceUnit: "per job", duration: "1.5 hours", isActive: true, rating: 4.8, createdAt: "2025-01-08T00:00:00Z", verificationStatus: "approved", image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&h=400&fit=crop" },
    { id: 9, name: "Interior Room Painting", nameAr: "دهان داخلي للغرف", description: "Painting walls and ceilings for standard rooms.", descriptionAr: "دهان الجدران والأسقف للغرف العادية.", categoryId: 5, providerId: 2, providerName: "Mike Provider", providerNameAr: "الفتح للخدمات المنزلية", price: 300, priceUnit: "per room", duration: "5 hours", isActive: true, rating: 4.4, createdAt: "2025-01-09T00:00:00Z", verificationStatus: "approved", image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&h=400&fit=crop" },
    { id: 10, name: "Exterior Trim Painting", nameAr: "دهان الإطارات الخارجية", description: "Refreshing exterior window and door trims.", descriptionAr: "تجديد إطارات النوافذ والأبواب الخارجية.", categoryId: 5, providerId: 2, providerName: "Mike Provider", providerNameAr: "الفتح للخدمات المنزلية", price: 400, priceUnit: "per job", duration: "6 hours", isActive: true, rating: 4.5, createdAt: "2025-01-10T00:00:00Z", verificationStatus: "approved", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop" },
    { id: 11, name: "Lawn Mowing & Edging", nameAr: "قص العشب وتطريزه", description: "Standard front and back yard maintenance.", descriptionAr: "صيانة الحديقة الأمامية والخلفية بشكل دوري.", categoryId: 6, providerId: 4, providerName: "Sarah Expert", providerNameAr: "", price: 50, priceUnit: "per job", duration: "1 hour", isActive: true, rating: 4.7, createdAt: "2025-01-11T00:00:00Z", verificationStatus: "approved", image: "https://images.unsplash.com/photo-1592419044706-39796d40f56c?w=600&h=400&fit=crop" },
    { id: 12, name: "Garden Cleanup", nameAr: "تنظيف الحديقة", description: "Removing weeds, dead plants, and preparing soil.", descriptionAr: "إزالة الأعشاب الضارة والنباتات الميتة وتحضير التربة.", categoryId: 6, providerId: 4, providerName: "Sarah Expert", providerNameAr: "", price: 150, priceUnit: "per job", duration: "3 hours", isActive: true, rating: 4.9, createdAt: "2025-01-12T00:00:00Z", verificationStatus: "approved", image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&h=400&fit=crop" },
    { id: 13, name: "Carpet Steam Cleaning", nameAr: "تنظيف السجاد بالبخار", description: "Professional deep steam cleaning for carpets.", descriptionAr: "تنظيف عميق احترافي للسجاد بالبخار.", categoryId: 1, providerId: 2, providerName: "Mike Provider", providerNameAr: "الفتح للخدمات المنزلية", price: 120, priceUnit: "per job", duration: "2 hours", isActive: true, rating: 4.6, createdAt: "2025-01-13T00:00:00Z", verificationStatus: "approved", image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=400&fit=crop" },
    { id: 14, name: "Ceiling Fan Installation", nameAr: "تركيب مروحة سقف", description: "Replacing or installing new ceiling fans.", descriptionAr: "استبدال أو تركيب مراوح سقف جديدة.", categoryId: 3, providerId: 5, providerName: "David Handyman", providerNameAr: "", price: 90, priceUnit: "per job", duration: "1.5 hours", isActive: true, rating: 4.8, createdAt: "2025-01-14T00:00:00Z", verificationStatus: "approved", image: "https://images.unsplash.com/photo-1529162773456-79c2a6e06e18?w=600&h=400&fit=crop" },
    { id: 15, name: "Drywall Repair", nameAr: "إصلاح الجبس", description: "Patching holes and smoothing drywall surfaces.", descriptionAr: "ترميم الثقوب وتنعيم أسطح الجبس.", categoryId: 4, providerId: 5, providerName: "David Handyman", providerNameAr: "", price: 70, priceUnit: "per hour", duration: "2 hours", isActive: true, rating: 4.7, createdAt: "2025-01-15T00:00:00Z", verificationStatus: "approved", image: "https://images.unsplash.com/photo-1581092335871-4d9b078b7e9c?w=600&h=400&fit=crop" },
    { id: 16, name: "Window Washing", nameAr: "غسل النوافذ", description: "Streak-free interior and exterior window cleaning.", descriptionAr: "تنظيف النوافذ من الداخل والخارج بدون خطوط.", categoryId: 1, providerId: 2, providerName: "Mike Provider", providerNameAr: "الفتح للخدمات المنزلية", price: 100, priceUnit: "per job", duration: "2 hours", isActive: true, rating: 4.7, createdAt: "2025-01-16T00:00:00Z", verificationStatus: "approved", image: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=600&h=400&fit=crop" },
    { id: 17, name: "Water Heater Repair", nameAr: "إصلاح سخان الماء", description: "Fixing thermostat and heating element issues.", descriptionAr: "إصلاح مشاكل الثرموستات وعنصر التسخين.", categoryId: 2, providerId: 4, providerName: "Sarah Expert", providerNameAr: "", price: 180, priceUnit: "per job", duration: "2 hours", isActive: true, rating: 4.8, createdAt: "2025-01-17T00:00:00Z", verificationStatus: "approved", image: "https://images.unsplash.com/photo-1584622650111-993b4264bf4b?w=600&h=400&fit=crop" },
    { id: 18, name: "Smart Home Setup", nameAr: "إعداد المنزل الذكي", description: "Installation of smart thermostats, locks, and cameras.", descriptionAr: "تركيب أجهزة التحكم الحرارية الذكية والأقفال والكاميرات.", categoryId: 3, providerId: 5, providerName: "David Handyman", providerNameAr: "", price: 150, priceUnit: "per job", duration: "3 hours", isActive: true, rating: 4.9, createdAt: "2025-01-18T00:00:00Z", verificationStatus: "approved", image: "https://images.unsplash.com/photo-1558002038-1055907df827?w=600&h=400&fit=crop" },
    { id: 19, name: "Door Lock Replacement", nameAr: "استبدال أقفال الأبواب", description: "Removing old locks and installing new deadbolts.", descriptionAr: "إزالة الأقفال القديمة وتركيب أقفال جديدة.", categoryId: 4, providerId: 5, providerName: "David Handyman", providerNameAr: "", price: 80, priceUnit: "per job", duration: "1 hour", isActive: true, rating: 4.6, createdAt: "2025-01-19T00:00:00Z", verificationStatus: "approved", image: "https://images.unsplash.com/photo-1582552938356-5a95e24d61b0?w=600&h=400&fit=crop" },
    { id: 20, name: "Cabinet Painting", nameAr: "دهان الخزائن", description: "Refinishing and painting kitchen or bathroom cabinets.", descriptionAr: "تجديد ودهان خزائن المطبخ أو الحمام.", categoryId: 5, providerId: 2, providerName: "Mike Provider", providerNameAr: "الفتح للخدمات المنزلية", price: 600, priceUnit: "per job", duration: "8 hours", isActive: true, rating: 4.9, createdAt: "2025-01-20T00:00:00Z", verificationStatus: "approved", image: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=600&h=400&fit=crop" },
    { id: 21, name: "Tree Trimming", nameAr: "تقليم الأشجار", description: "Safe trimming of overgrown branches.", descriptionAr: "تقليم آمن للأفرع المفرطة النمو.", categoryId: 6, providerId: 4, providerName: "Sarah Expert", providerNameAr: "", price: 200, priceUnit: "per job", duration: "3 hours", isActive: true, rating: 4.7, createdAt: "2025-01-21T00:00:00Z", verificationStatus: "approved", image: "https://images.unsplash.com/photo-1542576976-c8dd9d6d18ab?w=600&h=400&fit=crop" },
    { id: 22, name: "Gutter Cleaning", nameAr: "تنظيف المزاريق", description: "Clearing leaves and debris from roof gutters.", descriptionAr: "إزالة الأوراق والحطام من مزاريق السقف.", categoryId: 1, providerId: 2, providerName: "Mike Provider", providerNameAr: "الفتح للخدمات المنزلية", price: 130, priceUnit: "per job", duration: "2 hours", isActive: true, rating: 4.5, createdAt: "2025-01-22T00:00:00Z", verificationStatus: "approved", image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&h=400&fit=crop" },
    { id: 23, name: "Faucet Replacement", nameAr: "استبدال الصنبور", description: "Installing new kitchen or bathroom faucets.", descriptionAr: "تركيب صنابير جديدة للمطبخ أو الحمام.", categoryId: 2, providerId: 4, providerName: "Sarah Expert", providerNameAr: "", price: 110, priceUnit: "per job", duration: "1 hour", isActive: true, rating: 4.8, createdAt: "2025-01-23T00:00:00Z", verificationStatus: "approved", image: "https://images.unsplash.com/photo-1584622650111-993b4264bf4b?w=600&h=400&fit=crop" },
    { id: 24, name: "Outlet Installation", nameAr: "تركيب مقابس كهربائية", description: "Adding new electrical outlets or USB ports.", descriptionAr: "إضافة مقابس كهربائية جديدة أو منافذ USB.", categoryId: 3, providerId: 5, providerName: "David Handyman", providerNameAr: "", price: 90, priceUnit: "per job", duration: "1.5 hours", isActive: true, rating: 4.7, createdAt: "2025-01-24T00:00:00Z", verificationStatus: "approved", image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&h=400&fit=crop" },
    { id: 25, name: "Picture Hanging", nameAr: "تعليق الصور", description: "Precise wall hanging for heavy mirrors and art.", descriptionAr: "تعليق دقيق على الجدران للمرآة الثقيلة واللوحات الفنية.", categoryId: 4, providerId: 5, providerName: "David Handyman", providerNameAr: "", price: 50, priceUnit: "per hour", duration: "1 hour", isActive: true, rating: 4.9, createdAt: "2025-01-25T00:00:00Z", verificationStatus: "approved", image: "https://images.unsplash.com/photo-1513519245088-0e12902e35a6?w=600&h=400&fit=crop" },
    { id: 26, name: "Deck Staining", nameAr: "صبغ الأرصفة الخشبية", description: "Power washing and staining wooden decks.", descriptionAr: "غسيل بالضغط وصبغ الأرصفة الخشبية.", categoryId: 5, providerId: 2, providerName: "Mike Provider", providerNameAr: "الفتح للخدمات المنزلية", price: 450, priceUnit: "per job", duration: "6 hours", isActive: true, rating: 4.6, createdAt: "2025-01-26T00:00:00Z", verificationStatus: "approved", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop" },
    { id: 27, name: "Mulch Installation", nameAr: "تركيب التغطية التربوية", description: "Delivering and spreading fresh mulch in garden beds.", descriptionAr: "توصيل ونشر التغطية التربوية الطازجة في أسرّة الحديقة.", categoryId: 6, providerId: 4, providerName: "Sarah Expert", providerNameAr: "", price: 180, priceUnit: "per job", duration: "2.5 hours", isActive: true, rating: 4.8, createdAt: "2025-01-27T00:00:00Z", verificationStatus: "approved", image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&h=400&fit=crop" },
    { id: 28, name: "Move-Out Cleaning", nameAr: "تنظيف عند المغادرة", description: "Deep cleaning for end of lease or moving out.", descriptionAr: "تنظيف عميق عند انتهاء عقد الإيجار أو المغادرة.", categoryId: 1, providerId: 2, providerName: "Mike Provider", providerNameAr: "الفتح للخدمات المنزلية", price: 250, priceUnit: "per job", duration: "5 hours", isActive: true, rating: 4.9, createdAt: "2025-01-28T00:00:00Z", verificationStatus: "approved", image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=400&fit=crop" },
    { id: 29, name: "Garbage Disposal Repair", nameAr: "إصلاح معالجة النفايات", description: "Fixing jammed or leaking garbage disposals.", descriptionAr: "إصلاح معالجة النفايات المسدودة أو المتسربة.", categoryId: 2, providerId: 4, providerName: "Sarah Expert", providerNameAr: "", price: 100, priceUnit: "per job", duration: "1 hour", isActive: true, rating: 4.7, createdAt: "2025-01-29T00:00:00Z", verificationStatus: "approved", image: "https://images.unsplash.com/photo-1621905251189-08b45d6a26c7?w=600&h=400&fit=crop" },
    { id: 30, name: "Smoke Detector Setup", nameAr: "إعداد كاشف الدخان", description: "Installing and wiring smoke and CO detectors.", descriptionAr: "تركيب وأسلاك كواشف الدخان وأول أكسيد الكربون.", categoryId: 3, providerId: 5, providerName: "David Handyman", providerNameAr: "", price: 75, priceUnit: "per job", duration: "1 hour", isActive: true, rating: 5.0, createdAt: "2025-01-30T00:00:00Z", verificationStatus: "approved", image: "https://images.unsplash.com/photo-1584622650111-993b4264bf4b?w=600&h=400&fit=crop" }
  ],
  bookings: [],
  reviews: [],
  transactions: [],
  payouts: [],
  disputes: [],
  disputeMessages: [],
  disputeEvidence: [],
  disputeTimeline: [],
  serviceComments: [
    { serviceId: 13, fromId: 1, fromName: "Admin User", fromRole: "ADMIN", message: "the image is not related to the service, please review", createdAt: "2026-05-15T05:20:28.987Z", id: 1 },
    { serviceId: 13, fromId: 2, fromName: "Mike Provider", fromRole: "PROVIDER", message: "this is the image of Hana, i think it will encourage selecting the server, please accept", createdAt: "2026-05-15T05:23:25.724Z", id: 2 },
    { id: 3, serviceId: 26, fromId: 8, fromName: "Harery CS", fromRole: "CUSTOMER_SERVICE", message: "Man ! show related image. call me when u have time", createdAt: "2026-05-15T05:52:26.976Z", edited: true, editedAt: "2026-05-15T06:15:43.466Z" }
  ],
  disputes: [],
  disputeMessages: [],
  disputeEvidence: [],
  disputeTimeline: [],
  imageBlobs: [],
  bookingMessages: [],
  systemSettings: {
    reservationPercentage: 20,
    commissionTaxPercentage: 13,
    platformCommissionPercentage: 10,
    payoutDelayDays: 3,
    customerFreeCancellationHours: 24,
    vendorFreeCancellationHours: 48,
    customerLateCancellationFee: 50,
    vendorLateCancellationFee: 50,
    disputeWindowDays: 7,
    mediationDurationHours: 48,
    maxDisputeFiles: 20
  }
};

function seed() {
  let needsSeeding = false;
  
  if (!fs.existsSync(dbPath)) {
    needsSeeding = true;
  } else {
    try {
      const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      if (!data || !data.users || data.users.length === 0) {
        needsSeeding = true;
      }
    } catch (e) {
      needsSeeding = true; // Invalid JSON
    }
  }

  if (needsSeeding) {
    console.log('Seeding database (db.json) with default data...');
    fs.writeFileSync(dbPath, JSON.stringify(defaultSeedData, null, 2), 'utf8');
    console.log('Database seeded successfully.');
  } else {
    console.log('Database already contains data. Skipping seed.');
  }
}

seed();
