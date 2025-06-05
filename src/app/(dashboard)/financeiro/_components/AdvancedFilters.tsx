"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { X, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export interface FilterOption {
  id: string;
  label: string;
  options?: { value: string; label: string }[];
  type: 'text' | 'select' | 'date' | 'number'; // Added number type
}

interface FilterValues {
  [key: string]: string;
}

interface AdvancedFiltersProps {
  filterOptions: FilterOption[];
  onFilterChange: (filters: FilterValues) => void;
  className?: string;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filterOptions,
  onFilterChange,
  className = '',
}) => {
  const [expanded, setExpanded] = React.useState(false);
  const [filterValues, setFilterValues] = React.useState<FilterValues>({});

  const handleFilterChange = (id: string, value: string) => {
    const newFilters = { ...filterValues, [id]: value };
    
    // Remove empty filters
    if (!value) {
      delete newFilters[id];
    }
    
    setFilterValues(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    setFilterValues({});
    onFilterChange({});
  };

  const activeFiltersCount = Object.keys(filterValues).length;

  return (
    <Card className={`w-full ${className}`}>
      <div 
        className="flex justify-between items-center p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="font-medium">
            Filtros Avançados
            {activeFiltersCount > 0 && ` (${activeFiltersCount})`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                clearFilters();
              }}
            >
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </div>
      
      {expanded && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-2">
            {filterOptions.map((option) => (
              <div key={option.id} className="space-y-2">
                <Label htmlFor={option.id}>{option.label}</Label>
                
                {option.type === 'select' && option.options && (
                  <Select
                    value={filterValues[option.id] || ''}
                    onValueChange={(value) => handleFilterChange(option.id, value)}
                  >
                    <SelectTrigger id={option.id}>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      {option.options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                
                {option.type === 'text' && (
                  <Input
                    id={option.id}
                    value={filterValues[option.id] || ''}
                    onChange={(e) => handleFilterChange(option.id, e.target.value)}
                    placeholder={`Filtrar por ${option.label.toLowerCase()}...`}
                  />
                )}
                
                {option.type === 'date' && (
                  <Input
                    id={option.id}
                    type="date"
                    value={filterValues[option.id] || ''}
                    onChange={(e) => handleFilterChange(option.id, e.target.value)}
                  />
                )}
                
                {option.type === 'number' && (
                   <Input
                    id={option.id}
                    type="number"
                    value={filterValues[option.id] || ''}
                    onChange={(e) => handleFilterChange(option.id, e.target.value)}
                    placeholder={`Filtrar por ${option.label.toLowerCase()}...`}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};
