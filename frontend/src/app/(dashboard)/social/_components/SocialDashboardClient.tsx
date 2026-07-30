"use client";

import { useState } from "react";
import { Post, Product } from "@/models";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShoppingBag, Users, Heart } from "lucide-react";

// Tables
import PostsDataTable from "./posts/PostsDataTable";
import { columns as postColumns } from "./posts/PostsTableColumns";
import ProductsDataTable from "./products/ProductsDataTable";
import { columns as productColumns } from "./products/ProductsTableColumns";

// Modals
import ViewPostModal from "./modals/ViewPostModal";
import ViewProductModal from "./modals/ViewProductModal";

interface SocialClientProps {
  initialPosts: Post[];
  initialProducts: Product[];
}

export default function SocialDashboardClient({
  initialPosts,
  initialProducts,
}: SocialClientProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [products, setProducts] = useState<Product[]>(initialProducts);

  // Modal States
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Stats
  const totalLikes = posts.reduce((acc, curr) => acc + curr.totalLikes, 0);
  const activeProducts = products.filter(
    (p) => p.status === "AVAILABLE"
  ).length;

  // Handlers
  const handlePostDeleted = (id: string) => {
    setPosts((prev) => prev.filter((p) => p._id !== id));
  };

  const handleProductUpdated = (updated: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p._id === updated._id ? updated : p))
    );
  };

  const handleProductDeleted = (id: string) => {
    setProducts((prev) => prev.filter((p) => p._id !== id));
  };

  return (
    <div className="page-stack">
      <header>
        <h1 className="page-title">Social & Marketplace</h1>
        <p className="page-description">
          Moderate user-generated content and community listings.
        </p>
      </header>

      {/* --- Stats Cards --- */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{posts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Community Likes
            </CardTitle>
            <Heart className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLikes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Market Listings
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Items</CardTitle>
            <ShoppingBag className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProducts}</div>
          </CardContent>
        </Card>
      </div>

      {/* --- Main Content Tabs --- */}
      <Card className="flex-1 border-none shadow-none bg-transparent">
        <Tabs defaultValue="posts" className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="posts" className="flex gap-2">
                <Users className="h-4 w-4" /> Social Feed
              </TabsTrigger>
              <TabsTrigger value="products" className="flex gap-2">
                <ShoppingBag className="h-4 w-4" /> Marketplace
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="posts" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Community Posts</CardTitle>
                <CardDescription>
                  Manage posts shared by residents.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PostsDataTable
                  columns={postColumns({
                    onView: setSelectedPost,
                    onDelete: setSelectedPost,
                  })}
                  data={posts}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Product Listings</CardTitle>
                <CardDescription>
                  Manage marketplace items and status.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProductsDataTable
                  columns={productColumns({
                    onView: setSelectedProduct,
                    onDelete: setSelectedProduct,
                  })}
                  data={products}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Card>

      {/* --- Modals --- */}
      <ViewPostModal
        post={selectedPost}
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        onDeleted={handlePostDeleted}
      />

      <ViewProductModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onUpdated={handleProductUpdated}
        onDeleted={handleProductDeleted}
      />
    </div>
  );
}
