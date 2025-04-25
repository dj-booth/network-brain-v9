'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Globe, Users, MapPin } from 'lucide-react';
import Link from 'next/link';
import { supabase, type Community } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useSearchParams } from 'next/navigation';
import { CommunityMembers } from '../../app/components/CommunityMembers';

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const searchParams = useSearchParams();
  const selectedSlug = searchParams.get('selected');

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
        
        // If there's a selected slug, find and set the selected community
        if (selectedSlug) {
          const selected = data?.find(c => c.slug === selectedSlug) || null;
          setSelectedCommunity(selected);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCommunities();
  }, [selectedSlug]);

  const CommunityList = () => (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold">Communities</h1>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="text-center py-8">Loading communities...</div>
        ) : communities.length === 0 ? (
          <Card className="bg-muted">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No communities found. Create your first community to get started!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {communities.map((community) => (
              <Link 
                key={community.id} 
                href={`/communities?selected=${community.slug}`}
                className={`block ${selectedCommunity?.id === community.id ? 'ring-2 ring-primary' : ''}`}
              >
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
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

      <div className="p-4 border-t">
        <Link href="/communities/new" className="w-full">
          <Button className="w-full">
            <PlusCircle className="h-4 w-4 mr-2" />
            Create New Community
          </Button>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="w-[400px] border-r bg-muted/10">
        <CommunityList />
      </div>
      <div className="flex-1 overflow-auto">
        {selectedCommunity ? (
          <div className="p-6">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-4">{selectedCommunity.name}</h2>
              <p className="text-muted-foreground">{selectedCommunity.description}</p>
              
              <div className="flex items-center space-x-4 mt-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {selectedCommunity.member_count} members
                </div>
                {selectedCommunity.location && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {selectedCommunity.location}
                  </div>
                )}
                {selectedCommunity.website_url && (
                  <a 
                    href={selectedCommunity.website_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center hover:text-primary"
                  >
                    <Globe className="h-4 w-4 mr-1" />
                    Website
                  </a>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <CommunityMembers communityId={selectedCommunity.id} />
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Select a community to view details
          </div>
        )}
      </div>
    </div>
  );
} 