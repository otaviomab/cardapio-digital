'use client';

import { useEffect, useState } from 'react';
import { ObjectId } from 'mongodb';

interface CategoryBadgeProps {
  category?: string;
  categoryId?: string;
  restaurantId?: string;
  productName?: string;
}

// Lista de esquemas de cores para categorias
const colors = [
  'bg-blue-100 text-blue-800',
  'bg-green-100 text-green-800',
  'bg-red-100 text-red-800',
  'bg-yellow-100 text-yellow-800',
  'bg-purple-100 text-purple-800',
  'bg-pink-100 text-pink-800',
  'bg-indigo-100 text-indigo-800',
  'bg-krato-100 text-krato-800'
];

// Função para determinar a cor com base na categoria
const getCategoryColor = (category: string) => {
  // Calcula um índice baseado na primeira letra da categoria
  const index = category.charCodeAt(0) % colors.length;
  return colors[index];
};

export function CategoryBadge({ category, categoryId, restaurantId, productName }: CategoryBadgeProps) {
  const [categoryName, setCategoryName] = useState<string | undefined>(category);
  const [loading, setLoading] = useState(!category && (!!categoryId || !!productName));

  useEffect(() => {
    // Se já temos o nome da categoria, não precisamos buscar
    if (category) {
      setCategoryName(category);
      return;
    }

    // Se não temos nem categoryId nem productName, não temos como buscar
    if (!categoryId && !productName) {
      setCategoryName(undefined);
      return;
    }

    // Se não temos restaurantId, não conseguimos buscar as categorias
    if (!restaurantId) {
      setCategoryName('Categoria não identificada');
      return;
    }

    async function fetchCategory() {
      try {
        setLoading(true);
        
        // Se temos categoryId, buscamos a categoria correspondente
        if (categoryId) {
          const response = await fetch(`/api/mongodb?action=getCategories&restaurantId=${restaurantId}`);
          if (!response.ok) throw new Error('Erro ao buscar categorias');
          
          const categories = await response.json();
          const matchingCategory = categories.find((c: any) => 
            c._id === categoryId || 
            c.id === categoryId || 
            c._id.toString() === categoryId
          );
          
          if (matchingCategory) {
            setCategoryName(matchingCategory.name);
            return;
          }
        }
        
        // Se temos productName, buscamos o produto e depois a categoria
        if (productName) {
          const response = await fetch(`/api/mongodb?action=getProducts&restaurantId=${restaurantId}`);
          if (!response.ok) throw new Error('Erro ao buscar produtos');
          
          const products = await response.json();
          const matchingProduct = products.find((p: any) => p.name === productName);
          
          if (matchingProduct) {
            if (matchingProduct.category) {
              setCategoryName(matchingProduct.category);
              return;
            }
            
            if (matchingProduct.categoryId) {
              // Temos o categoryId do produto, buscamos a categoria
              const catResponse = await fetch(`/api/mongodb?action=getCategories&restaurantId=${restaurantId}`);
              if (!catResponse.ok) throw new Error('Erro ao buscar categorias');
              
              const categories = await catResponse.json();
              const matchingCategory = categories.find((c: any) => 
                c._id === matchingProduct.categoryId || 
                c.id === matchingProduct.categoryId || 
                c._id.toString() === matchingProduct.categoryId
              );
              
              if (matchingCategory) {
                setCategoryName(matchingCategory.name);
                return;
              }
            }
          }
        }
        
        // Se chegamos aqui, não encontramos a categoria
        setCategoryName('Categoria não encontrada');
      } catch (error) {
        console.error('Erro ao buscar categoria:', error);
        setCategoryName('Erro ao buscar categoria');
      } finally {
        setLoading(false);
      }
    }

    fetchCategory();
  }, [category, categoryId, restaurantId, productName]);

  if (loading) {
    return (
      <span className="inline-block bg-zinc-100 text-zinc-400 text-xs font-medium px-2 py-0.5 rounded-full mt-1 mb-1 animate-pulse">
        Carregando...
      </span>
    );
  }

  if (!categoryName) {
    return (
      <span className="inline-block bg-zinc-100 text-zinc-700 text-xs font-medium px-2 py-0.5 rounded-full mt-1 mb-1">
        Sem categoria
      </span>
    );
  }

  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1 mb-1 ${getCategoryColor(categoryName)}`}>
      {categoryName}
    </span>
  );
} 