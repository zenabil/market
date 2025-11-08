
import { type MetadataRoute } from 'next';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, query } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import type { Product, Category, Recipe } from '@/lib/placeholder-data';

// Initialize Firebase for server-side fetching
if (!getApps().length) {
  initializeApp(firebaseConfig);
}
 
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const db = getFirestore();

    const staticRoutes = [
        '', 
        '/products', 
        '/recipes', 
        '/about', 
        '/contact', 
        '/features',
        '/generate-recipe',
        '/meal-planner',
        '/login',
        '/privacy',
        '/terms',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'weekly' as const,
        priority: route === '' ? 1.0 : 0.8,
    }));

    // Fetch dynamic product routes
    const productsSnapshot = await getDocs(query(collection(db, 'products')));
    const productRoutes = productsSnapshot.docs.map(doc => {
        const product = doc.data() as Product;
        return {
            url: `${baseUrl}/product/${product.slug}`,
            lastModified: product.createdAt ? new Date(product.createdAt).toISOString() : new Date().toISOString(),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        };
    });

    // Fetch dynamic category routes
    const categoriesSnapshot = await getDocs(query(collection(db, 'categories')));
    const categoryRoutes = categoriesSnapshot.docs.map(doc => {
        const category = doc.data() as Category;
        return {
            url: `${baseUrl}/category/${category.slug}`,
            lastModified: new Date().toISOString(),
            changeFrequency: 'weekly' as const,
            priority: 0.6,
        };
    });

    // Fetch dynamic recipe routes
    const recipesSnapshot = await getDocs(query(collection(db, 'recipes')));
    const recipeRoutes = recipesSnapshot.docs.map(doc => {
        const recipe = doc.data() as Recipe;
        return {
            url: `${baseUrl}/recipes/${recipe.slug}`, 
            lastModified: new Date().toISOString(), 
            changeFrequency: 'monthly' as const,
            priority: 0.7,
        };
    });

    return [
        ...staticRoutes,
        ...productRoutes,
        ...categoryRoutes,
        ...recipeRoutes
    ];
}
