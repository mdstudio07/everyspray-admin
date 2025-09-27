'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Icons } from '@/lib/icons';

export default function UITestingPage() {
  const [inputValue, setInputValue] = useState('');
  const [selectValue, setSelectValue] = useState('');

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Theme Toggle */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              UI Component Testing
            </h1>
            <p className="text-lg text-muted-foreground">
              Development-only page to test all components in light and dark modes
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Color Palette Display */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
            <CardDescription>Official shadcn/ui colors with light/dark mode support</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="space-y-2">
                <div className="w-full h-16 bg-background border rounded"></div>
                <p className="text-sm font-medium">Background</p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-16 bg-foreground rounded"></div>
                <p className="text-sm font-medium">Foreground</p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-16 bg-card border rounded"></div>
                <p className="text-sm font-medium">Card</p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-16 bg-primary rounded"></div>
                <p className="text-sm font-medium">Primary</p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-16 bg-secondary rounded"></div>
                <p className="text-sm font-medium">Secondary</p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-16 bg-muted rounded"></div>
                <p className="text-sm font-medium">Muted</p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-16 bg-accent rounded"></div>
                <p className="text-sm font-medium">Accent</p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-16 bg-destructive rounded"></div>
                <p className="text-sm font-medium">Destructive</p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-16 bg-border border rounded"></div>
                <p className="text-sm font-medium">Border</p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-16 bg-input border rounded"></div>
                <p className="text-sm font-medium">Input</p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-16 bg-ring rounded"></div>
                <p className="text-sm font-medium">Ring</p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-16 bg-popover border rounded"></div>
                <p className="text-sm font-medium">Popover</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Typography */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Typography</CardTitle>
            <CardDescription>Urbanist for headings (h1-h6) and Inter for body text</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold">Heading 1 - Urbanist Font</h1>
              <p className="text-sm text-muted-foreground">font-family: Urbanist (headings)</p>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold">Heading 2 - Section Title</h2>
              <p className="text-sm text-muted-foreground">font-family: Urbanist (headings)</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-medium">Heading 3 - Subsection</h3>
              <p className="text-sm text-muted-foreground">font-family: Urbanist (headings)</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-medium">Heading 4 - Component Title</h4>
              <p className="text-sm text-muted-foreground">font-family: Urbanist (headings)</p>
            </div>
            <div className="space-y-2">
              <p className="text-base">Body text - Regular paragraph content with normal weight - Inter Font</p>
              <p className="text-sm text-muted-foreground">font-family: Inter (body text)</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Small text - Secondary information - Inter Font</p>
              <p className="text-xs text-muted-foreground">font-family: Inter (body text)</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Extra small - Captions and metadata - Inter Font</p>
              <p className="text-xs text-muted-foreground">font-family: Inter (body text)</p>
            </div>

            {/* Font Testing */}
            <div className="border-t pt-4 mt-4">
              <h5 className="text-lg font-semibold mb-2">Font Test Examples:</h5>
              <div className="space-y-2">
                <p className="font-heading">This text uses .font-heading class (Urbanist)</p>
                <p className="font-body">This text uses .font-body class (Inter)</p>
                <p>This text uses default body font (should be Inter)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
              <CardDescription>All button variants and sizes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Variants:</p>
                <div className="flex flex-wrap gap-2">
                  <Button>Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Sizes:</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm">Small</Button>
                  <Button>Default</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon">
                    <Icons.Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Form Controls</CardTitle>
              <CardDescription>Inputs, selects, and form elements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Input Field:</label>
                <Input
                  placeholder="Enter some text..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Dropdown:</label>
                <Select value={selectValue} onValueChange={setSelectValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="option1">Option 1</SelectItem>
                    <SelectItem value="option2">Option 2</SelectItem>
                    <SelectItem value="option3">Option 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Badges and Status */}
          <Card>
            <CardHeader>
              <CardTitle>Badges & Status</CardTitle>
              <CardDescription>Status indicators and labels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Avatars */}
          <Card>
            <CardHeader>
              <CardTitle>Avatars</CardTitle>
              <CardDescription>User profile images and fallbacks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <Avatar>
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <Avatar className="h-12 w-12">
                  <AvatarImage src="https://github.com/vercel.png" />
                  <AvatarFallback>VC</AvatarFallback>
                </Avatar>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Icons Showcase */}
        <Card className="my-8">
          <CardHeader>
            <CardTitle>Icons</CardTitle>
            <CardDescription>Radix icons (preferred) and Lucide icons (fallback)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-8 md:grid-cols-12 lg:grid-cols-16 gap-4">
              {Object.entries(Icons).slice(0, 20).map(([name, IconComponent]) => {
                const Icon = IconComponent as React.ComponentType<{ className?: string }>;
                return (
                  <div key={name} className="flex flex-col items-center space-y-2">
                    <div className="p-2 border rounded hover:bg-accent">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs text-center">{name}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Interactive Components */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Dialog */}
          <Card>
            <CardHeader>
              <CardTitle>Dialog</CardTitle>
              <CardDescription>Modal dialogs and overlays</CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Open Dialog</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Dialog Title</DialogTitle>
                    <DialogDescription>
                      This is a sample dialog content. It demonstrates how dialogs look in both light and dark modes.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline">Cancel</Button>
                    <Button>Confirm</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Dropdown Menu */}
          <Card>
            <CardHeader>
              <CardTitle>Dropdown Menu</CardTitle>
              <CardDescription>Context menus and actions</CardDescription>
            </CardHeader>
            <CardContent>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">Open Menu</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>
                    <Icons.User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Icons.Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Icons.LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>
        </div>

        {/* Loading States */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Loading States</CardTitle>
            <CardDescription>Beautiful animated loaders for different purposes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Wave bars - Loading */}
            <div className="space-y-3">
              <h4 className="text-lg font-semibold">Wave Bars - Loading</h4>
              <p className="text-sm text-muted-foreground">Rhythmic flow for general loading states</p>
              <div className="flex items-center space-x-4">
                <LoadingSpinner type="loading" size="sm" />
                <LoadingSpinner type="loading" size="md" />
                <LoadingSpinner type="loading" size="lg" />
                <Button disabled>
                  <LoadingSpinner type="loading" size="sm" className="mr-2" />
                  Loading...
                </Button>
              </div>
            </div>

            {/* Equalizer bars - Processing */}
            <div className="space-y-3">
              <h4 className="text-lg font-semibold">Equalizer Bars - Processing</h4>
              <p className="text-sm text-muted-foreground">Music-like vibe for data processing</p>
              <div className="flex items-center space-x-4">
                <LoadingSpinner type="processing" size="sm" />
                <LoadingSpinner type="processing" size="md" />
                <LoadingSpinner type="processing" size="lg" />
                <Button disabled>
                  <LoadingSpinner type="processing" size="sm" className="mr-2" />
                  Processing...
                </Button>
              </div>
            </div>

            {/* Ripple circles - Saving */}
            <div className="space-y-3">
              <h4 className="text-lg font-semibold">Ripple Circles - Saving</h4>
              <p className="text-sm text-muted-foreground">Expanding motion for save operations</p>
              <div className="flex items-center space-x-4">
                <LoadingSpinner type="saving" size="sm" />
                <LoadingSpinner type="saving" size="md" />
                <LoadingSpinner type="saving" size="lg" />
                <Button disabled>
                  <LoadingSpinner type="saving" size="sm" className="mr-2" />
                  Saving...
                </Button>
              </div>
            </div>

            {/* Legacy spinner */}
            <div className="space-y-3">
              <h4 className="text-lg font-semibold">Legacy Spinner (Fallback)</h4>
              <p className="text-sm text-muted-foreground">Default spinner for backward compatibility</p>
              <div className="flex items-center space-x-4">
                <LoadingSpinner size="sm" />
                <LoadingSpinner size="md" />
                <LoadingSpinner size="lg" />
                <Button disabled>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Default...
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Table</CardTitle>
            <CardDescription>Data tables and lists</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">John Doe</TableCell>
                  <TableCell>
                    <Badge>Active</Badge>
                  </TableCell>
                  <TableCell>Admin</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Edit</Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Jane Smith</TableCell>
                  <TableCell>
                    <Badge variant="secondary">Pending</Badge>
                  </TableCell>
                  <TableCell>Contributor</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Edit</Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>🧪 This page is for development testing only</p>
          <p>Toggle between light and dark modes to see all color variations</p>
        </div>
      </div>
    </div>
  );
}