
"use client"

import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxProps {
    items: { value: string; label: string }[];
    value: string | null;
    onChange: (value: string | null) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    noResultsText?: string;
    className?: string;
    onNewItem?: (newItem: string) => Promise<string | null>; // Callback to create a new item
}

export function Combobox({
    items,
    value,
    onChange,
    placeholder = "Select an item...",
    searchPlaceholder = "Search item...",
    noResultsText = "No item found.",
    className,
    onNewItem,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const handleCreateNew = async () => {
    if (onNewItem && inputValue) {
      const newItemId = await onNewItem(inputValue);
      if (newItemId) {
        onChange(newItemId);
        setOpen(false);
      }
    }
  };

  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  const showCreateOption = onNewItem && inputValue && !filteredItems.some(item => item.label.toLowerCase() === inputValue.toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {value
            ? items.find((item) => item.value === value)?.label
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput 
            placeholder={searchPlaceholder} 
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandGroup>
              {filteredItems.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.label}
                  onSelect={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === item.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {item.label}
                </CommandItem>
              ))}
              {showCreateOption && (
                <CommandItem
                  onSelect={handleCreateNew}
                  className="text-primary cursor-pointer"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create "{inputValue}"
                </CommandItem>
              )}
            </CommandGroup>
             {filteredItems.length === 0 && !showCreateOption && (
                 <CommandEmpty>{noResultsText}</CommandEmpty>
             )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

    