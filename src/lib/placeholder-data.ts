import { PlaceHolderImages } from './placeholder-images';

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  images: string[];
  sku: string;
  barcode: string;
  sold: number;
  discount: number; // Percentage
  averageRating?: number;
  reviewCount?: number;
  createdAt: string; // ISO string
};

export type Category = {
  id: string; // This is the Firestore document ID
  name: string;
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
        productName: string;
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

export type Review = {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    rating: number;
    comment: string;
    createdAt: string; // ISO string
};

export type WishlistItem = {
    id: string; // This is the product ID
    productId: string;
    addedAt: string; // ISO string
};

export type Recipe = {
  id: string;
  title: string;
  description: string;
  image: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  ingredients: string[];
  instructions: string[];
  averageRating?: number;
  reviewCount?: number;
}

export type Notification = {
    id: string;
    userId: string;
    message: string;
    link?: string;
    isRead: boolean;
    createdAt: string; // ISO string
};


// Placeholder data is no longer the source of truth for products, categories, or users.
// It will be fetched from Firestore. This array can be kept for reference or removed.
const products: Product[] = [];
const users: User[] = [];

export const getProducts = () => products;
export const getUsers = () => users;
export const getProductById = (id: string) => products.find(p => p.id === id);

    