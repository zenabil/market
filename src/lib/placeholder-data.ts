import { PlaceHolderImages } from './placeholder-images';

export type Product = {
  id: string;
  name: { ar: string; fr: string; en: string };
  description: { ar: string; fr: string; en: string };
  price: number;
  stock: number;
  categoryId: string;
  images: string[];
  sku: string;
  barcode: string;
  sold: number;
  discount: number; // Percentage
};

export type Category = {
  id: string;
  name: { ar: string; fr: string; en: string };
  image: string;
};

export type Address = {
  id: string;
  street: string;
  city: string;
  zipCode: string;
  country: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar: string;
  registrationDate: string;
  orderCount: number;
  totalSpent: number;
  loyaltyPoints: number;
  role: 'User' | 'Admin';
  addresses?: Address[];
};

export type Order = {
    id: string;
    userId: string;
    orderDate: string;
    totalAmount: number;
    status: string;
    shippingAddress: string;
    items: {
        productId: string;
        productName: { ar: string, fr: string, en: string };
        quantity: number;
        price: number;
    }[];
};


const findImage = (id: string) => PlaceHolderImages.find(img => img.id === id)?.imageUrl || '';

const categories: Category[] = [
  { id: 'fruits', name: { ar: 'فواكه', fr: 'Fruits', en: 'Fruits' }, image: findImage('category-fruits') },
  { id: 'vegetables', name: { ar: 'خضروات', fr: 'Légumes', en: 'Vegetables' }, image: findImage('category-vegetables') },
  { id: 'dairy', name: { ar: 'ألبان', fr: 'Produits Laitiers', en: 'Dairy' }, image: findImage('category-dairy') },
  { id: 'bakery', name: { ar: 'مخبوزات', fr: 'Boulangerie', en: 'Bakery' }, image: findImage('category-bakery') },
  { id: 'meats', name: { ar: 'لحوم', fr: 'Viandes', en: 'Meats' }, image: findImage('category-meats') },
  { id: 'beverages', name: { ar: 'مشروبات', fr: 'Boissons', en: 'Beverages' }, image: findImage('category-beverages') },
];

// Placeholder data is no longer the source of truth for products.
// It will be fetched from Firestore. This array can be kept for reference or removed.
const products: Product[] = [];

const users: User[] = [];

export const getProducts = () => products;
export const getCategories = () => categories;
export const getUsers = () => users;
export const getProductById = (id: string) => products.find(p => p.id === id);
export const getCategoryById = (id: string) => categories.find(c => c.id === id);
