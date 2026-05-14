import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation data (the "excel sheet")
// In a real scenario, this could be loaded from a JSON or generated from an Excel
const resources = {
  en: {
    translation: {
      common: {
        save: 'Save Changes',
        cancel: 'Cancel',
        loading: 'Loading...',
        actions: 'Actions',
        status: 'Status',
        id: 'ID',
        name: 'Name',
        email: 'Email',
        phone: 'Phone',
        search: 'Search...',
        no_results: 'No results found',
      },
      nav: {
        home: 'Home',
        services: 'Services',
        bookings: 'My Bookings',
        admin: 'Admin',
        profile: 'Profile',
        dashboard: 'Dashboard',
        settings: 'Settings',
        sign_out: 'Sign Out',
        sign_in: 'Sign In',
        get_started: 'Get Started',
      },
      profile: {
        title: 'My Profile',
        subtitle: 'Manage your personal information and security settings',
        personal_info: 'Personal Information',
        full_name: 'Full Name',
        bio: 'Bio',
        preferred_language: 'Preferred Language',
        security: 'Security & Password',
        current_password: 'Current Password',
        new_password: 'New Password',
        confirm_password: 'Confirm New Password',
        reset_password: 'Reset Password',
      },
      admin: {
        dashboard: 'Admin Dashboard',
        overview: 'Overview',
        users: 'Users',
        bookings: 'Bookings',
        reviews: 'Reviews',
        services: 'Services',
        categories: 'Categories',
      }
    }
  },
  fr: {
    translation: {
      common: {
        save: 'Sauvegarder',
        cancel: 'Annuler',
        loading: 'Chargement...',
        actions: 'Actions',
        status: 'Statut',
        id: 'ID',
        name: 'Nom',
        email: 'Email',
        phone: 'Téléphone',
        search: 'Rechercher...',
        no_results: 'Aucun résultat trouvé',
      },
      nav: {
        home: 'Accueil',
        services: 'Services',
        bookings: 'Mes Réservations',
        admin: 'Admin',
        profile: 'Profil',
        dashboard: 'Tableau de bord',
        settings: 'Paramètres',
        sign_out: 'Déconnexion',
        sign_in: 'Connexion',
        get_started: 'Commencer',
      },
      profile: {
        title: 'Mon Profil',
        subtitle: 'Gérez vos informations personnelles et paramètres de sécurité',
        personal_info: 'Informations Personnelles',
        full_name: 'Nom Complet',
        bio: 'Biographie',
        preferred_language: 'Langue Préférée',
        security: 'Sécurité et Mot de passe',
        current_password: 'Mot de passe actuel',
        new_password: 'Nouveau mot de passe',
        confirm_password: 'Confirmer le nouveau mot de passe',
        reset_password: 'Réinitialiser le mot de passe',
      },
      admin: {
        dashboard: 'Tableau de bord Admin',
        overview: 'Aperçu',
        users: 'Utilisateurs',
        bookings: 'Réservations',
        reviews: 'Avis',
        services: 'Services',
        categories: 'Catégories',
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    }
  });

export default i18n;
