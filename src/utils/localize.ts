import i18n from 'i18next';

export function localizedName<T extends { name: string; nameAr?: string }>(obj: T): string {
  return i18n.language === 'ar' && obj.nameAr ? obj.nameAr : obj.name;
}

export function localizedDescription<T extends { description: string; descriptionAr?: string }>(obj: T): string {
  return i18n.language === 'ar' && obj.descriptionAr ? obj.descriptionAr : obj.description;
}

export function serviceProviderName(service: { providerName: string; providerNameAr?: string }): string {
  return i18n.language === 'ar' && service.providerNameAr ? service.providerNameAr : service.providerName;
}
