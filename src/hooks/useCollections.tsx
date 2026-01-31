import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Collection {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_visible: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductCollection {
  id: string;
  product_id: string;
  collection_id: string;
  created_at: string;
}

export function useStoreCollections(storeId: string | undefined) {
  return useQuery({
    queryKey: ['store-collections', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('store_id', storeId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as Collection[];
    },
    enabled: !!storeId,
  });
}

export function useCollectionProducts(collectionId: string | undefined) {
  return useQuery({
    queryKey: ['collection-products', collectionId],
    queryFn: async () => {
      if (!collectionId) return [];
      const { data, error } = await supabase
        .from('product_collections')
        .select('product_id')
        .eq('collection_id', collectionId);
      if (error) throw error;
      return data.map(pc => pc.product_id);
    },
    enabled: !!collectionId,
  });
}

export function useCollectionWithProductCount(storeId: string | undefined) {
  return useQuery({
    queryKey: ['collections-with-count', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      
      // Fetch collections
      const { data: collections, error: collectionsError } = await supabase
        .from('collections')
        .select('*')
        .eq('store_id', storeId)
        .order('sort_order', { ascending: true });
      
      if (collectionsError) throw collectionsError;
      
      // Fetch product counts for each collection
      const collectionsWithCounts = await Promise.all(
        (collections as Collection[]).map(async (collection) => {
          const { count, error } = await supabase
            .from('product_collections')
            .select('*', { count: 'exact', head: true })
            .eq('collection_id', collection.id);
          
          return {
            ...collection,
            product_count: error ? 0 : (count || 0),
          };
        })
      );
      
      return collectionsWithCounts;
    },
    enabled: !!storeId,
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { 
      store_id: string; 
      name: string; 
      description?: string; 
      image_url?: string;
    }) => {
      const { data: collection, error } = await supabase
        .from('collections')
        .insert({
          store_id: data.store_id,
          name: data.name,
          description: data.description || null,
          image_url: data.image_url || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return collection as Collection;
    },
    onSuccess: (collection) => {
      queryClient.invalidateQueries({ queryKey: ['store-collections', collection.store_id] });
      queryClient.invalidateQueries({ queryKey: ['collections-with-count', collection.store_id] });
    },
  });
}

export function useUpdateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Collection> & { id: string }) => {
      const { data: collection, error } = await supabase
        .from('collections')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return collection as Collection;
    },
    onSuccess: (collection) => {
      queryClient.invalidateQueries({ queryKey: ['store-collections', collection.store_id] });
      queryClient.invalidateQueries({ queryKey: ['collections-with-count', collection.store_id] });
    },
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, storeId }: { id: string; storeId: string }) => {
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id, storeId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['store-collections', data.storeId] });
      queryClient.invalidateQueries({ queryKey: ['collections-with-count', data.storeId] });
    },
  });
}

export function useUpdateCollectionProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      collectionId, 
      productIds,
      storeId 
    }: { 
      collectionId: string; 
      productIds: string[];
      storeId: string;
    }) => {
      // Delete existing links
      const { error: deleteError } = await supabase
        .from('product_collections')
        .delete()
        .eq('collection_id', collectionId);
      
      if (deleteError) throw deleteError;

      // Insert new links
      if (productIds.length > 0) {
        const { error: insertError } = await supabase
          .from('product_collections')
          .insert(
            productIds.map(productId => ({
              collection_id: collectionId,
              product_id: productId,
            }))
          );
        
        if (insertError) throw insertError;
      }

      return { collectionId, storeId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['collection-products', data.collectionId] });
      queryClient.invalidateQueries({ queryKey: ['collections-with-count', data.storeId] });
    },
  });
}
