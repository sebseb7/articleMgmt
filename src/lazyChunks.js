/** Shared dynamic imports so lazy() and post-LCP preload resolve the same chunks. */
export const importApp = () => import('./App.jsx');
export const importArticlesGrid = () => import('./ArticlesGrid.jsx');
