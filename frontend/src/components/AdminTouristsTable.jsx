import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { usersAPI } from '../services/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Phone, RefreshCw, Search } from 'lucide-react';

const AdminTouristsTable = () => {
  const [tourists, setTourists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchTourists = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await usersAPI.getAll();
      if (response.data?.success) {
        setTourists(response.data.data.users || []);
      } else {
        setError(response.data?.message || 'Failed to fetch users');
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTourists();
  }, [fetchTourists]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tourists;
    return tourists.filter(t =>
      t.name?.toLowerCase().includes(q) ||
      t.username?.toLowerCase().includes(q) ||
      t.email?.toLowerCase().includes(q) ||
      t.phone?.toLowerCase().includes(q)
    );
  }, [tourists, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading tourists...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchTourists} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tourists..."
            className="pl-10 pr-4 py-2 w-full border rounded-md"
          />
        </div>
        <Button onClick={fetchTourists} variant="ghost" className="ml-2">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tourist</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>KY C</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Location</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((tourist) => (
            <TableRow key={tourist.id}>
              <TableCell className="font-medium">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={undefined} alt={tourist.name} />
                    <AvatarFallback>{tourist.name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{tourist.name || tourist.username}</div>
                    <div className="text-sm text-muted-foreground">{tourist.email}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center text-sm">
                  <Phone className="mr-2 h-3 w-3" />
                  {tourist.phone || '—'}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={tourist.kycVerified ? 'default' : 'secondary'}>
                  {tourist.kycVerified ? 'Verified' : 'Unverified'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">{tourist.role}</Badge>
              </TableCell>
              <TableCell>
                {tourist.location?.coordinates ? (
                  <span className="text-sm text-muted-foreground">
                    {tourist.location.coordinates[1].toFixed(4)}, {tourist.location.coordinates[0].toFixed(4)}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">No location</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {filtered.length === 0 && (
        <CardDescription className="text-center py-6">No tourists found.</CardDescription>
      )}
    </div>
  );
};

export default AdminTouristsTable;


