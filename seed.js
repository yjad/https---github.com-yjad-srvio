import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'db.json');

const defaultSeedData = {
  categories: [
    { id: 1, name: "Cleaning", icon: "🧹", description: "Home and office cleaning", color: "#3b82f6", activationDate: "2025-01-01", familyId: 1, isActive: true },
    { id: 2, name: "Plumbing", icon: "🪠", description: "Pipe and leak repairs", color: "#10b981", activationDate: "2025-01-01", familyId: 1, isActive: true },
    { id: 3, name: "Electrical", icon: "⚡", description: "Electrical installations and repairs", color: "#f59e0b", activationDate: "2025-01-01", familyId: 1, isActive: true },
    { id: 4, name: "Handyman", icon: "🛠️", description: "General repairs and assembly", color: "#6366f1", activationDate: "2025-01-01", familyId: 1, isActive: true },
    { id: 5, name: "Painting", icon: "🎨", description: "Interior and exterior painting", color: "#ec4899", activationDate: "2025-01-01", familyId: 1, isActive: true },
    { id: 6, name: "Landscaping", icon: "🌿", description: "Garden and yard maintenance", color: "#14b8a6", activationDate: "2025-01-01", familyId: 1, isActive: true }
  ],
  serviceFamilies: [
    { id: 1, name: "Home Services", description: "Professional home maintenance, repair, and improvement", icon: "Home", color: "#3b82f6", isActive: true, sortOrder: 1, createdAt: "2025-01-01" },
    { id: 2, name: "Instant Delivery", description: "Fast on-demand delivery of goods, food, and parcels", icon: "Truck", color: "#f59e0b", isActive: false, sortOrder: 2, createdAt: "2025-01-01" },
    { id: 3, name: "Scheduled Services", description: "Recurring and appointment-based professional services", icon: "Calendar", color: "#10b981", isActive: true, sortOrder: 3, createdAt: "2025-01-01" }
  ],
  users: [
    { id: 1, name: "Admin User", email: "admin@srvio.com", password: "admin123", phone: "555-0000", role: "ADMIN", preferredLanguage: "en", isVerified: true, joinDate: "2025-01-01T00:00:00Z" },
    { id: 2, name: "Mike Provider", email: "mike@email.com", password: "provider123", phone: "555-1111", role: "PROVIDER", preferredLanguage: "en", isVerified: true, joinDate: "2025-01-01T00:00:00Z" },
    { id: 3, name: "John Customer", email: "john@email.com", password: "user123", phone: "555-2222", role: "CUSTOMER", preferredLanguage: "en", isVerified: true, joinDate: "2025-01-01T00:00:00Z" },
    { id: 4, name: "Sarah Expert", email: "sarah@email.com", password: "provider123", phone: "555-3333", role: "PROVIDER", preferredLanguage: "en", isVerified: true, joinDate: "2025-01-02T00:00:00Z" },
    { id: 5, name: "David Handyman", email: "david@email.com", password: "provider123", phone: "555-4444", role: "PROVIDER", preferredLanguage: "en", isVerified: true, joinDate: "2025-01-03T00:00:00Z" },
    { id: 6, name: "Alice Customer", email: "alice@email.com", password: "user123", phone: "555-5555", role: "CUSTOMER", preferredLanguage: "en", isVerified: true, joinDate: "2025-01-05T00:00:00Z" },
  ],
  services: [
    { id: 1, name: "Deep House Cleaning", description: "Complete house deep cleaning service.", categoryId: 1, providerId: 2, providerName: "Mike Provider", price: 150, priceUnit: "per job", duration: "3 hours", isActive: true, rating: 4.8, createdAt: "2025-01-01T00:00:00Z", verificationStatus: "approved", image: "https://placehold.co/600x400/4A90E2/white?text=Deep+House+Cleaning" },
    { id: 2, name: "Standard Office Cleaning", description: "Regular office cleaning and sanitization.", categoryId: 1, providerId: 2, providerName: "Mike Provider", price: 80, priceUnit: "per job", duration: "2 hours", isActive: true, rating: 4.5, createdAt: "2025-01-02T00:00:00Z", verificationStatus: "approved", image: "https://placehold.co/600x400/50C878/white?text=Office+Cleaning" },
    { id: 3, name: "Leaky Pipe Repair", description: "Fixing under-sink leaks and pipe bursts.", categoryId: 2, providerId: 4, providerName: "Sarah Expert", price: 120, priceUnit: "per job", duration: "1.5 hours", isActive: true, rating: 4.9, createdAt: "2025-01-03T00:00:00Z", verificationStatus: "approved", image: "https://placehold.co/600x400/3498DB/white?text=Plumbing+Repair" },
    { id: 4, name: "Toilet Installation", description: "Complete installation of new toilet fixtures.", categoryId: 2, providerId: 4, providerName: "Sarah Expert", price: 200, priceUnit: "per job", duration: "2.5 hours", isActive: true, rating: 5.0, createdAt: "2025-01-04T00:00:00Z", verificationStatus: "approved", image: "https://placehold.co/600x400/2ECC71/white?text=Toilet+Installation" },
    { id: 5, name: "Electrical Panel Upgrade", description: "Upgrading home electrical panels to modern standards.", categoryId: 3, providerId: 5, providerName: "David Handyman", price: 500, priceUnit: "per job", duration: "4 hours", isActive: true, rating: 4.7, createdAt: "2025-01-05T00:00:00Z", verificationStatus: "approved", image: "https://placehold.co/600x400/F1C40F/black?text=Electrical+Panel+Upgrade" },
    { id: 6, name: "Light Fixture Installation", description: "Installing ceiling lights and chandeliers.", categoryId: 3, providerId: 5, providerName: "David Handyman", price: 60, priceUnit: "per hour", duration: "1 hour", isActive: true, rating: 4.6, createdAt: "2025-01-06T00:00:00Z", verificationStatus: "approved", image: "https://placehold.co/600x400/E67E22/white?text=Light+Fixture" },
    { id: 7, name: "Furniture Assembly", description: "IKEA and other brand furniture assembly.", categoryId: 4, providerId: 5, providerName: "David Handyman", price: 45, priceUnit: "per hour", duration: "2 hours", isActive: true, rating: 4.9, createdAt: "2025-01-07T00:00:00Z", verificationStatus: "approved", image: "https://placehold.co/600x400/9B59B6/white?text=Furniture+Assembly" },
    { id: 8, name: "TV Mounting", description: "Secure wall mounting for TVs of all sizes.", categoryId: 4, providerId: 5, providerName: "David Handyman", price: 80, priceUnit: "per job", duration: "1.5 hours", isActive: true, rating: 4.8, createdAt: "2025-01-08T00:00:00Z", verificationStatus: "approved", image: "https://placehold.co/600x400/34495E/white?text=TV+Mounting" },
    { id: 9, name: "Interior Room Painting", description: "Painting walls and ceilings for standard rooms.", categoryId: 5, providerId: 2, providerName: "Mike Provider", price: 300, priceUnit: "per room", duration: "5 hours", isActive: true, rating: 4.4, createdAt: "2025-01-09T00:00:00Z", verificationStatus: "approved", image: "https://placehold.co/600x400/E74C3C/white?text=Room+Painting" },
    { id: 10, name: "Exterior Trim Painting", description: "Refreshing exterior window and door trims.", categoryId: 5, providerId: 2, providerName: "Mike Provider", price: 400, priceUnit: "per job", duration: "6 hours", isActive: true, rating: 4.5, createdAt: "2025-01-10T00:00:00Z", verificationStatus: "approved", image: "https://placehold.co/600x400/C0392B/white?text=Exterior+Trim" },
    { id: 11, name: "Lawn Mowing & Edging", description: "Standard front and back yard maintenance.", categoryId: 6, providerId: 4, providerName: "Sarah Expert", price: 50, priceUnit: "per job", duration: "1 hour", isActive: true, rating: 4.7, createdAt: "2025-01-11T00:00:00Z", verificationStatus: "approved", image: "https://placehold.co/600x400/27AE60/white?text=Lawn+Mowing" },
    { id: 12, name: "Garden Cleanup", description: "Removing weeds, dead plants, and preparing soil.", categoryId: 6, providerId: 4, providerName: "Sarah Expert", price: 150, priceUnit: "per job", duration: "3 hours", isActive: true, rating: 4.9, createdAt: "2025-01-12T00:00:00Z", verificationStatus: "approved", image: "https://placehold.co/600x400/1ABC9C/white?text=Garden+Cleanup" },
    { id: 13, name: "Carpet Steam Cleaning", description: "Professional deep steam cleaning for carpets.", categoryId: 1, providerId: 2, providerName: "Mike Provider", price: 120, priceUnit: "per job", duration: "2 hours", isActive: true, rating: 4.6, createdAt: "2025-01-13T00:00:00Z", verificationStatus: "approved", image: "https://placehold.co/600x400/8E44AD/white?text=Carpet+Steam+Clean" },
    { id: 14, name: "Ceiling Fan Installation", description: "Replacing or installing new ceiling fans.", categoryId: 3, providerId: 5, providerName: "David Handyman", price: 90, priceUnit: "per job", duration: "1.5 hours", isActive: true, rating: 4.8, createdAt: "2025-01-14T00:00:00Z", verificationStatus: "approved", image: "https://placehold.co/600x400/D35400/white?text=Ceiling+Fan" },
    { id: 15, name: "Drywall Repair", description: "Patching holes and smoothing drywall surfaces.", categoryId: 4, providerId: 5, providerName: "David Handyman", price: 70, priceUnit: "per hour", duration: "2 hours", isActive: true, rating: 4.7, createdAt: "2025-01-15T00:00:00Z", verificationStatus: "approved", image: "https://placehold.co/600x400/7F8C8D/white?text=Drywall+Repair" },
    { id: 16, name: "Window Washing", description: "Streak-free interior and exterior window cleaning.", categoryId: 1, providerId: 2, providerName: "Mike Provider", price: 100, priceUnit: "per job", duration: "2 hours", isActive: true, rating: 4.7, createdAt: "2025-01-16T00:00:00Z", verificationStatus: "approved", image: "https://placehold.co/600x400/5DADE2/white?text=Window+Washing" },
    { id: 17, name: "Water Heater Repair", description: "Fixing thermostat and heating element issues.", categoryId: 2, providerId: 4, providerName: "Sarah Expert", price: 180, priceUnit: "per job", duration: "2 hours", isActive: true, rating: 4.8, createdAt: "2025-01-17T00:00:00Z", verificationStatus: "approved", image: "https://placehold.co/600x400/2471A3/white?text=Water+Heater" },
    { id: 18, name: "Smart Home Setup", description: "Installation of smart thermostats, locks, and cameras.", categoryId: 3, providerId: 5, providerName: "David Handyman", price: 150, priceUnit: "per job", duration: "3 hours", isActive: true, rating: 4.9, createdAt: "2025-01-18T00:00:00Z", verificationStatus: "approved", image: "https://placehold.co/600x400/1F618D/white?text=Smart+Home" },
    { id: 19, name: "Door Lock Replacement", description: "Removing old locks and installing new deadbolts.", categoryId: 4, providerId: 5, providerName: "David Handyman", price: 80, priceUnit: "per job", duration: "1 hour", isActive: true, rating: 4.6, createdAt: "2025-01-19T00:00:00Z", verificationStatus: "approved", image: "https://placehold.co/600x400/515A5A/white?text=Lock+Replacement" },
    { id: 20, name: "Cabinet Painting", description: "Refinishing and painting kitchen or bathroom cabinets.", categoryId: 5, providerId: 2, providerName: "Mike Provider", price: 600, priceUnit: "per job", duration: "8 hours", isActive: true, rating: 4.9, createdAt: "2025-01-20T00:00:00Z", verificationStatus: "approved", image: "https://placehold.co/600x400/922B21/white?text=Cabinet+Painting" },
    { id: 21, name: "Tree Trimming", description: "Safe trimming of overgrown branches.", categoryId: 6, providerId: 4, providerName: "Sarah Expert", price: 200, priceUnit: "per job", duration: "3 hours", isActive: true, rating: 4.7, createdAt: "2025-01-21T00:00:00Z", verificationStatus: "approved", image: "https://placehold.co/600x400/1E8449/white?text=Tree+Trimming" },
    { id: 22, name: "Gutter Cleaning", description: "Clearing leaves and debris from roof gutters.", categoryId: 1, providerId: 2, providerName: "Mike Provider", price: 130, priceUnit: "per job", duration: "2 hours", isActive: true, rating: 4.5, createdAt: "2025-01-22T00:00:00Z", verificationStatus: "approved", image: "https://placehold.co/600x400/117A65/white?text=Gutter+Cleaning" },
    { id: 23, name: "Faucet Replacement", description: "Installing new kitchen or bathroom faucets.", categoryId: 2, providerId: 4, providerName: "Sarah Expert", price: 110, priceUnit: "per job", duration: "1 hour", isActive: true, rating: 4.8, createdAt: "2025-01-23T00:00:00Z", verificationStatus: "approved", image: "https://placehold.co/600x400/1A5276/white?text=Faucet+Replacement" },
    { id: 24, name: "Outlet Installation", description: "Adding new electrical outlets or USB ports.", categoryId: 3, providerId: 5, providerName: "David Handyman", price: 90, priceUnit: "per job", duration: "1.5 hours", isActive: true, rating: 4.7, createdAt: "2025-01-24T00:00:00Z", verificationStatus: "approved", image: "https://placehold.co/600x400/6C3483/white?text=Outlet+Install" },
    { id: 25, name: "Picture Hanging", description: "Precise wall hanging for heavy mirrors and art.", categoryId: 4, providerId: 5, providerName: "David Handyman", price: 50, priceUnit: "per hour", duration: "1 hour", isActive: true, rating: 4.9, createdAt: "2025-01-25T00:00:00Z", verificationStatus: "approved", image: "https://placehold.co/600x400/839192/white?text=Picture+Hanging" },
    { id: 26, name: "Deck Staining", description: "Power washing and staining wooden decks.", categoryId: 5, providerId: 2, providerName: "Mike Provider", price: 450, priceUnit: "per job", duration: "6 hours", isActive: true, rating: 4.6, createdAt: "2025-01-26T00:00:00Z", verificationStatus: "approved", image: "https://placehold.co/600x400/A93226/white?text=Deck+Staining" },
    { id: 27, name: "Mulch Installation", description: "Delivering and spreading fresh mulch in garden beds.", categoryId: 6, providerId: 4, providerName: "Sarah Expert", price: 180, priceUnit: "per job", duration: "2.5 hours", isActive: true, rating: 4.8, createdAt: "2025-01-27T00:00:00Z", verificationStatus: "approved", image: "https://placehold.co/600x400/0E6655/white?text=Mulch+Install" },
    { id: 28, name: "Move-Out Cleaning", description: "Deep cleaning for end of lease or moving out.", categoryId: 1, providerId: 2, providerName: "Mike Provider", price: 250, priceUnit: "per job", duration: "5 hours", isActive: true, rating: 4.9, createdAt: "2025-01-28T00:00:00Z", verificationStatus: "approved", image: "https://placehold.co/600x400/2E86C1/white?text=Move+Out+Cleaning" },
    { id: 29, name: "Garbage Disposal Repair", description: "Fixing jammed or leaking garbage disposals.", categoryId: 2, providerId: 4, providerName: "Sarah Expert", price: 100, priceUnit: "per job", duration: "1 hour", isActive: true, rating: 4.7, createdAt: "2025-01-29T00:00:00Z", verificationStatus: "approved", image: "https://placehold.co/600x400/1B4F72/white?text=Garbage+Disposal" },
    { id: 30, name: "Smoke Detector Setup", description: "Installing and wiring smoke and CO detectors.", categoryId: 3, providerId: 5, providerName: "David Handyman", price: 75, priceUnit: "per job", duration: "1 hour", isActive: true, rating: 5.0, createdAt: "2025-01-30T00:00:00Z", verificationStatus: "approved", image: "https://placehold.co/600x400/512E5F/white?text=Smoke+Detector" }
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
