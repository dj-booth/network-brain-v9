'use client';

import { useState, useCallback, useEffect } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface Community {
  id: string;
  name: string;
}

interface ColumnMapping {
  csvColumn: string;
  tableColumn: string;
  status: 'matched' | 'skipped' | 'unmatched';
}

const TABLE_COLUMNS = [
  { id: 'name', label: 'Name' },
  { id: 'email', label: 'Email' },
  { id: 'title', label: 'Title' },
  { id: 'company', label: 'Company' },
  { id: 'bio', label: 'Bio' },
  { id: 'location', label: 'Location' },
  { id: 'phone', label: 'Phone' },
  { id: 'linkedin_url', label: 'LinkedIn URL' },
  { id: 'twitter_url', label: 'Twitter URL' },
  { id: 'website_url', label: 'Website URL' },
  { id: 'image_url', label: 'Profile Image URL' },
  { id: 'last_contact', label: 'Last Contact Date' },
  { id: 'detailed_summary', label: 'Detailed Summary' },
  { id: 'onboarding', label: 'Onboarding Status' },
  { id: 'onboarding_updated_at', label: 'Onboarding Updated At' },
  { id: 'onboarding_reason', label: 'Onboarding Reason' },
  { id: 'test_onboarding_data', label: 'Test Onboarding Data' },
  { id: 'current_focus', label: 'Current Focus' },
  { id: 'startup_experience', label: 'Startup Experience' },
  { id: 'preferred_company_size', label: 'Preferred Company Size' },
  { id: 'long_term_goal', label: 'Long Term Goal' },
  { id: 'application_data', label: 'Application Data' },
  { id: 'application_metadata', label: 'Application Metadata' },
  { id: 'source_source', label: 'Source' },
  { id: 'internal_notes', label: 'Internal Notes' }
];

// Special values for the select
const SELECT_VALUES = {
  SKIP: 'skip',
  CLEAR: '__clear__',
  NO_COMMUNITY: '__no_community__'
} as const;

// Function to normalize strings for comparison
const normalizeString = (str: string): string => {
  return str.toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove special characters and spaces
    .trim();
};

// Function to find the best match for a CSV header
const findBestMatch = (header: string): { tableColumn: string; status: ColumnMapping['status'] } => {
  const normalizedHeader = normalizeString(header);
  
  // Direct matches (after normalization)
  const directMatch = TABLE_COLUMNS.find(col => 
    normalizeString(col.id) === normalizedHeader || 
    normalizeString(col.label) === normalizedHeader
  );
  if (directMatch) return { tableColumn: directMatch.id, status: 'matched' };

  // Partial matches
  const partialMatch = TABLE_COLUMNS.find(col =>
    normalizeString(col.id).includes(normalizedHeader) ||
    normalizedHeader.includes(normalizeString(col.id)) ||
    normalizeString(col.label).includes(normalizedHeader) ||
    normalizedHeader.includes(normalizeString(col.label))
  );
  if (partialMatch) return { tableColumn: partialMatch.id, status: 'matched' };

  return { tableColumn: SELECT_VALUES.CLEAR, status: 'unmatched' };
};

