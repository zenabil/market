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
  id: string; // This is the Firestore document ID
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

export type Coupon = {
  id: string;
  code: string;
  discountPercentage: number;
  expiryDate: string; // ISO string
  isActive: boolean;
};


// Placeholder data is no longer the source of truth for products, categories, or users.
// It will be fetched from Firestore. This array can be kept for reference or removed.
const products: Product[] = [];
const users: User[] = [];

export const getProducts = () => products;
export const getUsers = () => users;
export const getProductById = (id: string) => products.find(p => p.id === id);
