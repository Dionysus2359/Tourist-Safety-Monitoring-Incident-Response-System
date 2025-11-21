import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  Eye,
  MapPin,
  Clock,
  User,
  Filter,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Phone,
  Mail
} from "lucide-react";
import { incidentsAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const IncidentsTable = () => {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  console.log('📊 IncidentsTable rendered:', { user: user?.username, loading });
  const [error, setError] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    severity: 'all',
    search: ''
  });

  // Fetch incidents - wrapped with useCallback to prevent unnecessary re-renders
  const fetchIncidents = useCallback(async () => {
    console.log('🔄 IncidentsTable: Starting to fetch incidents...');
    try {
      setLoading(true);
      setError(null);
      const response = await incidentsAPI.getAll();

      if (response.data.success) {
        const incidentData = response.data.data.incidents || [];
        setIncidents(incidentData);
        console.log('✅ IncidentsTable: Fetched incidents successfully:', incidentData.length);
      } else {
        console.log('❌ IncidentsTable: Failed to fetch incidents - API error');
        setError("Failed to fetch incidents");
      }
    } catch (err) {
      console.error("❌ IncidentsTable: Error fetching incidents:", err);
      setError(err.response?.data?.message || "Failed to fetch incidents");
    } finally {
      setLoading(false);
      console.log('🔄 IncidentsTable: Fetch incidents completed');
    }
  }, []);

  // Fetch incidents on component mount - only once
  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const updateIncidentStatus = useCallback(async (incidentId, newStatus) => {
    try {
      setUpdatingStatus(true);
      const response = await incidentsAPI.update(incidentId, { status: newStatus });

      if (response.data.success) {
        // Update the local state
        setIncidents(prevIncidents => prevIncidents.map(incident =>
          incident.id === incidentId
            ? { ...incident, status: newStatus }
            : incident
        ));
        setSelectedIncident(null);
      } else {
        setError("Failed to update incident status");
      }
    } catch (err) {
      console.error("Error updating incident status:", err);
      setError(err.response?.data?.message || "Failed to update incident status");
    } finally {
      setUpdatingStatus(false);
    }
  }, []);

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'reported': return 'destructive';
      case 'inProgress': return 'default';
      case 'resolved': return 'secondary';
      default: return 'outline';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return null;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredIncidents = incidents.filter(incident => {
    const matchesStatus = filters.status === 'all' || incident.status === filters.status;
    const matchesSeverity = filters.severity === 'all' || incident.severity === filters.severity;
    const matchesSearch = !filters.search ||
      incident.description.toLowerCase().includes(filters.search.toLowerCase()) ||
      incident.user?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      incident.address?.toLowerCase().includes(filters.search.toLowerCase());

    return matchesStatus && matchesSeverity && matchesSearch;
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Incidents Management</CardTitle>
          <CardDescription>Loading incidents...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading incidents...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Incidents Management</CardTitle>
          <CardDescription>Error loading incidents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-red-600">
            <XCircle className="h-6 w-6 mr-2" />
            {error}
          </div>
          <div className="flex justify-center mt-4">
            <Button onClick={fetchIncidents} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="search"
                  type="text"
                  placeholder="Search incidents..."
                  className="pl-10 pr-4 py-2 w-full border rounded-md"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
            </div>
            <div className="min-w-[150px]">
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="reported">Reported</SelectItem>
                  <SelectItem value="inProgress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[150px]">
              <Label>Severity</Label>
              <Select value={filters.severity} onValueChange={(value) => setFilters({ ...filters, severity: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={fetchIncidents} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Incidents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Incidents ({filteredIncidents.length})</CardTitle>
          <CardDescription>
            Manage and monitor all reported incidents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredIncidents.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {incidents.length === 0 ? "No incidents found" : "No incidents match your filters"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Incident</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Reported</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIncidents.map((incident) => (
                  <TableRow key={incident.id}>
                    <TableCell>
                      <div className="max-w-[300px]">
                        <p className="font-medium truncate" title={incident.description}>
                          {incident.description}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ID: {incident.id}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {incident.user?.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{incident.user?.name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{incident.user?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {getSeverityIcon(incident.severity)}
                        <Badge variant="outline" className="capitalize">
                          {incident.severity}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(incident.status)} className="capitalize">
                        {incident.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span className="truncate max-w-[150px]" title={incident.address || 'Unknown'}>
                          {incident.address || 'Unknown'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDate(incident.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedIncident(incident)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Incident Details</DialogTitle>
                            <DialogDescription>
                              Incident ID: {selectedIncident?.id}
                            </DialogDescription>
                          </DialogHeader>
                          {selectedIncident && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">Description</Label>
                                  <p className="text-sm mt-1">{selectedIncident.description}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Status</Label>
                                  <div className="mt-1">
                                    <Badge variant={getStatusBadgeVariant(selectedIncident.status)} className="capitalize">
                                      {selectedIncident.status}
                                    </Badge>
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Severity</Label>
                                  <div className="flex items-center mt-1">
                                    {getSeverityIcon(selectedIncident.severity)}
                                    <Badge variant="outline" className="capitalize ml-2">
                                      {selectedIncident.severity}
                                    </Badge>
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Reported</Label>
                                  <div className="flex items-center mt-1 text-sm">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {formatDate(selectedIncident.createdAt)}
                                  </div>
                                </div>
                              </div>

                              <div>
                                <Label className="text-sm font-medium">Location</Label>
                                <div className="flex items-center mt-1 text-sm">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {selectedIncident.address || 'Unknown'}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Coordinates: {selectedIncident.location?.coordinates?.join(', ') || 'N/A'}
                                </div>
                              </div>

                              <div>
                                <Label className="text-sm font-medium">Reporter</Label>
                                <div className="flex items-center mt-1">
                                  <Avatar className="h-8 w-8 mr-2">
                                    <AvatarFallback>
                                      {selectedIncident.user?.name?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-sm">{selectedIncident.user?.name || 'Unknown'}</p>
                                    <div className="flex items-center text-xs text-muted-foreground">
                                      <Mail className="h-3 w-3 mr-1" />
                                      {selectedIncident.user?.email}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {user?.role === 'admin' && (
                                <div>
                                  <Label className="text-sm font-medium">Update Status</Label>
                                  <div className="flex space-x-2 mt-2">
                                    <Select
                                      value={selectedIncident.status}
                                      onValueChange={(value) => updateIncidentStatus(selectedIncident.id, value)}
                                      disabled={updatingStatus}
                                    >
                                      <SelectTrigger className="w-[140px]">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="reported">Reported</SelectItem>
                                        <SelectItem value="inProgress">In Progress</SelectItem>
                                        <SelectItem value="resolved">Resolved</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    {updatingStatus && <RefreshCw className="h-4 w-4 animate-spin mt-2" />}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IncidentsTable;
