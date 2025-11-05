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

export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  registrationDate: string;
  orderCount: number;
  totalSpent: number;
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

const users: User[] = [
    { id: '1', name: 'أحمد بن علي', email: 'ahmed.benali@example.com', avatar: 'https://picsum.photos/seed/user1/100/100', registrationDate: '2023-01-15', orderCount: 5, totalSpent: 12500 },
    { id: '2', name: 'فاطمة الزهراء', email: 'fatima.zahra@example.com', avatar: 'https://picsum.photos/seed/user2/100/100', registrationDate: '2023-03-22', orderCount: 12, totalSpent: 34800 },
    { id: '3', name: 'يوسف شريف', email: 'youssef.cherif@example.com', avatar: 'https://picsum.photos/seed/user3/100/100', registrationDate: '2023-05-10', orderCount: 2, totalSpent: 4500 },
    { id: '4', name: 'أمينة حداد', email: 'amina.haddad@example.com', avatar: 'https://picsum.photos/seed/user4/100/100', registrationDate: '2023-06-01', orderCount: 8, totalSpent: 21000 },
    { id: '5', name: 'محمد إبراهيم', email: 'mohamed.ibrahim@example.com', avatar: 'https://picsum.photos/seed/user5/100/100', registrationDate: '2023-08-19', orderCount: 1, totalSpent: 950 },
];


export const getProducts = () => products;
export const getCategories = () => categories;
export const getUsers = () => users;
export const getProductById = (id: string) => products.find(p => p.id === id);
export const getCategoryById = (id: string) => categories.find(c => c.id === id);
