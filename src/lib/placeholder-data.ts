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

const products: Product[] = [
  { id: '1', name: { ar: 'طماطم طازجة', fr: 'Tomates Fraîches', en: 'Fresh Tomatoes' }, description: { ar: 'طماطم حمراء طازجة وناضجة، مثالية للسلطات والطبخ.', fr: 'Tomates rouges fraîches et juteuses, parfaites pour les salades et la cuisine.', en: 'Fresh and ripe red tomatoes, perfect for salads and cooking.' }, price: 120.50, stock: 100, categoryId: 'vegetables', images: [findImage('product-1')], sku: 'VEG001', barcode: '1234567890123', sold: 250, discount: 10 },
  { id: '2', name: { ar: 'حليب كامل الدسم', fr: 'Lait Entier', en: 'Whole Milk' }, description: { ar: 'حليب بقري طازج كامل الدسم، غني بالكالسيوم.', fr: 'Lait de vache frais et entier, riche en calcium.', en: 'Fresh whole cow\'s milk, rich in calcium.' }, price: 95.00, stock: 80, categoryId: 'dairy', images: [findImage('product-2')], sku: 'DAI001', barcode: '1234567890124', sold: 400, discount: 0 },
  { id: '3', name: { ar: 'خبز باجيت فرنسي', fr: 'Baguette Française', en: 'French Baguette' }, description: { ar: 'خبز باجيت فرنسي تقليدي، مقرمش من الخارج وطري من الداخل.', fr: 'Baguette française traditionnelle, croustillante à l\'extérieur et moelleuse à l\'intérieur.', en: 'Traditional French baguette, crispy on the outside and soft on the inside.' }, price: 25.00, stock: 150, categoryId: 'bakery', images: [findImage('product-3')], sku: 'BAK001', barcode: '1234567890125', sold: 600, discount: 0 },
  { id: '4', name: { ar: 'تفاح أخضر', fr: 'Pommes Vertes', en: 'Green Apples' }, description: { ar: 'تفاح أخضر منعش وحامض قليلاً، مثالي كوجبة خفيفة.', fr: 'Pommes vertes croquantes et acidulées, idéales pour une collation.', en: 'Crisp and tangy green apples, perfect for a snack.' }, price: 350.00, stock: 60, categoryId: 'fruits', images: [findImage('product-4')], sku: 'FRU001', barcode: '1234567890126', sold: 180, discount: 0 },
  { id: '5', name: { ar: 'صدر دجاج', fr: 'Poitrine de Poulet', en: 'Chicken Breast' }, description: { ar: 'صدور دجاج طرية بدون عظم أو جلد، مصدر ممتاز للبروتين.', fr: 'Poitrines de poulet tendres, désossées et sans peau, une excellente source de protéines.', en: 'Tender, boneless, skinless chicken breasts, an excellent source of protein.' }, price: 850.00, stock: 30, categoryId: 'meats', images: [findImage('product-5')], sku: 'MEA001', barcode: '1234567890127', sold: 120, discount: 5 },
  { id: '6', name: { ar: 'عصير برتقال طبيعي', fr: 'Jus d\'Orange Naturel', en: 'Natural Orange Juice' }, description: { ar: 'عصير برتقال طازج 100% بدون سكر مضاف.', fr: 'Jus d\'orange 100% pur et frais, sans sucre ajouté.', en: '100% pure and fresh orange juice, with no added sugar.' }, price: 220.00, stock: 90, categoryId: 'beverages', images: [findImage('product-6')], sku: 'BEV001', barcode: '1234567890128', sold: 320, discount: 0 },
  { id: '7', name: { ar: 'جبنة شيدر', fr: 'Fromage Cheddar', en: 'Cheddar Cheese' }, description: { ar: 'جبنة شيدر إنجليزية تقليدية، ذات نكهة قوية ومميزة.', fr: 'Fromage cheddar anglais traditionnel, avec une saveur forte et distinctive.', en: 'Traditional English cheddar cheese, with a strong and distinctive flavor.' }, price: 550.00, stock: 45, categoryId: 'dairy', images: [findImage('product-7')], sku: 'DAI002', barcode: '1234567890129', sold: 150, discount: 0 },
  { id: '8', name: { ar: 'جزر طازج', fr: 'Carottes Fraîches', en: 'Fresh Carrots' }, description: { ar: 'جزر طازج ومقرمش، غني بفيتامين أ.', fr: 'Carottes fraîches et croquantes, riches en vitamine A.', en: 'Fresh and crunchy carrots, rich in Vitamin A.' }, price: 80.00, stock: 120, categoryId: 'vegetables', images: [findImage('product-8')], sku: 'VEG002', barcode: '1234567890130', sold: 280, discount: 0 },
  { id: '9', name: { ar: 'زيت زيتون بكر', fr: 'Huile d\'Olive Vierge', en: 'Virgin Olive Oil' }, description: { ar: 'زيت زيتون بكر ممتاز معصور على البارد.', fr: 'Huile d\'olive vierge extra, pressée à froid.', en: 'Extra virgin olive oil, cold-pressed.' }, price: 1200.00, stock: 50, categoryId: 'beverages', images: [findImage('product-9')], sku: 'BEV002', barcode: '1234567890131', sold: 90, discount: 15 },
  { id: '10', name: { ar: 'زبادي بالفراولة', fr: 'Yaourt à la Fraise', en: 'Strawberry Yogurt' }, description: { ar: 'زبادي كريمي بقطع الفراولة الحقيقية.', fr: 'Yaourt crémeux avec de vrais morceaux de fraises.', en: 'Creamy yogurt with real strawberry pieces.' }, price: 55.00, stock: 200, categoryId: 'dairy', images: [findImage('product-10')], sku: 'DAI003', barcode: '1234567890132', sold: 550, discount: 0 },
  { id: '11', name: { ar: 'معكرونة سباغيتي', fr: 'Pâtes Spaghetti', en: 'Spaghetti Pasta' }, description: { ar: 'معكرونة سباغيتي إيطالية عالية الجودة.', fr: 'Pâtes spaghetti italiennes de haute qualité.', en: 'High-quality Italian spaghetti pasta.' }, price: 110.00, stock: 100, categoryId: 'bakery', images: [findImage('product-11')], sku: 'BAK002', barcode: '1234567890133', sold: 210, discount: 0 },
  { id: '12', name: { ar: 'ماء معدني', fr: 'Eau Minérale', en: 'Mineral Water' }, description: { ar: 'مياه معدنية طبيعية من جبال الأطلس.', fr: 'Eau minérale naturelle des montagnes de l\'Atlas.', en: 'Natural mineral water from the Atlas mountains.' }, price: 30.00, stock: 300, categoryId: 'beverages', images: [findImage('product-12')], sku: 'BEV003', barcode: '1234567890134', sold: 800, discount: 0 },
  { id: '13', name: { ar: 'موز', fr: 'Bananes', en: 'Bananas' }, description: { ar: 'موز حلو وناضج، مصدر جيد للبوتاسيوم.', fr: 'Bananes douces et mûres, une bonne source de potassium.', en: 'Sweet and ripe bananas, a good source of potassium.' }, price: 280.00, stock: 70, categoryId: 'fruits', images: [findImage('product-13')], sku: 'FRU002', barcode: '1234567890135', sold: 350, discount: 0 },
  { id: '14', name: { ar: 'قهوة مطحونة', fr: 'Café Moulu', en: 'Ground Coffee' }, description: { ar: 'قهوة أرابيكا 100% محمصة ومطحونة.', fr: 'Café 100% arabica, torréfié et moulu.', en: '100% Arabica coffee, roasted and ground.' }, price: 480.00, stock: 40, categoryId: 'beverages', images: [findImage('product-14')], sku: 'BEV004', barcode: '1234567890136', sold: 110, discount: 0 },
  { id: '15', name: { ar: 'بطاطس', fr: 'Pommes de Terre', en: 'Potatoes' }, description: { ar: 'بطاطس متعددة الاستخدامات، مناسبة للقلي والخبز والسلق.', fr: 'Pommes de terre polyvalentes, idéales pour frire, cuire au four ou bouillir.', en: 'Versatile potatoes, suitable for frying, baking, and boiling.' }, price: 70.00, stock: 200, categoryId: 'vegetables', images: [findImage('product-15')], sku: 'VEG003', barcode: '1234567890137', sold: 450, discount: 20 },
  { id: '16', name: { ar: 'بيض (12 قطعة)', fr: 'Œufs (12 pcs)', en: 'Eggs (12 pcs)' }, description: { ar: 'بيض دجاج طازج من مزارع محلية.', fr: 'Œufs de poule frais provenant de fermes locales.', en: 'Fresh chicken eggs from local farms.' }, price: 240.00, stock: 100, categoryId: 'dairy', images: [findImage('product-16')], sku: 'DAI004', barcode: '1234567890138', sold: 700, discount: 0 },
];

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