export default function ImportPage() {
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadCommunities() {
      try {
        const { data, error } = await supabase
          .from('communities')
          .select('id, name')
          .order('name');

        if (error) throw error;
        setCommunities(data || []);
      } catch (error) {
        console.error('Error loading communities:', error);
        toast.error('Failed to load communities');
      }
    }

    loadCommunities();
  }, []);

  const processFile = useCallback((file: File) => {
    if (!file || !file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim()));
      const headers = rows[0];
      
      // Auto-match columns and set initial mappings
      const initialMappings: ColumnMapping[] = headers.map(header => {
        const match = findBestMatch(header);
        return {
          csvColumn: header,
          tableColumn: match.tableColumn,
          status: match.status
        };
      });

      setCsvHeaders(headers);
      setCsvData(rows.slice(1));
      setColumnMappings(initialMappings);

      // Show success message for auto-matched columns
      const matchedCount = initialMappings.filter(m => m.status === 'matched').length;
      if (matchedCount > 0) {
        toast.success(`Auto-matched ${matchedCount} columns`);
      }
    };

    reader.readAsText(file);
  }, []);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleColumnMapping = (csvColumn: string, tableColumn: string) => {
    setColumnMappings(prev => 
      prev.map(mapping => 
        mapping.csvColumn === csvColumn 
          ? { 
              ...mapping, 
              tableColumn: tableColumn === SELECT_VALUES.CLEAR ? SELECT_VALUES.CLEAR : tableColumn,
              status: tableColumn === SELECT_VALUES.SKIP ? 'skipped' : 
                     tableColumn === SELECT_VALUES.CLEAR ? 'unmatched' : 'matched'
            }
          : mapping
      )
    );
  };

  const handleImport = async () => {
    if (!csvData.length) {
      toast.error('No data to import');
      return;
    }

    const mappedColumns = columnMappings.filter(m => m.status === 'matched');
    if (!mappedColumns.length) {
      toast.error('No columns mapped for import');
      return;
    }

    try {
      setLoading(true);
      
      // Process each row
      const processedRows = csvData.map(row => {
        const processedRow: Record<string, string> = {};
        mappedColumns.forEach((mapping, index) => {
          const csvIndex = csvHeaders.indexOf(mapping.csvColumn);
          if (csvIndex !== -1) {
            processedRow[mapping.tableColumn] = row[csvIndex];
          }
        });
        return processedRow;
      });

      // Insert the rows into the people table
      const { data: insertedPeople, error: insertError } = await supabase
        .from('people')
        .insert(processedRows)
        .select('id');

      if (insertError) throw insertError;

      // If a community is selected, add the imported people to that community
      if (selectedCommunityId && insertedPeople) {
        const communityMembers = insertedPeople.map(person => ({
          community_id: selectedCommunityId,
          person_id: person.id,
          membership_status: 'prospect'
        }));

        const { error: membershipError } = await supabase
          .from('community_members')
          .insert(communityMembers);

        if (membershipError) throw membershipError;
      }

      toast.success(`Successfully imported ${processedRows.length} people${selectedCommunityId ? ' and added them to the community' : ''}`);
      
      // Reset the form
      setCsvData([]);
      setCsvHeaders([]);
      setColumnMappings([]);
      setFileName('');
      setSelectedCommunityId(null);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Import Data</h1>
      
      <Card className="p-6">
        {!csvData.length ? (
          <div
            className={cn(
              "flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-colors",
              isDragging ? "border-primary bg-accent/10" : "border-border",
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-gray-400 mb-4" />
            <label htmlFor="csv-upload" className="cursor-pointer">
              <Button>Choose CSV File</Button>
            </label>
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileUpload}
            />
            <p className="text-sm text-gray-500 mt-2">or drag and drop your CSV file here</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">File:</span>
                <span className="font-medium">{fileName}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setCsvData([]);
                  setCsvHeaders([]);
                  setColumnMappings([]);
                  setFileName('');
                  setSelectedCommunityId(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Add to Community (Optional)</h3>
                <p className="text-sm text-gray-500">
                  Select a community to automatically add imported people as prospects
                </p>
                <Select
                  value={selectedCommunityId || SELECT_VALUES.NO_COMMUNITY}
                  onValueChange={(value) => setSelectedCommunityId(value === SELECT_VALUES.NO_COMMUNITY ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a community" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SELECT_VALUES.NO_COMMUNITY}>No community</SelectItem>
                    {communities.map((community) => (
                      <SelectItem key={community.id} value={community.id}>
                        {community.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <h3 className="text-lg font-medium">Map Columns</h3>
              <p className="text-sm text-gray-500">
                Match your CSV columns to the corresponding table columns
              </p>

              <div className="grid gap-4">
                {csvHeaders.map((header) => {
                  const mapping = columnMappings.find(m => m.csvColumn === header);
                  return (
                    <div 
                      key={header} 
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-lg transition-colors",
                        mapping?.status === 'matched' && "bg-green-50",
                        mapping?.status === 'skipped' && "bg-red-50/50"
                      )}
                    >
                      <div className="w-1/3">
                        <p className="text-sm font-medium">{header}</p>
                      </div>
                      <div className="w-2/3">
                        <Select
                          value={mapping?.tableColumn}
                          onValueChange={(value) => handleColumnMapping(header, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a column" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={SELECT_VALUES.SKIP}>Skip this column</SelectItem>
                            <SelectItem value={SELECT_VALUES.CLEAR}>Clear selection</SelectItem>
                            {TABLE_COLUMNS.map((column) => (
                              <SelectItem key={column.id} value={column.id}>
                                {column.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end mt-6">
                <Button onClick={handleImport} disabled={loading}>
                  {loading ? 'Importing...' : 'Import Data'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
} 