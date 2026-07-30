"use client";

import { User, Post, Product } from "@/models";
import { STORAGE_BASE_URL } from "@/lib/api-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Users,
  Building,
  HeartHandshake,
  ShoppingCart,
  ShieldAlert,
  FileWarning,
  ImageIcon,
} from "lucide-react";
import Image from "next/image";
import ClientDate from "./ClientDate";

// The client component that displays the UI
export default function UserProfileClient({
  user,
  posts = [],
  products = [],
}: {
  user: User;
  posts?: Post[];
  products?: Product[];
}) {
  const getRoleBadge = (role: User["role"]) => {
    switch (role) {
      case "ADMIN":
        return <Badge variant="destructive">Admin</Badge>;
      case "MODERATOR":
        return <Badge className="bg-yellow-500">Moderator</Badge>;
      case "RESIDENT":
      default:
        return <Badge variant="secondary">Resident</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row gap-6">
          <Avatar className="h-28 w-28">
            <AvatarImage
              src={
                user.profilePicture
                  ? `${STORAGE_BASE_URL}/${user.profilePicture}`
                  : undefined
              }
              alt={user.name}
            />
            <AvatarFallback>
              {user.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-3xl">{user.name}</CardTitle>
              {getRoleBadge(user.role)}
            </div>
            <CardDescription className="mt-1">
              Unit: {user.unitNumber} | Joined:{" "}
              <ClientDate date={user.createdAt} />{" "}
            </CardDescription>
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-bold">
                    {user.socialStats.totalFollowers}
                  </div>
                  <div className="text-xs text-muted-foreground">Followers</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <HeartHandshake className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-bold">
                    {user.socialStats.totalFollowing}
                  </div>
                  <div className="text-xs text-muted-foreground">Following</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-bold">{user.sellerStats.itemsSold}</div>
                  <div className="text-xs text-muted-foreground">
                    Items Sold
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="details">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">Profile Details</TabsTrigger>
          <TabsTrigger value="posts">Social Posts ({posts.length})</TabsTrigger>
          <TabsTrigger value="products">
            Marketplace ({products.length})
          </TabsTrigger>
          <TabsTrigger value="reports">Security Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Full Profile Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <Label className="font-semibold">Full Name</Label>
                <p className="text-muted-foreground">{user.name}</p>
              </div>
              <div className="space-y-1">
                <Label className="font-semibold">Email</Label>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
              <div className="space-y-1">
                <Label className="font-semibold">Phone</Label>
                <p className="text-muted-foreground">{user.phoneNumber}</p>
              </div>
              <div className="space-y-1">
                <Label className="font-semibold">Unit Number</Label>
                <p className="text-muted-foreground">{user.unitNumber}</p>
              </div>
              <div className="space-y-1">
                <Label className="font-semibold">Date of Birth</Label>
                <p className="text-muted-foreground">
                  {user.dateOfBirth ? (
                    <ClientDate date={user.dateOfBirth} />
                  ) : (
                    "Not Set"
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="font-semibold">User ID</Label>
                <p className="text-muted-foreground truncate">{user._id}</p>
              </div>
              <div className="md:col-span-3 space-y-1">
                <Label className="font-semibold">Emergency Contact</Label>
                {user.emergencyContact?.name ? (
                  <div className="text-sm text-muted-foreground p-3 border rounded-md max-w-md">
                    <p>Name: {user.emergencyContact.name}</p>
                    <p>Phone: {user.emergencyContact.phoneNumber}</p>
                    <p>Relation: {user.emergencyContact.relationship}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not set</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="posts">
          <Card>
            <CardHeader>
              <CardTitle>Social Posts</CardTitle>
              <CardDescription>
                All posts created by {user.name}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {posts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {posts.map((post) => (
                    <Card key={post._id} className="overflow-hidden">
                      {post.images && post.images.length > 0 ? (
                        <Image
                          src={`${STORAGE_BASE_URL}/${post.images[0]}`}
                          alt={post.description.substring(0, 30)}
                          width={300}
                          height={200}
                          className="w-full h-32 object-cover"
                        />
                      ) : (
                        <div className="w-full h-32 bg-secondary flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <CardContent className="p-4">
                        <p className="text-sm line-clamp-3">
                          {post.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          <ClientDate date={post.createdAt} />
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Placeholder tab="posts" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Marketplace Listings</CardTitle>
              <CardDescription>
                All products listed by {user.name}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {products.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {products.map((product) => (
                    <Card key={product._id} className="overflow-hidden">
                      {product.images && product.images.length > 0 ? (
                        <Image
                          src={`${STORAGE_BASE_URL}/${product.images[0]}`}
                          alt={product.title}
                          width={200}
                          height={200}
                          className="w-full h-36 object-cover"
                        />
                      ) : (
                        <div className="w-full h-36 bg-secondary flex items-center justify-center">
                          <ImageIcon className="h-10 w-10 text-muted-foreground" />
                        </div>
                      )}
                      <CardContent className="p-3">
                        <h3 className="font-semibold truncate">
                          {product.title}
                        </h3>
                        <p className="text-sm font-bold text-primary">
                          ${product.price}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Placeholder tab="products" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Security Reports</CardTitle>
              <CardDescription>
                All incident reports submitted by {user.name}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Placeholder tab="reports" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Placeholder({ tab }: { tab: "posts" | "products" | "reports" }) {
  const messages = {
    posts: { icon: Building, text: "No social posts found." },
    products: { icon: ShoppingCart, text: "No marketplace listings found." },
    reports: { icon: ShieldAlert, text: "No security reports found." },
  };
  const Icon = messages[tab].icon || FileWarning;

  return (
    <div className="flex flex-col items-center justify-center h-48 border rounded-lg">
      <Icon className="w-12 h-12 text-muted-foreground" />
      <p className="mt-4 text-muted-foreground">{messages[tab].text}</p>
    </div>
  );
}
