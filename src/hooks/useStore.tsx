import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Store {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  bio: string | null;
  payment_instructions: string | null;
  whatsapp_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  store_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_notes: string | null;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
}

export function useMyStore() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-store', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data as Store | null;
    },
    enabled: !!user,
  });
}

export function useStoreBySlug(slug: string) {
  return useQuery({
    queryKey: ['store', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      return data as Store | null;
    },
    enabled: !!slug,
  });
}

export function useStoreProducts(storeId: string | undefined) {
  return useQuery({
    queryKey: ['store-products', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!storeId,
  });
}

export function useStoreOrders(storeId: string | undefined) {
  return useQuery({
    queryKey: ['store-orders', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
    enabled: !!storeId,
  });
}

export function useOrderItems(orderId: string | undefined) {
  return useQuery({
    queryKey: ['order-items', orderId],
    queryFn: async () => {
      if (!orderId) return [];
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);
      if (error) throw error;
      return data as OrderItem[];
    },
    enabled: !!orderId,
  });
}

export function useCreateStore() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { name: string; bio?: string; whatsapp_number?: string; payment_instructions?: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      const slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substring(2, 6);

      const { data: store, error } = await supabase
        .from('stores')
        .insert({
          owner_id: user.id,
          name: data.name,
          slug,
          bio: data.bio || null,
          whatsapp_number: data.whatsapp_number || null,
          payment_instructions: data.payment_instructions || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return store as Store;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-store'] });
    },
  });
}

export function useUpdateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Store> & { id: string }) => {
      const { data: store, error } = await supabase
        .from('stores')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return store as Store;
    },
    onSuccess: (store) => {
      queryClient.invalidateQueries({ queryKey: ['my-store'] });
      queryClient.invalidateQueries({ queryKey: ['store', store.slug] });
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { store_id: string; name: string; description?: string; price: number; image_url?: string }) => {
      const { data: product, error } = await supabase
        .from('products')
        .insert({
          store_id: data.store_id,
          name: data.name,
          description: data.description || null,
          price: data.price,
          image_url: data.image_url || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return product as Product;
    },
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: ['store-products', product.store_id] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Product> & { id: string }) => {
      const { data: product, error } = await supabase
        .from('products')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return product as Product;
    },
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: ['store-products', product.store_id] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, storeId }: { id: string; storeId: string }) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id, storeId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['store-products', data.storeId] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, storeId }: { id: string; status: Order['status']; storeId: string }) => {
      const { data: order, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { order: order as Order, storeId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['store-orders', data.storeId] });
    },
  });
}

export function useFeaturedStores() {
  return useQuery({
    queryKey: ['featured-stores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .limit(6);
      if (error) throw error;
      return data as Store[];
    },
  });
}
