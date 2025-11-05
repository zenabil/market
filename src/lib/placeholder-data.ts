import { PlaceHolderImages } from './placeholder-images';

export type Product = {
  id: string;
  name: { ar: string; fr: string; en: string };
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

const findImage = (id: string) => PlaceHolderImages.find(img => img.id === id)?.imageUrl || '';

const categories: Category[] = [
  { id: 'fruits', name: { ar: 'فواكه', fr: 'Fruits', en: 'Fruits' }, image: findImage('category-fruits') },
  { id: 'vegetables', name: { ar: 'خضروات', fr: 'Légumes', en: 'Vegetables' }, image: findImage('category-vegetables') },
  { id: 'dairy', name: { ar: 'ألبان', fr: 'Produits Laitiers', en: 'Dairy' }, image: findImage('category-dairy') },
  { id: 'bakery', name: { ar: 'مخبوزات', fr: 'Boulangerie', en: 'Bakery' }, image: findImage('category-bakery') },
  { id: 'meats', name: { ar: 'لحوم', fr: 'Viandes', en: 'Meats' }, image: findImage('category-meats') },
  { id: 'beverages', name: { ar: 'مشروبات', fr: 'Boissons', en: 'Beverages' }, image: findImage('category-beverages') },
];

const products: Product[] = [
  { id: '1', name: { ar: 'طماطم طازجة', fr: 'Tomates Fraîches', en: 'Fresh Tomatoes' }, price: 120.50, stock: 100, categoryId: 'vegetables', images: [findImage('product-1')], sku: 'VEG001', barcode: '1234567890123', sold: 250, discount: 10 },
  { id: '2', name: { ar: 'حليب كامل الدسم', fr: 'Lait Entier', en: 'Whole Milk' }, price: 95.00, stock: 80, categoryId: 'dairy', images: [findImage('product-2')], sku: 'DAI001', barcode: '1234567890124', sold: 400, discount: 0 },
  { id: '3', name: { ar: 'خبز باجيت فرنسي', fr: 'Baguette Française', en: 'French Baguette' }, price: 25.00, stock: 150, categoryId: 'bakery', images: [findImage('product-3')], sku: 'BAK001', barcode: '1234567890125', sold: 600, discount: 0 },
  { id: '4', name: { ar: 'تفاح أخضر', fr: 'Pommes Vertes', en: 'Green Apples' }, price: 350.00, stock: 60, categoryId: 'fruits', images: [findImage('product-4')], sku: 'FRU001', barcode: '1234567890126', sold: 180, discount: 0 },
  { id: '5', name: { ar: 'صدر دجاج', fr: 'Poitrine de Poulet', en: 'Chicken Breast' }, price: 850.00, stock: 30, categoryId: 'meats', images: [findImage('product-5')], sku: 'MEA001', barcode: '1234567890127', sold: 120, discount: 5 },
  { id: '6', name: { ar: 'عصير برتقال طبيعي', fr: 'Jus d\'Orange Naturel', en: 'Natural Orange Juice' }, price: 220.00, stock: 90, categoryId: 'beverages', images: [findImage('product-6')], sku: 'BEV001', barcode: '1234567890128', sold: 320, discount: 0 },
  { id: '7', name: { ar: 'جبنة شيدر', fr: 'Fromage Cheddar', en: 'Cheddar Cheese' }, price: 550.00, stock: 45, categoryId: 'dairy', images: [findImage('product-7')], sku: 'DAI002', barcode: '1234567890129', sold: 150, discount: 0 },
  { id: '8', name: { ar: 'جزر طازج', fr: 'Carottes Fraîches', en: 'Fresh Carrots' }, price: 80.00, stock: 120, categoryId: 'vegetables', images: [findImage('product-8')], sku: 'VEG002', barcode: '1234567890130', sold: 280, discount: 0 },
  { id: '9', name: { ar: 'زيت زيتون بكر', fr: 'Huile d\'Olive Vierge', en: 'Virgin Olive Oil' }, price: 1200.00, stock: 50, categoryId: 'beverages', images: [findImage('product-9')], sku: 'BEV002', barcode: '1234567890131', sold: 90, discount: 15 },
  { id: '10', name: { ar: 'زبادي بالفراولة', fr: 'Yaourt à la Fraise', en: 'Strawberry Yogurt' }, price: 55.00, stock: 200, categoryId: 'dairy', images: [findImage('product-10')], sku: 'DAI003', barcode: '1234567890132', sold: 550, discount: 0 },
  { id: '11', name: { ar: 'معكرونة سباغيتي', fr: 'Pâtes Spaghetti', en: 'Spaghetti Pasta' }, price: 110.00, stock: 100, categoryId: 'bakery', images: [findImage('product-11')], sku: 'BAK002', barcode: '1234567890133', sold: 210, discount: 0 },
  { id: '12', name: { ar: 'ماء معدني', fr: 'Eau Minérale', en: 'Mineral Water' }, price: 30.00, stock: 300, categoryId: 'beverages', images: [findImage('product-12')], sku: 'BEV003', barcode: '1234567890134', sold: 800, discount: 0 },
  { id: '13', name: { ar: 'موز', fr: 'Bananes', en: 'Bananas' }, price: 280.00, stock: 70, categoryId: 'fruits', images: [findImage('product-13')], sku: 'FRU002', barcode: '1234567890135', sold: 350, discount: 0 },
  { id: '14', name: { ar: 'قهوة مطحونة', fr: 'Café Moulu', en: 'Ground Coffee' }, price: 480.00, stock: 40, categoryId: 'beverages', images: [findImage('product-14')], sku: 'BEV004', barcode: '1234567890136', sold: 110, discount: 0 },
  { id: '15', name: { ar: 'بطاطس', fr: 'Pommes de Terre', en: 'Potatoes' }, price: 70.00, stock: 200, categoryId: 'vegetables', images: [findImage('product-15')], sku: 'VEG003', barcode: '1234567890137', sold: 450, discount: 20 },
  { id: '16', name: { ar: 'بيض (12 قطعة)', fr: 'Œufs (12 pcs)', en: 'Eggs (12 pcs)' }, price: 240.00, stock: 100, categoryId: 'dairy', images: [findImage('product-16')], sku: 'DAI004', barcode: '1234567890138', sold: 700, discount: 0 },
];

export const getProducts = () => products;
export const getCategories = () => categories;
export const getProductById = (id: string) => products.find(p => p.id === id);
export const getCategoryById = (id: string) => categories.find(c => c.id === id);
