'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Globe, Users, MapPin } from 'lucide-react';
import Link from 'next/link';
import { supabase, type Community } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCommunities() {
      try {
        const { data, error } = await supabase
          .from('communities')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching communities:', error);
          return;
        }

        setCommunities(data || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCommunities();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Communities</h1>
        <Link href="/communities/new">
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create New Community
          </Button>
        </Link>
      </div>
      
      {loading ? (
        <div className="text-center py-8">Loading communities...</div>
      ) : communities.length === 0 ? (
        <Card className="bg-muted">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No communities found. Create your first community to get started!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {communities.map((community) => (
            <Link key={community.id} href={`/communities/${community.slug}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                {community.banner_image_url && (
                  <div className="w-full h-32 relative">
                    <img
                      src={community.banner_image_url}
                      alt={community.name}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        {community.name}
                        {community.is_verified && (
                          <span className="ml-2 text-blue-500">✓</span>
                        )}
                      </CardTitle>
                      {community.short_description && (
                        <CardDescription>{community.short_description}</CardDescription>
                      )}
                    </div>
                    {community.logo_url && (
                      <img
                        src={community.logo_url}
                        alt={`${community.name} logo`}
                        className="w-12 h-12 rounded-full"
                      />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {community.member_count} members
                    </div>
                    {community.location && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {community.location}
                      </div>
                    )}
                    {community.website_url && (
                      <div className="flex items-center">
                        <Globe className="h-4 w-4 mr-1" />
                        Website
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 